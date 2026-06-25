"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const adminSections = [
  {
    title: "Productos",
    description: "Crear, editar, controlar stock y desactivar productos del catálogo.",
    href: "/admin/productos",
    action: "Ingresar a productos",
  },
  {
    title: "Órdenes",
    description: "Revisar pedidos, ver productos comprados y actualizar datos de entrega.",
    href: "/admin/ordenes",
    action: "Ingresar a órdenes",
  },
];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setIsAdmin(false);
          return;
        }

        const response = await fetch("/api/admin/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No pudimos verificar tu acceso.");
        }

        setIsAdmin(Boolean(data.isAdmin));
      } catch (err) {
        setError(err.message || "No pudimos verificar tu acceso.");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-panel container">
          <p className="admin-eyebrow">Admin</p>
          <h1 className="admin-title">Verificando acceso...</h1>
        </section>
      </main>
    );
  }

  if (error || !isAdmin) {
    return (
      <main className="admin-page">
        <section className="admin-panel container">
          <p className="admin-eyebrow">Admin</p>
          <h1 className="admin-title">No autorizado</h1>
          <p className="admin-error">{error || "Tu usuario no tiene permisos de administrador."}</p>
          <Link href="/" className="admin-link">
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-panel container">
        <div className="admin-heading admin-heading--split">
          <div>
            <p className="admin-eyebrow">Admin</p>
            <h1 className="admin-title">Panel de administración</h1>
          </div>
          <Link href="/productos" className="admin-link admin-link--secondary">
            Volver a vista cliente
          </Link>
        </div>

        <div className="admin-dashboard-grid">
          {adminSections.map(section => (
            <article key={section.href} className="admin-dashboard-card">
              <div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <Link href={section.href} className="admin-link">
                {section.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
