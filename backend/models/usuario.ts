import { Timestamp } from "firebase-admin/firestore";

// 🔹 Definimos los roles reales y actuales de SnackCity
export enum RolUsuario {
  // Administración General Listo
  CEO = "CEO", // David
  ADMIN = "Administrador General", //Gady

  // Ventas y Distribución Listo
  JEFE_VENTAS = "Jefe de Ventas y Distribución", // Cesar

  // Almacén e Inventario Listo
  JEFE_ALMACEN = "Jefe de Almacén e Inventario", // Arturo

  // Compras Listo
  ENCARGADO_COMPRAS = "Encargado de Compras", // Bryan

  // Reportes y Análisis Listo
  ANALISTA_REPORTES = "Analista de Reportes", // Daniel

  // Turnos y Personal Listo
  COORDINADOR_TURNOS = "Coordinador de Turnos", // Ali
}

// 🔸 Modelo de Usuario principal
export interface UserModel {
  id?: string;                      // ID generado por Firestore o Firebase Auth
  nombre: string;                   // Nombre completo
  correo: string;                   // Correo electrónico
  creadoEn?: Date | Timestamp;      // Fecha de creación
  rol: RolUsuario;                  // Cargo (basado en el enum RolUsuario)
  departamento?: string;            // Nombre del departamento (ej: "Compras")
}