import { Component } from "react";
import PropTypes from "prop-types";

/**
 * Si el código de una página (chunk de lazy()) no se puede descargar, por
 * ejemplo sin internet, React desmonta toda la app y queda la pantalla en
 * negro. Este componente atrapa ese error y muestra un mensaje con opción de
 * reintentar. Se reinicia solo al cambiar de ruta (prop resetKey).
 */
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    const sinConexion = typeof navigator !== "undefined" && !navigator.onLine;
    return (
      <div className="state-block" style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
        <h3>{sinConexion ? "Esta sección no está disponible sin conexión" : "No se pudo cargar esta sección"}</h3>
        <p style={{ color: "var(--text-muted)", maxWidth: 420 }}>
          {sinConexion
            ? "Vuelve a intentarlo cuando tengas internet. Mientras tanto puedes ver el inicio, el catálogo y las páginas legales."
            : "Ocurrió un problema al descargar la página. Intenta de nuevo."}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" style={{ width: "auto", padding: "10px 18px" }} onClick={() => globalThis.location.reload()}>
            Reintentar
          </button>
          <a href="/" style={{ alignSelf: "center", color: "var(--color-accent)" }}>Ir al inicio</a>
        </div>
      </div>
    );
  }
}

ChunkErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  resetKey: PropTypes.string,
};

export default ChunkErrorBoundary;
