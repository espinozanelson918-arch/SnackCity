document.addEventListener("DOMContentLoaded", function () {
  // Obtener la ruta actual
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  // Remover la clase 'active' de todos los botones
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Agregar clase 'active' al enlace actual
  const activeBtn = document.querySelector(`.nav-btn[href="${currentPath}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Actualizar el nombre de usuario si está disponible
  const userName = localStorage.getItem("userName") || "Agente";
  const userNameElement = document.getElementById("userName");
  if (userNameElement) {
    userNameElement.textContent = userName;
  }

  // Logout handler for branch pages
  const userMenuBtn = document.getElementById("userMenuBtn");
  if (userMenuBtn && typeof window !== 'undefined') {
    userMenuBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (typeof window.snackcitySignOut === "function") {
        window.snackcitySignOut();
      } else {
        // Fallback: go to login page
        window.location.href = "../index.html";
      }
    });
  }
});
