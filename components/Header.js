"use client";

import Link from "next/link";
import { useCart } from "./Cart";

export default function Header() {
  const { cartItemsCount } = useCart();

  return (
    <header className="site-header">
      <div className="topbar">
        <p className="topbar__text">Knitted essentials · diseño artesanal · edición cuidada</p>
      </div>

      <div className="header-main">
        <Link href="/" className="logo" aria-label="Volver al inicio">
          <div className="brand">
            <span className="brand-main">islabonita</span>
            <span className="brand-sub">STUDIO</span>
          </div>
        </Link>

        <nav className="main-nav" aria-label="Navegación principal">
          <ul className="main-nav__list">
            <li className="main-nav__item">
              <Link href="/productos" className="main-nav__link">
                Productos
              </Link>
            </li>
            <li className="main-nav__item">
              <Link href="/" className="main-nav__link">
                Home
              </Link>
            </li>
          </ul>
        </nav>

        <div className="header-actions" aria-label="Acciones del usuario">
          <Link href="/carrito" className="header-actions__link cart-link" aria-label="Ver carrito">
            Cart <span className="cart-count">({cartItemsCount})</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
