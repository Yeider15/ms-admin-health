const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const adminRoutes = require("./src/routes/adminRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- VALIDACIÓN ACTUALIZADA ---
const requiredEnvVars = [
  "DB_HOST",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "EMAILJS_SERVICE_ID",
  "EMAILJS_TEMPLATE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
  "FRONTEND_URL"
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ ERROR: Faltan variables en .env: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("MS Admin Health - Conectado con EmailJS");
});

app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});