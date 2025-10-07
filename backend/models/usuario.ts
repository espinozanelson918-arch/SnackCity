export interface UserModel {
  id?: string;      // generado por Firestore
  nombre: string;
  email: string;
  sucursal:string;
  rol: string;      // ejemplo: "admin", "usuario"
}