// backend/models/department.ts
export interface Position {
  titulo: string;   // "Gerente", "Analista", "Auxiliar", ...
  nivel: number;    // 1 = más alto
}

export interface DepartmentModel {
  id?: string;
  nombre: string;           // "Finanzas", "Marketing", etc.
  descripcion?: string;
  supervisorId?: string;    // id del usuario responsable (puede ser el CEO al inicio)
  posiciones?: Position[];  // jerarquía interna
  activo?: boolean;         // true por defecto
}