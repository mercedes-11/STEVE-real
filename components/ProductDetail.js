"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

export default function ProductDetail({ productId }) {
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
            <ProductCard product={product} detail />
          </div>
        </div>
      </section>
    </main>
  );
}
