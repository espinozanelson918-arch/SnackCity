import { Request, Response } from "express";
import { db } from "../firebase/firebase";
import { LogModel } from "../models/log";

const collection = db.collection("logs");

// ✅ Crear un log manualmente (opcional)
export const crearLog = async (req: Request, res: Response) => {
  try {
    const data: LogModel = req.body;
    const docRef = await collection.add({
      ...data,
      fecha: new Date().toISOString(),
    });
    res.status(201).json({ id: docRef.id, ...data });
  } catch (error) {
    res.status(500).json({ error: "Error al crear log" });
  }
};

// ✅ Listar todos los logs
export const listarLogs = async (_req: Request, res: Response) => {
  try {
    const snapshot = await collection.orderBy("fecha", "desc").get();
    const logs: LogModel[] = [];
    snapshot.forEach(doc => {
      logs.push({ id: doc.id, ...(doc.data() as LogModel) });
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error al listar logs" });
  }
};

// ✅ Obtener log por ID
export const obtenerLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Log no encontrado" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener log" });
  }
};

// ✅ Eliminar log
export const eliminarLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await collection.doc(id).delete();
    res.json({ mensaje: "Log eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar log" });
  }
};