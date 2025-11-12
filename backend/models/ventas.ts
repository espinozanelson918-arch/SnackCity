export interface VentaModel {
  id?: string;
  cliente: string;            // Nombre o ID del cliente
  fechaVenta: string;         // Fecha de la venta
  productos: {
    productoId: string;       // ID del producto vendido
    nombre?: string;          // opcional: nombre del producto
    cantidad: number;         // cantidad vendida
    precioUnitario: number;   // precio por unidad
    subtotal?: number;        // cantidad * precioUnitario
  }[];
  total: number;              // Total de la venta
  metodoPago: "efectivo" | "tarjeta"; // método de pago
  estado: "pendiente" | "completado" | "cancelado";     // estado de la venta
  usuarioId: string;          // Usuario que realizó la venta
}