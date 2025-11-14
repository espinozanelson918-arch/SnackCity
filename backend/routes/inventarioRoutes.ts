import { Router } from "express";
import {
  registrarMovimiento,
  listarMovimientos,
  movimientosPorProducto
} from "../controller/inventario";

const router = Router();

router.post("/movimientos", registrarMovimiento);
router.get("/movimientos", listarMovimientos);
router.get("/movimientos/:productoId", movimientosPorProducto);

export default router;