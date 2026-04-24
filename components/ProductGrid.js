import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  return (
    <div className="selection-grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} grid />
      ))}
    </div>
  );
}
