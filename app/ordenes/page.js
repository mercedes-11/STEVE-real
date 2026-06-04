"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { formatPrice } from "@/data/products";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoadingOrders(false);
      return;
    }

    const getOrders = async () => {
      setLoadingOrders(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError("Necesitas iniciar sesion para ver tus ordenes.");
          return;
        }

        const response = await fetch("/api/ordenes", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No pudimos cargar tus ordenes.");
        }

        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message || "No pudimos cargar tus ordenes.");
      } finally {
        setLoadingOrders(false);
      }
    };

    getOrders();
  }, [authLoading, user]);

  if (authLoading || loadingOrders) {
    return (
      <main className="orders-page">
        <section className="orders-panel container">
          <p className="orders-eyebrow">Mi cuenta</p>
          <h1 className="orders-title">Cargando ordenes...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="orders-page">
        <section className="orders-panel container">
          <p className="orders-eyebrow">Mi cuenta</p>
          <h1 className="orders-title">Mis ordenes</h1>
          <p className="orders-empty">Necesitas iniciar sesion para ver tu historial de compras.</p>
          <Link href="/login?redirect=/ordenes" className="orders-link">
            Iniciar sesion
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <section className="orders-panel container">
        <div className="orders-heading">
          <p className="orders-eyebrow">Mi cuenta</p>
          <h1 className="orders-title">Mis ordenes</h1>
        </div>

        {error && <p className="orders-error">{error}</p>}

        {!error && !orders.length && (
          <div className="orders-empty-block">
            <p className="orders-empty">Todavia no tenes ordenes.</p>
            <Link href="/productos" className="orders-link">
              Ver productos
            </Link>
          </div>
        )}

        {!!orders.length && (
          <div className="orders-list">
            {orders.map(order => (
              <article key={order.id} className="orders-item">
                <div>
                  <p className="orders-item__label">Numero de orden</p>
                  <h2>#{order.id}</h2>
                  <p>{formatDate(order.creado_en)}</p>
                </div>
                <div>
                  <p className="orders-item__label">Estado</p>
                  <p>{order.estado}</p>
                </div>
                <div>
                  <p className="orders-item__label">Productos</p>
                  <p>{order.cantidad_productos}</p>
                </div>
                <div className="orders-item__total">
                  <p className="orders-item__label">Total</p>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
