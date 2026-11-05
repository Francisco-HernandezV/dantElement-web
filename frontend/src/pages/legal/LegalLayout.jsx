import { useEffect } from "react";
import PropTypes from "prop-types";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./legal.css";

/** Marco común de las páginas legales (/terminos y /privacidad). */
function LegalLayout({ titulo, version, vigencia, children }) {
  useEffect(() => {
    document.title = `${titulo} · DanElement Boutique`;
    window.scrollTo(0, 0);
  }, [titulo]);

  return (
    <>
      <Navbar />
      <main className="legal-page">
        <article className="legal-doc">
          <h1>{titulo}</h1>
          {version && vigencia ? (
            <p className="legal-meta">
              Versión {version} · Vigente desde el {vigencia}
            </p>
          ) : (
            <p className="legal-meta">DanElement Boutique</p>
          )}
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}

LegalLayout.propTypes = {
  titulo: PropTypes.string.isRequired,
  version: PropTypes.string,
  vigencia: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default LegalLayout;
