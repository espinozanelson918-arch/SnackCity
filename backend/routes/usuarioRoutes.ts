import { Router } from "express";
import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario
} from "../controller/usuario";
import { db } from "../firebase/firebase"; // Importamos conexión a Firestore

const router = Router();

// Rutas para usuarios
router.post("/", crearUsuario);
router.get("/", listarUsuarios);

// ✅ Ruta especial para obtener el CEO (debe ir antes de la ruta parametrizada)
router.get("/rol/ceo", async (req, res) => {
  try {
    const snapshot = await db.collection("usuarios").where("rol", "==", "CEO").get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No hay CEO registrado" });
    }

    const ceo = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))[0]; // Solo devuelve el primero

    res.json(ceo);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el CEO" });
  }
});

router.get("/:id", obtenerUsuario);
router.put("/:id", actualizarUsuario);
router.delete("/:id", eliminarUsuario);

export default router;
