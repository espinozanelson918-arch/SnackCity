import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 🔧 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAUcDxszHV4bVvnYBQT7OmOb3I0cnUwdpA",
  authDomain: "snackcity-2f551.firebaseapp.com",
  projectId: "snackcity-2f551",
  storageBucket: "snackcity-2f551.firebasestorage.app",
  messagingSenderId: "625609791401",
  appId: "1:625609791401:web:bd2d77452aee0f09ca56b8",
  measurementId: "G-G31FZ0EPKB",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const logoutBtn = document.getElementById("logout");
const userName = document.getElementById("userName");

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");

  const docRef = doc(db, "usuarios", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists() || docSnap.data().rol !== "admin") {
    alert("No tienes permisos de administrador");
    await signOut(auth);
    return (window.location.href = "index.html");
  }

  userName.textContent = docSnap.data().nombre;
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
