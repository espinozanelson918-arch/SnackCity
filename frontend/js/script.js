// Firebase App (the core Firebase SDK) is always required and other imports
// ======================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUcDxszHV4bVvnYBQT7OmOb3I0cnUwdpA",
  authDomain: "snackcity-2f551.firebaseapp.com",
  projectId: "snackcity-2f551",
  storageBucket: "snackcity-2f551.firebasestorage.app",
  messagingSenderId: "625609791401",
  appId: "1:625609791401:web:bd2d77452aee0f09ca56b8",
  measurementId: "G-G31FZ0EPKB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======================================
// CONFIGURATION
// ======================================

const CONFIG = {
  messages: {
    register: {
      success: "✅ ¡Registro exitoso! Bienvenido a SnackCity.",
      error: "❌ Error al crear la cuenta. Por favor, inténtalo de nuevo.",
      emailInUse:
        "❌ El correo electrónico ya está registrado. Usa otro correo o inicia sesión.",
    },
    passwordReset: {
      success:
        "✅ ¡Correo de recuperación enviado! Revisa tu bandeja de entrada.",
      error:
        "❌ Error al enviar el correo de recuperación. Por favor, inténtalo de nuevo.",
    },
  },
  redirects: {
    admin: "html/managua.html",
    gerente: "html/dashboard.html",
    default: "index.html",
  },
  timeouts: {
    redirect: 2000,
  },
};

// ======================================
// FORM VALIDATION & AUTHENTICATION
// ======================================

document.addEventListener("DOMContentLoaded", function () {
  // Initialize form event listeners
  initLoginForm();
  initPasswordToggle();
  initRegisterForm();
  initPasswordResetForm();
});

/**
 * Initialize login form with validation
 */
function initLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // Add input event listeners for real-time validation
  const emailInput = document.getElementById("loginCorreo");
  const passwordInput = document.getElementById("loginPassword");

  if (emailInput) {
    emailInput.addEventListener("input", validateEmail);
    emailInput.addEventListener("blur", validateEmail);
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", validatePassword);
    passwordInput.addEventListener("blur", validatePassword);
  }

  // Add form submit handler
  loginForm.addEventListener("submit", handleLogin);
}

/**
 * Initialize password visibility toggle
 */
function initPasswordToggle() {
  const togglePassword = document.querySelector(".toggle-password");
  if (togglePassword) {
    togglePassword.addEventListener("click", function () {
      const password = document.getElementById("loginPassword");
      const type =
        password.getAttribute("type") === "password" ? "text" : "password";
      password.setAttribute("type", type);
      this.querySelector("i").classList.toggle("fa-eye");
      this.querySelector("i").classList.toggle("fa-eye-slash");
    });
  }
}

/**
 * Initialize register form with validation
 */
function initRegisterForm() {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  // Add input event listeners for real-time validation
  const nombreInput = document.getElementById("registerNombre");
  const emailInput = document.getElementById("registerCorreo");
  const passwordInput = document.getElementById("registerPassword");
  const sucursalInput = document.getElementById("registerSucursal");
  const rolSelect = document.getElementById("registerRol");

  if (nombreInput) {
    nombreInput.addEventListener("input", validateRegisterNombre);
    nombreInput.addEventListener("blur", validateRegisterNombre);
  }

  if (emailInput) {
    emailInput.addEventListener("input", validateRegisterEmail);
    emailInput.addEventListener("blur", validateRegisterEmail);
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", validateRegisterPassword);
    passwordInput.addEventListener("blur", validateRegisterPassword);
  }

  if (sucursalInput) {
    sucursalInput.addEventListener("change", validateRegisterSucursal);
  }

  if (rolSelect) {
    rolSelect.addEventListener("change", validateRegisterRol);
  }

  // Add form submit handler
  registerForm.addEventListener("submit", handleRegister);
}

/**
 * Initialize password reset form with validation
 */
function initPasswordResetForm() {
  const passwordResetForm = document.getElementById("passwordResetForm");
  if (!passwordResetForm) return;

  // Add input event listeners for real-time validation
  const emailInput = document.getElementById("forgotPasswordEmail");

  if (emailInput) {
    emailInput.addEventListener("input", validateResetEmail);
    emailInput.addEventListener("blur", validateResetEmail);
  }

  // Add form submit handler
  passwordResetForm.addEventListener("submit", handlePasswordReset);
}

/**
 * Validate email format for login form
 */
function validateEmail() {
  const email = document.getElementById("loginCorreo");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) return false;

  if (!email.value.trim()) {
    setErrorFor(email, "El correo electrónico es requerido");
    return false;
  } else if (!emailRegex.test(email.value.trim())) {
    setErrorFor(email, "Por favor ingresa un correo electrónico válido");
    return false;
  } else {
    setSuccessFor(email);
    return true;
  }
}

/**
 * Validate password for login form
 */
function validatePassword() {
  const password = document.getElementById("loginPassword");

  if (!password) return false;

  if (!password.value) {
    setErrorFor(password, "La contraseña es requerida");
    return false;
  } else if (password.value.length < 6) {
    setErrorFor(password, "La contraseña debe tener al menos 6 caracteres");
    return false;
  } else {
    setSuccessFor(password);
    return true;
  }
}

/**
 * Validate nombre for register form
 */
function validateRegisterNombre() {
  const nombre = document.getElementById("registerNombre");

  if (!nombre) return false;

  if (!nombre.value.trim()) {
    setErrorFor(nombre, "El nombre es requerido");
    return false;
  } else if (nombre.value.trim().length < 2) {
    setErrorFor(nombre, "El nombre debe tener al menos 2 caracteres");
    return false;
  } else {
    setSuccessFor(nombre);
    return true;
  }
}

/**
 * Validate email format for register form
 */
function validateRegisterEmail() {
  const email = document.getElementById("registerCorreo");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) return false;

  if (!email.value.trim()) {
    setErrorFor(email, "El correo electrónico es requerido");
    return false;
  } else if (!emailRegex.test(email.value.trim())) {
    setErrorFor(email, "Por favor ingresa un correo electrónico válido");
    return false;
  } else {
    setSuccessFor(email);
    return true;
  }
}

/**
 * Validate password for register form
 */
function validateRegisterPassword() {
  const password = document.getElementById("registerPassword");

  if (!password) return false;

  if (!password.value) {
    setErrorFor(password, "La contraseña es requerida");
    return false;
  } else if (password.value.length < 6) {
    setErrorFor(password, "La contraseña debe tener al menos 6 caracteres");
    return false;
  } else {
    setSuccessFor(password);
    return true;
  }
}

/**
 * Validate sucursal for register form
 */
function validateRegisterSucursal() {
  const sucursal = document.getElementById("registerSucursal");

  if (!sucursal) return false;

  if (!sucursal.value) {
    setErrorFor(sucursal, "Por favor selecciona una sucursal");
    return false;
  } else {
    setSuccessFor(sucursal);
    return true;
  }
}

/**
 * Validate rol for register form
 */
function validateRegisterRol() {
  const rol = document.getElementById("registerRol");

  if (!rol) return false;

  if (!rol.value) {
    setErrorFor(rol, "Por favor selecciona un rol");
    return false;
  } else {
    setSuccessFor(rol);
    return true;
  }
}

/**
 * Validate email format for password reset form
 */
function validateResetEmail() {
  const email = document.getElementById("forgotPasswordEmail");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) return false;

  if (!email.value.trim()) {
    setErrorFor(email, "El correo electrónico es requerido");
    return false;
  } else if (!emailRegex.test(email.value.trim())) {
    setErrorFor(email, "Por favor ingresa un correo electrónico válido");
    return false;
  } else {
    setSuccessFor(email);
    return true;
  }
}

/**
 * Set error state for input field
 */
function setErrorFor(input, message) {
  if (!input) return;

  // Find the form group (could be .form-group or parent of select/input)
  let formGroup = input.closest(".form-group");
  if (!formGroup) {
    // If no form-group found, try to find parent element
    formGroup = input.parentElement;
  }
  if (!formGroup) return;

  // Add error class to input/select
  input.classList.remove("success");
  input.classList.add("error");

  // Show error message
  let errorElement = formGroup.querySelector(".error-message");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.className = "error-message";
    formGroup.appendChild(errorElement);
  }

  errorElement.textContent = message;
  errorElement.style.display = "block";

  return false;
}

/**
 * Set success state for input field
 */
function setSuccessFor(input) {
  if (!input) return;

  // Find the form group (could be .form-group or parent of select/input)
  let formGroup = input.closest(".form-group");
  if (!formGroup) {
    // If no form-group found, try to find parent element
    formGroup = input.parentElement;
  }
  if (!formGroup) return;

  // Add success class to input/select
  input.classList.remove("error");
  input.classList.add("success");

  // Hide error message if exists
  const errorElement = formGroup.querySelector(".error-message");
  if (errorElement) {
    errorElement.style.display = "none";
  }

  return true;
}

/**
 * Show message in alert box
 */
function showMessage(element, message, type = "info") {
  if (!element) return;

  // Set message and type
  element.textContent = message;
  element.className = `alert alert-${type} show`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    element.classList.remove("show");
  }, 5000);
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();

  // Validate form
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  const correo = document.getElementById("loginCorreo").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const msgElement = document.getElementById("loginMsg");
  const submitButton = document.querySelector(
    '#loginForm button[type="submit"]'
  );
  const originalButtonText = submitButton ? submitButton.innerHTML : "";

  try {
    // Show loading state
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    }

    // Sign in with Firebase Auth
    const cred = await signInWithEmailAndPassword(auth, correo, password);
    const userDoc = await getDoc(doc(db, "usuarios", cred.user.uid));

    // Verify user exists in Firestore
    if (!userDoc.exists()) {
      showMessage(
        msgElement,
        "Usuario no encontrado. Por favor, verifica tus credenciales.",
        "error"
      );
      await signOut(auth);
      return;
    }

    // Redirect based on role
    const rol = userDoc.data().rol;
    if (rol === "admin" || rol === "gerente") {
      showMessage(
        msgElement,
        "Inicio de sesión exitoso. Redirigiendo...",
        "success"
      );
      setTimeout(() => {
        window.location.href =
          CONFIG.redirects[rol] || CONFIG.redirects.default;
      }, 1500);
    } else {
      await signOut(auth);
      showMessage(
        msgElement,
        "No tienes permisos para acceder a este sistema.",
        "error"
      );
    }
  } catch (error) {
    console.error("Error en login:", error);
    let errorMessage =
      "Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo.";

    // More specific error messages
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      errorMessage =
        "Correo o contraseña incorrectos. Por favor, verifica tus credenciales.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage =
        "Demasiados intentos fallidos. Por favor, inténtalo más tarde o restablece tu contraseña.";
    } else if (error.code === "auth/user-disabled") {
      errorMessage =
        "Esta cuenta ha sido deshabilitada. Por favor, contacta al administrador.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "El correo electrónico proporcionado no es válido.";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage =
        "Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.";
    }

    showMessage(msgElement, errorMessage, "error");
  } finally {
    // Restore button state
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}

/**
 * Maneja el registro de nuevos usuarios
 * @param {Event} e - Evento del formulario
 */
async function handleRegister(e) {
  e.preventDefault();

  // Obtener referencias a los elementos del formulario
  const nombreInput = document.getElementById("registerNombre");
  const correoInput = document.getElementById("registerCorreo");
  const passwordInput = document.getElementById("registerPassword");
  const sucursalInput = document.getElementById("registerSucursal");
  const rolSelect = document.getElementById("registerRol");
  const msgElement = document.getElementById("registerMsg");

  // Obtener valores y limpiar espacios en blanco
  const nombre = nombreInput.value.trim();
  const correo = correoInput.value.trim();
  const password = passwordInput.value.trim();
  const sucursal = sucursalInput.value.trim();
  const rol = rolSelect.value;

  // Validar campos requeridos
  if (!nombre) {
    showMessage(
      msgElement,
      "⚠️ Por favor ingresa tu nombre completo.",
      "error"
    );
    nombreInput.focus();
    return;
  }

  if (!correo) {
    showMessage(
      msgElement,
      "⚠️ Por favor ingresa tu correo electrónico.",
      "error"
    );
    correoInput.focus();
    return;
  }

  // Validar formato de correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    showMessage(
      msgElement,
      "⚠️ Por favor ingresa un correo electrónico válido.",
      "error"
    );
    correoInput.focus();
    return;
  }

  if (!password) {
    showMessage(msgElement, "⚠️ Por favor ingresa una contraseña.", "error");
    passwordInput.focus();
    return;
  }

  // Validar fortaleza de la contraseña
  if (password.length < 6) {
    showMessage(
      msgElement,
      "⚠️ La contraseña debe tener al menos 6 caracteres.",
      "error"
    );
    passwordInput.focus();
    return;
  }

  if (!sucursal) {
    showMessage(msgElement, "⚠️ Por favor selecciona una sucursal.", "error");
    sucursalInput.focus();
    return;
  }

  if (!rol) {
    showMessage(msgElement, "⚠️ Por favor selecciona un rol.", "error");
    rolSelect.focus();
    return;
  }

  try {
    // Crear usuario en Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, correo, password);

    // Guardar datos adicionales en Firestore
    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nombre,
      correo,
      sucursal,
      rol,
      creadoEn: serverTimestamp(),
    });

    // Mostrar mensaje de éxito y redirigir
    showMessage(msgElement, CONFIG.messages.register.success, "success");
    e.target.reset();

    setTimeout(() => {
      window.location.href = CONFIG.redirects.default;
    }, CONFIG.timeouts.redirect);
  } catch (error) {
    console.error("Error en registro:", error);
    const errorMessage =
      error.code === "auth/email-already-in-use"
        ? CONFIG.messages.register.emailInUse
        : CONFIG.messages.register.error;
    showMessage(msgElement, errorMessage, "error");
  }
}

/**
 * Maneja el restablecimiento de contraseña
 * @param {Event} e - Evento del formulario
 */
async function handlePasswordReset(e) {
  e.preventDefault();

  const email = document.getElementById("forgotPasswordEmail").value.trim();
  const msgElement = document.getElementById("forgotPasswordMsg");

  try {
    // Enviar correo de recuperación
    await sendPasswordResetEmail(auth, email);

    // Mostrar mensaje de éxito y redirigir
    showMessage(msgElement, CONFIG.messages.passwordReset.success, "success");
    e.target.reset();

    setTimeout(() => {
      window.location.href = CONFIG.redirects.default;
    }, CONFIG.timeouts.redirect);
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    showMessage(msgElement, CONFIG.messages.passwordReset.error, "error");
  }
}
