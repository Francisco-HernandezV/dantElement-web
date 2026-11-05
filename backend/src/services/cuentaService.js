import pool from "../config/db.js";

/**
 * Eliminación de cuentas de clientes.
 *
 * Un cliente con compras no se puede borrar de seguridad.personas: ventas,
 * apartados, abonos y pagos la referencian y deben conservarse por
 * obligaciones fiscales. Por eso la eliminación se hace en dos pasos:
 *
 *  1. Solicitud (marcarEliminacion): la cuenta se bloquea y se oculta de
 *     inmediato (eliminado_en = NOW()). Durante DIAS_GRACIA días el cliente
 *     puede cancelarla iniciando sesión.
 *  2. Anonimización (anonimizarPersona): al vencer el plazo se borran sus
 *     datos personales. La fila queda como "Cliente eliminado #ID" y su
 *     historial de compras se conserva sin identificarlo.
 */
export const DIAS_GRACIA = 30;

/** Fecha en que se anonimizará una cuenta marcada en `desde`. */
export function fechaAnonimizacion(desde = new Date()) {
  return new Date(new Date(desde).getTime() + DIAS_GRACIA * 24 * 60 * 60 * 1000);
}

/** ¿Tiene apartados sin liquidar (incluye los vencidos que siguen en estado activo)? */
export async function tieneApartadoActivo(db, personaId) {
  const { rows } = await db.query(
    `SELECT 1 FROM ventas.apartados WHERE cliente_id = $1 AND estado = 'activo' LIMIT 1`,
    [personaId]
  );
  return rows.length > 0;
}

export const MENSAJE_APARTADO_ACTIVO =
  "Tienes un apartado activo. Para eliminar tu cuenta primero debes liquidarlo o cancelarlo en la tienda. " +
  "Recuerda que si lo cancelas, el anticipo y los abonos no se devuelven.";

/**
 * Paso 1: bloquea la cuenta, la oculta de clientes y POS y cierra sus sesiones.
 * Los datos siguen ahí durante el periodo de gracia.
 */
export async function marcarEliminacion(db, personaId) {
  await db.query(
    `UPDATE seguridad.personas
        SET eliminado_en = NOW(),
            es_cliente = FALSE,
            cuenta_activa = FALSE,
            token_version = COALESCE(token_version, 0) + 1,
            actualizado_en = NOW()
      WHERE id = $1`,
    [personaId]
  );
  await db.query(`DELETE FROM seguridad.tokens WHERE usuario_id = $1`, [personaId]);
}

/** Cancela una eliminación pendiente (el cliente volvió a iniciar sesión). */
export async function cancelarEliminacion(db, personaId) {
  await db.query(
    `UPDATE seguridad.personas
        SET eliminado_en = NULL,
            es_cliente = TRUE,
            cuenta_activa = TRUE,
            actualizado_en = NOW()
      WHERE id = $1 AND anonimizado_en IS NULL`,
    [personaId]
  );
}

/**
 * Paso 2: borra los datos personales. No toca ventas, pagos, apartados ni
 * abonos. Devuelve true si la persona quedó anonimizada.
 */
export async function anonimizarPersona(db, personaId) {
  const { rowCount } = await db.query(
    `UPDATE seguridad.personas
        SET nombre = 'Cliente eliminado #' || id,
            telefono = NULL,
            email = NULL,
            fecha_nacimiento = NULL,
            rfc = NULL,
            notas = NULL,
            password_hash = NULL,
            pin_lookup = NULL,
            email_verificado = FALSE,
            cuenta_activa = FALSE,
            es_cliente = FALSE,
            login_attempts = 0,
            lock_until = NULL,
            recovery_attempts = 0,
            recovery_lock_until = NULL,
            requiere_cambio_password = FALSE,
            token_version = COALESCE(token_version, 0) + 1,
            eliminado_en = COALESCE(eliminado_en, NOW()),
            anonimizado_en = NOW(),
            actualizado_en = NOW()
      WHERE id = $1
        AND es_empleado = FALSE
        AND anonimizado_en IS NULL`,
    [personaId]
  );
  if (rowCount === 0) return false;

  await db.query(`DELETE FROM seguridad.tokens WHERE usuario_id = $1`, [personaId]);
  await db.query(`DELETE FROM ventas.direcciones WHERE usuario_id = $1`, [personaId]);
  // detalle_carrito se borra en cascada con su carrito.
  await db.query(`DELETE FROM ventas.carritos WHERE usuario_id = $1`, [personaId]);
  return true;
}

/**
 * Anonimiza a todas las personas cuyo periodo de gracia ya venció.
 * La ejecuta la tarea diaria (jobs/anonimizacion.js).
 */
export async function anonimizarVencidas() {
  const { rows } = await pool.query(
    `SELECT id
       FROM seguridad.personas
      WHERE eliminado_en IS NOT NULL
        AND anonimizado_en IS NULL
        AND es_empleado = FALSE
        AND eliminado_en <= NOW() - ($1 || ' days')::interval`,
    [String(DIAS_GRACIA)]
  );

  let anonimizadas = 0;
  for (const { id } of rows) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (await tieneApartadoActivo(client, id)) {
        // No debería pasar (se bloquea al pedir la eliminación), pero si un
        // apartado quedó abierto se espera a que se liquide o cancele.
        await client.query("ROLLBACK");
        console.warn(`Anonimización pospuesta para la persona ${id}: tiene un apartado activo.`);
        continue;
      }
      if (await anonimizarPersona(client, id)) anonimizadas++;
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error(`Error al anonimizar la persona ${id}:`, error.message);
    } finally {
      client.release();
    }
  }
  return anonimizadas;
}
