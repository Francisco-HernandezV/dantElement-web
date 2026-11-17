import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useConfig } from "../context/ConfigContext";
import "../styles/theme.css";
import "./QuienesSomos.css";

const VALORES = [
  { titulo: "Calidad", texto: "Elegimos cada prenda y accesorio por sus materiales y acabados, para que te acompañen mucho tiempo." },
  { titulo: "Exclusividad", texto: "Traemos piezas que no encuentras en cualquier lugar, en cantidades cuidadas." },
  { titulo: "Cercanía", texto: "Te atendemos en persona y en línea, y entregamos en Huejutla, San Felipe y Jaltocán." },
  { titulo: "Honestidad", texto: "Precios claros, apartados con reglas transparentes y respeto por tus datos personales." },
];

/** Página pública "Quiénes somos": historia, misión, visión, valores y contacto. */
function QuienesSomos() {
  const { config } = useConfig();
  const nombre = config?.nombre_tienda || "DanElement Boutique";

  useEffect(() => {
    document.title = "Quiénes somos · DanElement Boutique";
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="quienes-page">
        <header className="quienes-hero">
          <p className="quienes-eyebrow">Quiénes somos</p>
          <h1>Estilo urbano, hecho cerca de ti</h1>
          <p className="quienes-lead">
            {nombre} es una boutique de moda urbana de la Huasteca hidalguense: gorras, ropa y
            accesorios para quienes visten con actitud.
          </p>
        </header>

        <section className="quienes-seccion">
          <h2>Nuestra historia</h2>
          <p>
            Nacimos en Huejutla de Reyes con una idea sencilla: que el estilo urbano que ves en las
            grandes ciudades también esté al alcance aquí, con buena calidad y atención personal.
            Empezamos con una selección pequeña de gorras y accesorios y fuimos creciendo junto con
            nuestros clientes, sumando ropa y nuevas colecciones.
          </p>
          <p>
            Hoy combinamos la tienda física con este sitio y nuestra app, para que puedas ver el
            catálogo, apartar tus piezas y recibirlas en Huejutla, San Felipe y Jaltocán.
          </p>
        </section>

        <section className="quienes-mv">
          <article className="quienes-tarjeta">
            <h2>Misión</h2>
            <p>
              Ofrecer moda urbana de calidad y exclusiva, con un trato cercano y facilidades de compra,
              para que cada cliente exprese su estilo con confianza.
            </p>
          </article>
          <article className="quienes-tarjeta">
            <h2>Visión</h2>
            <p>
              Ser la boutique de referencia en estilo urbano de la Huasteca, reconocida por su
              selección, su servicio y su presencia tanto en tienda como en línea.
            </p>
          </article>
        </section>

        <section className="quienes-seccion">
          <h2>Nuestros valores</h2>
          <ul className="quienes-valores">
            {VALORES.map((v) => (
              <li key={v.titulo} className="quienes-tarjeta">
                <h3>{v.titulo}</h3>
                <p>{v.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="quienes-seccion quienes-visita">
          <h2>Visítanos</h2>
          <p>
            {config?.ubicacion ? (
              config.maps_url ? (
                <a href={config.maps_url} target="_blank" rel="noopener noreferrer">{config.ubicacion}</a>
              ) : config.ubicacion
            ) : (
              "Calle Cuauhtémoc número 1, Huejutla de Reyes, Hidalgo."
            )}
          </p>
          {config?.email_contacto && (
            <p>
              Escríbenos a <a href={`mailto:${config.email_contacto}`}>{config.email_contacto}</a>
            </p>
          )}
          <Link to="/catalogo/todo" className="quienes-cta">Ver el catálogo</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default QuienesSomos;
