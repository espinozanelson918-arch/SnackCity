import { Router } from "express";
import {
  crearDepartamento,
  listarDepartamentos,
  obtenerDepartamento,
  actualizarDepartamento,
  eliminarDepartamento,
  asignarUsuarioADepartamento
} from "../controller/department";

const router = Router();

router.post("/", crearDepartamento);
router.get("/", listarDepartamentos);
router.get("/:id", obtenerDepartamento);
router.put("/:id", actualizarDepartamento);
router.delete("/:id", eliminarDepartamento);

// asignar usuario
router.post("/:departamentoId/asignar", asignarUsuarioADepartamento);

export default router;