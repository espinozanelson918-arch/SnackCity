  import { Request, Response } from "express";
  import { db } from "../firebase/firebase";
  import { UserModel } from "../models/usuario";
  import { Timestamp } from "firebase-admin/firestore";
  import admin from "firebase-admin";

  const collection = db.collection("usuarios");
  const logsCollection = db.collection("logs");

  // ✅ Crear usuario (Firestore + Firebase Auth)
  export const crearUsuario = async (req: Request, res: Response) => {
    try {
      const data: Partial<UserModel> & { password?: string } = req.body;

      // Validar que solo haya un CEO
      if (data.rol === "CEO") {
        const existingCEOs = await collection.where("rol", "==", "CEO").get();
        if (!existingCEOs.empty) {
          return res.status(400).json({ error: "Ya existe un CEO registrado" });
        }
      }

      // Validar correo y contraseña
      if (!data.correo || !data.password) {
        return res.status(400).json({ error: "Correo y contraseña son requeridos" });
      }

      // 📌 Crear usuario en Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email: data.correo,
        password: data.password,
        displayName: data.nombre,
      });

      // Eliminar contraseña del objeto antes de guardar
      const { password, ...userData } = data;

      // Guardar datos en Firestore
      userData.creadoEn = Timestamp.now();
      userData.id = userRecord.uid;

      await collection.doc(userRecord.uid).set(userData);

      // Registrar log
      await logsCollection.add({
        tipo: "usuario_creado",
        mensaje: `Usuario ${userData.nombre} (${userRecord.uid}) creado en Firestore y Auth`,
        detalles: userData,
        fecha: new Date().toISOString(),
        estado: "exitoso",
      });

      res.status(201).json({
        id: userRecord.uid,
        ...userData,
        mensaje: "Usuario creado correctamente en Firestore y Firebase Auth",
      });
    } catch (error) {
      console.error("❌ Error al crear usuario:", error);

      await logsCollection.add({
        tipo: "error",
        mensaje: "Error al crear usuario",
        error: String(error),
        fecha: new Date().toISOString(),
        estado: "fallido",
      });

      res.status(500).json({ error: "Error al crear usuario" });
    }
  };

  // ✅ Listar todos los usuarios
  export const listarUsuarios = async (req: Request, res: Response) => {
    try {
      const snapshot = await collection.get();
      const usuarios: UserModel[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as UserModel;
        usuarios.push({
          id: doc.id,
          ...data,
          creadoEn:
            data.creadoEn instanceof Timestamp ? data.creadoEn.toDate() : data.creadoEn,
        });
      });

      res.json(usuarios);
    } catch (error) {
      console.error("❌ Error al listar usuarios:", error);
      await logsCollection.add({
        tipo: "error",
        mensaje: "Error al listar usuarios",
        error: String(error),
        fecha: new Date().toISOString(),
        estado: "fallido",
      });
      res.status(500).json({ error: "Error al listar usuarios" });
    }
  };

  // ✅ Obtener usuario por ID
  export const obtenerUsuario = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await collection.doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const data = doc.data() as UserModel;
      res.json({
        id: doc.id,
        ...data,
        creadoEn:
          data.creadoEn instanceof Timestamp ? data.creadoEn.toDate() : data.creadoEn,
      });
    } catch (error) {
      console.error("❌ Error al obtener usuario:", error);
      await logsCollection.add({
        tipo: "error",
        mensaje: "Error al obtener usuario",
        error: String(error),
        fecha: new Date().toISOString(),
        estado: "fallido",
      });
      res.status(500).json({ error: "Error al obtener usuario" });
    }
  };

  // ✅ Obtener el CEO
  export const obtenerCEO = async (req: Request, res: Response) => {
    try {
      const snapshot = await collection.where("rol", "==", "CEO").get();
      if (snapshot.empty) {
        return res.status(404).json({ error: "No hay CEO registrado" });
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as UserModel;

      res.json({
        id: doc.id,
        ...data,
        creadoEn:
          data.creadoEn instanceof Timestamp ? data.creadoEn.toDate() : data.creadoEn,
      });
    } catch (error) {
      console.error("❌ Error al obtener CEO:", error);
      await logsCollection.add({
        tipo: "error",
        mensaje: "Error al obtener CEO",
        error: String(error),
        fecha: new Date().toISOString(),
        estado: "fallido",
      });
      res.status(500).json({ error: "Error al obtener el CEO" });
    }
  };

  // ✅ Actualizar usuario
  export const actualizarUsuario = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: Partial<UserModel> = req.body;

      await collection.doc(id).update(data);

      // Si cambia el correo o nombre, actualizar también en Firebase Auth
      const updates: any = {};
      if (data.correo) updates.email = data.correo;
      if (data.nombre) updates.displayName = data.nombre;

      if (Object.keys(updates).length > 0) {
        await admin.auth().updateUser(id, updates);
      }

      await logsCollection.add({
        tipo: "usuario_actualizado",
        mensaje: `Usuario ${id} actualizado correctamente`,
        cambios: data,
        fecha: new Date().toISOString(),
        estado: "exitoso",
      });

      res.json({ mensaje: "Usuario actualizado correctamente" });
    } catch (error) {
      console.error("❌ Error al actualizar usuario:", error);
      await logsCollection.add({
        tipo: "error",
        mensaje: "Error al actualizar usuario",
        error: String(error),
        fecha: new Date().toISOString(),
        estado: "fallido",
      });
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  };

  // ✅ Eliminar usuario
  export const eliminarUsuario = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await collection.doc(id).delete();
      await admin.auth().deleteUser(id);

      await logsCollection.add({
        tipo: "usuario_eliminado",
        mensaje: `Usuario ${id} eliminado correctamente de Firestore y Auth`,
        fecha: new Date().toISOString(),
        estado: "exitoso",
      });

      res.json({ mensaje: "Usuario eliminado de Firestore y Firebase Auth" });
    } catch (error) {
      console.error("❌ Error al eliminar usuario:", error);
      await logsCollection.add({
        tipo: "error",
        mensaje: "Error al eliminar usuario",
        error: String(error),
        fecha: new Date().toISOString(),
        estado: "fallido",
      });
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  };