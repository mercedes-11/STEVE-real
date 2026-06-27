import Link from "next/link";
import Header from "../components/Header";
import { CartProvider } from "../components/Cart";
import "./globals.css";

export const metadata = {
  title: "islabonita",
  description: "E-commerce de ropa knitted con diseño artesanal, elegante y contemporáneo."
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <Header />
          {children}

          <footer className="site-footer">
            <div className="container footer-container">
              <div className="footer-brand">
                <h2>islabonita</h2>
                <p>
                  En Islabonita, nuestra misión va más allá de la creación de textiles y objetos
                  artesanales de alta calidad. Somos una firma de lujo que se enorgullece en tejer
                  una conexión profunda entre el respeto por la tradición, la excelencia en el diseño
                  y el impacto social positivo. Nos esforzamos por marcar una diferencia significativa
                  en la vida cotidiana de las comunidades con las que trabajamos y en el entorno que
                  nos rodea.
                </p>
              </div>

              <div className="footer-links">
                <h3>Navegación</h3>
                <ul>
                  <li>
                    <Link href="/">Home</Link>
                  </li>
                  <li>
                    <Link href="/productos">Productos</Link>
                  </li>
                  <li>
                    <Link href="/carrito">Carrito</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <p>© 2026 islabonita. Todos los derechos reservados.</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
