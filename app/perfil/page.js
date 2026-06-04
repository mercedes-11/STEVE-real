"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";

export default function PerfilPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const getProfile = async () => {
      setLoadingProfile(true);
      setError(null);

      const { data, error: profileError } = await supabase
        .from("usuarios")
        .select("nombre, apellido, email, direccion, telefono")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError(profileError.message || "No pudimos cargar los datos de tu perfil.");
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoadingProfile(false);
    };

    getProfile();
  }, [authLoading, router, user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/");
  };

  if (authLoading || loadingProfile) {
    return (
      <main className="profile-page">
        <section className="profile-panel container">
          <p className="profile-eyebrow">Mi cuenta</p>
          <h1 className="profile-title">Cargando perfil...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const displayEmail = profile?.email || user.email;

  return (
    <main className="profile-page">
      <section className="profile-panel container">
        <div className="profile-heading">
          <p className="profile-eyebrow">Mi cuenta</p>
          <h1 className="profile-title">Perfil</h1>
        </div>

        {error ? (
          <p className="profile-error">{error}</p>
        ) : (
          <dl className="profile-details">
            <div className="profile-detail">
              <dt>Nombre</dt>
              <dd>{profile?.nombre || "-"}</dd>
            </div>
            <div className="profile-detail">
              <dt>Apellido</dt>
              <dd>{profile?.apellido || "-"}</dd>
            </div>
            <div className="profile-detail">
              <dt>Email</dt>
              <dd>{displayEmail}</dd>
            </div>
            <div className="profile-detail">
              <dt>Dirección</dt>
              <dd>{profile?.direccion || "-"}</dd>
            </div>
            <div className="profile-detail">
              <dt>Teléfono</dt>
              <dd>{profile?.telefono || "-"}</dd>
            </div>
          </dl>
        )}

        <div className="profile-actions">
          <Link href="/ordenes" className="profile-link">
            Mis órdenes
          </Link>
        </div>

        <button className="profile-logout" type="button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Cerrando..." : "Cerrar sesión"}
        </button>
      </section>
    </main>
  );
}
