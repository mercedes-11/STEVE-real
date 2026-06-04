"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await fetch("/api/productos", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No pudimos cargar la selección.");
        }

        setProducts(data.products || []);
      } catch (err) {
        setError(err.message || "No pudimos cargar la selección.");
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  if (loading) {
    return <p>Cargando selección...</p>;
  }

  if (error) {
    return <p style={{ color: "#8b3a2f" }}>{error}</p>;
  }

  if (!products.length) {
    return <p>No hay productos destacados disponibles.</p>;
  }

  return (
    <div className="selection-carousel">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
