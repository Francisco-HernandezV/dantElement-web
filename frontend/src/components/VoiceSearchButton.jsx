import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const MicIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>);

// Mensajes para cada error que puede devolver la Web Speech API.
const MENSAJES_ERROR = {
  "not-allowed": "Permiso de micrófono denegado. Actívalo en la configuración del navegador.",
  "service-not-allowed": "Permiso de micrófono denegado. Actívalo en la configuración del navegador.",
  "no-speech": "No te escuchamos. Toca el micrófono e intenta de nuevo.",
  "audio-capture": "No encontramos un micrófono en este dispositivo.",
  network: "La búsqueda por voz necesita conexión a internet.",
};

const obtenerReconocimiento = () =>
  typeof window === "undefined" ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;

/**
 * Botón de búsqueda por voz (sensor: micrófono). Usa la Web Speech API del
 * navegador. El permiso del micrófono se pide solo al tocar el botón.
 * Llama a onResultado(texto) con lo que dijo la persona.
 */
function VoiceSearchButton({ onResultado }) {
  const [escuchando, setEscuchando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const reconocimientoRef = useRef(null);
  const temporizadorRef = useRef(null);

  const mostrarMensaje = (texto, duracionMs = 4000) => {
    setMensaje(texto);
    clearTimeout(temporizadorRef.current);
    if (duracionMs) {
      temporizadorRef.current = setTimeout(() => setMensaje(""), duracionMs);
    }
  };

  // Al salir de la página: detener el micrófono y limpiar el temporizador.
  useEffect(() => () => {
    clearTimeout(temporizadorRef.current);
    reconocimientoRef.current?.abort();
  }, []);

  const alternar = () => {
    if (escuchando) {
      reconocimientoRef.current?.stop();
      return;
    }

    const Reconocimiento = obtenerReconocimiento();
    if (!Reconocimiento) {
      mostrarMensaje("Tu navegador no permite búsqueda por voz. Prueba con Chrome, Edge o Safari.", 5000);
      return;
    }
    if (!navigator.onLine) {
      mostrarMensaje(MENSAJES_ERROR.network);
      return;
    }

    const rec = new Reconocimiento();
    rec.lang = "es-MX";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setEscuchando(true);
      mostrarMensaje("Escuchando… di lo que buscas.", 0);
    };
    rec.onresult = (evento) => {
      const texto = (evento.results?.[0]?.[0]?.transcript || "").trim().replace(/[.。]$/, "");
      if (texto) {
        mostrarMensaje(`Buscando: "${texto}"`, 2500);
        onResultado(texto);
      }
    };
    rec.onerror = (evento) => {
      if (evento.error === "aborted") return;
      mostrarMensaje(MENSAJES_ERROR[evento.error] || "No se pudo usar el micrófono. Intenta de nuevo.", 5000);
    };
    rec.onend = () => {
      setEscuchando(false);
      setMensaje((actual) => (actual.startsWith("Escuchando") ? "" : actual));
    };

    reconocimientoRef.current = rec;
    try {
      rec.start(); // aquí el navegador pide el permiso del micrófono
    } catch {
      mostrarMensaje("No se pudo iniciar el micrófono. Intenta de nuevo.");
    }
  };

  return (
    <>
      <button
        type="button"
        className={`voice-btn ${escuchando ? "escuchando" : ""}`}
        onClick={alternar}
        aria-label={escuchando ? "Detener búsqueda por voz" : "Buscar por voz"}
        aria-pressed={escuchando}
        title="Buscar por voz"
      >
        <MicIcon />
      </button>
      {mensaje && (
        <div className="voice-msg" role="status" aria-live="polite">
          {mensaje}
        </div>
      )}
    </>
  );
}

VoiceSearchButton.propTypes = {
  onResultado: PropTypes.func.isRequired,
};

export default VoiceSearchButton;
