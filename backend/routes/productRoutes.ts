import { Router } from "express";
import {
  crearProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto
} from "../controller/product";

const router = Router();

router.post("/", crearProducto);
router.get("/", listarProductos);
router.get("/:id", obtenerProducto);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);

export default router;