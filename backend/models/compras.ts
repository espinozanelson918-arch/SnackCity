export interface CompraModel {
  id?: string;
  proveedor: string;         // Nombre o ID del proveedor
  fechaCompra: string;       // Fecha de la compra
  productos: {
    productoId: string;      // ID del producto comprado
    nombre?: string; // opcional — útil para mostrar sin otra consulta
    cantidad: number;        // Cantidad comprada
    precioUnitario: number;  // Precio de compra por unidad
    subtotal?: number; // opcional — cantidad * precioUnitario
  }[];
  total: number;             // Total de la compra
  estado: "pendiente" | "completado" | "cancelado"; // Estado de la compra
  
  usuarioId: string;         // 👈 ID del usuario que realizó la compra
}