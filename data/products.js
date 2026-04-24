export const TAX_RATE = 0.21;

export const products = [
  {
    id: 1,
    name: "Sweater Pampa Tierra",
    price: 100000,
    image: "/assets/sweater-pampa-tierra.png",
    category: "sweaters"
  },
  {
    id: 2,
    name: "Sweater Patagonia Oliva",
    price: 100000,
    image: "/assets/sweater-patagonia-oliva.png",
    category: "sets"
  },
  {
    id: 3,
    name: "Sweater Patagonia Humo",
    price: 100000,
    image: "/assets/sweater-patagonia-humo.png",
    category: "tops"
  },
  {
    id: 4,
    name: "Sweater Patagonia Chocolate",
    price: 100000,
    image: "/assets/sweater-patagonia-chocolate.png",
    category: "bottoms"
  }
];

export function getProductById(id) {
  return products.find(product => String(product.id) === String(id));
}

export function formatPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "$0";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

export function calculateNetPrice(price) {
  return price / (1 + TAX_RATE);
}
