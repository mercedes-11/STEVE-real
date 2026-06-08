import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MERCADO_PAGO_API = "https://api.mercadopago.com";
const PAYMENT_EVENT_TYPES = new Set(["payment", "payments"]);

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getPaymentId(body, searchParams) {
  return (
    body?.data?.id ||
    body?.resource?.id ||
    body?.id ||
    searchParams.get("data.id") ||
    searchParams.get("id")
  );
}

function getEventType(body, searchParams) {
  return body?.type || searchParams.get("type") || searchParams.get("topic");
}

async function getMercadoPagoPayment(paymentId) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Falta configurar MERCADOPAGO_ACCESS_TOKEN.");
  }

  const response = await fetch(`${MERCADO_PAGO_API}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "No pudimos consultar el pago en Mercado Pago.");
  }

  return data;
}

async function recordWebhookEvent({ supabase, body, payment, result, error }) {
  const payload = body && typeof body === "object" ? body : {};

  const { error: insertError } = await supabase.from("mercadopago_webhook_events").insert({
    event_id: String(body?.id || body?.data?.id || payment?.id || ""),
    action: body?.action || null,
    type: body?.type || null,
    mp_payment_id: payment?.id ? String(payment.id) : null,
    external_reference: payment?.external_reference || null,
    mp_status: payment?.status || null,
    payload: {
      event: payload,
      payment,
      result,
    },
    procesado: Boolean(result?.ok),
    error: error || null,
  });

  if (insertError) {
    console.error("No se pudo guardar el evento de Mercado Pago:", insertError.message);
  }
}

export async function POST(request) {
  const supabase = getSupabaseClient();
  const searchParams = request.nextUrl.searchParams;
  const body = await request.json().catch(() => ({}));
  const eventType = getEventType(body, searchParams);

  // TODO: validar x-signature y x-request-id cuando se configure MERCADOPAGO_WEBHOOK_SECRET.
  // Antes de modificar la orden, este webhook siempre consulta el pago real en Mercado Pago.

  if (eventType && !PAYMENT_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const paymentId = getPaymentId(body, searchParams);

  if (!paymentId) {
    await recordWebhookEvent({
      supabase,
      body,
      payment: null,
      result: null,
      error: "Evento sin payment_id.",
    });

    return NextResponse.json({ received: true, ignored: true });
  }

  let payment;

  try {
    payment = await getMercadoPagoPayment(paymentId);
  } catch (paymentError) {
    await recordWebhookEvent({
      supabase,
      body,
      payment: { id: String(paymentId) },
      result: null,
      error: paymentError.message,
    });

    return NextResponse.json({ received: true, processed: false, error: paymentError.message });
  }

  const externalReference =
    payment.external_reference ||
    payment.metadata?.external_reference ||
    body?.external_reference ||
    null;

  if (!externalReference) {
    await recordWebhookEvent({
      supabase,
      body,
      payment,
      result: null,
      error: "Pago sin external_reference.",
    });

    return NextResponse.json({ received: true, processed: false, error: "Pago sin external_reference." });
  }

  const { data: result, error: rpcError } = await supabase.rpc("confirmar_pago_mercadopago", {
    p_external_reference: externalReference,
    p_mp_payment_id: String(payment.id),
    p_mp_status: payment.status,
    p_mp_status_detail: payment.status_detail || null,
  });

  await recordWebhookEvent({
    supabase,
    body,
    payment,
    result,
    error: rpcError?.message || null,
  });

  if (rpcError) {
    return NextResponse.json({ received: true, processed: false, error: rpcError.message });
  }

  return NextResponse.json({ received: true, processed: true, result });
}
