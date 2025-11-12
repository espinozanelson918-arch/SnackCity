import { Request, Response } from "express";
import { db } from "../firebase/firebase";
import { VentaModel } from "../models/ventas";

const collection = db.collection("ventas");
const productosCollection = db.collection("productos");
const logsCollection = db.collection("logs");

// ✅ Crear una venta y actualizar stock
export const crearVenta = async (req: Request, res: Response) => {
  const batch = db.batch();

  try {
    const data: VentaModel = req.body;

    // Validar usuarioId
    if (!data.usuarioId) {
      return res.status(400).json({ error: "El campo usuarioId es obligatorio." });
    }

    // Crear venta
    const ventaRef = collection.doc();
    batch.set(ventaRef, data);

    // Actualizar stock
    for (const item of data.productos) {
      const productoRef = productosCollection.doc(item.productoId);
      const productoSnap = await productoRef.get();

      if (productoSnap.exists) {
        const productoData = productoSnap.data()!;
        const nuevoStock = Math.max((productoData.stock || 0) - item.cantidad, 0);
        batch.update(productoRef, { stock: nuevoStock });
      } else {
        console.warn(`⚠️ Producto no encontrado: ${item.productoId}`);
      }
    }

    // Confirmar batch
    await batch.commit();

    // 🔹 Log de creación
    await logsCollection.add({
      tipo: "venta_creada",
      descripcion: `Se realizó una venta con ID ${ventaRef.id} por un total de ${data.total}`,
      usuarioId: data.usuarioId,
      fecha: new Date().toISOString(),
    });

    res.status(201).json({ id: ventaRef.id, ...data });
  } catch (error) {
    console.error("❌ Error al crear venta:", error);
    await logsCollection.add({
      tipo: "error",
      descripcion: `Error al crear venta: ${error instanceof Error ? error.message : error}`,
      fecha: new Date().toISOString(),
    });
    res.status(500).json({ error: "Error al crear la venta o actualizar stock" });
  }
};

// ✅ Listar todas las ventas
export const listarVentas = async (_req: Request, res: Response) => {
  try {
    const snapshot = await collection.get();
    const ventas: VentaModel[] = [];
    snapshot.forEach((doc) => ventas.push({ id: doc.id, ...(doc.data() as VentaModel) }));
    res.json(ventas);
  } catch (error) {
    console.error("❌ Error al listar ventas:", error);
    res.status(500).json({ error: "Error al listar ventas" });
  }
};

// ✅ Obtener una venta por ID
export const obtenerVenta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Venta no encontrada" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("❌ Error al obtener venta:", error);
    res.status(500).json({ error: "Error al obtener la venta" });
  }
};

// ✅ Actualizar una venta
export const actualizarVenta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<VentaModel> = req.body;
    await collection.doc(id).update(data);

    await logsCollection.add({
      tipo: "venta_actualizada",
      descripcion: `La venta ${id} fue actualizada`,
      usuarioId: data.usuarioId || "desconocido",
      fecha: new Date().toISOString(),
    });

    res.json({ mensaje: "Venta actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar venta:", error);
    res.status(500).json({ error: "Error al actualizar venta" });
  }
};

// ✅ Eliminar una venta
export const eliminarVenta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await collection.doc(id).delete();

    await logsCollection.add({
      tipo: "venta_eliminada",
      descripcion: `La venta con ID ${id} fue eliminada del sistema`,
      fecha: new Date().toISOString(),
    });

    res.json({ mensaje: "Venta eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar venta:", error);
    res.status(500).json({ error: "Error al eliminar venta" });
  }
};