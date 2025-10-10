// ======================================
// DASHBOARD APPLICATION - REFACTORED
// ======================================

// Firebase Imports
// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Inicialización de Firebase
let app;
try {
  const firebaseConfig = {
    apiKey: "AIzaSyAUcDxszHV4bVvnYBQT7OmOb3I0cnUwdpA",
    authDomain: "snackcity-2f551.firebaseapp.com",
    projectId: "snackcity-2f551",
    storageBucket: "snackcity-2f551.firebasestorage.app",
    messagingSenderId: "625609791401",
    appId: "1:625609791401:web:bd2d77452aee0f09ca56b8",
    measurementId: "G-G31FZ0EPKB",
  };

  // Inicializar Firebase
  app = initializeApp(firebaseConfig);
  console.log("Firebase inicializado correctamente");
} catch (error) {
  console.error("Error al inicializar Firebase:", error);
  throw error; // O maneja el error de otra manera apropiada
}

// Inicializar servicios de Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// ======================================
// STATE MANAGEMENT
// ======================================
const state = {
  currentUser: null,
  userData: {},
  productos: [],
  currentOrder: {
    items: [],
    subtotal: 0,
    tax: 0.16, // 16% IVA
    total: 0,
  },
  isLoading: false,
  error: null,
};

// ======================================
// DOM ELEMENTS
// ======================================
const DOM = {
  // Navigation
  sidebar: document.querySelector(".sidebar"),
  toggleSidebar: document.getElementById("toggleSidebarBtn"),
  logoutBtn: document.querySelector(".dropdown-item.text-danger"),

  // User Info
  userName: document.getElementById("userName"),
  userRole: document.getElementById("userRole"),

  // Modal Elements
  orderModal: document.getElementById("addProductModal"),
  productSelect: document.getElementById("productSelect"),
  productQuantity: document.getElementById("productQuantity"),
  productPrice: document.getElementById("productPrice"),
  confirmAddProduct: document.getElementById("confirmAddProduct"),
  cancelBtn: document.getElementById("cancelBtn"),
  addProductForm: document.getElementById("addProductForm"),
  addProductBtn: document.getElementById("addProductBtn"),

  // Order Form
  orderForm: document.getElementById("orderForm"),
  branchSelect: document.getElementById("branch"),
  deliveryDateInput: document.getElementById("deliveryDate"),
  notesInput: document.getElementById("notes"),
  productTable: document.getElementById("productsTableBody"),
  orderTotal: document.getElementById("orderTotal"),
};

// ======================================
// UTILITY FUNCTIONS
// ======================================
const utils = {
  showMessage(message, type = "info") {
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
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  },

  hasPermission(requiredRoles) {
    if (!state.userData?.rol) {
      return true; // Default access if no role
    }
    return requiredRoles.includes(state.userData.rol);
  },
};

// ======================================
// AUTHENTICATION
// ======================================
const authService = {
  async signOut() {
    try {
      await firebaseSignOut(auth);
      window.location.href = "../index.html";
    } catch (error) {
      utils.showMessage("Error al cerrar sesión", "error");
      console.error("Sign out error:", error);
    }
  },

  initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "../index.html";
        return;
      }

      state.currentUser = user;
      await this.loadUserData(user.uid);
      await initializeDashboard();
    });
  },

  async loadUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", uid));

      if (!userDoc.exists()) {
        utils.showMessage(
          "Usuario no encontrado en la base de datos. Algunas funciones pueden no estar disponibles.",
          "warning"
        );
        state.userData = { rol: "vendedor", nombre: state.currentUser.email };
      } else {
        state.userData = userDoc.data();
      }

      this.updateUI();
    } catch (error) {
      console.error("Error loading user data:", error);
      state.userData = {
        rol: "vendedor",
        nombre: state.currentUser?.email || "Usuario",
      };
      this.updateUI();
    }
  },

  updateUI() {
    if (DOM.userName) {
      DOM.userName.textContent =
        state.userData.nombre || state.currentUser?.email || "Usuario";
    }

    if (DOM.userRole) {
      const roleNames = {
        admin: "Administrador",
        gerente: "Gerente",
        vendedor: "Vendedor",
      };
      DOM.userRole.textContent = roleNames[state.userData.rol] || "Usuario";
    }
  },
};

// ======================================
// PRODUCTS
// ======================================
const productsService = {
  async loadProducts() {
    try {
      state.isLoading = true;
      // Productos por defecto
      state.productos = [
        {
          id: "prod1",
          nombre: "Coca-Cola Original",
          codigo: "COLA-001",
          precio: 12.5,
          descripcion: "Coca-Cola Original 2L",
          categoria: "Bebidas",
        },
        {
          id: "prod2",
          nombre: "Coca-Cola Zero",
          codigo: "COLA-002",
          precio: 12.5,
          descripcion: "Coca-Cola Zero 2L",
          categoria: "Bebidas",
        },
        {
          id: "prod3",
          nombre: "Coca-Cola Light",
          codigo: "COLA-003",
          precio: 12.5,
          descripcion: "Coca-Cola Light 2L",
          categoria: "Bebidas",
        },
        {
          id: "prod4",
          nombre: "Fanta",
          codigo: "FANTA-001",
          precio: 12.5,
          descripcion: "Fanta 2L",
          categoria: "Bebidas",
        },
        {
          id: "prod5",
          nombre: "Sprite",
          codigo: "SPRITE-001",
          precio: 12.5,
          descripcion: "Sprite 2L",
          categoria: "Bebidas",
        },
      ];
      this.populateProductDropdown();
    } catch (error) {
      console.error("Error loading products:", error);
      utils.showMessage("Error al cargar los productos", "error");
    } finally {
      state.isLoading = false;
    }
  },

  populateProductDropdown() {
    if (!DOM.productSelect) return;

    DOM.productSelect.innerHTML = `
      <option value="" disabled selected>Seleccione un producto</option>
      ${state.productos
        .map(
          (product) => `
        <option value="${product.id}" data-price="${product.precio}">
          ${product.nombre} - ${product.codigo} (${utils.formatCurrency(
            product.precio
          )})
        </option>
      `
        )
        .join("")}
    `;

    // Add price auto-fill
    DOM.productSelect.addEventListener("change", (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      if (selectedOption?.dataset.price) {
        DOM.productPrice.value = parseFloat(
          selectedOption.dataset.price
        ).toFixed(2);
      }
    });
  },
};

// ======================================
// ORDER MANAGEMENT
// ======================================
const orderService = {
  addProductToOrder() {
    const productId = DOM.productSelect.value;
    const product = state.productos.find((p) => p.id === productId);
    const quantity = parseInt(DOM.productQuantity.value) || 1;
    const price = parseFloat(DOM.productPrice.value) || 0;

    if (!productId || !price) {
      utils.showMessage(
        "Por favor selecciona un producto y especifica un precio",
        "warning"
      );
      return;
    }

    // Verificar si el producto ya está en el pedido
    const existingItem = state.currentOrder.items.find(
      (item) => item.id === productId
    );

    if (existingItem) {
      // Actualizar cantidad si el producto ya existe
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * price;
    } else {
      // Agregar nuevo producto al pedido
      state.currentOrder.items.push({
        id: productId,
        name: product.nombre,
        code: product.codigo,
        quantity,
        price,
        total: quantity * price,
      });
    }

    // Actualizar la interfaz
    this.updateOrderSummary();
    this.renderOrderItems();
    modalService.closeModal();
  },

  updateOrderSummary() {
    state.currentOrder.subtotal = state.currentOrder.items.reduce(
      (sum, item) => sum + item.total,
      0
    );
    state.currentOrder.tax = state.currentOrder.subtotal * 0.16;
    state.currentOrder.total =
      state.currentOrder.subtotal + state.currentOrder.tax;

    if (DOM.orderTotal) {
      DOM.orderTotal.textContent = utils.formatCurrency(
        state.currentOrder.total
      );
    }
  },

  renderOrderItems() {
    if (!DOM.productTable) return;

    DOM.productTable.innerHTML = state.currentOrder.items
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${utils.formatCurrency(item.price)}</td>
          <td>${utils.formatCurrency(item.total)}</td>
          <td>
            <button class="btn btn-sm btn-danger remove-item" data-id="${
              item.id
            }">
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
        state.currentOrder.items = state.currentOrder.items.filter(
          (item) => item.id !== productId
        );
        this.updateOrderSummary();
        this.renderOrderItems();
      });
    });
  },

  submitOrder(e) {
    e.preventDefault();

    if (state.currentOrder.items.length === 0) {
      utils.showMessage("Agrega al menos un producto al pedido", "warning");
      return;
    }

    if (!DOM.branchSelect?.value || !DOM.deliveryDateInput?.value) {
      utils.showMessage("Completa todos los campos requeridos", "warning");
      return;
    }

    // Generar un ID único para el pedido
    const orderId = `order_${Date.now()}`;

    const orderData = {
      id: orderId,
      branch: DOM.branchSelect.value,
      deliveryDate: DOM.deliveryDateInput.value,
      notes: DOM.notesInput?.value || "",
      items: [...state.currentOrder.items], // Hacemos una copia del array
      subtotal: state.currentOrder.subtotal,
      tax: state.currentOrder.tax,
      total: state.currentOrder.total,
      status: "pending",
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser?.uid || "anonymous",
      createdByName: state.userData?.nombre || "Usuario Anónimo",
    };

    try {
      // Obtener pedidos existentes del localStorage
      const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];

      // Agregar el nuevo pedido
      savedOrders.push(orderData);

      // Guardar de vuelta en el localStorage
      localStorage.setItem("orders", JSON.stringify(savedOrders));

      // Mostrar mensaje de éxito
      utils.showMessage(`Pedido #${orderId} guardado exitosamente`, "success");
      console.log("Pedido guardado:", orderData);

      // Resetear el formulario y el estado
      state.currentOrder = { items: [], subtotal: 0, tax: 0.16, total: 0 };
      DOM.orderForm?.reset();
      this.updateOrderSummary();
      this.renderOrderItems();
    } catch (error) {
      console.error("Error al guardar el pedido en localStorage:", error);
      utils.showMessage("Error al guardar el pedido", "error");
    }
  },
};

// ======================================
// MODAL MANAGEMENT
// ======================================
const modalService = {
  initialize() {
    if (DOM.addProductBtn) {
      DOM.addProductBtn.addEventListener("click", () => this.openModal());
    }
    if (DOM.closeBtn) {
      DOM.closeBtn.addEventListener("click", () => this.closeModal());
    }
    if (DOM.cancelBtn) {
      DOM.cancelBtn.addEventListener("click", () => this.closeModal());
    }
    if (DOM.confirmAddProduct) {
      // Asegurarse de que solo hay un manejador de eventos
      DOM.confirmAddProduct.removeEventListener(
        "click",
        orderService.addProductToOrder
      );
      DOM.confirmAddProduct.addEventListener("click", () => {
        orderService.addProductToOrder();
      });
    }
    if (DOM.orderModal) {
      DOM.orderModal.addEventListener("click", (e) => {
        if (e.target === DOM.orderModal) this.closeModal();
      });
    }
  },

  openModal() {
    if (DOM.orderModal) {
      DOM.orderModal.style.display = "flex";
      DOM.orderModal.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  },

  closeModal() {
    if (DOM.orderModal) {
      DOM.orderModal.style.display = "none";
      DOM.orderModal.classList.remove("show");
      document.body.style.overflow = "auto";
    }
  },
};

// ======================================
// INITIALIZATION
// ======================================
async function initializeDashboard() {
  // Initialize event listeners
  if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      authService.signOut();
    });
  }

  if (DOM.toggleSidebar) {
    DOM.toggleSidebar.addEventListener("click", () => {
      DOM.sidebar?.classList.toggle("show");
      document.body.classList.toggle("sidebar-visible");
    });
  }

  if (DOM.orderForm) {
    DOM.orderForm.addEventListener("submit", (e) =>
      orderService.submitOrder(e)
    );
  }

  // Initialize services
  modalService.initialize();
  await productsService.loadProducts();
  orderService.updateOrderSummary();
  orderService.renderOrderItems();
}

// Start the application
document.addEventListener("DOMContentLoaded", () => {
  authService.initializeAuthListener();
});
