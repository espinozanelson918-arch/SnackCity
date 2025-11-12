import { db } from "../firebase/firebase";

export const registrarLog = async (accion: string, detalle: string, usuario?: string) => {
  const logRef = db.collection("logs").doc();
  await logRef.set({
    accion,
    detalle,
    usuario: usuario || "Sistema",
    fecha: new Date().toISOString(),
  });
};