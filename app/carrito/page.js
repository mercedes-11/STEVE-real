'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Cart from '@/components/Cart';

export default function CartPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Si terminó de cargar y NO hay usuario, redirigir a login
    if (!loading && !user) {
      setRedirecting(true);
      router.push('/auth/login?redirect=/carrito');
    }
  }, [loading, user, router]);

  // Mientras está cargando o redirigiendo
  if (loading || redirecting || !user) {
    return (
      <main className="cart-page">
        <section className="section">
          <div className="container">
            <p style={{ textAlign: 'center', padding: '40px 20px' }}>
              ⏳ Verificando sesión...
            </p>
          </div>
        </section>
      </main>
    );
  }

  // El usuario está logueado, mostrar carrito
  return (
    <main className="cart-page">
      <section className="section">
        <div className="container">
          <h1 className="catalog-title">Carrito</h1>
          <Cart />
        </div>
      </section>
    </main>
  );
}
