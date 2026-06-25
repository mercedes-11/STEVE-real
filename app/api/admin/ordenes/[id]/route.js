import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_FIELDS = new Set(["estado", "nombre", "telefono", "direccion_envio"]);
const FORBIDDEN_FIELDS = new Set([
  "total",
  "detalle_ordenes",
  "detalles",
  "mp_status",
  "mp_payment_id",
  "pagado_en",
  "stock_confirmado_en",
  "mp_preference_id",
  "external_reference",
  "mp_status_detail",
  "stock_error",
]);
const ALLOWED_STATUSES = new Set([
  "pendiente_pago",
  "pendiente_pago_mp",
  "pagado",
  "pago_rechazado",
  "pago_aprobado_sin_stock",
]);

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

function getOrderId(params) {
  const orderId = Number(params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return null;
  }

  return orderId;
}

function validateOrderPayload(body) {
  if (!body || typeof body !== "object") {
    return { error: "Datos de orden inválidos." };
  }

  const forbidden = Object.keys(body).filter(field => FORBIDDEN_FIELDS.has(field));

  if (forbidden.length) {
    return { error: `No se pueden editar estos campos: ${forbidden.join(", ")}.` };
  }

  const payload = {};

  for (const field of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = String(body[field] || "").trim();
    }
  }

  if (!Object.keys(payload).length) {
    return { error: "No hay campos editables para actualizar." };
  }

  if (payload.estado && !ALLOWED_STATUSES.has(payload.estado)) {
    return { error: "Estado de orden inválido." };
  }

  return { payload };
}

export async function PUT(request, { params }) {
  const orderId = getOrderId(params);

  if (!orderId) {
    return NextResponse.json({ error: "Orden inválida." }, { status: 400 });
  }

  const { supabase, error, status } = await getAdminContext(request);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const body = await request.json().catch(() => null);
  const { payload, error: validationError } = validateOrderPayload(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error: updateError } = await supabase
    .from("ordenes")
    .update(payload)
    .eq("id", orderId)
    .select(
      "id, email, nombre, telefono, direccion_envio, total, estado, metodo_pago, creado_en, actualizado_en"
    )
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      ...data,
      total: Number(data.total || 0),
    },
  });
}
