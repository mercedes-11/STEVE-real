import { useEffect, useMemo, useState } from "react";
import CartPanel from "./components/CartPanel";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import SweatersPage from "./pages/SweatersPage";
import { PRODUCTS, STORAGE_KEY } from "./data/products";
import { formatPrice } from "./utils/format";

function loadSavedCart() {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);

    if (!savedCart) {
      return [];
    }

    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter(
      item =>
        item &&
        typeof item.id === "number" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number"
    );
  } catch (error) {
    console.error("No se pudo recuperar el carrito:", error);
    return [];
  }
}

export default function App() {
  const currentPage = document.body.dataset.page === "sweaters" ? "sweaters" : "home";
  const [cart, setCart] = useState(() => loadSavedCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("cart-open", isCartOpen);

    return () => {
      document.body.classList.remove("cart-open");
    };
  }, [isCartOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("No se pudo guardar el carrito en localStorage:", error);
    }
  }, [cart]);

  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") {
        setIsCartOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const cartItemsCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  function openCart(event) {
    if (event) {
      event.preventDefault();
    }

    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  function addToCart(productId) {
    const product = PRODUCTS.find(item => item.id === productId);

    if (!product) {
      return;
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === productId);

      if (existingItem) {
        return currentCart.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
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

    setIsCartOpen(true);
  }

  function updateQuantity(productId, change) {
    setCart(currentCart =>
      currentCart
        .map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();

    if (!email) {
      alert("Por favor, ingresá un email.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      alert("Ingresá un email válido.");
      return;
    }

    alert("Gracias por suscribirte al newsletter.");
    event.currentTarget.reset();
  }

  const commonPageProps = {
    products: PRODUCTS,
    onAddToCart: addToCart
  };

  return (
    <>
      <Header cartItemsCount={cartItemsCount} onOpenCart={openCart} />

      {currentPage === "sweaters" ? (
        <SweatersPage {...commonPageProps} />
      ) : (
        <HomePage {...commonPageProps} />
      )}

      <Footer onNewsletterSubmit={handleNewsletterSubmit} />

      <CartPanel
        cart={cart}
        cartTotal={formatPrice(cartTotal)}
        isOpen={isCartOpen}
        onClose={closeCart}
        onDecrease={productId => updateQuantity(productId, -1)}
        onIncrease={productId => updateQuantity(productId, 1)}
        onRemove={removeFromCart}
      />
    </>
  );
}
