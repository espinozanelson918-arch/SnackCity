import express from "express";
import path from "path";
import productoRoutes from "./routes/productRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";
import departamentRoutes from "./routes/departamentRoutes";
import comprasRoutes from "./routes/comprasRoutes";
import ventaRoutes from "./routes/ventasRoutes";
import logsRoutes from "./routes/logsRoutes";
import reporteRoutes from "./routes/reportesRoutes";
import inventarioRoutes from "./routes/inventarioRoutes";
import turnoRoutes from "./routes/turnoRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Rutas API
app.use("/api/productos", productoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/departamentos", departamentRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/turnos", turnoRoutes);

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Redirigir cualquier ruta no API a index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app; // importante para Vercel
