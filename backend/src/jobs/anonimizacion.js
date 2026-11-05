import cron from "node-cron";
import { asegurarColumnasSeguridad } from "../config/schema.js";
import { anonimizarVencidas } from "../services/cuentaService.js";

async function ejecutar(origen) {
  try {
    await asegurarColumnasSeguridad();
    const total = await anonimizarVencidas();
    if (total > 0) console.log(`🧹 Anonimización (${origen}): ${total} cuenta(s) eliminada(s) definitivamente.`);
  } catch (error) {
    console.error(`❌ Error en la anonimización (${origen}):`, error.message);
  }
}

/**
 * Anonimiza las cuentas cuyo periodo de gracia de 30 días ya venció.
 * Corre todos los días a las 3:15 (hora de México) y una vez poco después de
 * arrancar, porque en Render el servidor puede estar dormido a esa hora.
 */
export function iniciarTareaAnonimizacion() {
  cron.schedule("15 3 * * *", () => ejecutar("diaria"), {
    timezone: "America/Mexico_City",
  });
  setTimeout(() => ejecutar("arranque"), 60 * 1000);
}
