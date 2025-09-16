// Cargar header y footer automáticamente
document.addEventListener("DOMContentLoaded", () => {
  // Cargar header
  fetch("includes/header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header").innerHTML = data;
    });

  // Cargar footer
  fetch("includes/footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer").innerHTML = data;
    });
});
