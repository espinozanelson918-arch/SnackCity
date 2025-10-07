import express from "express";
import productoRoutes from "./routes/productRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";

const app = express();
const PORT = 3000;

// Middleware para trabajar con JSON
app.use(express.json());
app.use("/productos", productoRoutes);
app.use("/usuarios", usuarioRoutes);


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});