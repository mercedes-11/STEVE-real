export const TAX_RATE = 0.21;

export const products = [
  {
    id: 1,
    name: "Navy Braided Sweater",
    price: 118000,
    imageClass: "placeholder-one",
    category: "sweaters"
  },
  {
    id: 2,
    name: "Chocolate Knit Set",
    price: 164000,
    imageClass: "placeholder-two",
    category: "sets"
  },
  {
    id: 3,
    name: "Soft Ribbed Top",
    price: 79000,
    imageClass: "placeholder-three",
    category: "tops"
  },
  {
    id: 4,
    name: "Tailored Knit Bottom",
    price: 96000,
    imageClass: "placeholder-four",
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
