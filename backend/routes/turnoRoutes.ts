// routes/turnoRoutes.ts

import { Router } from "express";
import {
  crearTurno,
  listarTurnos,
  obtenerTurno,
  actualizarTurno,
  eliminarTurno
} from "../controller/turno";

const router = Router();

router.post("/", crearTurno);
router.get("/", listarTurnos);
router.get("/:id", obtenerTurno);
router.put("/:id", actualizarTurno);
router.delete("/:id", eliminarTurno);

export default router;