import { useEffect, useState } from "react";
import { cardStyle, primaryBtn, ghostBtn } from "./pwaStyles";

const CHECK_EVERY_MS = 60 * 60 * 1000; // busca versión nueva cada hora

// Registra public/sw.js "a mano" (sin ninguna librería) y avisa cuando hay
// una versión nueva instalada y lista para activarse.
export default function UpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onNewWorker = (worker) => {
      worker.addEventListener("statechange", () => {
        // "installed" + ya había un SW controlando la página = hay una
        // versión nueva esperando, no es la primera instalación.
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
          setNeedRefresh(true);
        }
      });
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(reg.waiting);
          setNeedRefresh(true);
        }

        reg.addEventListener("updatefound", () => {
          if (reg.installing) onNewWorker(reg.installing);
        });

        const interval = setInterval(() => reg.update().catch(() => {}), CHECK_EVERY_MS);
        return () => clearInterval(interval);
      })
      .catch((error) => {
        console.error("Error registrando el service worker:", error);
      });

    // Cuando el SW en espera toma el control, recargamos una sola vez para
    // que la pestaña quede servida por la versión nueva.
    let recargando = false;
    const onControllerChange = () => {
      if (recargando) return;
      recargando = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const updateServiceWorker = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!needRefresh) return null;

  return (
    <div style={cardStyle} role="alert">
      <span style={{ flex: "1 1 160px" }}>Nueva versión disponible</span>
      <button type="button" style={primaryBtn} onClick={updateServiceWorker}>
        Actualizar
      </button>
      <button
        type="button"
        style={ghostBtn}
        onClick={() => setNeedRefresh(false)}
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}
