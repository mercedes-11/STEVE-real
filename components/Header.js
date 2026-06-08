"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./Cart";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const { cartItemsCount } = useCart();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      setIsAdmin(false);

      if (!user) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return;
      }

      try {
        const response = await fetch("/api/admin/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (isMounted) {
          setIsAdmin(Boolean(data.isAdmin));
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    }

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <header className="site-header">
      <div className="topbar">
        <p className="topbar__text">Knitted essentials - diseño artesanal - edición cuidada</p>
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
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="header-actions__link">
                  Panel admin
                </Link>
              )}
              <Link href="/perfil" className="header-actions__link">
                Mi cuenta
              </Link>
            </>
          ) : (
            <Link href="/login" className="header-actions__link">
              Iniciar sesión
            </Link>
          )}
          <Link href="/carrito" className="header-actions__link cart-link" aria-label="Ver carrito">
            Cart <span className="cart-count">({cartItemsCount})</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
