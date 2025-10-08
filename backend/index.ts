import express from "express";
import productoRoutes from "../backend/routes/productRoutes";
import usuarioRoutes from "../backend/routes/usuarioRoutes";
import { VercelRequest, VercelResponse } from '@vercel/node';

const app = express();
app.use(express.json());
app.use("/productos", productoRoutes);
app.use("/usuarios", usuarioRoutes);

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}