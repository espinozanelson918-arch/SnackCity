import { Request, Response } from "express";
import { db } from "../firebase/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { InventoryMovement, TipoMovimiento } from "../models/inventario";

const collection = db.collection("inventario");
const productsCollection = db.collection("productos");

// 🎯 REGISTRAR MOVIMIENTO
export const registrarMovimiento = async (req: Request, res: Response) => {
  try {
    const data: InventoryMovement = req.body;

    if (!data.productoId || !data.cantidad || !data.tipo || !data.usuarioId) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // obtener producto
    const productDoc = await productsCollection.doc(data.productoId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const product = productDoc.data() as any;
    const stockAntes = product.stock || 0;

    // determinar si suma o resta
    let stockDespues = stockAntes;
    const tiposQueResta: TipoMovimiento[] = ["VENTA", "MERMA", "AJUSTE"];

    if (tiposQueResta.includes(data.tipo)) {
      stockDespues = stockAntes - data.cantidad;
    } else {
      stockDespues = stockAntes + data.cantidad;
    }

    if (stockDespues < 0) {
      return res.status(400).json({ error: "Stock insuficiente para esta salida" });
    }

    // actualizar stock del producto
    await productsCollection.doc(data.productoId).update({
      stock: stockDespues
    });

    // guardar movimiento
    const movement: InventoryMovement = {
      ...data,
      fecha: Timestamp.now(),
      stockAntes,
      stockDespues
    };

    const docRef = await collection.add(movement);

    res.status(201).json({
      id: docRef.id,
      ...movement,
      mensaje: "Movimiento registrado y stock actualizado"
    });

  } catch (error) {
    res.status(500).json({ error: "Error al registrar movimiento" });
  }
};

// 🎯 LISTAR MOVIMIENTOS
export const listarMovimientos = async (req: Request, res: Response) => {
  try {
    const snapshot = await collection.get();
    const movimientos: InventoryMovement[] = [];

    snapshot.forEach(doc => movimientos.push({
      id: doc.id,
      ...(doc.data() as InventoryMovement)
    }));

    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar movimientos" });
  }
};

// 🎯 MOVIMIENTOS POR PRODUCTO
export const movimientosPorProducto = async (req: Request, res: Response) => {
  try {
    const { productoId } = req.params;

    const snapshot = await collection
      .where("productoId", "==", productoId)
      .orderBy("fecha", "asc")
      .get();

    const movimientos: InventoryMovement[] = [];

    snapshot.forEach(doc => movimientos.push({
      id: doc.id,
      ...(doc.data() as InventoryMovement)
    }));

    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener movimientos del producto" });
  }
};