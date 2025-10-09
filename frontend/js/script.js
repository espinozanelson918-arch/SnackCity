// Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAUcDxszHV4bVvnYBQT7OmOb3I0cnUwdpA",
  authDomain: "snackcity-2f551.firebaseapp.com",
  projectId: "snackcity-2f551",
  storageBucket: "snackcity-2f551.firebasestorage.app",
  messagingSenderId: "625609791401",
  appId: "1:625609791401:web:bd2d77452aee0f09ca56b8",
  measurementId: "G-G31FZ0EPKB",
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const registerForm = document.getElementById("registerForm");
const registerMsg = document.getElementById("registerMsg");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordMsg = document.getElementById("forgotPasswordMsg");

// Formulario de Login
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    // Prevenir el envío por defecto
    e.preventDefault();

    // Obtener los valores del formulario
    const correo = document.getElementById("loginCorreo").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    console.log(correo);
    console.log(password);

    // Validar campos
    if (!correo || !password) {
      showMessage(loginMsg, "⚠️ Por favor completa todos los campos.", "error");
      return;
    }

    // Iniciar sesión
    try {
      const cred = await signInWithEmailAndPassword(auth, correo, password);
      const uid = cred.user.uid;

      const docRef = doc(db, "usuarios", uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        showMessage(
          loginMsg,
          "⚠️ Usuario no encontrado en Firestore.",
          "error"
        );
        return;
      }

      // Validar rol
      const rol = docSnap.data().rol;

      console.log(rol);
      console.log(window.location.href);

      if (rol === "admin") window.location.href = "/SnackCity/frontend/html/menu_admin.html";
      else if (rol === "gerente")
        window.location.href = "/SnackCity/frontend/html/menu_gerente.html";
      else {
        showMessage(loginMsg, "⚠️ Rol no reconocido.", "error");
      }
    } catch (err) {
      console.error("Error en login:", err);
      showMessage(
        loginMsg,
        "❌ Credenciales incorrectas o usuario no registrado.",
        "error"
      );
    }
  });
}

// Formulario de Recuperar Contraseña
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (e) => {
    // Prevenir el envío por defecto
    e.preventDefault();

    // Obtener el correo electrónico
    const email = document.getElementById("forgotPasswordEmail").value.trim();

    // Validar campos
    if (!email) {
      showMessage(
        forgotPasswordMsg,
        "⚠️ Por favor ingresa tu correo electrónico.",
        "error"
      );
      return;
    }

    // Enviar correo de recuperación
    try {
      await sendPasswordResetEmail(auth, email);
      showMessage(
        forgotPasswordMsg,
        "📧 Se ha enviado un correo para restablecer tu contraseña.",
        "success"
      );
      forgotPasswordForm.reset();

      // Redirigir después de 3 segundos
      setTimeout(() => {
        window.location.href = "f../index.html";
      }, 3000);
    } catch (err) {
      console.error("Error al enviar correo de recuperación:", err);
      showMessage(forgotPasswordMsg, `❌ Error: ${err.message}`, "error");
    }
  });
}

// Función auxiliar para mostrar mensajes
function showMessage(element, message, type = "info") {
  if (!element) return;

  element.textContent = message;
  element.className = `msg ${type}`;

  // Desaparecer después de 5 segundos para mensajes de éxito
  if (type === "success") {
    setTimeout(() => {
      element.textContent = "";
      element.className = "msg";
    }, 5000);
  }
}

// Formulario de Registro
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    // Prevenir el envío por defecto
    e.preventDefault();

    // Obtener los valores del formulario
    const nombre = document.getElementById("registerNombre").value.trim();
    const correo = document.getElementById("registerCorreo").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const sucursal = document.getElementById("registerSucursal").value.trim();
    const rol = document.getElementById("registerRol").value;

    // Validar campos
    if (!nombre || !correo || !password || !sucursal || !rol) {
      showMessage(registerMsg, "⚠️ Completa todos los campos.", "error");
      return;
    }

    // Crear usuario en Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, correo, password);
      const uid = cred.user.uid;

      // Guardar datos adicionales en Firestore
      await setDoc(doc(db, "usuarios", uid), {
        nombre,
        correo,
        sucursal,
        rol,
        creadoEn: new Date().toISOString(),
      });

      showMessage(
        registerMsg,
        "✅ Usuario registrado correctamente. Redirigiendo...",
        "success"
      );
      registerForm.reset();

      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 2000);
    } catch (err) {
      console.error("Error en registro:", err);
      showMessage(registerMsg, `❌ Error: ${err.message}`, "error");
    }
  });
}
