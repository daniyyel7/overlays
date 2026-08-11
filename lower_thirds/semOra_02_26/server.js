const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const PRESETS_FILE = "./presets.json";

let presets = [];
let textoActual = { texto1: "", texto2: "" };

// cargar presets guardados
if (fs.existsSync(PRESETS_FILE)) {
  presets = JSON.parse(fs.readFileSync(PRESETS_FILE, "utf8"));
}

// devolver presets
app.get("/presets", (req, res) => {
  res.json(presets);
});

// guardar presets
app.post("/presets", (req, res) => {
  presets = req.body;
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2));
  res.sendStatus(200);
});

// set LIVE
app.post("/set", (req, res) => {
  textoActual = req.body;
  res.sendStatus(200);
});

// overlay pide textos
app.get("/textos", (req, res) => {
  res.json(textoActual);
});

app.listen(PORT, () => {
  console.log("Server corriendo en http://localhost:" + PORT);
});