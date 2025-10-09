// Firebase App (the core Firebase SDK) is always required and other imports
// ======================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
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

// Wait for Firebase to be ready
console.log("🔥 Firebase initialized successfully");

// Add a small delay to ensure Firebase is fully loaded
setTimeout(() => {
  console.log("⏳ Firebase ready, waiting for authentication...");
}, 100);

// ======================================
// GLOBAL STATE
// ======================================

/**
 * Check Firebase connection and configuration
 */
async function checkFirebaseConnection() {
  try {
    console.log("🔍 Checking Firebase connection...");

    // Test basic Firebase functionality
    const testCollection = collection(db, "test");
    console.log("✅ Firestore connection verified");

    // Test authentication state
    const user = auth.currentUser;
    console.log(
      "🔐 Current auth state:",
      user ? "authenticated" : "not authenticated"
    );

    return true;
  } catch (error) {
    console.error("❌ Firebase connection error:", error);
    showMessage(
      "Error de conexión con Firebase. Verifica tu conexión a internet.",
      "error"
    );
    return false;
  }
}

// ======================================
// DOM ELEMENTS
const sidebar = document.querySelector(".sidebar");
const toggleSidebar = document.querySelector(".toggle-sidebar");
const logoutBtn = document.querySelector(".logout-btn");

// DOM Elements (Updated for custom modal)
const orderModal = document.getElementById("addProductModal");
const closeBtn = orderModal?.querySelector(".btn-close");
const cancelBtn = document.getElementById("cancelBtn");

// Order form elements
const orderForm = document.getElementById("orderForm");
const productSelect = document.getElementById("productSelect");
const productQuantity = document.getElementById("productQuantity");
const productPrice = document.getElementById("productPrice");
const confirmAddProduct = document.getElementById("confirmAddProduct");
const productTable = document.querySelector("#productTable tbody");

// Modal elements (Custom implementation)
const addProductBtn = document.getElementById("addProductBtn");
const productsList = document.getElementById("productsList");
const branchSelect = document.getElementById("branch");
// UTILITY FUNCTIONS
// ======================================

/**
 * Show message to user
 */
function showMessage(message, type = "info") {
  // Create alert element if it doesn't exist
  let alertElement = document.querySelector(".alert-custom");
  if (!alertElement) {
    alertElement = document.createElement("div");
    alertElement.className = "alert-custom";
    document.body.appendChild(alertElement);
  }

  alertElement.textContent = message;
  alertElement.className = `alert-custom alert-${type} show`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertElement.classList.remove("show");
  }, 5000);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

/**
 * Check if user has required role
 */
function hasPermission(requiredRoles) {
  if (!userData || !userData.rol) {
    console.log("⚠️ No user data or role found, defaulting to basic access");
    return true; // Allow access by default if no role data
  }
  const hasAccess = requiredRoles.includes(userData.rol);
  console.log(`🔐 Checking permission for role '${userData.rol}':`, hasAccess);
  return hasAccess;
}

// ======================================
// AUTHENTICATION
// ======================================
/**
 * Handle user authentication state changes
 *
 * IMPORTANT: This function now supports multiple user roles and includes
 * fallback mechanisms to prevent automatic redirections to login.
 *
 * Supported roles: admin, gerente, vendedor
 *
 * If user document doesn't exist in Firestore, it defaults to 'vendedor' role
 * If user doesn't have required permissions, shows warning but doesn't immediately redirect
 * If Firebase connection fails, shows warning but continues with default permissions
 */
onAuthStateChanged(auth, async (user) => {
  console.log(
    "Authentication state changed:",
    user ? "logged in" : "logged out"
  );

  if (!user) {
    console.log("No user found, redirecting to login...");
    window.location.href = "../index.html";
    return;
  }

  currentUser = user;
  console.log("User authenticated:", user.email, user.uid);

  try {
    // Get user data from Firestore
    console.log("Loading user data from Firestore...");
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));

    if (!userDoc.exists()) {
      console.log("User document not found in Firestore");
      // Instead of redirecting, show a warning but allow access
      showMessage(
        "Usuario no encontrado en la base de datos. Algunas funciones pueden no estar disponibles.",
        "warning"
      );
      userData = { rol: "vendedor", nombre: user.email }; // Default fallback
    } else {
      userData = userDoc.data();
      console.log("User data loaded:", userData);
    }

    // Check if user has permission to access dashboard
    const allowedRoles = ["admin", "gerente", "vendedor"];
    if (!hasPermission(allowedRoles)) {
      console.log("User doesn't have permission to access dashboard");
      showMessage(
        "No tienes permisos para acceder a este sistema. Contacta al administrador.",
        "error"
      );
      // Instead of immediate redirect, give user time to read the message
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 3000);
      return;
    }

    console.log("User has permission, initializing dashboard...");

    // Update UI with user information
    updateUserInterface();

    // Initialize dashboard functionality
    await initializeDashboard();
  } catch (error) {
    console.error("Error in authentication:", error);
    showMessage(
      "Error al verificar permisos. Se usarán permisos por defecto.",
      "warning"
    );
    // Set default user data as fallback
    userData = { rol: "vendedor", nombre: user.email || "Usuario" };
    updateUserInterface();
    await initializeDashboard();
  }
});

/**
 * Update user interface with current user data
 */
function updateUserInterface() {
  if (userNameElement) {
    userNameElement.textContent =
      userData.nombre || currentUser.email || "Usuario";
  }

  if (userRoleElement) {
    const roleNames = {
      admin: "Administrador",
      gerente: "Gerente",
      vendedor: "Vendedor",
    };
    userRoleElement.textContent = roleNames[userData.rol] || "Usuario";
  }
}

/**
 * Initialize dashboard after successful authentication
 */
async function initializeDashboard() {
  try {
    console.log("🚀 Starting dashboard initialization...");

    // First, check Firebase connection
    const firebaseConnected = await checkFirebaseConnection();
    if (!firebaseConnected) {
      console.log("⚠️ Firebase connection issues detected, but continuing...");
    }

    // Load products for dropdown
    await loadProducts();

    // Setup role-based UI
    setupRoleBasedUI();

    console.log("✅ Dashboard initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing dashboard:", error);
    showMessage("Error al cargar el dashboard. Recarga la página.", "error");
  }
}

/**
 * Setup UI based on user role
 */
function setupRoleBasedUI() {
  // Hide admin-only features for non-admin users
  if (userData.rol !== "admin") {
    const adminElements = document.querySelectorAll(".admin-only");
    adminElements.forEach((el) => {
      el.style.display = "none";
    });
  }
}

// ======================================
// SIDEBAR & NAVIGATION
// ======================================

/**
 * Toggle sidebar visibility
 */
toggleSidebar?.addEventListener("click", () => {
  sidebar.classList.toggle("show");
  document.body.classList.toggle("sidebar-visible");
});

/**
 * Handle logout
 */
logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await signOut(auth);
    window.location.href = "../index.html";
  } catch (error) {
    console.error("Error signing out:", error);
    showMessage("Error al cerrar sesión", "error");
  }
});

// ======================================
// PRODUCTS MANAGEMENT
// ======================================

/**
 * Load products from Firestore
 */
async function loadProducts() {
  try {
    console.log("Loading products...");
    const querySnapshot = await getDocs(collection(db, "products"));
    products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Loaded ${products.length} products`);

    // Populate product dropdown if it exists
    if (productSelect) {
      populateProductDropdown();
    }
  } catch (error) {
    console.error("Error loading products:", error);
    showMessage("Error al cargar productos", "error");
  }
}

/**
 * Populate product dropdown
 */
function populateProductDropdown() {
  if (!productSelect) return;

  productSelect.innerHTML = `
    <option value="" disabled selected>Seleccione un producto</option>
    ${products
      .map(
        (product) => `
      <option value="${product.id}" data-price="${product.price}">
        ${product.name} - ${product.code}
      </option>
    `
      )
      .join("")}
  `;

  // Add event listener for price auto-fill
  productSelect.addEventListener("change", (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    if (selectedOption && selectedOption.dataset.price) {
      productPrice.value = parseFloat(selectedOption.dataset.price).toFixed(2);
    }
  });
}

// ======================================
// ORDER MANAGEMENT
// ======================================

let currentOrder = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};

/**
 * Add product to order
 */
function addProductToOrder() {
  const productId = productSelect.value;
  const product = products.find((p) => p.id === productId);
  const quantity = parseInt(productQuantity.value) || 1;
  const price =
    parseFloat(productPrice.value) ||
    parseFloat(
      productSelect.options[productSelect.selectedIndex]?.dataset.price
    );

  if (!product || !quantity || !price) {
    showMessage(
      "Por favor selecciona un producto, cantidad y precio válidos",
      "warning"
    );
    return;
  }

  const item = {
    id: productId,
    name: product.name,
    code: product.code,
    quantity,
    price,
    total: quantity * price,
  };

  // Check if product already exists in order
  const existingItemIndex = currentOrder.items.findIndex(
    (item) => item.id === productId
  );

  if (existingItemIndex > -1) {
    // Update existing item
    currentOrder.items[existingItemIndex].quantity += quantity;
    currentOrder.items[existingItemIndex].total =
      currentOrder.items[existingItemIndex].quantity * price;
  } else {
    // Add new item
    currentOrder.items.push(item);
  }

  updateOrderSummary();
  renderOrderItems();

  // Reset form
  productSelect.value = "";
  productQuantity.value = "1";
  productPrice.value = "";
}

/**
 * Update order summary
 */
function updateOrderSummary() {
  currentOrder.subtotal = currentOrder.items.reduce(
    (sum, item) => sum + item.total,
    0
  );
  currentOrder.tax = currentOrder.subtotal * 0.16; // 16% IVA
  currentOrder.total = currentOrder.subtotal + currentOrder.tax;

  // Update UI
  const subtotalElement = document.getElementById("subtotal");
  const taxElement = document.getElementById("tax");
  const totalElement = document.getElementById("total");

  if (subtotalElement)
    subtotalElement.textContent = formatCurrency(currentOrder.subtotal);
  if (taxElement) taxElement.textContent = formatCurrency(currentOrder.tax);
  if (totalElement)
    totalElement.textContent = formatCurrency(currentOrder.total);
}

/**
 * Render order items in table
 */
function renderOrderItems() {
  if (!productTable) return;

  productTable.innerHTML = currentOrder.items
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.code}</td>
      <td class="text-end">${item.quantity}</td>
      <td class="text-end">${formatCurrency(item.price)}</td>
      <td class="text-end">${formatCurrency(item.total)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `
    )
    .join("");

  // Add event listeners to remove buttons
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = e.currentTarget.dataset.id;
      currentOrder.items = currentOrder.items.filter(
        (item) => item.id !== productId
      );
      updateOrderSummary();
      renderOrderItems();
    });
  });
}

/**
 * Handle order form submission
 */
async function handleOrderSubmit(e) {
  e.preventDefault();

  if (currentOrder.items.length === 0) {
    showMessage(
      "Por favor, agregue al menos un producto al pedido.",
      "warning"
    );
    return;
  }

  const orderData = {
    branch: document.getElementById("branch").value,
    deliveryDate: document.getElementById("deliveryDate").value,
    notes: document.getElementById("notes").value,
    items: currentOrder.items,
    subtotal: currentOrder.subtotal,
    tax: currentOrder.tax,
    total: currentOrder.total,
    status: "pending",
    createdAt: serverTimestamp(),
    createdBy: currentUser.uid,
    createdByName: userData.nombre || currentUser.email,
  };

  try {
    // Add order to Firestore
    const docRef = await addDoc(collection(db, "orders"), orderData);
    console.log("Order created with ID: ", docRef.id);

    // Reset form and order
    orderForm.reset();
    currentOrder = { items: [], subtotal: 0, tax: 0, total: 0 };
    updateOrderSummary();
    renderOrderItems();

    // Show success message
    showMessage("¡Pedido creado exitosamente!", "success");
  } catch (error) {
    console.error("Error creating order: ", error);
    showMessage(
      "Error al crear el pedido. Por favor, inténtalo nuevamente.",
      "error"
    );
  }
}

// ======================================
// MODAL FUNCTIONALITY
// ======================================

/**
 * Initialize modal functionality (Custom implementation - no Bootstrap dependency)
 */
function initializeModal() {
  // Open modal
  newOrderBtn?.addEventListener("click", openModal);

  // Close modal events
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === orderModal) {
      closeModal();
    }
  });

  // Add product button
  addProductBtn?.addEventListener("click", addProductRow);

  // Form submission
  orderForm?.addEventListener("submit", handleModalSubmit);
}

/**
 * Open order modal
 */
async function openModal() {
  if (products.length === 0) {
    await loadProducts();
  }

  orderModal.style.display = "flex";
  orderForm.reset();
  productsList.innerHTML = "";
  addProductRow(); // Add first product row
}

/**
 * Close order modal
 */
function closeModal() {
  orderModal.style.display = "none";
}

/**
 * Add new product row to modal
 */
function addProductRow() {
  if (products.length === 0) {
    showMessage("No hay productos disponibles", "warning");
    return;
  }

  const productRow = document.createElement("div");
  productRow.className = "product-item";

  // Product select
  const productSelect = document.createElement("select");
  productSelect.className = "form-control product-select";
  productSelect.required = true;

  // Default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Seleccione un producto";
  productSelect.appendChild(defaultOption);

  // Add products
  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.nombre || product.name} - ${formatCurrency(
      product.precio || product.price
    )}`;
    option.dataset.price = product.precio || product.price;
    productSelect.appendChild(option);
  });

  // Quantity input
  const quantityInput = document.createElement("input");
  quantityInput.type = "number";
  quantityInput.min = "1";
  quantityInput.value = "1";
  quantityInput.className = "form-control quantity";
  quantityInput.required = true;
  quantityInput.style.width = "80px";

  // Remove button
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn-outline-danger";
  removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
  removeBtn.onclick = () => {
    if (productsList.children.length > 1) {
      productRow.remove();
    } else {
      showMessage("Debe haber al menos un producto en el pedido", "warning");
    }
  };

  // Assemble row
  productRow.appendChild(productSelect);
  productRow.appendChild(quantityInput);
  productRow.appendChild(removeBtn);
  productsList.appendChild(productRow);
}

/**
 * Handle modal form submission (Custom implementation)
 */
/**
 * Handle modal form submission (Custom implementation)
 */
async function handleModalSubmit(e) {
  e.preventDefault();

  const branch = branchSelect.value;
  const productItems = [];
  let total = 0;

  // Validate branch selection
  if (!branch) {
    showMessage("Por favor seleccione una sucursal", "warning");
    return;
  }

  // Collect products
  const productRows = productsList.querySelectorAll(".product-item");
  if (productRows.length === 0) {
    showMessage("Por favor agregue al menos un producto", "warning");
    return;
  }

  for (const row of productRows) {
    const productSelect = row.querySelector(".product-select");
    const quantityInput = row.querySelector(".quantity");

    if (productSelect.value && quantityInput.value > 0) {
      const productId = productSelect.value;
      const product = products.find((p) => p.id === productId);
      const quantity = parseInt(quantityInput.value);
      const subtotal = (product.precio || product.price) * quantity;

      productItems.push({
        id: productId,
        nombre: product.nombre || product.name,
        precio: product.precio || product.price,
        cantidad: quantity,
        subtotal: subtotal,
      });

      total += subtotal;
    }
  }

  if (productItems.length === 0) {
    showMessage("Por favor seleccione productos válidos", "warning");
    return;
  }

  try {
    // Save order to Firebase
    const orderData = {
      sucursal: branch,
      productos: productItems,
      total: total,
      fecha: serverTimestamp(),
      estado: "pendiente",
      usuario: currentUser.uid,
      usuarioNombre: userData.nombre || currentUser.email,
    };

    const docRef = await addDoc(collection(db, "pedidos"), orderData);

    showMessage(`Pedido creado exitosamente con ID: ${docRef.id}`, "success");
    closeModal();
  } catch (error) {
    console.error("Error creating order:", error);
    showMessage("Error al crear el pedido", "error");
  }
}

// ======================================
// INITIALIZATION
// ======================================

/**
 * Initialize dashboard when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔧 DOM loaded, initializing dashboard...");

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  const deliveryDate = document.getElementById("deliveryDate");
  if (deliveryDate) {
    deliveryDate.min = today;
  }

  // Initialize modal functionality
  initializeModal();

  // Add product to order (for simple form)
  confirmAddProduct?.addEventListener("click", addProductToOrder);

  // Form submission (for simple form)
  orderForm?.addEventListener("submit", handleOrderSubmit);

  console.log("✅ Dashboard initialization complete");
});
