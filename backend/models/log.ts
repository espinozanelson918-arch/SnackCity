export interface LogModel {
  id?: string;
  accion: string;         // Qué acción ocurrió (ej: "Venta creada", "Compra eliminada")
  detalle: string;        // Descripción más detallada de lo sucedido
  usuario?: string;       // Quién realizó la acción (si aplica)
  fecha: Date;          // Fecha del evento (ISO string)
}