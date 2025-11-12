import express from "express";
import { crearLog, listarLogs, obtenerLog, eliminarLog } from "../controller/logs";

const router = express.Router();

router.post("/", crearLog);
router.get("/", listarLogs);
router.get("/:id", obtenerLog);
router.delete("/:id", eliminarLog);

export default router;
