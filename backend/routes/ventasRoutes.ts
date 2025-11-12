import { Router } from "express";
import {
  crearVenta,
  listarVentas,
  obtenerVenta,
  actualizarVenta,
  eliminarVenta
} from "../controller/ventas"; // asegúrate que el nombre coincida

const router = Router();

// Rutas para ventas
router.post("/", crearVenta);
router.get("/", listarVentas);
router.get("/:id", obtenerVenta);
router.put("/:id", actualizarVenta);
router.delete("/:id", eliminarVenta);

export default router;