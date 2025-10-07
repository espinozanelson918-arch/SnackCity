import { Router } from "express";
import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario
} from "../controller/usuario"; // asegurate de que el archivo se llame usuario.ts

const router = Router();

// Rutas para usuarios
router.post("/", crearUsuario);
router.get("/", listarUsuarios);
router.get("/:id", obtenerUsuario);
router.put("/:id", actualizarUsuario);
router.delete("/:id", eliminarUsuario);

export default router;