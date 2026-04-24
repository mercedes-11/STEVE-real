import Link from "next/link";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";

export default function HomePage() {
  return (
    <>
      <main>
        <section className="hero" id="home" aria-label="Presentación principal de islabonita">
          <div className="hero__content">
            <p className="hero__eyebrow">New Collection</p>
            <h1 className="hero__title">Knitted pieces made to feel timeless.</h1>
            <p className="hero__text">
              Descubrí sweaters, tops, bottoms y sets pensados desde la textura, la calma y la
              elegancia de lo esencial.
            </p>

            <div className="hero__actions">
              <Link href="/productos" className="hero__button hero__button--primary">
                Shop New In
              </Link>
              <Link href="/productos" className="hero__button hero__button--secondary">
                Discover the Brand
              </Link>
            </div>
          </div>
        </section>
      </main>

      <section className="selection section" id="featured">
        <div className="container selection-layout">
          <div className="selection-intro">
            <p className="section-tag">Edit selección</p>
            <h2>Nuestra selección</h2>
            <p>
              Explorá una curaduría de piezas tejidas con impronta artesanal, siluetas elegantes y
              una estética atemporal pensada para destacar.
            </p>

            <Link href="/productos" className="selection-link">
              Ver más
            </Link>
          </div>

          <div className="selection-carousel-wrapper">
            <div className="selection-carousel">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
