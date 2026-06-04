import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BANK_TRANSFER = "transferencia";
const MERCADO_PAGO = "mercado_pago";

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

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return { items: [], hasInvalidItems: true };
  }

  const itemsByProduct = new Map();
  let hasInvalidItems = false;

  for (const item of items) {
    const producto_id = Number(item.producto_id ?? item.id);
    const cantidad = Number(item.cantidad ?? item.quantity);

    if (!Number.isInteger(producto_id) || producto_id <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
      hasInvalidItems = true;
      continue;
    }

    itemsByProduct.set(producto_id, (itemsByProduct.get(producto_id) || 0) + cantidad);
  }

  return {
    items: Array.from(itemsByProduct, ([producto_id, cantidad]) => ({
      producto_id,
      cantidad,
    })),
    hasInvalidItems,
  };
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

export async function GET(request) {
  const { supabase, user, error } = await getAuthenticatedUser(request);

  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data: orders, error: ordersError } = await supabase
    .from("ordenes")
    .select("id, total, estado, creado_en")
    .eq("usuario_id", user.id)
    .order("creado_en", { ascending: false });

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const orderIds = orders.map(order => order.id);
  let quantitiesByOrder = new Map();

  if (orderIds.length) {
    const { data: details, error: detailsError } = await supabase
      .from("detalle_ordenes")
      .select("orden_id, cantidad")
      .in("orden_id", orderIds);

    if (detailsError) {
      return NextResponse.json({ error: detailsError.message }, { status: 500 });
    }

    quantitiesByOrder = details.reduce((acc, detail) => {
      const current = acc.get(detail.orden_id) || 0;
      acc.set(detail.orden_id, current + Number(detail.cantidad || 0));
      return acc;
    }, new Map());
  }

  return NextResponse.json({
    orders: orders.map(order => ({
      id: order.id,
      total: Number(order.total || 0),
      estado: order.estado,
      creado_en: order.creado_en,
      cantidad_productos: quantitiesByOrder.get(order.id) || 0,
    })),
  });
}

export async function POST(request) {
  const { supabase, user, error } = await getAuthenticatedUser(request);

  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { items, hasInvalidItems } = normalizeItems(body?.items);
  const paymentMethod = body?.paymentMethod === MERCADO_PAGO ? MERCADO_PAGO : BANK_TRANSFER;
  const checkoutData = body?.checkoutData || {};

  if (hasInvalidItems) {
    return NextResponse.json(
      { error: "Cada item debe tener producto_id o id y cantidad mayor a 0." },
      { status: 400 }
    );
  }

  if (!items.length) {
    return NextResponse.json({ error: "El carrito esta vacio." }, { status: 400 });
  }

  const productIds = [...new Set(items.map(item => item.producto_id))];
  const { data: products, error: productsError } = await supabase
    .from("productos")
    .select("id, nombre, precio, stock")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: "Hay productos del carrito que ya no existen." }, { status: 400 });
  }

  const productsById = new Map(products.map(product => [Number(product.id), product]));
  const orderItems = [];
  const stockUpdates = [];
  let total = 0;

  for (const item of items) {
    const product = productsById.get(item.producto_id);
    const price = Number(product.precio || 0);
    const stock = product.stock == null ? null : Number(product.stock);

    if (stock !== null && stock < item.cantidad) {
      return NextResponse.json(
        { error: `No hay stock suficiente para ${product.nombre}.` },
        { status: 400 }
      );
    }

    if (stock !== null) {
      stockUpdates.push({
        id: item.producto_id,
        previousStock: stock,
        nextStock: stock - item.cantidad,
      });
    }

    const subtotal = price * item.cantidad;
    total += subtotal;

    orderItems.push({
      producto_id: item.producto_id,
      nombre_producto: product.nombre,
      precio_unitario: price,
      cantidad: item.cantidad,
      subtotal,
    });
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("email, nombre, telefono, direccion")
    .eq("id", user.id)
    .maybeSingle();

  const orderStatus = paymentMethod === MERCADO_PAGO ? "pendiente_pago_mp" : "pendiente_pago";

  const { data: order, error: orderError } = await supabase
    .from("ordenes")
    .insert({
      usuario_id: user.id,
      email: profile?.email || checkoutData.email || user.email,
      nombre: profile?.nombre || checkoutData.nombre || "",
      telefono: profile?.telefono || checkoutData.telefono || "",
      direccion_envio: profile?.direccion || checkoutData.direccion_envio || "",
      total,
      estado: orderStatus,
    })
    .select("id")
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const detailsPayload = orderItems.map(item => ({
    orden_id: order.id,
    ...item,
  }));

  const { error: detailsError } = await supabase.from("detalle_ordenes").insert(detailsPayload);

  if (detailsError) {
    return NextResponse.json({ error: detailsError.message }, { status: 500 });
  }

  for (const stockUpdate of stockUpdates) {
    const { data: updatedProduct, error: stockError } = await supabase
      .from("productos")
      .update({ stock: stockUpdate.nextStock })
      .eq("id", stockUpdate.id)
      .eq("stock", stockUpdate.previousStock)
      .select("id")
      .maybeSingle();

    if (stockError) {
      return NextResponse.json({ error: stockError.message }, { status: 500 });
    }

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "El stock cambio durante la compra. Volve a intentar." },
        { status: 409 }
      );
    }
  }

  return NextResponse.json({ orderId: order.id, total, estado: orderStatus }, { status: 201 });
}
