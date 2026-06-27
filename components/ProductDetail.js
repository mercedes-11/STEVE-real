"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./Cart";
import { formatPrice } from "@/lib/pricing";

export default function ProductDetail({ productId }) {
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProduct = async () => {
      try {
        const response = await fetch(`/api/productos/${productId}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No pudimos cargar el producto.");
        }

        setProduct(data.product);
      } catch (err) {
        setError(err.message || "No pudimos cargar el producto.");
      } finally {
        setLoading(false);
      }
    };

    getProduct();
  }, [productId]);

  if (loading) {
    return (
      <main className="product-detail-page">
        <section className="section">
          <div className="container product-detail-layout">
            <h1 className="catalog-title">Cargando producto...</h1>
          </div>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-detail-page">
        <section className="section">
          <div className="container product-detail-layout">
            <h1 className="catalog-title">Producto no encontrado</h1>
            {error && <p>{error}</p>}
            <Link href="/productos" className="selection-link">
              Volver a productos
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <section className="section">
        <div className="container product-detail-layout">
          <div className="product-detail-header">
            <h1 className="catalog-title">{product.name}</h1>
            <Link href="/productos" className="selection-link">
              Volver a productos
            </Link>
          </div>

          <div className="product-detail-card">
            <div className="product-detail-media">
              <img src={product.image} alt={product.name} className="product-detail-image" />
            </div>

            <div className="product-detail-info">
              <p className="product-detail-category">{product.category || "Producto"}</p>
              <h2>{product.name}</h2>
              <p className="product-detail-price">{formatPrice(product.price)}</p>
              {product.description && (
                <p className="product-detail-description">{product.description}</p>
              )}
              <button
                type="button"
                className="product-detail-add"
                onClick={() => addToCart(product)}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
