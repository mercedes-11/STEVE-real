'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Obtener el hash con el token
      const hash = window.location.hash;
      
      // Si hay sesión activa, redirigir al carrito
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/carrito');
      } else {
        // Si no hay sesión, ir al login
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [router]);

  return <p>Procesando autenticación...</p>;
}
