import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import { TERMINOS_VERSION, FECHA_VIGENCIA } from "./legalVersions";

function Terminos() {
  return (
    <LegalLayout
      titulo="Términos y condiciones de uso"
      version={TERMINOS_VERSION}
      vigencia={FECHA_VIGENCIA}
    >
      <p>Sitio web y aplicación móvil de DanElement Boutique.</p>

      <h2>1. Quién ofrece la plataforma</h2>
      <p>
        <strong>DanElement Boutique</strong> es una tienda de ropa juvenil y accesorios, propiedad del{" "}
        <strong>Lic. José Daniel Hernández Pérez</strong>, ubicada en Calle Cuauhtémoc número 1, frente a la
        Presidencia Municipal, Huejutla de Reyes, Hidalgo, México.
      </p>
      <div className="legal-tabla-wrap">
        <table>
          <tbody>
            <tr><th scope="row">Teléfono y WhatsApp</th><td>56 4934 0578</td></tr>
            <tr><th scope="row">Correo electrónico</th><td>danelementboutique@gmail.com</td></tr>
            <tr><th scope="row">Horario de la tienda</th><td>Lunes a sábado de 9:00 a 19:00; domingo de 10:00 a 17:00</td></tr>
            <tr><th scope="row">Redes sociales</th><td>Instagram @danelement_boutique_huejutla y Facebook</td></tr>
          </tbody>
        </table>
      </div>

      <h2>2. Alcance y aceptación</h2>
      <p>Estos términos regulan el uso de dos servicios digitales de DanElement Boutique (en conjunto, “la plataforma”):</p>
      <ul>
        <li>El sitio web de DanElement Boutique.</li>
        <li>La aplicación móvil DanElement para Android.</li>
      </ul>
      <p>
        También regulan las compras, apartados, cambios y envíos que se registran en la plataforma, aunque se
        realicen en la tienda o por teléfono.
      </p>
      <p>
        Puede consultar el catálogo sin registrarse. Al crear una cuenta, usted declara que leyó y acepta estos
        términos. Si no está de acuerdo, no cree una cuenta ni use la plataforma.
      </p>
      <p>
        El uso de sus datos personales se rige por el <Link to="/privacidad">Aviso de privacidad</Link>.
      </p>

      <h2>3. Qué puede hacer en la plataforma</h2>
      <div className="legal-tabla-wrap">
        <table>
          <thead>
            <tr><th>Función</th><th>Sitio web</th><th>App móvil</th></tr>
          </thead>
          <tbody>
            <tr><td>Consultar el catálogo (fotos, precios, tallas, colores y existencias)</td><td>Sí, sin cuenta</td><td>Sí, sin cuenta</td></tr>
            <tr><td>Buscar y filtrar productos</td><td>Sí</td><td>Sí</td></tr>
            <tr><td>Crear cuenta, activarla por correo y recuperar la contraseña</td><td>Sí</td><td>Sí</td></tr>
            <tr><td>Consultar sus datos de cuenta</td><td>Sí</td><td>Sí</td></tr>
            <tr><td>Corregir nombre, correo y teléfono</td><td>Sí</td><td>No, por ahora</td></tr>
            <tr><td>Ver datos de contacto y ubicación de la tienda</td><td>Sí</td><td>Sí</td></tr>
            <tr><td>Comprar, pagar o apartar en línea</td><td><strong>No</strong></td><td><strong>No</strong></td></tr>
          </tbody>
        </table>
      </div>
      <p className="legal-aviso">
        <strong>La plataforma no vende en línea.</strong> Las compras y los apartados se hacen en la tienda física o
        se coordinan por teléfono o WhatsApp. Si ve un botón de carrito o de apartado, este todavía no está disponible.
      </p>
      <p>
        Los precios, fotografías y existencias del catálogo son <strong>informativos</strong>. Pueden cambiar sin
        previo aviso y el inventario puede agotarse en tienda antes de actualizarse. El precio que se cobra es el
        vigente en la tienda al momento de la compra. Los colores pueden verse distintos según la pantalla. Los
        precios están en pesos mexicanos.
      </p>

      <h2>4. Cuentas de clientes</h2>
      <ol>
        <li>
          Para crear una cuenta debe ser mayor de 18 años y dar datos verdaderos: nombre, correo electrónico,
          contraseña y fecha de nacimiento. El teléfono es opcional.
        </li>
        <li>La cuenta se activa al confirmar su correo electrónico con el enlace que le enviamos.</li>
        <li>
          Su contraseña es personal. Debe tener entre 8 y 16 caracteres, con al menos una mayúscula, una minúscula,
          un número y un símbolo. Por seguridad, la cuenta se bloquea temporalmente tras varios intentos fallidos de
          inicio de sesión, y la recuperación de contraseña se bloquea 15 minutos tras 5 códigos incorrectos.
        </li>
        <li>
          Si usted ya es cliente de la tienda y se registra con el mismo correo que dio en tienda, su cuenta puede
          quedar ligada a su historial de compras y apartados.
        </li>
        <li>
          Puede corregir su nombre, correo y teléfono desde su perfil en el sitio web, y solicitar la baja de su
          cuenta en cualquier momento por los medios del Aviso de privacidad.
        </li>
        <li>
          Podemos suspender o cancelar una cuenta que se use para suplantar a otra persona, intentar acceder sin
          autorización o afectar el funcionamiento de la plataforma.
        </li>
      </ol>

      <h2>5. Cuentas del personal de la tienda</h2>
      <p>
        El sitio web y la app móvil incluyen módulos de uso interno: punto de venta, apartados y abonos, inventario,
        reportes, corte de caja y administración. Solo pueden usarlos las personas que trabajan en la tienda, con
        una cuenta creada por el administrador.
      </p>
      <ol>
        <li>Cada cuenta del personal y su PIN son personales e intransferibles.</li>
        <li>El acceso a cada módulo depende del puesto (administrador, vendedor o gestor de inventario).</li>
        <li>
          La información de clientes, ventas e inventario solo puede usarse para el trabajo en la tienda. No puede
          copiarse, compartirse ni usarse para fines personales.
        </li>
        <li>Todas las operaciones quedan registradas con el nombre de quien las hizo.</li>
        <li>La cuenta se desactiva al terminar la relación laboral.</li>
      </ol>

      <h2>6. Usos prohibidos</h2>
      <p>No está permitido:</p>
      <ul>
        <li>Intentar acceder a módulos, cuentas o datos que no le corresponden.</li>
        <li>Registrar una cuenta con el correo o teléfono de otra persona.</li>
        <li>Usar programas automatizados para extraer información o saturar la plataforma.</li>
        <li>Intentar vulnerar la seguridad de la plataforma o alterar su funcionamiento.</li>
        <li>Copiar el catálogo, las fotografías o la marca con fines comerciales.</li>
      </ul>

      <h2>7. Compras en tienda y formas de pago</h2>
      <ol>
        <li>Se aceptan pagos en efectivo, con tarjeta, por transferencia o con una combinación de ellos.</li>
        <li>
          Cada venta se registra en la plataforma y se le entrega un comprobante (ticket), que puede recibir impreso
          o en PDF.
        </li>
        <li>Conserve su comprobante: lo necesitará para cambios y garantías.</li>
        <li>La plataforma no emite facturas. Si necesita factura de una compra, consúltelo directamente en la tienda.</li>
      </ol>

      <h2>8. Apartados</h2>
      <ol>
        <li>
          Puede apartar productos en la tienda dejando un <strong>anticipo de entre el 30 % y el 50 %</strong> del
          total. El porcentaje depende del monto de la compra y se le informa al apartar.
        </li>
        <li>El plazo para liquidar se indica en su comprobante de apartado.</li>
        <li>
          Puede abonar en efectivo, con tarjeta o por transferencia. Cada abono se registra y se refleja en su saldo.
        </li>
        <li>
          Mientras el apartado esté vigente, la mercancía queda reservada a su nombre. Se le entrega cuando liquida
          el total.
        </li>
        <li>
          Si el plazo vence sin que liquide, la tienda puede cancelar el apartado y regresar la mercancía a la venta.
        </li>
        <li>
          <strong>
            Si el apartado vence sin liquidarse o usted lo cancela, el anticipo y los abonos realizados no se
            devuelven ni se convierten en saldo a favor.
          </strong>{" "}
          Esta condición se le informa antes de apartar.
        </li>
      </ol>

      <h2>9. Cambios de mercancía</h2>
      <ol>
        <li>
          Puede cambiar un producto dentro de los <strong>7 días naturales</strong> siguientes a la compra,
          presentando su comprobante.
        </li>
        <li>El producto debe estar en buen estado, sin uso y con su etiqueta, si la traía.</li>
        <li>
          Puede cambiarlo por uno o varios productos cuyo precio sume <strong>igual o más</strong> de lo que pagó.
          Si el nuevo total es mayor, usted paga la diferencia.
        </li>
        <li><strong>No se devuelve dinero por cambio de opinión, talla, color o gusto.</strong></li>
      </ol>

      <h2>10. Garantía por defectos</h2>
      <p>
        La sección anterior no limita sus derechos como consumidor. Si un producto tiene un defecto de fabricación o
        no corresponde a lo ofrecido, usted puede elegir entre la reposición del producto, una bonificación o la
        devolución de lo pagado, conforme al artículo 92 de la Ley Federal de Protección al Consumidor. Repórtelo en
        la tienda o por teléfono con su comprobante.
      </p>

      <h2>11. Entregas y envíos</h2>
      <p>
        Los envíos no se solicitan en la plataforma. Se acuerdan por teléfono o WhatsApp al 56 4934 0578. Hay tres
        formas de recibir su compra:
      </p>
      <div className="legal-tabla-wrap">
        <table>
          <thead>
            <tr><th>Forma</th><th>Cómo funciona</th></tr>
          </thead>
          <tbody>
            <tr><td>Recoger en tienda</td><td>Sin costo, en el horario de atención.</td></tr>
            <tr><td>Envío local</td><td>Dentro de Huejutla y alrededores, con un mensajero en motocicleta.</td></tr>
            <tr>
              <td>Envío foráneo</td>
              <td>
                A localidades como Platón, San Felipe, Atlapexco o Huautla. La tienda lleva el paquete a la base de
                transporte de Huejutla que va a su localidad y lo entrega al operador que sale hacia allá. Usted lo
                recoge en el punto acordado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ol>
        <li>
          Antes de enviar se le informa el costo, el medio de transporte y el punto y el momento aproximados de
          entrega. El envío se hace solo cuando usted acepta.
        </li>
        <li>Usted debe dar datos de contacto y entrega correctos y recoger el paquete a tiempo.</li>
        <li>Revise el paquete al recibirlo. Si hay un defecto, aplica la sección 10.</li>
        <li>
          Si el paquete se pierde o se daña durante el traslado, DanElement Boutique responde por él y acordará con
          usted la solución: reposición del producto o devolución de lo pagado. Repórtelo por teléfono o WhatsApp en
          cuanto lo detecte.
        </li>
      </ol>

      <h2>12. Promociones</h2>
      <p>
        Las promociones se anuncian en las redes sociales oficiales de la tienda. Cada promoción aplica con las
        condiciones y la vigencia indicadas en su publicación. La plataforma no envía promociones por correo ni
        notificaciones.
      </p>

      <h2>13. Propiedad intelectual</h2>
      <p>
        La marca DanElement Boutique, su logotipo, las fotografías de productos y el diseño de la plataforma
        pertenecen a su titular o se usan con autorización. No pueden reproducirse con fines comerciales sin permiso
        por escrito.
      </p>

      <h2>14. Disponibilidad y responsabilidad</h2>
      <p>
        Procuramos que la plataforma funcione de forma continua, pero puede interrumpirse por mantenimiento, fallas de
        conexión o fallas de los proveedores de alojamiento. Esas interrupciones no afectan las compras ni los
        apartados ya registrados.
      </p>
      <p>
        No somos responsables de daños causados por el uso indebido de su cuenta cuando usted compartió su contraseña
        o no la protegió.
      </p>

      <h2>15. Cambios a estos términos</h2>
      <p>
        Cualquier cambio se publicará en el sitio web y en la app con su número de versión y fecha. Los cambios no
        afectan compras, apartados ni cambios de mercancía ya realizados. Si un cambio es importante, le pediremos
        aceptarlo la siguiente vez que inicie sesión.
      </p>

      <h2>16. Quejas y legislación aplicable</h2>
      <p>
        Si tiene una queja o duda, contáctenos primero por los medios de la sección 1. También puede acudir a la
        Procuraduría Federal del Consumidor (Profeco).
      </p>
      <p>
        Estos términos se rigen por las leyes de los Estados Unidos Mexicanos, en particular la Ley Federal de
        Protección al Consumidor. Para cualquier controversia, las partes se someten a los tribunales competentes de
        Huejutla de Reyes, Hidalgo, sin perjuicio de la competencia de la Profeco.
      </p>
    </LegalLayout>
  );
}

export default Terminos;
