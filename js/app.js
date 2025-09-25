// js/app.js
import { db, storage } from "./firebase.js";
import { ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

const form = document.getElementById("uploadForm");
const proyectosLista = document.getElementById("proyectosLista");

// 🔹 Subir proyecto
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const titulo = form.titulo.value;
  const descripcion = form.descripcion.value;
  const archivo = form.archivo.files[0];
  if (!archivo) return alert("Selecciona un archivo");

  // 1. Subir archivo a Firebase Storage
  const archivoRef = storageRef(storage, "proyectos/" + archivo.name);
  await uploadBytes(archivoRef, archivo);
  const url = await getDownloadURL(archivoRef);

  // 2. Guardar datos en Firebase Database
  const proyecto = {
    titulo,
    descripcion,
    nombreArchivo: archivo.name,
    archivoURL: url,
    fecha: new Date().toLocaleString()
  };

  push(ref(db, "proyectos"), proyecto);
  form.reset();
});

// 🔹 Mostrar proyectos en tiempo real
onValue(ref(db, "proyectos"), (snapshot) => {
  proyectosLista.innerHTML = "";
  snapshot.forEach((childSnapshot) => {
    const proyecto = childSnapshot.val();
    const id = childSnapshot.key;

    proyectosLista.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card shadow-lg border-0 rounded-4 h-100 bg-light text-dark">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-primary fw-bold">${proyecto.titulo}</h5>
            <p class="card-text">${proyecto.descripcion}</p>
            <small class="text-secondary">📅 ${proyecto.fecha}</small>
            <div class="mt-auto d-flex justify-content-between">
              <a href="${proyecto.archivoURL}" target="_blank" class="btn btn-info btn-sm rounded-pill">
                <i class="bi bi-eye"></i> Ver
              </a>
              <a href="${proyecto.archivoURL}" download="${proyecto.nombreArchivo}" class="btn btn-success btn-sm rounded-pill">
                <i class="bi bi-download"></i> Descargar
              </a>
              <button class="btn btn-danger btn-sm rounded-pill" onclick="eliminarProyecto('${id}')">
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>`;
  });
});

// 🔹 Eliminar proyecto
window.eliminarProyecto = function(id) {
  remove(ref(db, "proyectos/" + id));
};
