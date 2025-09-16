// subir.js

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// ⚠️ Configura tus datos
const token = fs.readFileSync("token.txt", "utf8").trim();
const owner = "jessm23";    // tu usuario de GitHub
const repo = "portafolio";  // nombre del repositorio
const branch = "main";      // rama principal

/**
 * 🔹 Función para subir un archivo a GitHub (nuevo o actualizar)
 * @param {string} localPath - Ruta local del archivo
 * @param {string} remotePath - Ruta en GitHub (carpeta/repositorio)
 * @param {string} mensaje - Mensaje del commit
 */
export async function subirArchivo(localPath, remotePath, mensaje) {
  if (!fs.existsSync(localPath)) {
    console.error(`❌ Archivo no encontrado: ${localPath}`);
    return;
  }

  const content = fs.readFileSync(localPath, "base64");
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${remotePath}`;

  let sha = null;
  const check = await fetch(url, { headers: { Authorization: `token ${token}` } });

  if (check.ok) {
    const data = await check.json();
    sha = data.sha;
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: mensaje,
      content,
      branch,
      ...(sha ? { sha } : {})
    }),
  });

  if (res.ok) {
    console.log(`✅ Archivo ${remotePath} subido a GitHub`);
  } else {
    const error = await res.json();
    console.error("❌ Error al subir a GitHub:", error);
  }
}

/**
 * 🔹 Función recursiva para subir toda una carpeta a GitHub
 * @param {string} carpeta - Carpeta local a subir
 * @param {string} nombreProyecto - Carpeta en GitHub
 */
export async function subirProyecto(carpeta, nombreProyecto) {
  if (!fs.existsSync(carpeta)) {
    console.error(`❌ Carpeta no encontrada: ${carpeta}`);
    return;
  }

  const items = fs.readdirSync(carpeta);
  for (const item of items) {
    const localPath = path.join(carpeta, item);
    const remotePath = path.join(nombreProyecto, item).replace(/\\/g, "/");

    if (fs.statSync(localPath).isDirectory()) {
      await subirProyecto(localPath, remotePath);
    } else {
      await subirArchivo(localPath, remotePath, `Agrego ${item} al proyecto ${nombreProyecto}`);
    }
  }
}

// 🔹 Si quieres probar subir todo manualmente
// (Descomenta la siguiente línea y ejecuta node subir.js)
//subirProyecto("./", "portafolioweb");
