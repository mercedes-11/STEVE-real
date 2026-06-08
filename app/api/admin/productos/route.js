import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseForUser(accessToken) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}

async function getAdminContext(request) {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return { error: "Usuario no autenticado.", status: 401 };
  }

  const supabase = getSupabaseForUser(accessToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return { error: "Usuario no autenticado.", status: 401 };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (adminError) {
    return { error: adminError.message, status: 500 };
  }

  if (!admin) {
    return { error: "No autorizado.", status: 403 };
  }

  return { supabase, user };
}

function normalizeProduct(product) {
  return {
    id: product.id,
    nombre: product.nombre,
    precio: Number(product.precio || 0),
    imagen_url: product.imagen_url || "",
    categoria: product.categoria || "",
    descripcion: product.descripcion || "",
    stock: product.stock == null ? null : Number(product.stock),
    activo: Boolean(product.activo),
  };
}

function validateProductPayload(body) {
  const nombre = String(body?.nombre || "").trim();
  const precio = Number(body?.precio);
  const imagen_url = String(body?.imagen_url || "").trim();
  const categoria = String(body?.categoria || "").trim();
  const descripcion = String(body?.descripcion || "").trim();
  const stockValue = body?.stock === "" || body?.stock == null ? null : Number(body.stock);
  const activo = body?.activo == null ? true : Boolean(body.activo);

  if (!nombre) {
    return { error: "El nombre es obligatorio." };
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    return { error: "El precio debe ser mayor a 0." };
  }

  if (stockValue !== null && (!Number.isInteger(stockValue) || stockValue < 0)) {
    return { error: "El stock debe ser mayor o igual a 0." };
  }

  return {
    product: {
      nombre,
      precio,
      imagen_url,
      categoria,
      descripcion,
      stock: stockValue,
      activo,
    },
  };
}

export async function GET(request) {
  const { supabase, error, status } = await getAdminContext(request);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const { data, error: productsError } = await supabase
    .from("productos")
    .select("id, nombre, precio, imagen_url, categoria, descripcion, stock, activo")
    .order("id", { ascending: true });

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  return NextResponse.json({ products: data.map(normalizeProduct) });
}

export async function POST(request) {
  const { supabase, error, status } = await getAdminContext(request);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const body = await request.json().catch(() => null);
  const { product, error: validationError } = validateProductPayload(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("productos")
    .insert(product)
    .select("id, nombre, precio, imagen_url, categoria, descripcion, stock, activo")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ product: normalizeProduct(data) }, { status: 201 });
}
