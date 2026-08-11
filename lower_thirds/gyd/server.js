const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const PRESETS_FILE = "./presets.json";
const PRESETS2_FILE = "./presets2.json"; // Archivo para guardar nombres y áreas

let presets = [];
let textoActual = { texto1: "", texto2: "", timestamp: 0 };
let creditosActuales = { lista: [], timestamp: 0 };

// Carga inicial
if (fs.existsSync(PRESETS_FILE)) presets = JSON.parse(fs.readFileSync(PRESETS_FILE, "utf8"));
if (fs.existsSync(PRESETS2_FILE)) creditosActuales = JSON.parse(fs.readFileSync(PRESETS2_FILE, "utf8"));

// --- LOWER THIRD ---
app.get("/presets", (req, res) => res.json(presets));
app.post("/presets", (req, res) => {
  presets = req.body;
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2));
  res.sendStatus(200);
});
app.post("/set", (req, res) => {
  textoActual = { ...req.body, timestamp: Date.now() };
  res.sendStatus(200);
});
app.get("/textos", (req, res) => res.json(textoActual));

// --- CRÉDITOS (PRESETS 2) ---
app.post("/actualizar-creditos", (req, res) => {
  creditosActuales = { lista: req.body.lista, timestamp: Date.now() };
  // Guardamos en presets2.json para que no se pierdan
  fs.writeFileSync(PRESETS2_FILE, JSON.stringify(creditosActuales, null, 2));
  res.send({ status: "ok" });
});

app.get("/creditos", (req, res) => res.json(creditosActuales));

app.listen(PORT, () => console.log("🚀 Servidor en puerto 3000 con presets2 activo"));