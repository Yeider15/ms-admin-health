const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const adminRoutes = require("./src/routes/adminRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Validar variables de entorno críticas
const requiredEnvVars = [
  "DB_HOST",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "BREVO_API_KEY",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `ERROR: Faltan variables de entorno: ${missingEnvVars.join(", ")}`,
  );
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("MS Admin Health - Conectado");
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
