// backend/controller/department.ts
import { Request, Response } from "express";
import { db } from "../firebase/firebase";
import { DepartmentModel } from "../models/department";
import { RolUsuario, UserModel } from "../models/usuario";

const collection = db.collection("departamentos");

// Crear departamento (solo CEO o admin — validación simple basada en userId y rol)
export const crearDepartamento = async (req: Request, res: Response) => {
  try {
    const data: DepartmentModel = req.body;
    const { creatorId } = req.body; // opcional: id del usuario que solicita la creación

    // Si queremos que solo el CEO pueda crear departamentos:
    if (creatorId) {
      const userDoc = await db.collection("usuarios").doc(creatorId).get();
      if (!userDoc.exists) return res.status(403).json({ error: "Usuario no encontrado" });
      const user = userDoc.data() as UserModel;
      if (user.rol !== RolUsuario.CEO && user.rol !== RolUsuario.ADMIN) {
  return res.status(403).json({ error: "No tiene permisos para crear departamentos" });
}
    }

    const deptData = {
      nombre: data.nombre,
      descripcion: data.descripcion || "",
      supervisorId: data.supervisorId || null,
      posiciones: data.posiciones || [],
      activo: data.activo === undefined ? true : data.activo
    };

    const docRef = await collection.add(deptData);
    res.status(201).json({ id: docRef.id, ...deptData });
  } catch (error) {
    res.status(500).json({ error: "Error al crear departamento" });
  }
};

// Listar departamentos
export const listarDepartamentos = async (req: Request, res: Response) => {
  try {
    const snapshot = await collection.get();
    const departamentos: DepartmentModel[] = [];
    snapshot.forEach(doc => departamentos.push({ id: doc.id, ...(doc.data() as DepartmentModel) }));
    res.json(departamentos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar departamentos" });
  }
};

// Obtener por ID
export const obtenerDepartamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Departamento no encontrado" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener departamento" });
  }
};

// Actualizar departamento
export const actualizarDepartamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<DepartmentModel> = req.body;
    await collection.doc(id).update(data);
    res.json({ mensaje: "Departamento actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar departamento" });
  }
};

// Eliminar departamento
export const eliminarDepartamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await collection.doc(id).delete();
    res.json({ mensaje: "Departamento eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar departamento" });
  }
};

// Asignar usuario a departamento (útil para vincular usuarios existentes)
export const asignarUsuarioADepartamento = async (req: Request, res: Response) => {
  try {
    const { departamentoId } = req.params;
    const { usuarioId } = req.body;
    if (!usuarioId) return res.status(400).json({ error: "Falta usuarioId" });

    // actualiza el usuario
    await db.collection("usuarios").doc(usuarioId).update({ departamento: departamentoId });
    res.json({ mensaje: "Usuario asignado al departamento" });
  } catch (error) {
    res.status(500).json({ error: "Error al asignar usuario" });
  }
};