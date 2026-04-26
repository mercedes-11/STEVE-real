"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatPrice } from "../data/products";

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

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItemsCount,
        cartTotal,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart
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

  if (!cart.length) {
    return (
      <div className="cart-page__empty">
        <p>Tu carrito está vacío.</p>
      </div>
    );
  }

  return (
    <div className="cart-page__content">
      {cart.map(item => (
        <article key={item.id} className="cart-item">
          <div className="cart-item__info">
            <h3>{item.name}</h3>
            <p>{formatPrice(item.price)}</p>
          </div>

          <div className="cart-item__controls">
            <button type="button" className="cart-qty-btn" onClick={() => decreaseQuantity(item.id)}>
              -
            </button>
            <span className="cart-item__quantity">{item.quantity}</span>
            <button type="button" className="cart-qty-btn" onClick={() => increaseQuantity(item.id)}>
              +
            </button>
          </div>

          <div className="cart-item__subtotal">{formatPrice(item.price * item.quantity)}</div>

          <button type="button" className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>
            Eliminar
          </button>
        </article>
      ))}

      <div className="cart-summary">
        <span>Total</span>
        <strong>{formatPrice(cartTotal)}</strong>
      </div>

      <button type="button" className="cart-checkout">
        Finalizar compra
      </button>
    </div>
  );
}