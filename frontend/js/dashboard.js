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
// TOAST NOTIFICATION SERVICE
// ======================================
const toastService = {
  /**
   * Creates and shows a toast notification
   * @param {Object} options - Toast options
   * @param {string} options.message - The message to display
   * @param {string} [options.type='info'] - The type of notification (success, error, warning, info)
   * @param {number} [options.duration=5000] - Duration in milliseconds (0 = no auto-close)
   * @param {Object} [options.action] - Optional action button
   * @param {string} options.action.text - Action button text
   * @param {Function} options.action.onClick - Action button click handler
   * @returns {HTMLElement} The created toast element
   */
  createToast({ message, type = 'info', duration = 5000, action } = {}) {
    const container = document.getElementById('toastContainer');
    if (!container) {
      console.warn('Toast container not found');
      return null;
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';

    // Set toast content
    toast.innerHTML = `
      <i class="fas fa-${icon} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
        ${action ? `<button class="toast-action">${action.text}</button>` : ''}
      </div>
      <button class="toast-close">&times;</button>
    `;

    // Add to container
    container.appendChild(toast);

    // Show toast with a small delay to allow CSS transitions
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remove after duration
    let timeoutId;
    const removeToast = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode === container) {
          container.removeChild(toast);
        }
      }, 300);
    };

    // Set up close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(timeoutId);
      removeToast();
    });

    // Set up action button if provided
    if (action) {
      const actionBtn = toast.querySelector('.toast-action');
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick();
        removeToast();
      });
    }

    // Auto-remove if duration is greater than 0
    if (duration > 0) {
      timeoutId = setTimeout(removeToast, duration);
    }

    // Make toast clickable to dismiss
    toast.addEventListener('click', () => {
      clearTimeout(timeoutId);
      removeToast();
    });

    return toast;
  },

  /**
   * Shows a success toast
   * @param {string} message - The success message to display
   * @param {Object} [options] - Additional options
   * @returns {HTMLElement} The created toast element
   */
  success(message, options = {}) {
    return this.createToast({
      message,
      type: 'success',
      ...options
    });
  },

  /**
   * Shows an error toast
   * @param {string} message - The error message to display
   * @param {Object} [options] - Additional options
   * @returns {HTMLElement} The created toast element
   */
  error(message, options = {}) {
    return this.createToast({
      message,
      type: 'error',
      ...options
    });
  },

  /**
   * Shows a warning toast
   * @param {string} message - The warning message to display
   * @param {Object} [options] - Additional options
   * @returns {HTMLElement} The created toast element
   */
  warning(message, options = {}) {
    return this.createToast({
      message,
      type: 'warning',
      ...options
    });
  },

  /**
   * Shows an info toast
   * @param {string} message - The info message to display
   * @param {Object} [options] - Additional options
   * @returns {HTMLElement} The created toast element
   */
  info(message, options = {}) {
    return this.createToast({
      message,
      type: 'info',
      ...options
    });
  },
  
  /**
   * Legacy show method for backward compatibility
   * @param {string} message - The message to display
   * @param {string} type - The type of notification (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  show(message, type = 'info', duration = 5000) {
    return this.createToast({ message, type, duration });
  }
};

// ======================================
// UTILITY FUNCTIONS
// ======================================
const utils = {
  showMessage(message, type = "info") {
    // Use the new toast service for showing messages
    if (type === 'error') {
      toastService.error(message);
    } else if (type === 'warning') {
      toastService.warning(message);
    } else if (type === 'success') {
      toastService.success(message);
    } else {
      toastService.info(message);
    }
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
// ROLE-BASED NAVIGATION RESTRICTIONS
// ======================================
const roleService = {
  isBranchLink(href = '', text = '') {
    const re = /(managua|jinotepe|diriamba|masaya)\.html$/i;
    const t = (text || '').toLowerCase();
    return re.test(href) || ["managua", "jinotepe", "diriamba", "masaya"].some((b) => t.includes(b));
  },

  isDashboardLink(href = '', text = '') {
    const t = (text || '').toLowerCase();
    return href.includes('dashboard.html') || t.includes('dashboard');
  },

  disableLink(anchor) {
    if (!anchor) return;
    anchor.classList.add('disabled');
    anchor.setAttribute('aria-disabled', 'true');
    anchor.tabIndex = -1;
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toastService.info('Acceso restringido por rol');
    };
    // Avoid stacking multiple handlers if called again
    anchor.removeEventListener('click', handler);
    anchor.addEventListener('click', handler);
  },

  applyNavigationRules(role) {
    try {
      const links = document.querySelectorAll('.sidebar .nav-link');
      const path = (window.location.pathname.split('/').pop() || '').toLowerCase();

      links.forEach((a) => {
        const href = (a.getAttribute('href') || '').toLowerCase();
        const text = (a.textContent || '').trim();
        const isBranch = this.isBranchLink(href, text);
        const isDashboard = this.isDashboardLink(href, text);

        if (role === 'admin') {
          if (!isDashboard) this.disableLink(a);
        } else if (role === 'gerente') {
          if (!isBranch) this.disableLink(a);
        }
      });

      // Enforce redirects if landed on a disallowed page
      if (role === 'admin') {
        if (/(managua|jinotepe|diriamba|masaya)\.html$/i.test(path)) {
          window.location.href = 'dashboard.html';
        }
      } else if (role === 'gerente') {
        if (path === 'dashboard.html' || path === '') {
          window.location.href = 'managua.html';
        }
      }
    } catch (err) {
      console.warn('Error applying role navigation rules:', err);
    }
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
    // Apply role-based navigation restrictions
    roleService.applyNavigationRules(state.userData.rol);
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

// ======================================
// INBOX SERVICE
// ======================================
const inboxService = {
  STORAGE_KEY: 'dashboard_inbox_messages',
  
  /**
   * Get all messages from localStorage
   * @returns {Array} Array of messages
   */
  getMessages() {
    const messages = localStorage.getItem(this.STORAGE_KEY);
    return messages ? JSON.parse(messages) : [];
  },
  
  /**
   * Save messages to localStorage
   * @param {Array} messages - Array of messages to save
   */
  saveMessages(messages) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
  },
  
  /**
   * Add a new message to the inbox
   * @param {Object} message - The message to add
   * @param {string} message.title - The message title
   * @param {string} message.content - The message content
   * @param {string} message.type - The message type (info, success, warning, error)
   * @param {string} message.branch - The branch that sent the message
   * @param {string} message.orderId - The related order ID (optional)
   * @returns {Object} The created message with ID and timestamp
   */
  addMessage({ title, content, type = 'info', branch = '', orderId = '' }) {
    const messages = this.getMessages();
    const newMessage = {
      id: Date.now().toString(),
      title,
      content,
      type,
      branch,
      orderId,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    messages.unshift(newMessage);
    this.saveMessages(messages);
    this.updateUnreadCount();
    
    return newMessage;
  },
  
  /**
   * Mark a message as read
   * @param {string} messageId - The ID of the message to mark as read
   */
  markAsRead(messageId) {
    const messages = this.getMessages();
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    );
    
    this.saveMessages(updatedMessages);
    this.updateUnreadCount();
  },
  
  /**
   * Mark all messages as read
   */
  markAllAsRead() {
    const messages = this.getMessages().map(msg => ({ ...msg, read: true }));
    this.saveMessages(messages);
    this.updateUnreadCount();
  },
  
  /**
   * Delete a message
   * @param {string} messageId - The ID of the message to delete
   */
  deleteMessage(messageId) {
    const messages = this.getMessages().filter(msg => msg.id !== messageId);
    this.saveMessages(messages);
    this.updateUnreadCount();
  },
  
  /**
   * Delete all read messages
   */
  deleteAllRead() {
    const messages = this.getMessages().filter(msg => !msg.read);
    this.saveMessages(messages);
    this.updateUnreadCount();
  },
  
  /**
   * Update the unread count badge in the UI
   */
  updateUnreadCount() {
    const unreadCount = this.getMessages().filter(msg => !msg.read).length;
    const badge = document.getElementById('unreadCount');
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    return unreadCount;
  },
  
  /**
   * Render messages in the inbox
   * @param {string} filter - Filter messages by status (all, read, unread)
   */
  renderMessages(filter = 'all') {
    const container = document.getElementById('inboxMessages');
    if (!container) return;
    
    let messages = this.getMessages();
    
    // Apply filter
    if (filter === 'read') {
      messages = messages.filter(msg => msg.read);
    } else if (filter === 'unread') {
      messages = messages.filter(msg => !msg.read);
    }
    
    if (messages.length === 0) {
      container.innerHTML = `
        <div class="inbox-empty-state">
          <i class="fas fa-inbox"></i>
          <p>No hay mensajes en tu bandeja de entrada</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = messages.map(msg => `
      <div class="inbox-message ${msg.read ? '' : 'unread'}" data-id="${msg.id}">
        <div class="inbox-message-header">
          <h4 class="inbox-message-title">
            <i class="fas fa-${this.getMessageIcon(msg.type)}"></i>
            ${msg.title}
          </h4>
          <span class="inbox-message-time">${this.formatTime(msg.timestamp)}</span>
        </div>
        <div class="inbox-message-content">
          <p>${msg.content}</p>
          ${msg.branch ? `<p><strong>Sucursal:</strong> ${msg.branch}</p>` : ''}
          ${msg.orderId ? `<p><strong>Pedido #:</strong> ${msg.orderId}</p>` : ''}
          <div class="inbox-message-actions">
            <button class="btn btn-sm ${msg.read ? 'btn-outline-secondary' : 'btn-primary'} mark-read" 
                    data-id="${msg.id}">
              ${msg.read ? 'Marcar como no leído' : 'Marcar como leído'}
            </button>
            <button class="btn btn-sm btn-outline-danger delete-message" data-id="${msg.id}">
              <i class="fas fa-trash-alt"></i> Eliminar
            </button>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add event listeners
    this.setupMessageEventListeners();
  },
  
  /**
   * Set up event listeners for message actions
   */
  setupMessageEventListeners() {
    // Toggle message expansion
    document.querySelectorAll('.inbox-message-header').forEach(header => {
      header.addEventListener('click', (e) => {
        // Don't toggle if clicking on a button inside the header
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          return;
        }
        
        const message = header.closest('.inbox-message');
        message.classList.toggle('expanded');
        
        // Mark as read when expanded
        if (message.classList.contains('expanded') && !message.classList.contains('read')) {
          const messageId = message.dataset.id;
          this.markAsRead(messageId);
          message.classList.remove('unread');
        }
      });
    });
    
    // Mark as read/unread
    document.querySelectorAll('.mark-read').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const messageId = button.dataset.id;
        const message = document.querySelector(`.inbox-message[data-id="${messageId}"]`);
        
        if (message) {
          const isRead = message.classList.contains('read');
          this.markAsRead(messageId);
          
          if (isRead) {
            message.classList.add('unread');
            button.textContent = 'Marcar como leído';
            button.classList.remove('btn-outline-secondary');
            button.classList.add('btn-primary');
          } else {
            message.classList.remove('unread');
            button.textContent = 'Marcar como no leído';
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-secondary');
          }
        }
      });
    });
    
    // Delete message
    document.querySelectorAll('.delete-message').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const messageId = button.dataset.id;
        this.deleteMessage(messageId);
        document.querySelector(`.inbox-message[data-id="${messageId}"]`)?.remove();
        
        // If no messages left, show empty state
        if (!document.querySelector('.inbox-message')) {
          this.renderMessages();
        }
      });
    });
  },
  
  /**
   * Get the appropriate icon for the message type
   * @param {string} type - The message type
   * @returns {string} The icon class
   */
  getMessageIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    
    return icons[type] || 'envelope';
  },
  
  /**
   * Format a timestamp as a relative time string
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time string
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMins < 1) return 'Hace unos segundos';
    if (diffInMins < 60) return `Hace ${diffInMins} minuto${diffInMins > 1 ? 's' : ''}`;
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  /**
   * Initialize the inbox
   */
  init() {
    // Initialize unread count
    this.updateUnreadCount();
    
    // Set up inbox link
    const inboxLink = document.getElementById('inboxLink');
    if (inboxLink) {
      inboxLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openInbox();
      });
    }
    
    // Set up filter buttons
    document.querySelectorAll('[data-filter]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(btn => 
          btn.classList.remove('active')
        );
        button.classList.add('active');
        this.renderMessages(button.dataset.filter);
      });
    });
    
    // Set up mark all as read button
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        this.markAllAsRead();
        this.renderMessages();
      });
    }
    
    // Set up delete all read button
    const deleteAllReadBtn = document.getElementById('deleteAllRead');
    if (deleteAllReadBtn) {
      deleteAllReadBtn.addEventListener('click', () => {
        this.deleteAllRead();
        this.renderMessages();
      });
    }
    
    // Initialize Bootstrap modal
    this.inboxModal = new bootstrap.Modal(document.getElementById('inboxModal'));
  },
  
  /**
   * Open the inbox modal
   */
  openInbox() {
    this.renderMessages();
    this.inboxModal.show();
  }
};

// ======================================
// MESSAGE HANDLING FROM BRANCHES
// ======================================
function handleBranchMessages() {
  // Listen for messages from branches
  window.addEventListener('message', (event) => {
    // Verify the origin if needed for security
    // if (event.origin !== 'https://your-domain.com') return;
    
    const { data } = event;
    
    // Check if this is a completion message from a branch
    if (data && data.type === 'order_completed' && data.message) {
      const branchName = data.branch || 'sucursal';
      const orderId = data.orderId || '';
      
      // Add to inbox
      inboxService.addMessage({
        title: `Pedido Completado - ${branchName}`,
        content: data.message,
        type: 'success',
        branch: branchName,
        orderId: orderId
      });
      
      // Show toast notification with click handler to open inbox
      const toast = toastService.createToast({
        message: `Pedido completado en ${branchName}${orderId ? ` (${orderId})` : ''}`,
        type: 'success',
        duration: 5000,
        action: {
          text: 'Ver en bandeja',
          onClick: () => {
            inboxService.openInbox();
            // Auto-filter to show only unread messages
            setTimeout(() => {
              const unreadFilter = document.querySelector('[data-filter="unread"]');
              if (unreadFilter) unreadFilter.click();
            }, 100);
          }
        }
      });
      
      // Auto-open the inbox if it's not already open
      if (!document.querySelector('.modal.show')) {
        inboxService.openInbox();
        // Auto-filter to show only unread messages
        setTimeout(() => {
          const unreadFilter = document.querySelector('[data-filter="unread"]');
          if (unreadFilter) unreadFilter.click();
        }, 100);
      }
      
      // If there's a refresh function, call it to update the UI
      if (typeof window.refreshOrders === 'function') {
        window.refreshOrders();
      }
    }
  });
}

// Start the application
document.addEventListener("DOMContentLoaded", () => {
  authService.initializeAuthListener();
  handleBranchMessages();
  
  // Initialize inbox after auth is ready
  const checkAuth = setInterval(() => {
    if (state.currentUser) {
      clearInterval(checkAuth);
      inboxService.init();
    }
  }, 100);
});
