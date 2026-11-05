import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import { AVISO_VERSION, FECHA_VIGENCIA } from "./legalVersions";

function Privacidad() {
  return (
    <LegalLayout
      titulo="Aviso de privacidad integral"
      version={AVISO_VERSION}
      vigencia={FECHA_VIGENCIA}
    >
      <p>
        Este aviso se emite conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
        Particulares, publicada en el Diario Oficial de la Federación el 20 de marzo de 2025 (“la Ley”). Aplica al
        sitio web, a la aplicación móvil y a la tienda física de DanElement Boutique.
      </p>

      <h2>1. Responsable</h2>
      <p>
        El <strong>Lic. José Daniel Hernández Pérez</strong>, quien opera el negocio con el nombre comercial{" "}
        <strong>DanElement Boutique</strong>, con domicilio en Calle Cuauhtémoc número 1, frente a la Presidencia
        Municipal, Huejutla de Reyes, Hidalgo, México, es el responsable del tratamiento de sus datos personales.
      </p>
      <p>
        Contacto para temas de privacidad: <strong>danelementboutique@gmail.com</strong> · Teléfono 56 4934 0578 ·
        En tienda, de lunes a sábado de 9:00 a 19:00 y domingo de 10:00 a 17:00.
      </p>

      <h2>2. Datos personales que tratamos</h2>
      <div className="legal-tabla-wrap">
        <table>
          <thead>
            <tr><th>Cuándo los obtenemos</th><th>Datos</th><th>Obligatorios u opcionales</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Al crear una cuenta en el sitio web o en la app</td>
              <td>Nombre completo, correo electrónico, contraseña y fecha de nacimiento. Teléfono.</td>
              <td>Obligatorios, salvo el teléfono</td>
            </tr>
            <tr>
              <td>Al registrarle como cliente en la tienda</td>
              <td>
                Nombre. Si usted los proporciona: teléfono, correo electrónico, fecha de nacimiento, RFC (solo para
                solicitar un comprobante fiscal) y observaciones sobre su atención.
              </td>
              <td>Solo el nombre es obligatorio</td>
            </tr>
            <tr>
              <td>Al comprar, apartar o cambiar mercancía</td>
              <td>
                Productos, importes, fechas, método de pago (efectivo, tarjeta o transferencia), referencia del pago,
                anticipos y abonos, y estado del apartado.
              </td>
              <td>Necesarios para la operación</td>
            </tr>
            <tr>
              <td>Al solicitar un envío</td>
              <td>Nombre, teléfono y lugar de entrega.</td>
              <td>Necesarios para el envío</td>
            </tr>
            <tr>
              <td>Al usar su cuenta</td>
              <td>
                Fecha de registro, aceptación de estos documentos, verificación del correo, intentos de inicio de
                sesión y de recuperación de contraseña, y bloqueos de seguridad.
              </td>
              <td>Se generan automáticamente</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>No tratamos datos personales sensibles</strong> (como origen étnico, salud, creencias o datos
        biométricos). No almacenamos números de tarjeta: los pagos con tarjeta se procesan en la terminal del banco.
        Su contraseña se guarda cifrada mediante una función de <em>hash</em> y nadie del personal puede conocerla.
      </p>
      <p>
        Algunos de estos datos son patrimoniales (importes, pagos y abonos). Los tratamos porque son necesarios para
        cumplir la compraventa o el apartado que usted solicita.
      </p>

      <h2>3. Finalidades</h2>
      <h3>Finalidades primarias (necesarias para el servicio)</h3>
      <ol>
        <li>Crear, verificar y administrar su cuenta, y permitirle iniciar sesión y recuperar su contraseña.</li>
        <li>
          Registrar sus compras, apartados, abonos y cambios de mercancía, y emitir los comprobantes
          correspondientes.
        </li>
        <li>Comunicarnos con usted sobre su cuenta, sus apartados y sus envíos.</li>
        <li>Coordinar los envíos que usted solicite.</li>
        <li>Atender las solicitudes de comprobante fiscal que usted haga en la tienda.</li>
        <li>
          Evaluar internamente, al momento de crear un apartado, la probabilidad de que este se cancele. Para ello se
          usa un modelo estadístico que considera su edad, su antigüedad como cliente y su historial de apartados. El
          resultado solo orienta al personal: <strong>no se toma ninguna decisión de forma automática</strong> y el
          apartado no se niega por este resultado.
        </li>
        <li>
          Proteger su cuenta y nuestros sistemas: detectar accesos indebidos, bloquear intentos repetidos y conservar
          registros de seguridad.
        </li>
        <li>Cumplir obligaciones legales y fiscales, y atender requerimientos de autoridades.</li>
      </ol>
      <h3>Finalidad secundaria (no necesaria para el servicio)</h3>
      <ol>
        <li>
          Clasificar a los clientes en grupos según su frecuencia y monto de compra, para que el personal ofrezca
          una mejor atención en tienda.
        </li>
      </ol>
      <p>
        Las promociones de la tienda se publican en sus redes sociales; <strong>no usamos sus datos para enviarle
        publicidad</strong> por correo, mensajes ni llamadas.
      </p>
      <p>
        Si no desea que sus datos se usen para la finalidad secundaria, puede indicarlo en cualquier momento por los
        medios de la sección 6. Su negativa no será motivo para negarle productos ni servicios.
      </p>

      <h2>4. Con quién compartimos sus datos</h2>
      <p>
        <strong>Proveedores que tratan datos por nuestra cuenta (encargados).</strong> Para operar los servicios
        usamos proveedores tecnológicos que alojan o procesan datos únicamente para ese fin:
      </p>
      <div className="legal-tabla-wrap">
        <table>
          <thead>
            <tr><th>Proveedor</th><th>Servicio</th><th>Datos a los que tiene acceso</th></tr>
          </thead>
          <tbody>
            <tr><td>Render</td><td>Servidores y base de datos; servicio de análisis estadístico</td><td>Los datos del sistema</td></tr>
            <tr><td>Vercel</td><td>Publicación del sitio web</td><td>Datos técnicos de la conexión (dirección IP)</td></tr>
            <tr><td>Brevo</td><td>Envío de los correos de activación y recuperación de contraseña</td><td>Nombre y correo electrónico</td></tr>
            <tr><td>Cloudinary</td><td>Almacenamiento de imágenes de productos y del logotipo</td><td>Ninguno de clientes</td></tr>
          </tbody>
        </table>
      </div>
      <p>Algunos de estos proveedores pueden almacenar la información en servidores ubicados fuera de México.</p>
      <p>
        <strong>Transferencias.</strong> Solo compartimos sus datos con terceros en estos casos, que no requieren su
        consentimiento conforme al artículo 36 de la Ley:
      </p>
      <div className="legal-tabla-wrap">
        <table>
          <thead>
            <tr><th>Destinatario</th><th>Finalidad</th><th>¿Requiere consentimiento?</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Mensajeros y operadores de transporte que llevan su envío</td>
              <td>Entregarle el paquete (nombre, teléfono y punto de entrega)</td>
              <td>No: es necesario para cumplir el envío que usted pidió</td>
            </tr>
            <tr>
              <td>Autoridades competentes</td>
              <td>Atender requerimientos legales o judiciales</td>
              <td>No: lo exige la ley</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>No vendemos ni rentamos sus datos personales.</p>

      <h2>5. Tecnologías que usan el sitio web y la app</h2>
      <p>
        El sitio web y la app <strong>no usan cookies de rastreo, publicidad personalizada ni herramientas de
        analítica</strong>.
      </p>
      <ul>
        <li>
          <strong>Sitio web:</strong> guarda en el almacenamiento local de su navegador (<em>localStorage</em>) la
          credencial de su sesión y su tipo de usuario, y guarda copias del catálogo para funcionar sin conexión. Esta
          información se borra al cerrar sesión o limpiar los datos del navegador. El sitio carga tipografías desde
          Google Fonts, por lo que Google recibe la dirección IP de su dispositivo.
        </li>
        <li>
          <strong>App móvil:</strong> guarda la credencial de su sesión en el almacenamiento cifrado del teléfono. No
          solicita acceso a su ubicación, cámara, contactos ni fotos, ni envía notificaciones.
        </li>
        <li>
          <strong>Asistente de voz (Alexa):</strong> consultar el catálogo por voz no requiere cuenta y no recaba
          datos personales. Las grabaciones de voz las procesa Amazon conforme a sus propios términos; nosotros no las
          recibimos ni las guardamos.
        </li>
      </ul>

      <h2>6. Derechos ARCO, revocación y limitación del uso</h2>
      <p>
        Usted puede <strong>acceder</strong> a sus datos, <strong>rectificarlos</strong>, <strong>cancelarlos</strong>{" "}
        u <strong>oponerse</strong> a su uso para fines específicos (derechos ARCO). También puede{" "}
        <strong>revocar</strong> su consentimiento y <strong>limitar</strong> el uso de sus datos.
      </p>
      <p><strong>Medios para presentar su solicitud:</strong></p>
      <ul>
        <li>
          Por correo electrónico a <strong>danelementboutique@gmail.com</strong>, con el asunto “Solicitud de derechos
          ARCO”.
        </li>
        <li>En la tienda, en Calle Cuauhtémoc número 1, Huejutla de Reyes, en el horario de atención.</li>
      </ul>
      <p><strong>Su solicitud debe incluir:</strong></p>
      <ol>
        <li>Su nombre y un correo electrónico o domicilio para responderle.</li>
        <li>
          Una copia de su identificación oficial vigente. Si actúa un representante, también su identificación y el
          documento que acredite la representación. Si escribe desde el correo registrado en su cuenta, podemos
          pedirle confirmar su identidad por ese medio.
        </li>
        <li>El derecho que desea ejercer y una descripción clara de los datos (salvo que solicite acceso).</li>
        <li>
          Cualquier información que ayude a localizar sus datos, como el teléfono o correo con que está registrado.
        </li>
        <li>Si pide una rectificación, la corrección que solicita y, en su caso, el documento que la respalde.</li>
      </ol>
      <p>
        <strong>Plazos:</strong> le responderemos en un máximo de <strong>20 días hábiles</strong> desde que recibamos
        su solicitud. Si procede, la haremos efectiva dentro de los <strong>15 días hábiles</strong> siguientes a la
        respuesta. Ambos plazos pueden ampliarse una sola vez por un periodo igual, si las circunstancias lo
        justifican; le avisaremos si eso ocurre.
      </p>
      <p>
        <strong>Respuesta:</strong> por el mismo medio por el que nos escribió, o por el que nos indique. Los datos
        que solicite se le entregarán en archivo electrónico. El trámite es gratuito; solo podrían cobrarse costos de
        reproducción o envío.
      </p>
      <p>
        <strong>Cuándo podemos negar la solicitud:</strong> si no se acredita la identidad; si no tenemos sus datos;
        si se afectan derechos de terceros; si existe un impedimento legal o resolución de autoridad; o si el derecho
        ya se ejerció. Le explicaremos el motivo.
      </p>
      <p>
        <strong>Cancelación y baja de cuenta:</strong> cuando proceda, sus datos se bloquearán y después se
        suprimirán. Los registros de ventas y pagos que la ley obliga a conservar se mantendrán sin datos que le
        identifiquen, o bloqueados, durante el plazo legal.
      </p>
      <p>
        Si lo desea, le proporcionamos un formato de solicitud en la tienda o por correo. Si considera que su
        solicitud no fue atendida correctamente, puede acudir a la <strong>Secretaría Anticorrupción y Buen
        Gobierno</strong>, autoridad en materia de protección de datos personales.
      </p>

      <h2>7. Personas menores de edad</h2>
      <p>
        Para crear una cuenta en el sitio web o en la app se requiere ser mayor de 18 años. Si un menor de edad
        realiza una compra en tienda, sus datos solo se tratarán con el consentimiento de su madre, padre o tutor.
      </p>

      <h2>8. Cambios a este aviso</h2>
      <p>
        Cualquier cambio se publicará en el sitio web, en la app y en la tienda, con su número de versión y fecha de
        entrada en vigor. Si el cambio agrega finalidades que requieran su consentimiento, se lo pediremos antes de
        aplicarlo.
      </p>
      <p>
        Consulte también los <Link to="/terminos">Términos y condiciones</Link>.
      </p>
    </LegalLayout>
  );
}

export default Privacidad;
