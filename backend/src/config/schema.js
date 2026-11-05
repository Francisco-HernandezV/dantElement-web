import pool from "./db.js";

// Versiones vigentes de los documentos legales publicados en el frontend
// (/terminos y /privacidad). Al cambiar un documento, sube su versión aquí y
// en frontend/src/pages/legal/legalVersions.js.
export const TERMINOS_VERSION = "1.2";
export const AVISO_VERSION = "1.1";

let asegurado = null;

/**
 * Agrega a seguridad.personas las columnas que usan el registro y la
 * recuperación de contraseña. Sigue el mismo patrón que configController
 * (ALTER TABLE ... IF NOT EXISTS) y se ejecuta una sola vez por proceso.
 *
 *  - recovery_attempts:     intentos fallidos del código de recuperación.
 *                           (recovery_lock_until ya existía en la tabla.)
 *  - terminos_aceptados_en: cuándo aceptó los Términos y el Aviso al registrarse.
 *  - terminos_version / aviso_version: qué versión aceptó.
 *  - eliminado_en:   cuándo pidió eliminar su cuenta (o el admin lo eliminó).
 *                    Desde ese momento la cuenta queda bloqueada y oculta.
 *  - anonimizado_en: cuándo se borraron sus datos personales (30 días después).
 */
export function asegurarColumnasSeguridad() {
  if (!asegurado) {
    asegurado = pool
      .query(`
        ALTER TABLE seguridad.personas
          ADD COLUMN IF NOT EXISTS recovery_attempts     INTEGER NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS recovery_lock_until   TIMESTAMP,
          ADD COLUMN IF NOT EXISTS terminos_aceptados_en TIMESTAMP,
          ADD COLUMN IF NOT EXISTS terminos_version      VARCHAR(20),
          ADD COLUMN IF NOT EXISTS aviso_version         VARCHAR(20),
          ADD COLUMN IF NOT EXISTS eliminado_en          TIMESTAMP,
          ADD COLUMN IF NOT EXISTS anonimizado_en        TIMESTAMP
      `)
      .catch((error) => {
        // Si falla, se reintenta en la siguiente petición.
        asegurado = null;
        throw error;
      });
  }
  return asegurado;
}
