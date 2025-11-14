// controller/turno.ts

import { Request, Response } from "express";
import { db } from "../firebase/firebase"; // si tu proyecto usa otro path, ajústalo
import { TurnoModel } from "../models/turno";

const collection = "turnos";

// Crear turno
export const crearTurno = async (req: Request, res: Response) => {
  try {
    const data: TurnoModel = {
      ...req.body,
      creadoEn: new Date(),
      estado: "activo",
    };

    const doc = await db.collection(collection).add(data);
    return res.json({ id: doc.id, ...data });
  } catch (error) {
    return res.status(500).json({ error: "Error al crear turno" });
  }
};

// Listar turnos
export const listarTurnos = async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection(collection).get();
    const turnos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(turnos);
  } catch {
    return res.status(500).json({ error: "Error al listar turnos" });
  }
};

// Obtener turno por ID
export const obtenerTurno = async (req: Request, res: Response) => {
  try {
    const doc = await db.collection(collection).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Turno no encontrado" });
    return res.json({ id: doc.id, ...doc.data() });
  } catch {
    return res.status(500).json({ error: "Error al obtener turno" });
  }
};

// Actualizar turno
export const actualizarTurno = async (req: Request, res: Response) => {
  try {
    await db.collection(collection).doc(req.params.id).update(req.body);
    return res.json({ message: "Turno actualizado correctamente" });
  } catch {
    return res.status(500).json({ error: "Error al actualizar turno" });
  }
};

// Eliminar turno
export const eliminarTurno = async (req: Request, res: Response) => {
  try {
    await db.collection(collection).doc(req.params.id).delete();
    return res.json({ message: "Turno eliminado correctamente" });
  } catch {
    return res.status(500).json({ error: "Error al eliminar turno" });
  }
};