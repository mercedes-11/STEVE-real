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

async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return { error: "Usuario no autenticado." };
  }

  const supabase = getSupabaseForUser(accessToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return { error: "Usuario no autenticado." };
  }

  return { supabase, user };
}

export async function POST(request) {
  const { supabase, user, error } = await getAuthenticatedUser(request);

  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const producto_id = Number(body?.producto_id ?? body?.id);
  const cantidad = Number(body?.cantidad ?? body?.quantity);

  if (!Number.isInteger(producto_id) || producto_id <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
    return NextResponse.json(
      { error: "producto_id y cantidad mayor a 0 son obligatorios." },
      { status: 400 }
    );
  }

  const { data: product, error: productError } = await supabase
    .from("productos")
    .select("id, nombre, stock")
    .eq("id", producto_id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!product) {
    return NextResponse.json({ error: "El producto no existe." }, { status: 404 });
  }

  const { data: existingItem, error: existingError } = await supabase
    .from("carrito")
    .select("id, cantidad")
    .eq("usuario_id", user.id)
    .eq("producto_id", producto_id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const nextQuantity = Number(existingItem?.cantidad || 0) + cantidad;
  const stock = product.stock == null ? null : Number(product.stock);

  if (stock !== null && stock < nextQuantity) {
    return NextResponse.json(
      { error: `No hay stock suficiente para ${product.nombre}.` },
      { status: 400 }
    );
  }

  if (existingItem) {
    const { error: updateError } = await supabase
      .from("carrito")
      .update({ cantidad: nextQuantity })
      .eq("id", existingItem.id)
      .eq("usuario_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabase.from("carrito").insert({
      usuario_id: user.id,
      producto_id,
      cantidad,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { data: cart, error: cartError } = await supabase
    .from("carrito")
    .select("id, usuario_id, producto_id, cantidad")
    .eq("usuario_id", user.id)
    .order("id", { ascending: true });

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Producto agregado al carrito.",
    cart,
  });
}
