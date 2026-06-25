"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/pricing";

const editableStatuses = [
  "pendiente_pago",
  "pendiente_pago_mp",
  "pagado",
  "pago_rechazado",
  "pago_aprobado_sin_stock",
];

const emptyEditForm = {
  estado: "",
  nombre: "",
  telefono: "",
  direccion_envio: "",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toEditForm(order) {
  return {
    estado: order.estado || "",
    nombre: order.nombre || "",
    telefono: order.telefono || "",
    direccion_envio: order.direccion_envio || "",
  };
}

function getStatusBadgeClass(status) {
  if (status === "pagado") {
    return "status-badge status-badge--paid";
  }

  if (status === "pendiente_pago" || status === "pendiente_pago_mp") {
    return "status-badge status-badge--pending";
  }

  if (status === "pago_rechazado") {
    return "status-badge status-badge--rejected";
  }

  if (status === "pago_aprobado_sin_stock") {
    return "status-badge status-badge--stock";
  }

  return "status-badge";
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const editingOrder = useMemo(
    () => orders.find(order => order.id === editingOrderId) || null,
    [orders, editingOrderId]
  );

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

  async function loadOrders() {
    const data = await requestAdmin("/api/admin/ordenes");
    setOrders(data.orders || []);
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
        await loadOrders();
      } catch (err) {
        setError(err.message || "No pudimos cargar las órdenes.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  function toggleDetails(orderId) {
    setExpandedOrderId(current => (current === orderId ? null : orderId));
  }

  function startEditing(order) {
    setMessage(null);
    setError(null);
    setExpandedOrderId(order.id);
    setEditingOrderId(order.id);
    setEditForm(toEditForm(order));
  }

  function cancelEditing() {
    setEditingOrderId(null);
    setEditForm(emptyEditForm);
  }

  function updateField(field, value) {
    setEditForm(current => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleUpdateOrder(event) {
    event.preventDefault();

    if (!editingOrder) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await requestAdmin(`/api/admin/ordenes/${editingOrder.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      setMessage(`Orden #${editingOrder.id} actualizada.`);
      cancelEditing();
      await loadOrders();
    } catch (err) {
      setError(err.message || "No pudimos actualizar la orden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-panel container">
          <p className="admin-eyebrow">Admin</p>
          <h1 className="admin-title">Cargando órdenes...</h1>
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
        <div className="admin-heading admin-heading--split">
          <div>
            <p className="admin-eyebrow">Admin</p>
            <h1 className="admin-title">Órdenes</h1>
          </div>
          <div className="admin-actions admin-actions--inline">
            <Link href="/admin" className="admin-link">
              Panel admin
            </Link>
            <Link href="/productos" className="admin-link admin-link--secondary">
              Vista cliente
            </Link>
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}
        {message && <p className="admin-success">{message}</p>}

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--compact">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Método de pago</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <strong>{order.nombre || "-"}</strong>
                    <span>{order.email || "-"}</span>
                  </td>
                  <td>{formatPrice(order.total)}</td>
                  <td>
                    <span className={getStatusBadgeClass(order.estado)}>{order.estado}</span>
                  </td>
                  <td>{order.metodo_pago || "-"}</td>
                  <td>{formatDate(order.creado_en)}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button type="button" onClick={() => toggleDetails(order.id)}>
                        {expandedOrderId === order.id ? "Ocultar" : "Ver"}
                      </button>
                      <button type="button" onClick={() => startEditing(order)}>
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan="7">No hay órdenes para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {expandedOrderId && (
          <section className="admin-order-detail">
            {orders
              .filter(order => order.id === expandedOrderId)
              .map(order => (
                <div key={order.id}>
                  <div className="admin-order-detail__header">
                    <div>
                      <p className="admin-order__label">Detalle de orden</p>
                      <h2>#{order.id}</h2>
                    </div>
                    <button type="button" className="admin-text-button" onClick={() => toggleDetails(order.id)}>
                      Cerrar detalle
                    </button>
                  </div>

                  <div className="admin-order__customer">
                    <div>
                      <span>Email</span>
                      <strong>{order.email || "-"}</strong>
                    </div>
                    <div>
                      <span>Nombre</span>
                      <strong>{order.nombre || "-"}</strong>
                    </div>
                    <div>
                      <span>Teléfono</span>
                      <strong>{order.telefono || "-"}</strong>
                    </div>
                    <div>
                      <span>Dirección</span>
                      <strong>{order.direccion_envio || "-"}</strong>
                    </div>
                    <div>
                      <span>Método</span>
                      <strong>{order.metodo_pago || "-"}</strong>
                    </div>
                  </div>

                  <div className="admin-order__meta">
                    <span>MP status: {order.mp_status || "-"}</span>
                    <span>MP payment: {order.mp_payment_id || "-"}</span>
                    <span>Stock: {order.stock_confirmado_en ? "confirmado" : order.stock_error || "-"}</span>
                  </div>

                  {editingOrderId === order.id && (
                    <form className="admin-form admin-form--embedded" onSubmit={handleUpdateOrder}>
                      <div className="admin-form__header">
                        <h3>Editar orden</h3>
                        <button type="button" className="admin-text-button" onClick={cancelEditing}>
                          Cancelar edición
                        </button>
                      </div>

                      <div className="admin-form__grid">
                        <label>
                          Estado
                          <select value={editForm.estado} onChange={(event) => updateField("estado", event.target.value)}>
                            {editableStatuses.map(status => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Nombre
                          <input value={editForm.nombre} onChange={(event) => updateField("nombre", event.target.value)} />
                        </label>
                        <label>
                          Teléfono
                          <input value={editForm.telefono} onChange={(event) => updateField("telefono", event.target.value)} />
                        </label>
                        <label className="admin-form__wide">
                          Dirección de envío
                          <input
                            value={editForm.direccion_envio}
                            onChange={(event) => updateField("direccion_envio", event.target.value)}
                          />
                        </label>
                      </div>

                      <button className="admin-submit" type="submit" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </form>
                  )}

                  <div className="admin-table-wrap">
                    <table className="admin-table admin-table--compact">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>ID</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.detalles.map(detail => (
                          <tr key={detail.id}>
                            <td>{detail.nombre_producto}</td>
                            <td>{detail.producto_id}</td>
                            <td>{detail.cantidad}</td>
                            <td>{formatPrice(detail.precio_unitario)}</td>
                            <td>{formatPrice(detail.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </section>
        )}
      </section>
    </main>
  );
}
