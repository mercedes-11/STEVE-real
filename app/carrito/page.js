import Cart from '@/components/Cart';

export default function CartPage() {
  return (
    <main className="cart-page">
      <section className="section">
        <div className="container">
          <h1 className="catalog-title">Carrito</h1>
          <Cart />
        </div>
      </section>
    </main>
  );
}
