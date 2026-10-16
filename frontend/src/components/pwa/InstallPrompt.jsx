import { useEffect, useState } from "react";
import { cardStyle, primaryBtn, ghostBtn } from "./pwaStyles";

const DISMISS_KEY = "pwa-install-dismissed";

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  // iPadOS 13+ se identifica como Mac
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [dismissed, setDismissed] = useState(() => wasDismissed());
  const ios = isIOS();

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault(); // evita el mini-infobar y guardamos el evento
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    const mq = window.matchMedia("(display-mode: standalone)");
    const onModeChange = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    mq.addEventListener("change", onModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onModeChange);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* sin storage: solo se oculta en esta sesión */
    }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null); // el evento solo se puede usar una vez
  };

  if (installed || dismissed) return null;

  if (deferredPrompt) {
    return (
      <div style={cardStyle} role="dialog" aria-label="Instalar aplicación">
        <span style={{ flex: "1 1 160px" }}>Instala la app para acceder más rápido.</span>
        <button type="button" style={primaryBtn} onClick={install}>
          Instalar app
        </button>
        <button type="button" style={ghostBtn} onClick={dismiss} aria-label="Cerrar">
          ✕
        </button>
      </div>
    );
  }

  if (ios) {
    return (
      <div style={cardStyle} role="dialog" aria-label="Cómo instalar la aplicación">
        <span style={{ flex: "1 1 160px" }}>
          Para instalar la app toca <strong>Compartir</strong> y luego{" "}
          <strong>Añadir a pantalla de inicio</strong>.
        </span>
        <button type="button" style={ghostBtn} onClick={dismiss} aria-label="Cerrar">
          ✕
        </button>
      </div>
    );
  }

  return null;
}
