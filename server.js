import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import fetch from "node-fetch"; // Para GitHub
import { fileURLToPath } from "url";

// 🔹 Para poder usar __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 🔹 Configuración GitHub
const token = fs.readFileSync(path.join(__dirname, "token.txt"), "utf8").trim();
const owner = "jessm23";
const repo = "portafolio";
const branch = "main";


// Middleware
app.use(cors());
app.use(express.json());

// 👇 Esto sirve tus archivos estáticos (index.html, css, js, imágenes, etc.)
app.use(express.static(__dirname));

// Redirigir al index.html por defecto
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});



// Archivo JSON donde guardamos los proyectos
const DATA_FILE = path.join(__dirname, "proyectos.json");

// 🔹 Funciones de lectura y guardado de proyectos
const leerProyectos = () => (fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) : []);
const guardarProyectos = (proyectos) => fs.writeFileSync(DATA_FILE, JSON.stringify(proyectos, null, 2));

// 🔹 Configuración Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// 🔹 Función para subir archivo a GitHub
async function subirArchivo(localPath, remotePath, mensaje) {
  if (!fs.existsSync(localPath)) return console.error(`❌ Archivo no encontrado: ${localPath}`);

  const content = fs.readFileSync(localPath, "base64");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${remotePath}`;

  let sha = null;
 const check = await fetch(url, { 
  headers: { 
    Authorization: `Bearer ${token}`,
    "Accept": "application/vnd.github+json"
  } 
});
  if (check.ok) {
    const data = await check.json();
    sha = data.sha;
  }

const res = await fetch(url, {
  method: "PUT",
  headers: { 
    Authorization: `Bearer ${token}`, 
    "Content-Type": "application/json",
    "Accept": "application/vnd.github+json"
  },
  body: JSON.stringify({ message: mensaje, content, branch, ...(sha ? { sha } : {}) })
});


  if (res.ok) console.log(`✅ Archivo ${remotePath} subido a GitHub`);
  else console.error("❌ Error al subir a GitHub:", await res.json());
}

// 🔹 Obtener proyectos
app.get("/proyectos", (req, res) => res.json(leerProyectos()));

// 🔹 Subir proyecto al servidor y GitHub
app.post("/upload", upload.single("archivo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });

  const proyectos = leerProyectos();
  const nuevoProyecto = {
    id: Date.now(),
    titulo: req.body.titulo,
    descripcion: req.body.descripcion,
    archivoNombre: req.file.filename,
    archivoURL: "/uploads/" + req.file.filename,
    fecha: new Date().toLocaleString()
  };

  proyectos.unshift(nuevoProyecto); // ⬅️ Agrega arriba para que se vea primero
  guardarProyectos(proyectos);

  // 🔹 Subir automáticamente a GitHub
  try {
    const localPath = path.join(__dirname, "uploads", req.file.filename);
    const remotePath = `portafolioweb/${req.file.filename}`;
    await subirArchivo(localPath, remotePath, `Subido ${req.file.filename}`);
  } catch (err) {
    console.error("❌ Error al subir a GitHub:", err);
  }

  res.json(nuevoProyecto);
});

// 🔹 Editar proyecto
app.put("/proyectos/:id", (req, res) => {
  const proyectos = leerProyectos().map(p => (p.id == req.params.id ? { ...p, ...req.body } : p));
  guardarProyectos(proyectos);
  res.json({ success: true });
});

// 🔹 Eliminar proyecto
app.delete("/proyectos/:id", (req, res) => {
  const proyectos = leerProyectos().filter(p => p.id != req.params.id);
  guardarProyectos(proyectos);
  res.json({ success: true });
});

// 🔹 Iniciar servidor
app.listen(PORT, () => console.log(`✅ Servidor en http://localhost:${PORT}`));
