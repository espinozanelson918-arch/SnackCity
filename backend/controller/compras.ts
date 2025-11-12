import { Request, Response } from "express";
import { db } from "../firebase/firebase";
import { CompraModel } from "../models/compras";

const collection = db.collection("compras");
const productosCollection = db.collection("productos");
const logsCollection = db.collection("logs");
const usuariosCollection = db.collection("usuarios"); // nueva referencia para validar usuario

// ✅ Crear una compra y actualizar stock de productos
export const crearCompra = async (req: Request, res: Response) => {
  const batch = db.batch();

  try {
    const data: CompraModel = req.body;

    // Validar que venga el usuarioId (quién hace la compra)
    if (!data.usuarioId) {
      return res.status(400).json({ error: "Falta el campo usuarioId (empleado que realiza la compra)" });
    }

    // Validar que el usuario exista
    const usuarioRef = usuariosCollection.doc(data.usuarioId);
    const usuarioSnap = await usuarioRef.get();

    if (!usuarioSnap.exists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Crear la compra
    const compraRef = collection.doc();
    batch.set(compraRef, {
      ...data,
      fechaCreacion: new Date().toISOString(),
      usuario: usuarioSnap.data()?.nombre || "Desconocido",
    });

    // Actualizar el stock de cada producto comprado
    for (const item of data.productos) {
      const productoRef = productosCollection.doc(item.productoId);
      const productoSnap = await productoRef.get();

      if (productoSnap.exists) {
        const productoData = productoSnap.data()!;
        const nuevoStock = (productoData.stock || 0) + item.cantidad;
        batch.update(productoRef, { stock: nuevoStock });
      } else {
        console.warn(`⚠️ Producto no encontrado: ${item.productoId}`);
      }
    }

    // Confirmar todas las operaciones
    await batch.commit();

    // 📘 Registrar en logs
    await logsCollection.add({
      tipo: "compra_creada",
      mensaje: `Compra creada por usuario ${usuarioSnap.data()?.nombre || "Desconocido"}`,
      usuarioId: data.usuarioId,
      compraId: compraRef.id,
      fecha: new Date().toISOString(),
      estado: "exitoso",
    });

    res.status(201).json({ id: compraRef.id, ...data });
  } catch (error) {
    console.error("❌ Error al crear compra:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al crear compra o actualizar stock",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido",
    });

    res.status(500).json({ error: "Error al crear la compra o actualizar stock" });
  }
};

// ✅ Listar todas las compras
export const listarCompras = async (_req: Request, res: Response) => {
  try {
    const snapshot = await collection.get();
    const compras: CompraModel[] = [];
    snapshot.forEach(doc => {
      compras.push({ id: doc.id, ...(doc.data() as CompraModel) });
    });
    res.json(compras);
  } catch (error) {
    console.error("❌ Error al listar compras:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al listar compras",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido",
    });

    res.status(500).json({ error: "Error al listar compras" });
  }
};

// ✅ Obtener una compra por ID
export const obtenerCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Compra no encontrada" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("❌ Error al obtener compra:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al obtener compra por ID",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido",
    });

    res.status(500).json({ error: "Error al obtener la compra" });
  }
};

// ✅ Actualizar una compra
export const actualizarCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<CompraModel> = req.body;
    await collection.doc(id).update(data);

    await logsCollection.add({
      tipo: "compra_actualizada",
      mensaje: `Compra ${id} actualizada correctamente`,
      cambios: data,
      fecha: new Date().toISOString(),
      estado: "exitoso",
    });

    res.json({ mensaje: "Compra actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar compra:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al actualizar compra",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido",
    });

    res.status(500).json({ error: "Error al actualizar compra" });
  }
};

// ✅ Eliminar una compra
export const eliminarCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await collection.doc(id).delete();

    await logsCollection.add({
      tipo: "compra_eliminada",
      mensaje: `Compra ${id} eliminada correctamente`,
      fecha: new Date().toISOString(),
      estado: "exitoso",
    });

    res.json({ mensaje: "Compra eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar compra:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al eliminar compra",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido",
    });

    res.status(500).json({ error: "Error al eliminar compra" });
  }
};