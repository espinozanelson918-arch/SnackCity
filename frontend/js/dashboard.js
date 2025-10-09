// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
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
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUcDxszHV4bVvnYBQT7OmOb3I0cnUwdpA",
  authDomain: "snackcity-2f551.firebaseapp.com",
  projectId: "snackcity-2f551",
  storageBucket: "snackcity-2f551.firebasestorage.app",
  messagingSenderId: "625609791401",
  appId: "1:625609791401:web:bd2d77452aee0f09ca56b8",
  measurementId: "G-G31FZ0EPKB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const toggleSidebar = document.querySelector('.toggle-sidebar');
const productTable = document.querySelector('#productTable tbody');
const addProductBtn = document.getElementById('addProductBtn');
const confirmAddProduct = document.getElementById('confirmAddProduct');
const productSelect = document.getElementById('productSelect');
const productQuantity = document.getElementById('productQuantity');
const productPrice = document.getElementById('productPrice');
const orderForm = document.getElementById('orderForm');
const logoutBtn = document.querySelector('.logout-btn');

// State
let products = [];
let currentOrder = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0
};

// Toggle Sidebar
toggleSidebar?.addEventListener('click', () => {
  sidebar.classList.toggle('show');
  document.body.classList.toggle('sidebar-visible');
});

// Logout
logoutBtn?.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    await signOut(auth);
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Error signing out:', error);
  }
});

// Load Products
async function loadProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Populate product select
    if (productSelect) {
      productSelect.innerHTML = `
        <option value="" disabled selected>Seleccione un producto</option>
        ${products.map(product => `
          <option value="${product.id}" data-price="${product.price}">
            ${product.name} - ${product.code}
          </option>
        `).join('')}
      `;
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Add Product to Order
function addProductToOrder() {
  const productId = productSelect.value;
  const product = products.find(p => p.id === productId);
  const quantity = parseInt(productQuantity.value) || 1;
  const price = parseFloat(productPrice.value) || parseFloat(productSelect.options[productSelect.selectedIndex].dataset.price);
  
  if (!product || !quantity || !price) return;
  
  const item = {
    id: productId,
    name: product.name,
    code: product.code,
    quantity,
    price,
    total: quantity * price
  };
  
  // Check if product already exists in order
  const existingItemIndex = currentOrder.items.findIndex(item => item.id === productId);
  
  if (existingItemIndex > -1) {
    // Update existing item
    currentOrder.items[existingItemIndex].quantity += quantity;
    currentOrder.items[existingItemIndex].total = currentOrder.items[existingItemIndex].quantity * price;
  } else {
    // Add new item
    currentOrder.items.push(item);
  }
  
  updateOrderSummary();
  renderOrderItems();
  
  // Reset form
  productSelect.value = '';
  productQuantity.value = '1';
  productPrice.value = '';
}

// Update Order Summary
function updateOrderSummary() {
  currentOrder.subtotal = currentOrder.items.reduce((sum, item) => sum + item.total, 0);
  currentOrder.tax = currentOrder.subtotal * 0.16; // 16% IVA
  currentOrder.total = currentOrder.subtotal + currentOrder.tax;
  
  // Update UI
  const subtotalElement = document.getElementById('subtotal');
  const taxElement = document.getElementById('tax');
  const totalElement = document.getElementById('total');
  
  if (subtotalElement) subtotalElement.textContent = `$${currentOrder.subtotal.toFixed(2)}`;
  if (taxElement) taxElement.textContent = `$${currentOrder.tax.toFixed(2)}`;
  if (totalElement) totalElement.textContent = `$${currentOrder.total.toFixed(2)}`;
}

// Render Order Items
function renderOrderItems() {
  if (!productTable) return;
  
  productTable.innerHTML = currentOrder.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.code}</td>
      <td class="text-end">${item.quantity}</td>
      <td class="text-end">$${item.price.toFixed(2)}</td>
      <td class="text-end">$${item.total.toFixed(2)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const productId = e.currentTarget.dataset.id;
      currentOrder.items = currentOrder.items.filter(item => item.id !== productId);
      updateOrderSummary();
      renderOrderItems();
    });
  });
}

// Handle Form Submission
async function handleSubmit(e) {
  e.preventDefault();
  
  if (currentOrder.items.length === 0) {
    alert('Por favor, agregue al menos un producto al pedido.');
    return;
  }
  
  const orderData = {
    branch: document.getElementById('branch').value,
    deliveryDate: document.getElementById('deliveryDate').value,
    notes: document.getElementById('notes').value,
    items: currentOrder.items,
    subtotal: currentOrder.subtotal,
    tax: currentOrder.tax,
    total: currentOrder.total,
    status: 'pending',
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid || 'anonymous',
    createdByName: auth.currentUser?.displayName || 'Usuario'
  };
  
  try {
    // Add order to Firestore
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    console.log('Order created with ID: ', docRef.id);
    
    // Reset form and order
    orderForm.reset();
    currentOrder = { items: [], subtotal: 0, tax: 0, total: 0 };
    updateOrderSummary();
    renderOrderItems();
    
    // Show success message
    alert('¡Pedido creado exitosamente!');
    
  } catch (error) {
    console.error('Error creating order: ', error);
    alert('Error al crear el pedido. Por favor, intente nuevamente.');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize
  loadProducts();
  
  // Add product to order
  if (confirmAddProduct) {
    confirmAddProduct.addEventListener('click', addProductToOrder);
  }
  
  // Auto-fill price when product is selected
  if (productSelect) {
    productSelect.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      if (selectedOption && selectedOption.dataset.price) {
        productPrice.value = parseFloat(selectedOption.dataset.price).toFixed(2);
      }
    });
  }
  
  // Form submission
  if (orderForm) {
    orderForm.addEventListener('submit', handleSubmit);
  }
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const deliveryDate = document.getElementById('deliveryDate');
  if (deliveryDate) {
    deliveryDate.min = today;
  }
});
// User authentication state handling
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../index.html";
    return;
  }
  
  try {
    // Update UI with user info
    const userNameElement = document.getElementById("userName");
    const userRoleElement = document.getElementById("userRole");
    
    if (userNameElement || userRoleElement) {
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check admin role
        if (userData.rol !== "admin") {
          alert("No tienes permisos de administrador");
          await signOut(auth);
          window.location.href = "../index.html";
          return;
        }
        
        // Update UI
        if (userNameElement) {
          userNameElement.textContent = userData.nombre || user.email || 'Usuario';
        }
        if (userRoleElement) {
          userRoleElement.textContent = 'Administrador';
        }
      } else {
        // User document doesn't exist
        await signOut(auth);
        window.location.href = "../index.html";
      }
    }
  } catch (error) {
    console.error("Error checking user role:", error);
    await signOut(auth);
    window.location.href = "../index.html";
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Funcionalidad del modal de pedidos
document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const modal = document.getElementById("orderModal");
  const openModalBtn = document.getElementById("openOrderModal");
  const closeBtn = document.querySelector(".close");
  const cancelBtn = document.getElementById("cancelOrder");
  const addProductBtn = document.getElementById("addProduct");
  const productsList = document.getElementById("productsList");
  const orderForm = document.getElementById("orderForm");
  
  // Lista de productos disponibles (se podría cargar desde una API)
  const availableProducts = [
    { id: '1', nombre: 'Refresco', precio: 25 },
    { id: '2', nombre: 'Agua', precio: 15 },
    { id: '3', nombre: 'Jugo', precio: 20 },
    { id: '4', nombre: 'Bebida Energética', precio: 30 }
  ];
  
  // Abrir modal
  const openModal = () => {
    modal.style.display = 'block';
    // Limpiar el formulario al abrir
    orderForm.reset();
    productsList.innerHTML = '';
    // Agregar un producto por defecto
    addProductRow();
  };
  
  // Cerrar modal
  const closeModal = () => {
    modal.style.display = 'none';
  };
  
  // Agregar una nueva fila de producto
  const addProductRow = () => {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-item';
    
    // Crear el HTML para la fila de producto
    productDiv.innerHTML = `
      <div style="flex-grow: 1;">
        <select class="form-control product-select" required>
          <option value="">Seleccione un producto</option>
          ${availableProducts.map(product => 
            `<option value="${product.id}" data-price="${product.precio}">
              ${product.nombre} - $${product.precio}
            </option>`
          ).join('')}
        </select>
        <input type="number" class="form-control quantity" placeholder="Cantidad" min="1" value="1" required>
      </div>
      <button type="button" class="remove-product" style="margin-left: 10px; color: #e60012; background: none; border: none; cursor: pointer;">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    // Agregar la fila a la lista de productos
    productsList.appendChild(productDiv);
    
    // Agregar manejador de evento para el botón de eliminar
    const removeBtn = productDiv.querySelector('.remove-product');
    removeBtn.addEventListener('click', () => {
      // No permitir eliminar si solo queda un producto
      if (productsList.children.length > 1) {
        productsList.removeChild(productDiv);
      } else {
        alert('Debe haber al menos un producto en el pedido');
      }
    });
    
    // Agregar manejador para actualizar el total cuando cambia la cantidad o el producto
    const quantityInput = productDiv.querySelector('.quantity');
    const productSelect = productDiv.querySelector('.product-select');
    
    const updateTotal = () => {
      // Aquí podrías actualizar el total si lo deseas
    };
    
    quantityInput.addEventListener('change', updateTotal);
    productSelect.addEventListener('change', updateTotal);
  };
  
  // Manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que se haya seleccionado una sucursal
    const branchSelect = document.getElementById('branch');
    if (!branchSelect.value) {
      alert('Por favor seleccione una sucursal');
      return;
    }
    
    // Validar que haya al menos un producto
    const productItems = productsList.querySelectorAll('.product-item');
    if (productItems.length === 0) {
      alert('Por favor agregue al menos un producto');
      return;
    }
    
    // Recolectar datos del formulario
    const orderData = {
      branch: branchSelect.value,
      deliveryDate: document.getElementById('deliveryDate').value,
      products: [],
      total: 0
    };
    
    // Procesar cada producto
    let isValid = true;
    productItems.forEach(item => {
      const productSelect = item.querySelector('.product-select');
      const quantityInput = item.querySelector('.quantity');
      
      if (!productSelect.value || !quantityInput.value || parseInt(quantityInput.value) < 1) {
        isValid = false;
        return;
      }
      
      const product = availableProducts.find(p => p.id === productSelect.value);
      if (product) {
        const quantity = parseInt(quantityInput.value);
        const subtotal = product.precio * quantity;
        
        orderData.products.push({
          id: product.id,
          nombre: product.nombre,
          precio: product.precio,
          cantidad: quantity,
          subtotal: subtotal
        });
        
        orderData.total += subtotal;
      }
    });
    
    if (!isValid) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }
    
    if (orderData.products.length === 0) {
      alert('No se han seleccionado productos válidos');
      return;
    }
    
    // Aquí iría la lógica para guardar el pedido en la base de datos
    console.log('Datos del pedido:', orderData);
    
    // Mostrar mensaje de éxito y cerrar el modal
    alert('Pedido guardado exitosamente');
    closeModal();
  };
  
  // Event Listeners
  openModalBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  addProductBtn.addEventListener('click', addProductRow);
  orderForm.addEventListener('submit', handleSubmit);
  
  // Cerrar el modal al hacer clic fuera del contenido
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
});

// Funcionalidad del formulario de pedidos (existente)
document.addEventListener("DOMContentLoaded", () => {
  const orderModal = document.getElementById("orderModal");
  const newOrderBtn = document.getElementById("newOrderBtn");
  const closeBtn = document.querySelector(".close");
  const cancelBtn = document.querySelector(".btn-cancel");
  const orderForm = document.getElementById("orderForm");
  const addProductBtn = document.getElementById("addProductBtn");
  const productsList = document.getElementById("productsList");
  const branchSelect = document.getElementById("branch");

  let products = [];

  // Cargar productos desde Firebase
  const loadProducts = async () => {
    try {
      const productsRef = collection(db, "productos");
      const querySnapshot = await getDocs(productsRef);
      products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
    } catch (error) {
      console.error("Error cargando productos:", error);
      alert("Error al cargar los productos");
    }
  };

  // Mostrar modal
  const openModal = async () => {
    await loadProducts();
    orderModal.style.display = "flex";
    orderForm.reset();
    productsList.innerHTML = "";
    addProductRow(); // Agregar primera fila de producto
  };

  // Cerrar modal
  const closeModal = () => {
    orderModal.style.display = "none";
  };

  // Agregar nueva fila de producto
  const addProductRow = () => {
    if (products.length === 0) {
      alert("No hay productos disponibles");
      return;
    }

    const productRow = document.createElement("div");
    productRow.className = "product-item";

    // Selector de producto
    const productSelect = document.createElement("select");
    productSelect.className = "form-control product-select";
    productSelect.required = true;

    // Agregar opción por defecto
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Seleccione un producto";
    productSelect.appendChild(defaultOption);

    // Agregar productos al selector
    products.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = `${product.nombre} - $${product.precio}`;
      option.dataset.price = product.precio;
      productSelect.appendChild(option);
    });

    // Input de cantidad
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.value = "1";
    quantityInput.className = "form-control quantity";
    quantityInput.required = true;
    quantityInput.style.width = "80px";

    // Botón para eliminar producto
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-danger";
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.onclick = () => productRow.remove();

    // Agregar elementos al contenedor
    productRow.appendChild(productSelect);
    productRow.appendChild(quantityInput);
    productRow.appendChild(removeBtn);

    productsList.appendChild(productRow);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    const branch = branchSelect.value;
    const productItems = [];
    let total = 0;

    // Validar que se haya seleccionado una sucursal
    if (!branch) {
      alert("Por favor seleccione una sucursal");
      return;
    }

    // Recopilar productos seleccionados
    const productRows = productsList.querySelectorAll(".product-item");
    if (productRows.length === 0) {
      alert("Por favor agregue al menos un producto");
      return;
    }

    for (const row of productRows) {
      const productSelect = row.querySelector(".product-select");
      const quantityInput = row.querySelector(".quantity");

      if (productSelect.value && quantityInput.value > 0) {
        const productId = productSelect.value;
        const product = products.find((p) => p.id === productId);
        const quantity = parseInt(quantityInput.value);
        const subtotal = product.precio * quantity;

        productItems.push({
          id: productId,
          nombre: product.nombre,
          precio: product.precio,
          cantidad: quantity,
          subtotal: subtotal,
        });

        total += subtotal;
      }
    }

    if (productItems.length === 0) {
      alert("Por favor seleccione al menos un producto válido");
      return;
    }

    try {
      // Guardar pedido en Firebase
      const orderData = {
        sucursal: branch,
        productos: productItems,
        total: total,
        fecha: serverTimestamp(),
        estado: "pendiente",
        usuario: auth.currentUser.uid,
      };

      const docRef = await addDoc(collection(db, "pedidos"), orderData);
      alert(`Pedido creado exitosamente con ID: ${docRef.id}`);
      closeModal();
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      alert("Error al crear el pedido");
    }
  };

  // Event Listeners
  newOrderBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  addProductBtn.addEventListener("click", addProductRow);
  orderForm.addEventListener("submit", handleSubmit);

  // Cerrar modal al hacer clic fuera del contenido
  window.addEventListener("click", (e) => {
    if (e.target === orderModal) {
      closeModal();
    }
  });
});
