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

export async function GET(request) {
  const { supabase, user, error } = await getAuthenticatedUser(request);

  if (error) {
    return NextResponse.json({ error, isAdmin: false }, { status: 401 });
  }

  const { data, error: adminError } = await supabase
    .from("admins")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (adminError) {
    return NextResponse.json({ error: adminError.message, isAdmin: false }, { status: 500 });
  }

  return NextResponse.json({
    isAdmin: Boolean(data),
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
