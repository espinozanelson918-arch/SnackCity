import { Request, Response } from "express";
import { db } from "../firebase/firebase";
import { ReporteModel } from "../models/reportes";

const ventasCollection = db.collection("ventas");
const comprasCollection = db.collection("compras");
const productosCollection = db.collection("productos");

// 🧾 Generar un reporte entre dos fechas
export const generarReporte = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Debe proporcionar fechaInicio y fechaFin" });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // --- Obtener ventas ---
    const ventasSnap = await ventasCollection.get();
    let totalVentas = 0;
    const ventasFiltradas: any[] = [];

    ventasSnap.forEach(doc => {
      const data = doc.data();
      const fecha = new Date(data.fechaVenta);
      if (fecha >= inicio && fecha <= fin) {
        totalVentas += data.total;
        ventasFiltradas.push(data);
      }
    });

    // --- Obtener compras ---
    const comprasSnap = await comprasCollection.get();
    let totalCompras = 0;
    comprasSnap.forEach(doc => {
      const data = doc.data();
      const fecha = new Date(data.fechaCompra);
      if (fecha >= inicio && fecha <= fin) {
        totalCompras += data.total;
      }
    });

    // --- Calcular producto más vendido ---
    const contadorProductos: Record<string, number> = {};
    for (const venta of ventasFiltradas) {
      for (const item of venta.productos) {
        contadorProductos[item.productoId] = (contadorProductos[item.productoId] || 0) + item.cantidad;
      }
    }

    let productoMasVendido: ReporteModel["productoMasVendido"] | undefined;

    if (Object.keys(contadorProductos).length > 0) {
      const productoId = Object.keys(contadorProductos).reduce((a, b) =>
        contadorProductos[a] > contadorProductos[b] ? a : b
      );
      const productoDoc = await productosCollection.doc(productoId).get();
      productoMasVendido = {
        productoId,
        nombre: productoDoc.exists ? productoDoc.data()?.nombre : "Desconocido",
        cantidadVendida: contadorProductos[productoId],
      };
    }

    // --- Armar reporte ---
    const reporte: ReporteModel = {
      fechaInicio,
      fechaFin,
      totalVentas,
      totalCompras,
      gananciaNeta: totalVentas - totalCompras,
      productoMasVendido,
      fechaGeneracion: new Date().toISOString(),
    };

    res.json(reporte);
  } catch (error) {
    console.error("❌ Error al generar reporte:", error);
    res.status(500).json({ error: "Error al generar el reporte" });
  }
};

// 📋 (Opcional) Listar reportes guardados si decides almacenarlos
export const listarReportes = async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("reportes").get();
    const reportes: ReporteModel[] = [];
    snapshot.forEach(doc => {
      reportes.push({ id: doc.id, ...(doc.data() as ReporteModel) });
    });
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ error: "Error al listar reportes" });
  }
};