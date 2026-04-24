"use client";

import Link from "next/link";
import { useCart } from "./Cart";
import { calculateNetPrice, formatPrice } from "../data/products";

export default function ProductCard({ product, grid = false, detail = false }) {
  const { addToCart } = useCart();
  const cardClassName = [
    "selection-card",
    grid ? "selection-card--grid" : "",
    detail ? "selection-card--detail" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClassName}>
      <Link href={`/productos/${product.id}`} className="selection-card__media">
        <div className={`selection-image ${product.imageClass}`} aria-label={product.name}></div>
      </Link>

      <div className="selection-info">
        <div className="selection-row">
          <h3>
            <Link href={`/productos/${product.id}`}>{product.name}</Link>
          </h3>
          <p className="selection-price">{formatPrice(product.price)}</p>
        </div>

        <p className="selection-subtext">
          Precio sin impuestos nacionales: {formatPrice(Math.round(calculateNetPrice(product.price)))}
        </p>

        <button type="button" className="selection-add-btn" onClick={() => addToCart(product)}>
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
