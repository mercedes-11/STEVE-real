import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MERCADO_PAGO_API = "https://api.mercadopago.com";
const MERCADO_PAGO = "mercado_pago";
const ORDER_STATUS = "pendiente_pago_mp";

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

function getSiteUrl() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}

async function createMercadoPagoPreference({ accessToken, externalReference, orderItems, profile, user }) {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    throw new Error("Falta configurar NEXT_PUBLIC_SITE_URL.");
  }

  if (!accessToken) {
    throw new Error("Falta configurar MERCADOPAGO_ACCESS_TOKEN.");
  }

  const preferencePayload = {
    items: orderItems.map(item => ({
      id: String(item.producto_id),
      title: item.nombre_producto,
      quantity: item.cantidad,
      unit_price: item.precio_unitario,
      currency_id: "ARS",
    })),
    payer: {
      email: profile?.email || user.email,
      name: profile?.nombre || undefined,
      phone: profile?.telefono
        ? {
            number: profile.telefono,
          }
        : undefined,
    },
    external_reference: externalReference,
    notification_url: `${siteUrl}/api/mercadopago/webhook`,
    back_urls: {
      success: `${siteUrl}/checkout?mp=success&external_reference=${externalReference}`,
      failure: `${siteUrl}/checkout?mp=failure&external_reference=${externalReference}`,
      pending: `${siteUrl}/checkout?mp=pending&external_reference=${externalReference}`,
    },
    auto_return: "approved",
    metadata: {
      external_reference: externalReference,
    },
  };

  const response = await fetch(`${MERCADO_PAGO_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preferencePayload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "No pudimos crear la preferencia de Mercado Pago.");
  }

  return data;
}

export async function POST(request) {
  const { supabase, user, error } = await getAuthenticatedUser(request);

  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { items, hasInvalidItems } = normalizeItems(body?.items);
  const checkoutData = body?.checkoutData || {};

  if (hasInvalidItems) {
    return NextResponse.json(
      { error: "Cada item debe tener producto_id o id y cantidad mayor a 0." },
      { status: 400 }
    );
  }

  if (!items.length) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }

  const productIds = [...new Set(items.map(item => item.producto_id))];
  const { data: products, error: productsError } = await supabase
    .from("productos")
    .select("id, nombre, precio, stock, activo")
    .in("id", productIds)
    .eq("activo", true);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: "Hay productos del carrito que ya no están disponibles." }, { status: 400 });
  }

  const productsById = new Map(products.map(product => [Number(product.id), product]));
  const orderItems = [];
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

  const externalReference = crypto.randomUUID();

  let preference;

  try {
    preference = await createMercadoPagoPreference({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      externalReference,
      orderItems,
      profile,
      user,
    });
  } catch (preferenceError) {
    return NextResponse.json({ error: preferenceError.message }, { status: 500 });
  }

  const { data: order, error: orderError } = await supabase
    .from("ordenes")
    .insert({
      usuario_id: user.id,
      email: profile?.email || checkoutData.email || user.email,
      nombre: profile?.nombre || checkoutData.nombre || "",
      telefono: profile?.telefono || checkoutData.telefono || "",
      direccion_envio: profile?.direccion || checkoutData.direccion_envio || "",
      total,
      estado: ORDER_STATUS,
      metodo_pago: MERCADO_PAGO,
      external_reference: externalReference,
      mp_preference_id: preference.id,
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

  return NextResponse.json(
    {
      orderId: order.id,
      preferenceId: preference.id,
      initPoint: preference.init_point || preference.sandbox_init_point,
      externalReference,
      total,
      estado: ORDER_STATUS,
    },
    { status: 201 }
  );
}
