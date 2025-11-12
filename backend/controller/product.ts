import { Request, Response } from "express";
import { db } from "../firebase/firebase";
import { ProductModel } from "../models/product";

const collection = db.collection("productos");
const logsCollection = db.collection("logs"); // 📘 referencia a logs

// ✅ Crear producto
export const crearProducto = async (req: Request, res: Response) => {
  try {
    const data: ProductModel = req.body;
    const docRef = await collection.add(data);

    // 📘 Registrar en logs
    await logsCollection.add({
      tipo: "producto_creado",
      mensaje: `Producto creado con ID ${docRef.id}`,
      detalles: data,
      fecha: new Date().toISOString(),
      estado: "exitoso"
    });

    res.status(201).json({ id: docRef.id, ...data });
  } catch (error) {
    console.error("❌ Error al crear producto:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al crear producto",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido"
    });

    res.status(500).json({ error: "Error al crear producto" });
  }
};

// ✅ Listar todos los productos
export const listarProductos = async (_req: Request, res: Response) => {
  try {
    const snapshot = await collection.get();
    const productos: ProductModel[] = [];
    snapshot.forEach(doc => {
      productos.push({ id: doc.id, ...(doc.data() as ProductModel) });
    });
    res.json(productos);
  } catch (error) {
    console.error("❌ Error al listar productos:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al listar productos",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido"
    });

    res.status(500).json({ error: "Error al listar productos" });
  }
};

// ✅ Obtener un producto por ID
export const obtenerProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("❌ Error al obtener producto:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al obtener producto por ID",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido"
    });

    res.status(500).json({ error: "Error al obtener producto" });
  }
};

// ✅ Actualizar producto
export const actualizarProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<ProductModel> = req.body;

    await collection.doc(id).update(data);

    await logsCollection.add({
      tipo: "producto_actualizado",
      mensaje: `Producto ${id} actualizado correctamente`,
      cambios: data,
      fecha: new Date().toISOString(),
      estado: "exitoso"
    });

    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al actualizar producto",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido"
    });

    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

// ✅ Eliminar producto
export const eliminarProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await collection.doc(id).delete();

    await logsCollection.add({
      tipo: "producto_eliminado",
      mensaje: `Producto ${id} eliminado correctamente`,
      fecha: new Date().toISOString(),
      estado: "exitoso"
    });

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error);

    await logsCollection.add({
      tipo: "error",
      mensaje: "Error al eliminar producto",
      error: String(error),
      fecha: new Date().toISOString(),
      estado: "fallido"
    });

    res.status(500).json({ error: "Error al eliminar producto" });
  }
};
