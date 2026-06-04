'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const { data, error: err } = await supabase
          .from('productos')
          .select('*');

        if (err) {
          setError(`Error: ${err.message}`);
          console.error('Error en Supabase:', err);
        } else {
          setProductos(data);
          console.log('Productos cargados:', data);
        }
      } catch (err) {
        setError(`Error de conexión: ${err.message}`);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (productos.length === 0) return <p>No hay productos</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Conexión a Supabase - funciona</h2>
      <p><strong>Productos encontrados: {productos.length}</strong></p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {productos.map((prod) => (
          <div key={prod.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>{prod.nombre}</h3>
            <p>{prod.descripcion}</p>
            <p><strong>Precio:</strong> ${prod.precio}</p>
            <p><strong>Stock:</strong> {prod.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
