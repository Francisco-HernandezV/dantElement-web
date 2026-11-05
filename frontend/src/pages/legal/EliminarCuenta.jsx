import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";

/**
 * Página pública con los pasos para eliminar la cuenta. Google Play pide una
 * dirección web así para las apps que permiten crear cuentas.
 */
function EliminarCuenta() {
  return (
    <LegalLayout titulo="Eliminar tu cuenta">
      <p>
        Puedes eliminar tu cuenta de DanElement Boutique en cualquier momento, desde la aplicación móvil
        DanElement, desde este sitio web o escribiéndonos.
      </p>

      <h2>Cómo eliminarla</h2>
      <h3>Desde la app DanElement</h3>
      <ol>
        <li>Inicia sesión y abre tu <strong>Perfil</strong> (ícono de persona, arriba a la derecha).</li>
        <li>Toca <strong>Eliminar mi cuenta</strong>.</li>
        <li>Escribe tu contraseña y confirma.</li>
      </ol>
      <h3>Desde el sitio web</h3>
      <ol>
        <li><Link to="/login">Inicia sesión</Link> y entra a <strong>Mi perfil</strong>.</li>
        <li>En la sección <strong>Eliminar mi cuenta</strong>, da clic en el botón y confirma con tu contraseña.</li>
      </ol>
      <h3>Por correo o en la tienda</h3>
      <p>
        Si no puedes iniciar sesión, escríbenos a <strong>danelementboutique@gmail.com</strong> con el asunto
        “Eliminar mi cuenta”, desde el correo con el que te registraste, o visítanos en Calle Cuauhtémoc número 1,
        Huejutla de Reyes, Hidalgo.
      </p>

      <h2>Qué pasa después</h2>
      <div className="legal-tabla-wrap">
        <table>
          <thead>
            <tr><th>Cuándo</th><th>Qué ocurre</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>De inmediato</td>
              <td>Tu cuenta se desactiva, se cierran tus sesiones y dejas de aparecer en el sistema de la tienda. Te enviamos un correo de confirmación.</td>
            </tr>
            <tr>
              <td>Durante 30 días</td>
              <td>Si cambias de opinión, inicia sesión con tu correo y contraseña y la eliminación se cancela.</td>
            </tr>
            <tr>
              <td>A los 30 días</td>
              <td>Borramos tu nombre, correo, teléfono, fecha de nacimiento, RFC, contraseña y direcciones.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Qué se conserva</h2>
      <p>
        Los registros de tus compras, pagos, apartados y abonos se conservan porque la ley nos obliga a guardarlos,
        pero ya <strong>sin ningún dato que te identifique</strong>: aparecen como “Cliente eliminado”.
      </p>
      <p className="legal-aviso">
        Si tienes un <strong>apartado activo</strong>, primero debes liquidarlo o cancelarlo en la tienda. Si lo
        cancelas, el anticipo y los abonos no se devuelven (Términos y condiciones, sección 8).
      </p>

      <p>
        Más información en el <Link to="/privacidad">Aviso de privacidad</Link> y en los{" "}
        <Link to="/terminos">Términos y condiciones</Link>.
      </p>
    </LegalLayout>
  );
}

export default EliminarCuenta;
