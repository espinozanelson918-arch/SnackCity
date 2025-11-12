import { Router } from "express";
import { generarReporte, listarReportes } from "../controller/reportes";

const router = Router();

router.post("/", generarReporte);   // Generar un nuevo reporte
router.get("/", listarReportes);    // Listar reportes (si se guardan)

export default router;