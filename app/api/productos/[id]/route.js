import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.nombre,
    price: Number(product.precio || 0),
    image: product.imagen_url,
    category: product.categoria,
    description: product.descripcion,
    stock: product.stock == null ? null : Number(product.stock),
    active: Boolean(product.activo),
  };
}

export async function GET(request, { params }) {
  const productId = Number(params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Producto inválido." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, precio, imagen_url, categoria, descripcion, stock, activo")
    .eq("id", productId)
    .eq("activo", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ product: normalizeProduct(data) });
}
