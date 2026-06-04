import ProductDetail from "../../../components/ProductDetail";

export default function ProductDetailPage({ params }) {
  return <ProductDetail productId={params.id} />;
}
