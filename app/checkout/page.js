"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useCart } from "@/components/Cart";
import { formatPrice } from "@/lib/pricing";

const BANK_TRANSFER = "transferencia";
const MERCADO_PAGO = "mercado_pago";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState(BANK_TRANSFER);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOrderId, setSuccessOrderId] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login?redirect=/checkout");
      return;
    }

    const getProfile = async () => {
      setProfileLoading(true);

      const { data, error: profileError } = await supabase
        .from("usuarios")
        .select("nombre, apellido, email, direccion, telefono")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError) {
        setProfile(data);
      }

      setProfileLoading(false);
    };

    getProfile();
  }, [authLoading, router, user]);

  const handleConfirmOrder = async () => {
    if (orderLoading) {
      return;
    }

    setError(null);
    setSuccessOrderId(null);

    if (!user) {
      router.replace("/login?redirect=/checkout");
      return;
    }

    if (!cart.length) {
      setError("Tu carrito está vacío.");
      return;
    }

    setOrderLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/login?redirect=/checkout");
        return;
      }

      const endpoint =
        paymentMethod === MERCADO_PAGO ? "/api/mercadopago/preferencia" : "/api/ordenes";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentMethod,
          items: cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
          })),
          checkoutData: {
            email: profile?.email || user.email,
            nombre: profile?.nombre || "",
            telefono: profile?.telefono || "",
            direccion_envio: profile?.direccion || "",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No pudimos crear tu pedido.");
      }

      if (paymentMethod === MERCADO_PAGO) {
        if (!data.initPoint) {
          throw new Error("Mercado Pago no devolvió una URL de pago.");
        }

        window.location.assign(data.initPoint);
        return;
      }

      setSuccessOrderId(data.orderId);
      clearCart();
    } catch (orderError) {
      setError(orderError.message || "No pudimos crear tu pedido.");
    } finally {
      setOrderLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <main className="checkout-page">
        <section className="container checkout-shell">
          <p className="checkout-eyebrow">Checkout</p>
          <h1 className="checkout-title">Preparando tu compra...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!cart.length) {
    return (
      <main className="checkout-page">
        <section className="container checkout-shell">
          <p className="checkout-eyebrow">Checkout</p>
          <h1 className="checkout-title">Tu carrito está vacío</h1>
          <Link href="/productos" className="checkout-link">
            Ver productos
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="container checkout-shell">
        <div className="checkout-heading">
          <p className="checkout-eyebrow">Checkout</p>
          <h1 className="checkout-title">Finalizar compra</h1>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">
            <section className="checkout-section">
              <h2>Resumen</h2>
              <div className="checkout-items">
                {cart.map(item => (
                  <article key={item.id} className="checkout-item">
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </article>
                ))}
              </div>
              <div className="checkout-total">
                <span>Total</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>
            </section>

            <section className="checkout-section">
              <h2>Datos de contacto</h2>
              <dl className="checkout-profile">
                <div>
                  <dt>Nombre</dt>
                  <dd>{profile?.nombre || "-"}</dd>
                </div>
                <div>
                  <dt>Apellido</dt>
                  <dd>{profile?.apellido || "-"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{profile?.email || user.email}</dd>
                </div>
                <div>
                  <dt>Dirección</dt>
                  <dd>{profile?.direccion || "-"}</dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>{profile?.telefono || "-"}</dd>
                </div>
              </dl>
            </section>
          </div>

          <aside className="checkout-side">
            <section className="checkout-section">
              <h2>Método de pago</h2>

              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value={BANK_TRANSFER}
                    checked={paymentMethod === BANK_TRANSFER}
                    onChange={() => setPaymentMethod(BANK_TRANSFER)}
                  />
                  <span>Transferencia bancaria</span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value={MERCADO_PAGO}
                    checked={paymentMethod === MERCADO_PAGO}
                    onChange={() => setPaymentMethod(MERCADO_PAGO)}
                  />
                  <span>Pago seguro con Mercado Pago</span>
                </label>
              </div>

              {paymentMethod === BANK_TRANSFER ? (
                <div className="bank-details">
                  <p className="bank-details__note">
                    Coordinaremos los datos de transferencia por email/WhatsApp luego de confirmar el pedido.
                  </p>
                </div>
              ) : (
                <div className="mp-details">
                  <p>Te vamos a redirigir al Checkout Pro de Mercado Pago.</p>
                  <p>El stock se descuenta únicamente cuando Mercado Pago confirma el pago aprobado.</p>
                </div>
              )}

              {error && <p className="checkout-error">{error}</p>}

              {successOrderId && (
                <p className="checkout-success">
                  Pedido creado correctamente. Número de orden: {successOrderId}
                </p>
              )}

              <button
                type="button"
                className="checkout-confirm"
                onClick={handleConfirmOrder}
                disabled={orderLoading}
              >
                {orderLoading
                  ? paymentMethod === MERCADO_PAGO
                    ? "Preparando pago..."
                    : "Confirmando..."
                  : paymentMethod === MERCADO_PAGO
                    ? "Pagar con Mercado Pago"
                    : "Confirmar pedido"}
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
