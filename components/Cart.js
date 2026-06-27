"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/pricing";

const STORAGE_KEY = "islabonita-cart";
const CartContext = createContext(null);

function sanitizeCart(cart) {
  if (!Array.isArray(cart)) {
    return [];
  }

  return cart.filter(
    item =>
      item &&
      typeof item.id === "number" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      typeof item.quantity === "number"
  );
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);

      if (savedCart) {
        setCart(sanitizeCart(JSON.parse(savedCart)));
      }
    } catch (error) {
      console.error("No se pudo recuperar el carrito:", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("No se pudo guardar el carrito:", error);
    }
  }, [cart, isReady]);

  const cartItemsCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  async function syncCartItem(productId, quantity) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return;
      }

      const response = await fetch("/api/carrito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          producto_id: productId,
          cantidad: quantity,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error("No se pudo sincronizar el carrito:", data.error || response.statusText);
      }
    } catch (error) {
      console.error("No se pudo sincronizar el carrito:", error);
    }
  }

  function addToCart(product) {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);

      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          quantity: 1
        }
      ];
    });

    syncCartItem(product.id, 1);
  }

  function increaseQuantity(productId) {
    setCart(currentCart =>
      currentCart.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function decreaseQuantity(productId) {
    setCart(currentCart =>
      currentCart
        .map(item =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  }

  function clearCart() {
    setCart([]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("No se pudo vaciar el carrito:", error);
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItemsCount,
        cartTotal,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}

export default function Cart() {
  const { cart, cartTotal, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const router = useRouter();

  function handleCheckout() {
    router.push("/checkout");
  }

  if (!cart.length) {
    return (
      <div className="cart-page__empty">
        <p>Tu carrito está vacío.</p>
        <button type="button" className="cart-empty-link" onClick={() => router.push("/productos")}>
          Ver productos
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page__content">
      <section className="cart-items-panel" aria-label="Productos en el carrito">
        <div className="cart-section-heading">
          <p className="cart-section-kicker">Carrito</p>
          <h2>Sus selecciones</h2>
        </div>

        <div className="cart-items-list">
          {cart.map(item => (
            <article key={item.id} className={item.image ? "cart-item" : "cart-item cart-item--no-media"}>
              {item.image && (
                <div className="cart-item__media">
                  <img src={item.image} alt={item.name} />
                </div>
              )}

              <div className="cart-item__info">
                <h3>{item.name}</h3>
                <p>{formatPrice(item.price)}</p>
              </div>

              <div className="cart-item__controls" aria-label={`Cantidad de ${item.name}`}>
                <button type="button" className="cart-qty-btn" onClick={() => decreaseQuantity(item.id)}>
                  -
                </button>
                <span className="cart-item__quantity">{item.quantity}</span>
                <button type="button" className="cart-qty-btn" onClick={() => increaseQuantity(item.id)}>
                  +
                </button>
              </div>

              <div className="cart-item__subtotal">
                <span>Subtotal</span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </div>

              <button type="button" className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>
                Eliminar
              </button>
            </article>
          ))}
        </div>
      </section>

      <aside className="cart-summary-panel" aria-label="Resumen del pedido">
        <h2>Resumen del pedido</h2>

        <div className="cart-summary-row">
          <span>Subtotal</span>
          <strong>{formatPrice(cartTotal)}</strong>
        </div>

        <div className="cart-summary cart-summary--total">
          <span>Total estimado</span>
          <strong>{formatPrice(cartTotal)}</strong>
        </div>

        <button type="button" className="cart-checkout" onClick={handleCheckout}>
          Finalizar compra
        </button>
      </aside>
    </div>
  );
}
