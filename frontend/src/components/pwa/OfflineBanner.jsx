import { useEffect, useState } from "react";

// Avisa cuando el navegador pierde conexión. No bloquea la app: solo informa.
export default function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: "8px 16px",
        textAlign: "center",
        fontSize: "0.85rem",
        fontWeight: 600,
        background: "var(--color-yellow, #f59e0b)",
        color: "#111",
      }}
    >
      Sin conexión. Algunas funciones no estarán disponibles hasta que vuelvas a estar en línea.
    </div>
  );
}
