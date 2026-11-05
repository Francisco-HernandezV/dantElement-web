import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import "../styles/theme.css";

function UserProfile() {
  const [user, setUser] = useState({
    nombre: "",
    email: ""
  });
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);

  // Eliminar mi cuenta (solo clientes; el personal lo da de baja el admin)
  const navigate = useNavigate();
  const esCliente = (localStorage.getItem("rol") || "rol_cliente") === "rol_cliente";
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const [passwordBaja, setPasswordBaja] = useState("");
  const [errorBaja, setErrorBaja] = useState("");
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        setUser({
          nombre: res.data.nombre || "",
          email: res.data.email || ""
        });
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMensaje("");
    try {
      await api.put("/users/profile", user);
      setMensaje("✅ Perfil actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMensaje(error.response?.data?.message || "❌ Error al actualizar perfil");
    }
  };

  const handleEliminarCuenta = async (e) => {
    e.preventDefault();
    setErrorBaja("");
    if (!passwordBaja) {
      setErrorBaja("Escribe tu contraseña para confirmar.");
      return;
    }
    setEliminando(true);
    try {
      const { data } = await api.post("/users/eliminar-cuenta", { password: passwordBaja });
      localStorage.clear();
      alert(data.message);
      navigate("/");
    } catch (error) {
      setErrorBaja(error.response?.data?.message || "No se pudo eliminar la cuenta. Inténtalo de nuevo.");
    } finally {
      setEliminando(false);
    }
  };

  if (loading) return (
    <div className="state-block">
      <div className="spinner"></div>
      <h3>Cargando perfil...</h3>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="main-content">
        <div className="profile-wrapper">
          <div className="profile-header">
            <h2 className="section-title">Mi Perfil</h2>
            <p style={{color: "#8b949e"}}>Gestiona tu información personal</p>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label htmlFor="user_nombre">Nombre Completo</label>
              <input 
                id="user_nombre"
                type="text" 
                name="nombre" 
                value={user.nombre} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label htmlFor="user_email">Correo Electrónico</label>
              <input 
                id="user_email"
                type="email" 
                name="email" 
                value={user.email} 
                onChange={handleChange} 
              />
            </div>

            <button type="submit" className="btn-primary">Guardar Cambios</button>
            
            {mensaje && (
              <p style={{marginTop: "15px", color: mensaje.includes("✅") ? "#10b981" : "#ef4444", fontWeight: "bold"}}>
                {mensaje}
              </p>
            )}
          </form>

          <div style={{marginTop: "40px", borderTop: "1px solid #30363d", paddingTop: "20px"}}>
             <h3 style={{color: "white", fontSize: "1.1rem"}}>Seguridad</h3>
             <a href="/recover" style={{color: "#3b82f6", textDecoration: "underline", fontSize: "0.9rem"}}>
               ¿Quieres cambiar tu contraseña?
             </a>
          </div>

          {esCliente && (
            <div style={{marginTop: "40px", borderTop: "1px solid #30363d", paddingTop: "20px"}}>
              <h3 style={{color: "white", fontSize: "1.1rem"}}>Eliminar mi cuenta</h3>
              <p style={{color: "#8b949e", fontSize: "0.9rem", lineHeight: 1.6}}>
                Tu cuenta se desactiva de inmediato y tus datos personales se borran en 30 días.
                Tus compras y apartados se conservan sin datos que te identifiquen.
                Si cambias de opinión, inicia sesión antes de que pasen los 30 días.{" "}
                <Link to="/eliminar-cuenta" style={{color: "#3b82f6"}}>Más información</Link>
              </p>

              {!confirmandoBaja ? (
                <button
                  type="button"
                  onClick={() => setConfirmandoBaja(true)}
                  style={{background: "transparent", color: "#ef4444", border: "1px solid #ef4444", width: "auto", padding: "10px 18px"}}
                >
                  Eliminar mi cuenta
                </button>
              ) : (
                <form onSubmit={handleEliminarCuenta}>
                  <div className="form-group">
                    <label htmlFor="password_baja">Escribe tu contraseña para confirmar</label>
                    <input
                      id="password_baja"
                      type="password"
                      autoComplete="current-password"
                      value={passwordBaja}
                      onChange={(e) => setPasswordBaja(e.target.value)}
                    />
                  </div>
                  {errorBaja && (
                    <p style={{color: "#ef4444", fontSize: "0.9rem", marginBottom: "12px"}}>{errorBaja}</p>
                  )}
                  <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                    <button
                      type="submit"
                      disabled={eliminando}
                      style={{background: "#ef4444", color: "white", width: "auto", padding: "10px 18px"}}
                    >
                      {eliminando ? "Eliminando..." : "Sí, eliminar mi cuenta"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfirmandoBaja(false); setPasswordBaja(""); setErrorBaja(""); }}
                      style={{background: "transparent", color: "#8b949e", border: "1px solid #30363d", width: "auto", padding: "10px 18px"}}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default UserProfile;