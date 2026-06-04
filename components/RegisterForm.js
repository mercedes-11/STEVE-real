'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  marginTop: '5px',
  boxSizing: 'border-box',
};

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || 'Error al crear el usuario');
        return;
      }

      if (!data.user) {
        setError('No se pudo obtener el usuario creado.');
        return;
      }

      const { error: insertError } = await supabase.from('usuarios').insert({
        id: data.user.id,
        email,
        nombre,
        apellido,
        direccion,
        telefono,
      });

      if (insertError) {
        setError(insertError.message || 'Error al guardar los datos del usuario');
        return;
      }

      setSuccess(true);
      setEmail('');
      setPassword('');
      setNombre('');
      setApellido('');
      setDireccion('');
      setTelefono('');

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2>Cuenta creada</h2>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p>Redirigiendo al login...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
      <h1>Registrarse</h1>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="nombre">Nombre:</label>
          <input
            id="nombre"
            type="text"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="apellido">Apellido:</label>
          <input
            id="apellido"
            type="text"
            placeholder="Tu apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="direccion">Dirección:</label>
          <input
            id="direccion"
            type="text"
            placeholder="Tu dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="telefono">Teléfono:</label>
          <input
            id="telefono"
            type="tel"
            placeholder="Tu teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Cargando...' : 'Registrarse'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
