import ProductGrid from "../../components/ProductGrid";
import { products } from "../../data/products";

export const metadata = {
  title: "Productos | islabonita"
};

export default function ProductsPage() {
  return (
    <main className="catalog-page">
      <section className="catalog-intro section">
        <div className="container catalog-intro__content">
          <h1 className="catalog-title">Productos</h1>
        </div>
      </section>

      <section className="selection section" aria-label="Listado de productos">
        <div className="container">
          <ProductGrid products={products} />
        </div>
      </section>
    </main>
  );
}
