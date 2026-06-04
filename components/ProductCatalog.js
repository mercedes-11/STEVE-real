"use client";

import { useEffect, useState } from "react";
import ProductGrid from "./ProductGrid";

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await fetch("/api/productos", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No pudimos cargar los productos.");
        }

        setProducts(data.products || []);
      } catch (err) {
        setError(err.message || "No pudimos cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  if (error) {
    return <p style={{ color: "#8b3a2f" }}>{error}</p>;
  }

  if (!products.length) {
    return <p>No hay productos disponibles.</p>;
  }

  return <ProductGrid products={products} />;
}
