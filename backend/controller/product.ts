import { Request, Response } from "express";
import { db } from "../firebase/firebase";
import { ProductModel } from "../models/product";

const collection = db.collection("productos");

// Crear producto
export const crearProducto = async (req: Request, res: Response) => {
  try {
    const data: ProductModel = req.body;
    const docRef = await collection.add(data);
    res.status(201).json({ id: docRef.id,  ...data });
  } catch (error) {
    res.status(500).json({ error: "Error al crear producto" });
  }
};

// Obtener todos los productos
export const listarProductos = async (req: Request, res: Response) => {
  try {
    const snapshot = await collection.get();
    const productos: ProductModel[] = [];
    snapshot.forEach(doc => {
      productos.push({ id: doc.id, ...(doc.data() as ProductModel) });
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar productos" });
  }
};

// Obtener un producto por ID
export const obtenerProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await collection.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "ProductModel no encontrado" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener producto" });
  }
};

// Actualizar producto
export const actualizarProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<ProductModel> = req.body;
    await collection.doc(id).update(data);
    res.json({ mensaje: "Producto actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

// Eliminar producto
export const eliminarProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await collection.doc(id).delete();
    res.json({ mensaje: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};