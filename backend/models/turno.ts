// models/turno.ts

import { Timestamp } from "firebase-admin/firestore";

export interface TurnoModel {
  id?: string;
  empleadoId: string;       // ID del usuario asignado al turno
  departamento: string;     // Ej: "Ventas", "Producción"
  inicio: Date | Timestamp; // Fecha/hora inicio
  fin: Date | Timestamp;    // Fecha/hora fin
  estado: "activo" | "finalizado" | "cancelado";
  creadoEn?: Date | Timestamp;
}