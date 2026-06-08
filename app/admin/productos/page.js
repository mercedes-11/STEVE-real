"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/pricing";

const emptyForm = {
  id: null,
  nombre: "",
  precio: "",
  imagen_url: "",
  categoria: "",
  descripcion: "",
  stock: "",
  activo: true,
};

function toFormProduct(product) {
  return {
    id: product.id,
    nombre: product.nombre || "",
    precio: String(product.precio || ""),
    imagen_url: product.imagen_url || "",
    categoria: product.categoria || "",
    descripcion: product.descripcion || "",
    stock: product.stock == null ? "" : String(product.stock),
    activo: Boolean(product.activo),
  };
}

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const isEditing = useMemo(() => form.id !== null, [form.id]);

  async function getSessionToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || null;
  }

  async function requestAdmin(path, options = {}) {
    const token = await getSessionToken();

    if (!token) {
      throw new Error("Necesitás iniciar sesión.");
    }

    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Ocurrió un error.");
    }

    return data;
  }

  async function loadProducts() {
    const data = await requestAdmin("/api/admin/productos");
    setProducts(data.products || []);
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const adminData = await requestAdmin("/api/admin/me");

        if (!adminData.isAdmin) {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);
        await loadProducts();
      } catch (err) {
        setError(err.message || "No pudimos cargar el panel.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  function updateField(field, value) {
    setForm(current => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    const nombre = form.nombre.trim();
    const precio = Number(form.precio);
    const stock = form.stock === "" ? null : Number(form.stock);

    if (!nombre) {
      return "El nombre es obligatorio.";
    }

    if (!Number.isFinite(precio) || precio <= 0) {
      return "El precio debe ser mayor a 0.";
    }

    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      return "El stock debe ser mayor o igual a 0.";
    }

    return null;
  }

  function buildPayload() {
    return {
      nombre: form.nombre,
      precio: Number(form.precio),
      imagen_url: form.imagen_url,
      categoria: form.categoria,
      descripcion: form.descripcion,
      stock: form.stock === "" ? null : Number(form.stock),
      activo: Boolean(form.activo),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();

      if (isEditing) {
        await requestAdmin(`/api/admin/productos/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Producto actualizado.");
      } else {
        await requestAdmin("/api/admin/productos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Producto creado.");
      }

      setForm(emptyForm);
      await loadProducts();
    } catch (err) {
      setError(err.message || "No pudimos guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(productId) {
    setError(null);
    setMessage(null);

    const confirmed = window.confirm("¿Desactivar este producto?");

    if (!confirmed) {
      return;
    }

    try {
      await requestAdmin(`/api/admin/productos/${productId}`, {
        method: "DELETE",
      });
      setMessage("Producto desactivado.");
      await loadProducts();
    } catch (err) {
      setError(err.message || "No pudimos desactivar el producto.");
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-panel container">
          <p className="admin-eyebrow">Admin</p>
          <h1 className="admin-title">Cargando productos...</h1>
        </section>
      </main>
    );
  }

  if (error && !isAdmin) {
    return (
      <main className="admin-page">
        <section className="admin-panel container">
          <p className="admin-eyebrow">Admin</p>
          <h1 className="admin-title">No autorizado</h1>
          <p className="admin-error">{error}</p>
          <Link href="/" className="admin-link">
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-page">
        <section className="admin-panel container">
          <p className="admin-eyebrow">Admin</p>
          <h1 className="admin-title">No autorizado</h1>
          <p className="admin-error">Tu usuario no tiene permisos de administrador.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-panel container">
        <div className="admin-heading">
          <p className="admin-eyebrow">Admin</p>
          <h1 className="admin-title">Productos</h1>
        </div>

        <div className="admin-actions">
          <Link href="/productos" className="admin-link admin-link--secondary">
            Vista cliente
          </Link>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__header">
            <h2>{isEditing ? "Editar producto" : "Crear producto"}</h2>
            {isEditing && (
              <button type="button" className="admin-text-button" onClick={() => setForm(emptyForm)}>
                Cancelar edición
              </button>
            )}
          </div>

          <div className="admin-form__grid">
            <label>
              Nombre
              <input value={form.nombre} onChange={(event) => updateField("nombre", event.target.value)} required />
            </label>
            <label>
              Precio
              <input
                type="number"
                min="1"
                value={form.precio}
                onChange={(event) => updateField("precio", event.target.value)}
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => updateField("stock", event.target.value)}
                placeholder="Sin control"
              />
            </label>
            <label>
              Categoría
              <input value={form.categoria} onChange={(event) => updateField("categoria", event.target.value)} />
            </label>
            <label>
              Imagen URL
              <input value={form.imagen_url} onChange={(event) => updateField("imagen_url", event.target.value)} />
            </label>
            <label className="admin-form__check">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => updateField("activo", event.target.checked)}
              />
              Producto activo
            </label>
            <label className="admin-form__wide">
              Descripción
              <textarea value={form.descripcion} onChange={(event) => updateField("descripcion", event.target.value)} />
            </label>
          </div>

          {error && <p className="admin-error">{error}</p>}
          {message && <p className="admin-success">{message}</p>}

          <button className="admin-submit" type="submit" disabled={saving}>
            {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto"}
          </button>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>
                    <strong>{product.nombre}</strong>
                    <span>{product.categoria || "Sin categoría"}</span>
                  </td>
                  <td>{formatPrice(product.precio)}</td>
                  <td>{product.stock == null ? "Sin control" : product.stock}</td>
                  <td>{product.activo ? "Activo" : "Inactivo"}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button type="button" onClick={() => setForm(toFormProduct(product))}>
                        Editar
                      </button>
                      {product.activo && (
                        <button type="button" onClick={() => handleDeactivate(product.id)}>
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
