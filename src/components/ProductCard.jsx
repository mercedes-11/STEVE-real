import { calculateNetPrice, formatPrice } from "../utils/format";

export default function ProductCard({ product, grid = false, onAddToCart }) {
  const cardClassName = grid ? "selection-card selection-card--grid" : "selection-card";

  return (
    <article className={cardClassName}>
      <div className={`selection-image ${product.imageClass}`} aria-label={product.name}></div>

      <div className="selection-info">
        <div className="selection-row">
          <h3>{product.name}</h3>
          <p className="selection-price">{formatPrice(product.price)}</p>
        </div>

        <p className="selection-subtext">
          Precio sin impuestos nacionales: {formatPrice(Math.round(calculateNetPrice(product.price)))}
        </p>

        <button
          type="button"
          className="selection-add-btn"
          onClick={() => onAddToCart(product.id)}
        >
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
