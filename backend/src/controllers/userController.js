import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { hashPin } from "../services/tokenService.js";
import { sendVerificationEmail, sendResetEmail, sendAccountDeletionEmail } from "../services/mailService.js";
import {
  cancelarEliminacion,
  fechaAnonimizacion,
  marcarEliminacion,
  MENSAJE_APARTADO_ACTIVO,
  tieneApartadoActivo,
} from "../services/cuentaService.js";
import { generateToken, hashToken } from "../services/tokenService.js";
import { asegurarColumnasSeguridad, TERMINOS_VERSION, AVISO_VERSION } from "../config/schema.js";

const VERIF_EXP_HOURS = Number.parseInt(process.env.VERIFICATION_TOKEN_EXP_HOURS || "24", 10);
const RESET_EXP_HOURS = Number.parseInt(process.env.RESET_TOKEN_EXP_HOURS || "1", 10);
const LOGIN_MAX        = Number.parseInt(process.env.LOGIN_MAX_ATTEMPTS || "5", 10);
const LOGIN_LOCK_MIN   = Number.parseInt(process.env.LOGIN_LOCK_MINUTES || "15", 10);
const BCRYPT_ROUNDS    = 12;

function nowPlusHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
function nowPlusMinutes(mins) {
  return new Date(Date.now() + mins * 60 * 1000);
}

// ════════════════════════════════════════════════════════════
//  REGISTRO (VINCULACIÓN OMNICANAL SOLO POR CORREO)
// ════════════════════════════════════════════════════════════
//
// Si el correo ya pertenece a un cliente de mostrador (registrado en el POS,
// sin contraseña), la cuenta web se crea sobre esa MISMA fila para conservar
// su historial de compras. La vinculación es SOLO por correo: quien se
// registre ya no puede apropiarse de la fila de otra persona usando su
// teléfono. Además, en una fila existente no se modifica nombre, teléfono ni
// fecha de nacimiento: la cuenta sigue inactiva hasta que el dueño del correo
// la confirma, y después puede corregir sus datos desde su perfil.
export const registrarUsuario = async (req, res) => {
  const client = await pool.connect(); // Usamos client para manejar la transacción

  try {
    await asegurarColumnasSeguridad();

    // En el registro web la fecha de nacimiento es obligatoria (la valida
    // registerValidator). El RFC no se pide aquí, solo en el alta desde el POS.
    // registerValidator también exige acepta_terminos === true.
    const { nombre, email, password, telefono_contacto, fecha_nacimiento } = req.body;
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await client.query('BEGIN');

    const mail = email.trim();
    const tel = telefono_contacto?.trim() || null;
    const nacimiento = fecha_nacimiento?.trim() || null;

    // 1. ¿Ya existe una persona con ese correo? (el teléfono NO se usa para vincular)
    const { rows: encontradas } = await client.query(
      `SELECT id, password_hash, email_verificado, cuenta_activa, es_empleado, eliminado_en
         FROM seguridad.personas
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        FOR UPDATE`,
      [mail]
    );
    const existente = encontradas[0] || null;

    // 2. Cuenta ya en uso: verificada, activa o de un empleado.
    //    Una cuenta web que nunca se confirmó sí puede registrarse de nuevo
    //    (así nadie bloquea un correo ajeno registrándolo primero).
    // Eliminación pendiente: se cancela iniciando sesión, no registrándose otra vez.
    if (existente?.eliminado_en) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: "Esta cuenta está programada para eliminarse. Si quieres conservarla, inicia sesión con tu contraseña.",
      });
    }

    const cuentaEnUso = existente?.password_hash && (
      existente.email_verificado === true ||
      existente.cuenta_activa === true ||
      existente.es_empleado === true
    );
    if (cuentaEnUso) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Este correo electrónico ya se encuentra registrado." });
    }

    let userId;

    if (existente) {
      // 3a. Cliente de mostrador o registro web sin confirmar: solo se
      //     agregan las credenciales. Los demás datos no cambian hasta que
      //     el titular confirme el correo.
      const upd = await client.query(
        `UPDATE seguridad.personas
            SET password_hash = $1,
                es_cliente = TRUE,
                cuenta_activa = FALSE,
                email_verificado = FALSE,
                token_version = COALESCE(token_version, 0),
                terminos_aceptados_en = NOW(),
                terminos_version = $2,
                aviso_version = $3,
                actualizado_en = NOW()
          WHERE id = $4
          RETURNING id`,
        [hashedPassword, TERMINOS_VERSION, AVISO_VERSION, existente.id]
      );
      userId = upd.rows[0].id;

      // Los enlaces de activación anteriores dejan de servir.
      await client.query(
        `UPDATE seguridad.tokens SET usado = TRUE
          WHERE usuario_id = $1 AND tipo = 'verificacion' AND usado = FALSE`,
        [userId]
      );
    } else {
      // 3b. Persona nueva con cuenta web
      const userResult = await client.query(
        `INSERT INTO seguridad.personas
           (nombre, email, password_hash, telefono, fecha_nacimiento, cuenta_activa,
            email_verificado, es_cliente, es_empleado, rol_id, token_version,
            terminos_aceptados_en, terminos_version, aviso_version)
         VALUES ($1, $2, $3, $4, $5, FALSE, FALSE, TRUE, FALSE, 4, 0, NOW(), $6, $7)
         RETURNING id`,
        [nombre.trim(), mail, hashedPassword, tel, nacimiento, TERMINOS_VERSION, AVISO_VERSION]
      );
      userId = userResult.rows[0].id;
    }

    // 4. Generar token de verificación por correo
    const token    = generateToken(32);
    const tokenExp = nowPlusHours(VERIF_EXP_HOURS);

    await client.query(
      `INSERT INTO seguridad.tokens (usuario_id, tipo, token_hash, expira_en, usado)
       VALUES ($1, 'verificacion', $2, $3, FALSE)`,
      [userId, token, tokenExp]
    );

    await client.query('COMMIT'); // Todo salió bien, guardamos los cambios

    // 5. Enviar el correo electrónico (No detiene el registro si falla)
    try {
      await sendVerificationEmail(mail, nombre, token);
    } catch (error_) {
      console.error("Error enviando email de verificación:", error_.message);
    }

    return res.status(201).json({
      message: "Registro exitoso. Recibirás un correo con instrucciones para activar tu cuenta.",
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {}); // Deshacemos todo si hay un error

    if (error.code === "23505") {
      // Código 23505 = Unique Violation. Significa que el correo ya está en seguridad.personas
      // Mensaje seguro que no revela más información de la necesaria.
      return res.status(400).json({ message: "Este correo electrónico ya se encuentra registrado." });
    }

    console.error("Error registrarUsuario:", error);
    return res.status(500).json({ message: "Error interno del servidor al procesar el registro." });
  } finally {
    client.release();
  }
};

// ════════════════════════════════════════════════════════════
//  ACTIVAR CUENTA
// ════════════════════════════════════════════════════════════
export const activarCuenta = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ message: "Token inválido" });

    // Buscar token vigente en la tabla tokens
    const tokenResult = await pool.query(
      `SELECT id, usuario_id, expira_en
       FROM tokens
       WHERE token_hash = $1
         AND tipo = 'verificacion'
         AND usado = FALSE`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }
    const tkn = tokenResult.rows[0];

    if (new Date(tkn.expira_en) < new Date()) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    // Activar usuario
    await pool.query(
      `UPDATE seguridad.personas
       SET cuenta_activa = TRUE, email_verificado = TRUE, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [tkn.usuario_id]
    );

    // Marcar token como usado
    await pool.query(`UPDATE tokens SET usado = TRUE WHERE id = $1`, [tkn.id]);

    return res.json({ message: "Cuenta activada correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al activar cuenta" });
  }
};

// ════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════
export const loginUsuario = async (req, res) => {
  try {
    await asegurarColumnasSeguridad();
    const { email, password } = req.body;

    // 🔥 Modificación: Añadimos requiere_cambio_password y apuntamos al esquema seguridad
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.password_hash, u.cuenta_activa, u.login_attempts, u.lock_until, u.token_version, u.requiere_cambio_password, u.eliminado_en, r.nombre AS rol
       FROM seguridad.personas u
       LEFT JOIN seguridad.roles r ON r.id = u.rol_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    // Sin fila, o persona sin credenciales (cliente de mostrador): mismo mensaje
    if (result.rows.length === 0 || !result.rows[0].password_hash) {
      await bcrypt.hash("dummy", 12); // prevenir timing attack
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    const user = result.rows[0];

    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(423).json({
        message: `Cuenta bloqueada temporalmente por intentos fallidos. Intenta en 15 minutos.`,
      });
    }
    // Una cuenta con eliminación pendiente está inactiva, pero si el titular
    // inicia sesión con su contraseña dentro de los 30 días, se cancela.
    if (!user.cuenta_activa && !user.eliminado_en) {
      return res.status(403).json({ message: "Cuenta inactiva. Revisa tu correo para activarla." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const attempts  = (user.login_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await pool.query(
        "UPDATE seguridad.personas SET login_attempts = $1, lock_until = $2 WHERE id = $3",
        [attempts, lockUntil, user.id]
      );
      return res.status(401).json({
        message: `Credenciales inválidas. Intento ${attempts} de 5`,
      });
    }

    // Resetear intentos
    await pool.query(
      `UPDATE seguridad.personas
       SET login_attempts = 0, lock_until = NULL, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    let eliminacionCancelada = false;
    if (user.eliminado_en) {
      await cancelarEliminacion(pool, user.id);
      eliminacionCancelada = true;
    }

    // 🔥 NUEVA LÓGICA: Si requiere cambio de contraseña, enviamos un token temporal (15 min) y la bandera
    if (user.requiere_cambio_password) {
      const tokenTemp = jwt.sign(
        { id: user.id, email, token_version: user.token_version, temp: true },
        process.env.JWT_SECRET || "secreto_super_seguro",
        { expiresIn: "15m" }
      );
      
      return res.json({
        message: "Cambio de contraseña requerido",
        requirePasswordChange: true,
        token: tokenTemp,
        usuario: { id: user.id, email, rol: user.rol || 'rol_cliente' }
      });
    }

    // Login normal si no requiere cambio
    const tokenPayload = { id: user.id, email, token_version: user.token_version };
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "secreto_super_seguro",
      { expiresIn: "8h" }
    );

    return res.json({
      message: eliminacionCancelada
        ? "Se canceló la eliminación de tu cuenta. Bienvenido de nuevo."
        : "Login exitoso",
      eliminacionCancelada,
      requirePasswordChange: false,
      token,
      usuario: { 
          id: user.id, 
          email, 
          rol: user.rol || 'rol_cliente', 
          nombre: user.nombre // ¡AQUÍ ESTABA EL FALTANTE!
      },
    });
  } catch (e){
    console.error(e);
    return res.status(500).json({ message: "Error interno" });
  }
};

// ════════════════════════════════════════════════════════════
//  LOGOUT
// ════════════════════════════════════════════════════════════
export const logoutUsuario = async (req, res) => {
  try {
    await pool.query(
      `UPDATE seguridad.personas
       SET token_version = token_version + 1, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.user.id]
    );
    return res.json({ message: "Sesión cerrada y tokens invalidados." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al cerrar sesión" });
  }
};

// ════════════════════════════════════════════════════════════
//  RECUPERACIÓN DE CONTRASEÑA
// ════════════════════════════════════════════════════════════
// Máximo de códigos incorrectos por cuenta antes de bloquear la recuperación.
const RECOVERY_MAX_INTENTOS = 5;
const RECOVERY_LOCK_MIN = Number.parseInt(process.env.RECOVERY_LOCK_MINUTES || "15", 10);

function minutosRestantes(hasta) {
  return Math.max(1, Math.ceil((new Date(hasta).getTime() - Date.now()) / 60000));
}

function mensajeBloqueo(hasta) {
  const min = minutosRestantes(hasta);
  return `Superaste el número de intentos para el código de recuperación. Espera ${min} minuto${min === 1 ? "" : "s"} y solicita un código nuevo.`;
}

export const requestPasswordReset = async (req, res) => {
  try {
    await asegurarColumnasSeguridad();
    const { email } = req.body;

    const result = await pool.query(
      `SELECT id, nombre, recovery_lock_until
         FROM seguridad.personas
        WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ message: "Si el correo existe, se enviaron instrucciones." });
    }
    const user = result.rows[0];

    // Mientras la recuperación esté bloqueada no se generan códigos nuevos;
    // si no, el bloqueo se podría saltar pidiendo un código tras otro.
    if (user.recovery_lock_until && new Date(user.recovery_lock_until) > new Date()) {
      return res.status(429).json({ message: mensajeBloqueo(user.recovery_lock_until) });
    }

    // Invalidar tokens anteriores
    await pool.query(
      `UPDATE tokens SET usado = TRUE
       WHERE usuario_id = $1 AND tipo = 'recuperacion' AND usado = FALSE`,
      [user.id]
    );

    // Generar nuevo token numérico de 6 dígitos (crypto, no Math.random)
    const token     = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = hashToken(token);
    const expiry    = nowPlusHours(RESET_EXP_HOURS);

    // Código nuevo: el contador de intentos empieza de cero.
    await pool.query(
      `UPDATE seguridad.personas
          SET recovery_attempts = 0, recovery_lock_until = NULL
        WHERE id = $1`,
      [user.id]
    );

    await pool.query(
      `INSERT INTO tokens (usuario_id, tipo, token_hash, expira_en, usado)
       VALUES ($1, 'recuperacion', $2, $3, FALSE)`,
      [user.id, tokenHash, expiry]
    );

    try {
      await sendResetEmail(email, user.nombre || "Usuario", token);
    } catch (error_) {
      console.error("Error enviando email de recuperación:", error_.message);
    }

    return res.json({ message: "Correo enviado con éxito. Revisa tu bandeja." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

/**
 * Comprueba el código de recuperación de UNA cuenta (correo + código).
 * Cada código incorrecto suma un intento; al llegar a 5 se bloquea la
 * recuperación de esa cuenta durante RECOVERY_LOCK_MIN minutos y el código
 * vigente se invalida (hay que pedir uno nuevo al terminar la espera).
 *
 * Devuelve { ok: true, tokenId, usuarioId } o { ok: false, status, message }.
 */
async function verificarCodigoRecuperacion(email, codigo) {
  if (!email) {
    // Las versiones anteriores de la web y la app solo enviaban el código.
    return {
      ok: false,
      status: 400,
      message: "Falta el correo electrónico. Si usas la app, actualízala a la versión más reciente.",
    };
  }

  const { rows: personas } = await pool.query(
    `SELECT id, recovery_attempts, recovery_lock_until
       FROM seguridad.personas
      WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  const persona = personas[0];
  if (!persona) {
    return { ok: false, status: 400, message: "Código inválido o expirado" };
  }

  if (persona.recovery_lock_until && new Date(persona.recovery_lock_until) > new Date()) {
    return { ok: false, status: 429, message: mensajeBloqueo(persona.recovery_lock_until) };
  }

  const { rows: tokens } = await pool.query(
    `SELECT id, expira_en
       FROM tokens
      WHERE token_hash = $1
        AND usuario_id = $2
        AND tipo = 'recuperacion'
        AND usado = FALSE`,
    [hashToken(String(codigo).trim()), persona.id]
  );
  const tkn = tokens[0];

  if (tkn && new Date(tkn.expira_en) >= new Date()) {
    return { ok: true, tokenId: tkn.id, usuarioId: persona.id };
  }

  // Código incorrecto o vencido: cuenta como intento fallido.
  const intentos = (persona.recovery_attempts || 0) + 1;

  if (intentos >= RECOVERY_MAX_INTENTOS) {
    const hasta = nowPlusMinutes(RECOVERY_LOCK_MIN);
    await pool.query(
      `UPDATE seguridad.personas
          SET recovery_attempts = 0, recovery_lock_until = $1
        WHERE id = $2`,
      [hasta, persona.id]
    );
    await pool.query(
      `UPDATE tokens SET usado = TRUE
        WHERE usuario_id = $1 AND tipo = 'recuperacion' AND usado = FALSE`,
      [persona.id]
    );
    return { ok: false, status: 429, message: mensajeBloqueo(hasta) };
  }

  await pool.query(
    `UPDATE seguridad.personas SET recovery_attempts = $1 WHERE id = $2`,
    [intentos, persona.id]
  );
  const quedan = RECOVERY_MAX_INTENTOS - intentos;
  return {
    ok: false,
    status: 400,
    message: `Código inválido o expirado. Te quedan ${quedan} intento${quedan === 1 ? "" : "s"}.`,
  };
}

export const validateResetToken = async (req, res) => {
  try {
    await asegurarColumnasSeguridad();
    const { email, token } = req.body;
    if (!token) return res.status(400).json({ message: "Código inválido" });

    const resultado = await verificarCodigoRecuperacion(email, token);
    if (!resultado.ok) {
      return res.status(resultado.status).json({ message: resultado.message });
    }

    return res.json({ message: "Código válido" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al validar el código" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    await asegurarColumnasSeguridad();
    const { email, token, nueva_password } = req.body;
    if (!token || !nueva_password) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    if (nueva_password.length < Number.parseInt(process.env.PASSWORD_MIN_LENGTH || "8", 10)) {
      return res.status(400).json({ message: "Contraseña no cumple requisitos" });
    }

    const resultado = await verificarCodigoRecuperacion(email, token);
    if (!resultado.ok) {
      return res.status(resultado.status).json({ message: resultado.message });
    }

    const hashed = await bcrypt.hash(nueva_password, BCRYPT_ROUNDS);

    // Nueva contraseña: se limpian los contadores y se cierran las sesiones
    // abiertas (token_version + 1) por si alguien más tenía acceso.
    await pool.query(
      `UPDATE seguridad.personas
          SET password_hash = $1,
              recovery_attempts = 0,
              recovery_lock_until = NULL,
              login_attempts = 0,
              lock_until = NULL,
              token_version = COALESCE(token_version, 0) + 1,
              actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [hashed, resultado.usuarioId]
    );

    await pool.query(`UPDATE tokens SET usado = TRUE WHERE id = $1`, [resultado.tokenId]);

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error interno" });
  }
};

// ════════════════════════════════════════════════════════════
//  ELIMINAR MI CUENTA (cliente)
// ════════════════════════════════════════════════════════════
//
// Bloquea la cuenta de inmediato y la anonimiza a los 30 días (ver
// services/cuentaService.js). Pide la contraseña para confirmar.
export const eliminarCuenta = async (req, res) => {
  const client = await pool.connect();
  try {
    await asegurarColumnasSeguridad();
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Escribe tu contraseña para confirmar." });
    }

    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, nombre, email, password_hash, es_empleado, eliminado_en
         FROM seguridad.personas
        WHERE id = $1
        FOR UPDATE`,
      [req.user.id]
    );
    const persona = rows[0];
    if (!persona) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Cuenta no encontrada." });
    }
    if (persona.es_empleado) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "Las cuentas del personal las da de baja el administrador de la tienda.",
      });
    }

    const correcta = persona.password_hash && (await bcrypt.compare(password, persona.password_hash));
    if (!correcta) {
      await client.query("ROLLBACK");
      // 400 y no 401: la app móvil cierra la sesión ante cualquier 401/403.
      return res.status(400).json({ message: "La contraseña no es correcta." });
    }

    if (await tieneApartadoActivo(client, persona.id)) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: MENSAJE_APARTADO_ACTIVO });
    }

    await marcarEliminacion(client, persona.id);
    await client.query("COMMIT");

    const fecha = fechaAnonimizacion();
    if (persona.email) {
      sendAccountDeletionEmail(persona.email, persona.nombre, fecha).catch(() => {});
    }

    return res.json({
      message:
        "Tu cuenta se desactivó y tus datos personales se borrarán en 30 días. " +
        "Si cambias de opinión, inicia sesión antes de esa fecha.",
      anonimizacion_programada: fecha.toISOString(),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error eliminarCuenta:", error);
    return res.status(500).json({ message: "No se pudo eliminar la cuenta. Inténtalo de nuevo." });
  } finally {
    client.release();
  }
};

// ════════════════════════════════════════════════════════════
//  PERFIL
// ════════════════════════════════════════════════════════════
export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      // telefono AS telefono_contacto: se conserva el nombre del contrato de la API
      "SELECT id, nombre, email, telefono AS telefono_contacto FROM seguridad.personas WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener perfil" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nombre, email, telefono_contacto } = req.body;
    await pool.query(
      `UPDATE seguridad.personas
       SET nombre = $1, email = $2, telefono = $3, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [nombre, email, telefono_contacto || null, req.user.id]
    );
    return res.json({ message: "Perfil actualizado correctamente" });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ message: "Ese correo ya está en uso por otro usuario." });
    }
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar perfil" });
  }
};

// ════════════════════════════════════════════════════════════
//  CAMBIO DE CONTRASEÑA FORZADO (EMPLEADOS)
// ════════════════════════════════════════════════════════════
// ... (mantiene todo el código anterior intacto hasta antes de forcePasswordChange)

export const forcePasswordChange = async (req, res) => {
  try {
    const { nueva_password } = req.body;
    const userId = req.user.id;

    if (!nueva_password || nueva_password.length < 8) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(nueva_password, salt);

    const query = `
      UPDATE seguridad.personas 
      SET password_hash = $1, 
          requiere_cambio_password = FALSE, 
          token_version = token_version + 1, 
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING email;
    `;
    const { rows } = await pool.query(query, [hashedNewPassword, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const userEmail = rows[0].email;
    
    const rolQuery = await pool.query(`
       SELECT u.token_version, r.nombre AS rol
       FROM seguridad.personas u
       LEFT JOIN seguridad.roles r ON r.id = u.rol_id
       WHERE u.id = $1
    `, [userId]);

    const finalUser = rolQuery.rows[0];

    const tokenDefinitivo = jwt.sign(
      { id: userId, email: userEmail, token_version: finalUser.token_version },
      process.env.JWT_SECRET || "secreto_super_seguro",
      { expiresIn: "8h" }
    );

    return res.json({ 
      message: "Contraseña actualizada exitosamente.",
      token: tokenDefinitivo,
      usuario: { id: userId, email: userEmail, rol: finalUser.rol || 'rol_cliente' }
    });
  } catch (error) {
    console.error("Error en forcePasswordChange:", error);
    return res.status(500).json({ message: "Error interno al actualizar la contraseña." });
  }
};

export const actualizarPin = async (req, res) => {
  const { nuevoPin } = req.body;
  const { id } = req.user;

  if (!/^\d{4}$/.test(String(nuevoPin))) {
    return res.status(400).json({ message: "El PIN debe ser de 4 dígitos numéricos." });
  }

  try {
    const lookup = hashPin(String(nuevoPin));
    await pool.query(
      `UPDATE seguridad.personas SET pin_lookup = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id = $2`,
      [lookup, id]
    );
    return res.status(200).json({ message: "PIN actualizado correctamente." });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Ese PIN ya está en uso. Elige otro." });
    }
    console.error("Error al actualizar PIN:", error);
    return res.status(500).json({ message: "Error al actualizar el PIN." });
  }
};

export const adminAsignarPinVendedor = async (req, res) => {
  const { vendedorId, nuevoPin } = req.body;

  if (!vendedorId || !/^\d{4}$/.test(String(nuevoPin))) {
    return res.status(400).json({ message: "Se requiere vendedorId y un PIN de 4 dígitos." });
  }

  try {
    const lookup = hashPin(String(nuevoPin));
    const { rowCount } = await pool.query(
      `UPDATE seguridad.personas SET pin_lookup = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id = $2`,
      [lookup, vendedorId]
    );
    if (rowCount === 0) return res.status(404).json({ message: "Vendedor no encontrado." });
    return res.json({ message: "PIN del vendedor asignado correctamente." });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Ese PIN ya está en uso por otra persona. Elige otro." });
    }
    console.error("Error asignando PIN a vendedor:", error);
    return res.status(500).json({ message: "Error al asignar el PIN." });
  }
};