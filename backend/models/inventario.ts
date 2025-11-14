// backend/models/inventory.ts
import { Timestamp } from "firebase-admin/firestore";

export type TipoMovimiento =
  | "COMPRA"
  | "VENTA"
  | "AJUSTE"
  | "MERMA"
  | "INICIAL"
  | "DEVOLUCION"
  | "TRANSFERENCIA";

export interface InventoryMovement {
  id?: string;
  productoId: string;          // ID del producto
  cantidad: number;            // Positivo (+) o negativo (-)
  tipo: TipoMovimiento;        // Tipo de movimiento
  fecha: Date | Timestamp;     // Fecha del movimiento
  usuarioId: string;           // Quién hizo el movimiento
  descripcion?: string;        // Opcional: detalles del movimiento
  stockAntes?: number;         // Stock antes del movimiento
  stockDespues?: number;       // Stock después del movimiento
}