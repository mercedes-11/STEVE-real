import { formatPrice } from "../utils/format";

export default function CartPanel({
  cart,
  cartTotal,
  isOpen,
  onClose,
  onDecrease,
  onIncrease,
  onRemove
}) {
  return (
    <>
      <div className="cart-overlay" hidden={!isOpen} onClick={onClose}></div>

      <aside
        className={`cart-panel${isOpen ? " is-open" : ""}`}
        aria-hidden={isOpen ? "false" : "true"}
        aria-label="Carrito de compras"
      >
        <div className="cart-panel__header">
          <h2>Tu carrito</h2>
          <button type="button" className="cart-close" aria-label="Cerrar carrito" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="cart-panel__body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Tu carrito está vacío.</p>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map(item => (
                <article key={item.id} className="cart-item" data-product-id={item.id}>
                  <div className="cart-item__info">
                    <h3>{item.name}</h3>
                    <p>{formatPrice(item.price)}</p>
                  </div>

                  <div className="cart-item__controls">
                    <button
                      type="button"
                      className="cart-qty-btn"
                      onClick={() => onDecrease(item.id)}
                    >
                      -
                    </button>
                    <span className="cart-item__quantity">{item.quantity}</span>
                    <button
                      type="button"
                      className="cart-qty-btn"
                      onClick={() => onIncrease(item.id)}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item__subtotal">{formatPrice(item.price * item.quantity)}</div>

                  <button
                    type="button"
                    className="cart-remove-btn"
                    onClick={() => onRemove(item.id)}
                  >
                    Eliminar
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="cart-panel__footer">
          <div className="cart-summary">
            <span>Total</span>
            <strong className="cart-total">{cartTotal}</strong>
          </div>
          <button type="button" className="cart-checkout">
            Finalizar compra
          </button>
        </div>
      </aside>
    </>
  );
}
