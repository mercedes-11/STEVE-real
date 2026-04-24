import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../../components/ProductCard";
import { getProductById } from "../../../data/products";

export default function ProductDetailPage({ params }) {
  const product = getProductById(params.id);

  if (!product) {
    notFound();
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
