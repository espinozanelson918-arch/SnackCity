import { Router } from "express";
import {
  crearCompra,
  listarCompras,
  obtenerCompra,
  actualizarCompra,
  eliminarCompra,
} from "../controller/compras";

const router = Router();

router.post("/", crearCompra);
router.get("/", listarCompras);
router.get("/:id", obtenerCompra);
router.put("/:id", actualizarCompra);
router.delete("/:id", eliminarCompra);

export default router;
