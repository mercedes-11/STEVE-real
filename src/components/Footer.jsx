export default function Footer({ onNewsletterSubmit }) {
  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <h2>islabonita</h2>
          <p>
            En Islabonita, nuestra misión va más allá de la creación de textiles y objetos
            artesanales de alta calidad. Somos una firma de lujo que se enorgullece en tejer una
            conexión profunda entre el respeto por la tradición, la excelencia en el diseño y el
            impacto social positivo. Nos esforzamos por marcar una diferencia significativa en la
            vida cotidiana de las comunidades con las que trabajamos y en el entorno que nos rodea.
          </p>
        </div>

        <div className="footer-links">
          <h3>Categorías</h3>
          <ul>
            <li>
              <a href="sweaters.html">Sweaters</a>
            </li>
            <li>
              <a href="index.html#featured">Bottoms</a>
            </li>
            <li>
              <a href="index.html#featured">Tops</a>
            </li>
            <li>
              <a href="index.html#featured">Sets</a>
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h3>Ayuda</h3>
          <ul>
            <li>
              <a href="index.html#featured">Envíos</a>
            </li>
            <li>
              <a href="index.html#featured">Cambios y devoluciones</a>
            </li>
            <li>
              <a href="index.html#featured">Preguntas frecuentes</a>
            </li>
          </ul>
        </div>

        <div className="footer-newsletter">
          <h3>Newsletter</h3>
          <p>Suscribite para recibir novedades exclusivas</p>

          <form className="newsletter-form" onSubmit={onNewsletterSubmit}>
            <input type="email" name="email" placeholder="Tu email" required />
            <button type="submit">Suscribirme</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 islabonita. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
