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

function normalizeOrder(order, detailsByOrder) {
  return {
    id: order.id,
    usuario_id: order.usuario_id,
    email: order.email || "",
    nombre: order.nombre || "",
    telefono: order.telefono || "",
    direccion_envio: order.direccion_envio || "",
    total: Number(order.total || 0),
    estado: order.estado || "",
    metodo_pago: order.metodo_pago || "",
    creado_en: order.creado_en,
    actualizado_en: order.actualizado_en,
    mp_preference_id: order.mp_preference_id || null,
    mp_payment_id: order.mp_payment_id || null,
    mp_status: order.mp_status || null,
    mp_status_detail: order.mp_status_detail || null,
    pagado_en: order.pagado_en || null,
    stock_confirmado_en: order.stock_confirmado_en || null,
    stock_error: order.stock_error || null,
    detalles: detailsByOrder.get(order.id) || [],
  };
}

export async function GET(request) {
  const { supabase, error, status } = await getAdminContext(request);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const { data: orders, error: ordersError } = await supabase
    .from("ordenes")
    .select(
      "id, usuario_id, email, nombre, telefono, direccion_envio, total, estado, metodo_pago, creado_en, actualizado_en, mp_preference_id, mp_payment_id, mp_status, mp_status_detail, pagado_en, stock_confirmado_en, stock_error"
    )
    .order("creado_en", { ascending: false });

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const orderIds = orders.map(order => order.id);
  const detailsByOrder = new Map();

  if (orderIds.length) {
    const { data: details, error: detailsError } = await supabase
      .from("detalle_ordenes")
      .select("id, orden_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, creado_en")
      .in("orden_id", orderIds)
      .order("id", { ascending: true });

    if (detailsError) {
      return NextResponse.json({ error: detailsError.message }, { status: 500 });
    }

    for (const detail of details) {
      const current = detailsByOrder.get(detail.orden_id) || [];
      current.push({
        id: detail.id,
        orden_id: detail.orden_id,
        producto_id: detail.producto_id,
        nombre_producto: detail.nombre_producto || "",
        cantidad: Number(detail.cantidad || 0),
        precio_unitario: Number(detail.precio_unitario || 0),
        subtotal: Number(detail.subtotal || 0),
        creado_en: detail.creado_en,
      });
      detailsByOrder.set(detail.orden_id, current);
    }
  }

  return NextResponse.json({
    orders: orders.map(order => normalizeOrder(order, detailsByOrder)),
  });
}
