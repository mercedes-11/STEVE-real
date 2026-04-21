import ProductCard from "../components/ProductCard";

export default function SweatersPage({ products, onAddToCart }) {
  return (
    <main className="catalog-page">
      <section className="catalog-intro section">
        <div className="container catalog-intro__content">
          <h1 className="catalog-title">Sweaters</h1>
        </div>
      </section>

      <section className="selection section" aria-label="Listado de sweaters">
        <div className="container">
          <div className="selection-grid">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                grid
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
