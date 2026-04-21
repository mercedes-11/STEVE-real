export default function Header({ cartItemsCount, onOpenCart }) {
  return (
    <header className="site-header">
      <div className="topbar">
        <p className="topbar__text">Knitted essentials · diseño artesanal · edición cuidada</p>
      </div>

      <div className="header-main">
        <a href="index.html" className="logo" aria-label="Volver al inicio">
          <div className="brand">
            <span className="brand-main">islabonita</span>
            <span className="brand-sub">STUDIO</span>
          </div>
        </a>

        <nav className="main-nav" aria-label="Navegación principal" id="primary-navigation">
          <ul className="main-nav__list">
            <li className="main-nav__item">
              <a href="sweaters.html" className="main-nav__link">
                Sweaters
              </a>
            </li>
            <li className="main-nav__item">
              <a href="index.html" className="main-nav__link">
                Home
              </a>
            </li>
          </ul>
        </nav>

        <div className="header-actions" aria-label="Acciones del usuario">
          <a
            href="#cart"
            className="header-actions__link cart-link"
            aria-label="Ver carrito"
            onClick={onOpenCart}
          >
            Cart <span className="cart-count">({cartItemsCount})</span>
          </a>
        </div>
      </div>
    </header>
  );
}
