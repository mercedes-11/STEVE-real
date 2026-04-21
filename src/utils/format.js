import { TAX_RATE } from "../data/products";

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
