// Function to normalize branch names for comparison
function normalizeBranchName(name) {
  if (!name) return "";
  return name.toString().toLowerCase().trim();
}

// Function to load orders from localStorage
function loadOrders(branchName) {
  // Get orders from localStorage or initialize empty array
  let orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Normalize the current branch name for comparison
  const normalizedBranchName = normalizeBranchName(branchName);

  console.log(
    `Loading orders for branch: ${branchName} (normalized: ${normalizedBranchName})`
  );
  console.log(
    "All orders in localStorage:",
    JSON.parse(JSON.stringify(orders))
  );

  // Filter orders for the current branch that are pending
  const branchOrders = orders.filter((order) => {
    // Skip if order doesn't have a branch
    if (!order.branch) {
      console.log("Skipping order - no branch:", order);
      return false;
    }

    // Normalize the order's branch name
    const orderBranch = normalizeBranchName(order.branch);

    // Check if the order belongs to this branch and is pending
    const isMatch =
      orderBranch === normalizedBranchName &&
      (order.status === "pending" || order.status === undefined);

    if (isMatch) {
      console.log(`Matched order for ${branchName}:`, order);
    } else {
      console.log(
        `Skipping order - branch: ${order.branch} (${orderBranch}), status: ${order.status}`
      );
    }

    return isMatch;
  });

  console.log(
    `Found ${branchOrders.length} orders for branch: ${branchName}`,
    branchOrders
  );

  // Update the orders table
  updateOrdersTable(branchOrders);

  // Update the pending orders count
  updatePendingOrdersCount(branchOrders.length);

  return branchOrders;
}

// Function to update pending orders count in the dashboard
function updatePendingOrdersCount(count) {
  const pendingElement = document.querySelector(
    ".stat-card:nth-child(3) .stat-value"
  );
  if (pendingElement) {
    pendingElement.textContent = count;
  }
}

// Function to update the orders table
function updateOrdersTable(orders) {
  const tbody = document.querySelector(".data-table tbody");
  let noOrdersRow = document.getElementById("no-orders");

  if (!tbody) {
    console.warn("No se encontró el elemento tbody en la tabla de pedidos");
    return;
  }

  // Clear existing rows
  tbody.innerHTML = "";

  if (!orders || orders.length === 0) {
    // Create or show the no-orders row
    if (!noOrdersRow) {
      noOrdersRow = document.createElement("tr");
      noOrdersRow.id = "no-orders";
      noOrdersRow.innerHTML =
        '<td colspan="6" class="text-center">No hay pedidos pendientes</td>';
    } else {
      noOrdersRow.style.display = "";
    }
    tbody.appendChild(noOrdersRow);
    return;
  }

  // Hide the no-orders row if it exists
  if (noOrdersRow) {
    noOrdersRow.style.display = "none";
  }

  // Update table headers if they don't match our new format
  const thead = document.querySelector(".data-table thead");
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th># Orden</th>
        <th>Fecha de Entrega</th>
        <th>Productos</th>
        <th>Notas</th>
        <th>Total</th>
        <th>Estado</th>
        <th>Acción</th>
      </tr>
    `;
  }

  // Add each order to the table
  orders.forEach((order) => {
    const row = document.createElement("tr");

    // Safely calculate total products and get product names from items array
    let totalProducts = 0;
    let productsList = [];
    let itemsArray = [];

    try {
      // First try to get items from order.items, fallback to order.products
      const itemsSource = order.items || order.products || [];

      if (Array.isArray(itemsSource)) {
        itemsArray = itemsSource;
      } else if (typeof itemsSource === "object") {
        itemsArray = Object.values(itemsSource);
      }

      // Process items
      productsList = itemsArray
        .map((item) => {
          if (!item) return null;
          const quantity =
            typeof item.quantity === "number" ? item.quantity : 0;
          const name = item.name || item.productName || "Producto sin nombre";
          totalProducts += quantity;
          return `${quantity}x ${name}`;
        })
        .filter(Boolean); // Remove any null entries
    } catch (e) {
      console.error("Error processing products:", e, order);
      productsList = ["Error al cargar productos"];
    }

    // Format delivery date
    let deliveryDate = "No especificada";
    try {
      const dateValue =
        order.deliveryDate || order.fechaDeEntrega || order.delivery_date;
      if (dateValue) {
        // Handle YYYY-MM-DD format specifically
        const [year, month, day] = dateValue.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        if (!isNaN(date.getTime())) {
          const options = {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          };

          // Format the date in Spanish
          const formatter = new Intl.DateTimeFormat("es-NI", options);
          deliveryDate = formatter.format(date);

          // Capitalize the first letter of the weekday and month
          deliveryDate = deliveryDate
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          // Remove any leading zeros from the day
          deliveryDate = deliveryDate.replace(/(\d+)/, (_, p1) =>
            parseInt(p1, 10)
          );
        }
      }
    } catch (e) {
      console.error("Error formateando la fecha de entrega:", e);
    }

    // Format order date
    let orderDate = "Fecha no disponible";
    try {
      if (order.timestamp) {
        const date = new Date(order.timestamp);
        if (!isNaN(date.getTime())) {
          orderDate = date.toLocaleDateString("es-NI", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }
    } catch (e) {
      console.error("Error formatting order date:", e);
    }

    // Format the order ID
    const orderId = order.id
      ? `#${order.id.toString().replace(/^#/, "")}`
      : "#N/A";

    // Format notes
    const notes = order.notes || order.notas || "";
    const truncatedNotes =
      notes.length > 50 ? notes.substring(0, 50) + "..." : notes;

    // Format total amount safely
    let totalAmount = "N/A";
    try {
      totalAmount =
        typeof order.total === "number"
          ? `C$${order.total.toFixed(2)}`
          : order.total
          ? `C$${parseFloat(order.total).toFixed(2)}`
          : "N/A";
    } catch (e) {
      console.error("Error formateando el total del pedido:", e);
      totalAmount = "N/A";
    }

    // Determine status
    const isPending = order.status === "pending" || order.status === undefined;
    const isDenied = order.status === "denied";
    const statusText = isPending ? "Pendiente" : isDenied ? "Denegado" : "Completado";

    // Create the row HTML
    row.innerHTML = `
      <td>${orderId}</td>
      <td>
        <div class="delivery-date">
          <i class="far fa-calendar-alt"></i>
          <span>${deliveryDate}</span>
        </div>
        <small class="text-muted">${orderDate}</small>
      </td>
      <td>
        <div class="products-list">
          ${
            productsList.length > 0
              ? `<span>${productsList.join("<br>")}</span>`
              : "Sin productos"
          }
        </div>
        <small class="text-muted">${totalProducts} ${
      totalProducts === 1 ? "artículo" : "artículos"
    }</small>
      </td>
      <td>
        ${
          notes
            ? `
          <div class="notes-cell" title="${notes}">
            <i class="far fa-sticky-note text-muted me-1"></i>
            ${truncatedNotes}
          </div>
        `
            : '<span class="text-muted">Sin notas</span>'
        }
      </td>
      <td class="text-nowrap">${totalAmount}</td>
      <td>
        <span class="status-badge ${
          isPending ? "status-pending" : isDenied ? "status-denied" : "status-completed"
        }">
          ${statusText}
        </span>
      </td>
      <td class="text-nowrap">
        <button class="btn btn-sm ${
          isPending ? "btn-outline-primary" : "btn-outline-secondary"
        }" 
                data-order-id="${order.id}" 
                ${!isPending ? "disabled" : ""}
                onclick="completeOrder('${order.id}')">
          ${isPending ? "Completar" : "Completado"}
        </button>
        <button class="btn btn-sm btn-outline-danger"
                data-order-id="${order.id}"
                ${!isPending ? "disabled" : ""}
                onclick="denyOrder('${order.id}')">
          Denegar
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Add event listeners to the complete buttons
  document.querySelectorAll(".complete-order").forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.getAttribute("data-order-id");
      completeOrder(orderId);
    });
  });
}

// Function to complete an order
function completeOrder(orderId) {
  // Get all orders from localStorage
  let orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Find the order to complete
  const orderIndex = orders.findIndex((order) => order.id === orderId);

  if (orderIndex !== -1) {
    // Get the branch of the order being completed
    const orderBranch = orders[orderIndex].branch;

    // Update order status
    orders[orderIndex].status = "completed";
    orders[orderIndex].completedAt = new Date().toISOString();

    // Save back to localStorage
    localStorage.setItem("orders", JSON.stringify(orders));

    // Show success message with branch info
    showToast(`Pedido #${orderId} de ${orderBranch} completado exitosamente`);

    // Reload the orders to update the table
    const currentBranch = document
      .querySelector(".top-nav h1")
      .textContent.trim();
    loadOrders(currentBranch);

    // Update dashboard stats
    updateDashboardStats();
  }
}

// Function to deny an order
function denyOrder(orderId) {
  // Get all orders from localStorage
  let orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Find the order to deny
  const orderIndex = orders.findIndex((order) => order.id === orderId);

  if (orderIndex !== -1) {
    // Get the branch of the order being denied
    const orderBranch = orders[orderIndex].branch;

    // Update order status
    orders[orderIndex].status = "denied";
    orders[orderIndex].deniedAt = new Date().toISOString();

    // Save back to localStorage
    localStorage.setItem("orders", JSON.stringify(orders));

    // Show info message with branch info
    showToast(`Pedido #${orderId} de ${orderBranch} fue denegado`);

    // Reload the orders to update the table
    const currentBranch = document
      .querySelector(".top-nav h1")
      .textContent.trim();
    loadOrders(currentBranch);

    // Update dashboard stats
    updateDashboardStats();
  }
}

// Function to show toast notification
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast show";
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Function to update dashboard statistics
function updateDashboardStats() {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const currentBranch = document
    .querySelector(".top-nav h1")
    .textContent.trim();

  // Filter orders for the current branch
  const branchOrders = orders.filter(
    (order) => order.branch.toLowerCase() === currentBranch.toLowerCase()
  );

  // Calculate completed orders
  const completedOrders = branchOrders.filter(
    (order) => order.status === "completed"
  ).length;

  // Update the UI
  const completedElement = document.querySelector(
    ".stat-card:nth-child(2) .stat-value"
  );
  if (completedElement) {
    completedElement.textContent = completedOrders;
  }
}

// Function to get current branch name from URL, page header, or localStorage
function getCurrentBranch() {
  console.log("Determining current branch...");

  // Map of URL segments to branch names with variations
  const branchMap = {
    // Jinotepe variations
    jinotepe: "Jinotepe",
    "sucursal jinotepe": "Jinotepe",
    "sucursal-jinotepe": "Jinotepe",
    sucursal_jinotepe: "Jinotepe",
    sucursaljinotepe: "Jinotepe",

    // Diriamba variations
    diriamba: "Diriamba",
    "sucursal diriamba": "Diriamba",
    "sucursal-diriamba": "Diriamba",
    sucursal_diriamba: "Diriamba",
    sucursaldiriamba: "Diriamba",

    // Masaya variations
    masaya: "Masaya",
    "sucursal masaya": "Masaya",
    "sucursal-masaya": "Masaya",
    sucursal_masaya: "Masaya",
    sucursalmasaya: "Masaya",

    // Masatepe variations
    masatepe: "Masatepe",
    "sucursal masatepe": "Masatepe",
    "sucursal-masatepe": "Masatepe",
    sucursal_masatepe: "Masatepe",
    sucursalmasatepe: "Masatepe",

    // Managua variations
    managua: "Managua",
    "sucursal managua": "Managua",
    "sucursal-managua": "Managua",
    sucursal_managua: "Managua",
    sucursalmanagua: "Managua",
  };

  // 1. Try to get from URL first
  const url = window.location.href.toLowerCase();
  console.log("Current URL:", url);

  for (const [key, value] of Object.entries(branchMap)) {
    if (url.includes(key)) {
      console.log(`Found branch in URL: ${key} -> ${value}`);
      return value;
    }
  }

  // 2. Try to get from page header
  const headerElement = document.querySelector(".top-nav h1");
  if (headerElement) {
    const headerText = headerElement.textContent.trim();
    console.log("Header text:", headerText);

    // Check for exact matches first
    for (const [key, value] of Object.entries(branchMap)) {
      if (
        normalizeBranchName(headerText) === normalizeBranchName(value) ||
        normalizeBranchName(headerText).includes(normalizeBranchName(key))
      ) {
        console.log(`Matched branch in header: ${headerText} -> ${value}`);
        return value;
      }
    }

    // If no exact match, try partial matches
    const normalizedHeader = normalizeBranchName(headerText);
    for (const [key, value] of Object.entries(branchMap)) {
      if (normalizedHeader.includes(normalizeBranchName(key))) {
        console.log(
          `Matched branch in header (partial): ${headerText} -> ${value}`
        );
        return value;
      }
    }

    console.log("No branch match found in header, using header text as is");
    return headerText;
  }

  // 3. Try to get from localStorage as last resort
  try {
    const lastBranch = localStorage.getItem("lastVisitedBranch");
    if (lastBranch) {
      console.log(`Using last visited branch from localStorage: ${lastBranch}`);
      return lastBranch;
    }
  } catch (e) {
    console.error("Error accessing localStorage:", e);
  }

  // 4. Default fallback
  console.warn("Could not determine branch, using default: Jinotepe");
  return "Jinotepe";
}

// Initialize the page when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get the current branch name
  const branchName = getCurrentBranch();

  // Update page title to include branch name
  document.title = `${branchName} - Panel de Control`;

  // Update the branch name in the header if it exists
  const branchHeader = document.querySelector(".top-nav h1");
  if (branchHeader) {
    branchHeader.textContent = branchName;
  }

  // Load orders for this branch
  loadOrders(branchName);

  // Update dashboard stats
  updateDashboardStats();

  // Add event listener for the "Ver todo" button
  const viewAllButton = document.querySelector(".card-header .btn-link");
  if (viewAllButton) {
    viewAllButton.addEventListener("click", (e) => {
      e.preventDefault();
      // Here you can implement viewing all orders if needed
      showToast(`Mostrando todos los pedidos de ${branchName}`);
    });
  }

  // Initialize Quick Action: Nueva Orden modal
  try {
    setupQuickActionNewOrder(branchName);
  } catch (e) {
    console.error("Error setting up Nueva Orden modal:", e);
  }

  try {
    setupBranchReportsView(branchName);
  } catch (e) {
    console.error("Error setting up Reports view:", e);
  }
});

// Create and handle the Nueva Orden modal for branch pages
function setupQuickActionNewOrder(branchName) {
  // Default products list (similar to dashboard)
  const defaultProducts = [
    { id: "prod1", nombre: "Coca-Cola Original", codigo: "COLA-001", precio: 12.5 },
    { id: "prod2", nombre: "Coca-Cola Zero", codigo: "COLA-002", precio: 12.5 },
    { id: "prod3", nombre: "Coca-Cola Light", codigo: "COLA-003", precio: 12.5 },
    { id: "prod4", nombre: "Fanta", codigo: "FANTA-001", precio: 12.5 },
    { id: "prod5", nombre: "Sprite", codigo: "SPRITE-001", precio: 12.5 },
  ];
  // Find all "Nueva Orden" quick action buttons (some pages pueden tener más de uno)
  let newOrderBtns = Array.from(document.querySelectorAll(".quick-actions .btn-action"))
    .filter((btn) => (btn.textContent || "").toLowerCase().includes("nueva orden"));
  // Include explicit ID if provided in HTML
  const idBtn = document.getElementById("newOrderBtn");
  if (idBtn && !newOrderBtns.includes(idBtn)) newOrderBtns.push(idBtn);
  console.log("setupQuickActionNewOrder: botones detectados:", newOrderBtns.map(b => ({ id: b.id, text: (b.textContent||'').trim() })));
  if (!newOrderBtns.length) {
    // Retry shortly in case content renders later
    setTimeout(() => setupQuickActionNewOrder(branchName), 100);
    return;
  }

  // Ensure modal exists once
  let modal = document.getElementById("branchNewOrderModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "branchNewOrderModal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Nuevo Pedido - ${branchName}</h3>
            <button type="button" class="btn-close" aria-label="Cerrar">&times;</button>
          </div>
          <div class="modal-body">
            <form id="branchNewOrderForm" class="order-form">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="modalDeliveryDate" class="form-label">
                      <i class="far fa-calendar-alt"></i> Fecha Límite de Entrega
                    </label>
                    <input type="date" id="modalDeliveryDate" class="form-control" required />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">
                      <i class="fas fa-store"></i> Sucursal
                    </label>
                    <input type="text" class="form-control" value="${branchName}" disabled />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="modalNotes" class="form-label">
                  <i class="far fa-sticky-note"></i> Notas (Opcional)
                </label>
                <textarea id="modalNotes" class="form-control" rows="2" placeholder="Observaciones adicionales"></textarea>
              </div>

              <div class="products-section">
                <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <h4 style="margin:0;font-size:1rem;">Productos</h4>
                  <button type="button" class="btn btn-sm btn-outline" id="modalAddProductRow">
                    <i class="fas fa-plus"></i> Agregar Producto
                  </button>
                </div>
                <div class="table-responsive">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style="width:110px;">Cantidad</th>
                        <th style="width:150px;">Precio Unitario</th>
                        <th style="width:140px;">Subtotal</th>
                        <th style="width:90px;">Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="modalProductsTableBody"></tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" class="text-right"><strong>Total:</strong></td>
                        <td><span id="modalOrderTotal">C$0.00</span></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="modalCancelBtn">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save"></i> Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    // Close handlers
    const closeBtn = modal.querySelector(".btn-close");
    closeBtn.addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });

    // Wire dynamic products table logic
    const tbody = modal.querySelector('#modalProductsTableBody');
    const totalEl = modal.querySelector('#modalOrderTotal');
    const addRowBtn = modal.querySelector('#modalAddProductRow');

    const formatCurrency = (n) => {
      const val = isNaN(n) ? 0 : Number(n);
      return `C$${val.toFixed(2)}`;
    };

    const recalcTotals = () => {
      let total = 0;
      tbody.querySelectorAll('tr').forEach((tr) => {
        const qty = Number(tr.querySelector('.prod-qty')?.value || 0);
        const price = Number(tr.querySelector('.prod-price')?.value || 0);
        const sub = qty * price;
        tr.querySelector('.prod-subtotal').textContent = formatCurrency(sub);
        total += sub;
      });
      totalEl.textContent = formatCurrency(total);
    };

    const addRow = (prefill = { productId: '', qty: 1, price: null }) => {
      const tr = document.createElement('tr');
      const options = [`<option value="" disabled ${!prefill.productId ? 'selected' : ''}>Seleccione un producto</option>`]
        .concat(
          defaultProducts.map(p => `
            <option value="${p.id}" data-price="${p.precio}" data-name="${p.nombre}" data-code="${p.codigo}" ${prefill.productId===p.id?'selected':''}>
              ${p.nombre} - ${p.codigo} (C$${Number(p.precio).toFixed(2)})
            </option>
          `)
        )
        .join('');

      tr.innerHTML = `
        <td>
          <select class="form-control prod-select">${options}</select>
        </td>
        <td><input type="number" class="form-control prod-qty" min="1" value="${prefill.qty}"></td>
        <td><input type="number" class="form-control prod-price" step="0.01" min="0" value="${prefill.price ?? ''}" placeholder="0.00"></td>
        <td class="prod-subtotal">C$0.00</td>
        <td><button type="button" class="btn btn-sm btn-outline-danger prod-remove"><i class="fas fa-trash"></i></button></td>
      `;
      tbody.appendChild(tr);
      // Auto-fill price when selecting a product
      const sel = tr.querySelector('.prod-select');
      const priceInput = tr.querySelector('.prod-price');
      sel.addEventListener('change', (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        const price = opt?.dataset?.price ? Number(opt.dataset.price) : 0;
        priceInput.value = price.toFixed(2);
        recalcTotals();
      });
      tr.querySelectorAll('.prod-qty, .prod-price').forEach(inp => inp.addEventListener('input', recalcTotals));
      tr.querySelector('.prod-remove').addEventListener('click', () => { tr.remove(); recalcTotals(); });
      recalcTotals();
    };

    addRowBtn.addEventListener('click', () => addRow());

    // Add first row by default
    addRow();

    // Submit handler
    const form = modal.querySelector("#branchNewOrderForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleBranchModalSubmit(branchName, modal);
    });

    // Cancel handler
    modal.querySelector("#modalCancelBtn").addEventListener("click", () => closeModal(modal));
  }

  // Open modal on click for all matching buttons
  newOrderBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("newOrderBtn click → abrir modal de nueva orden para:", branchName);
      openModal(modal);
    });
  });
}

function openModal(modal) {
  if (!modal) return;
  console.log("openModal: mostrando modal", modal.id);
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("show"), 10);
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }, 200);
}

function handleBranchModalSubmit(branchName, modal) {
  const deliveryDate = (document.getElementById("modalDeliveryDate").value || "").trim();
  const notes = (document.getElementById("modalNotes").value || "").trim();

  const tbody = modal.querySelector('#modalProductsTableBody');
  const rows = Array.from(tbody?.querySelectorAll('tr') || []);

  if (!deliveryDate) {
    showToast("Selecciona la fecha de entrega");
    return;
  }
  if (!rows.length) {
    showToast("Agrega al menos un producto");
    return;
  }

  const items = [];
  rows.forEach((tr) => {
    const sel = tr.querySelector('.prod-select');
    const quantity = Number(tr.querySelector('.prod-qty')?.value || 0);
    const price = Number(tr.querySelector('.prod-price')?.value || 0);
    const productId = sel?.value || '';
    const opt = sel ? sel.options[sel.selectedIndex] : null;
    const name = (opt?.dataset?.name || '').trim();
    const code = (opt?.dataset?.code || '').trim();
    if (!productId || !name || quantity <= 0 || isNaN(price)) return;
    items.push({
      id: productId,
      code,
      name,
      quantity,
      price,
      total: quantity * price,
    });
  });

  if (!items.length) {
    showToast("Completa los datos de los productos");
    return;
  }

  const subtotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const orderId = `order_${Date.now()}`;
  const orderData = {
    id: orderId,
    branch: branchName,
    deliveryDate,
    notes,
    items,
    subtotal,
    tax,
    total,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: "branch-user",
    createdByName: localStorage.getItem("userName") || "Usuario",
  };

  try {
    const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    savedOrders.push(orderData);
    localStorage.setItem("orders", JSON.stringify(savedOrders));
    showToast(`Pedido #${orderId} guardado exitosamente`);
    // Reset form (limpia tabla y agrega una fila nueva)
    const form = document.getElementById("branchNewOrderForm");
    form.reset();
    const tbody = modal.querySelector('#modalProductsTableBody');
    if (tbody) tbody.innerHTML = '';
    const addBtn = modal.querySelector('#modalAddProductRow');
    if (addBtn) addBtn.click();
    closeModal(modal);

    // Refresh orders table if present
    if (document.querySelector(".data-table")) {
      loadOrders(branchName);
    }
    // Update dashboard stats regardless
    updateDashboardStats();
  } catch (err) {
    console.error("Error al guardar el pedido:", err);
    showToast("Error al guardar el pedido");
  }
}

function parseProductsToItems(input) {
  // Supports lines separated by newlines or semicolons
  const lines = input
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
  const items = [];
  for (const line of lines) {
    // Try patterns: "2x Nombre", "Nombre x2", "2 Nombre"
    let quantity = 1;
    let name = line;
    const m1 = line.match(/^\s*(\d+)\s*x\s*(.+)$/i); // 2x Coca-Cola
    const m2 = line.match(/^\s*(.+)\s*x\s*(\d+)\s*$/i); // Coca-Cola x2
    const m3 = line.match(/^\s*(\d+)\s+(.+)$/); // 2 Coca-Cola
    if (m1) { quantity = parseInt(m1[1], 10); name = m1[2].trim(); }
    else if (m2) { quantity = parseInt(m2[2], 10); name = m2[1].trim(); }
    else if (m3) { quantity = parseInt(m3[1], 10); name = m3[2].trim(); }

    items.push({ id: `item_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, name, code: "", quantity, price: 0, total: 0 });
  }
  return items;
}

function setupBranchReportsView(branchName) {
  const candidates = Array.from(document.querySelectorAll(".quick-actions .btn-action"));
  const byText = candidates.filter((btn) => (btn.textContent || "").toLowerCase().includes("ver reportes"));
  const idBtn = document.getElementById("viewReportsBtn");
  const buttons = [];
  if (idBtn) buttons.push(idBtn);
  byText.forEach((b) => { if (!buttons.includes(b)) buttons.push(b); });
  if (!buttons.length) {
    setTimeout(() => setupBranchReportsView(branchName), 100);
    return;
  }

  let modal = document.getElementById("branchReportsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "branchReportsModal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Historial de pedidos - ${branchName}</h3>
            <button type="button" class="btn-close" aria-label="Cerrar">&times;</button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Productos</th>
                    <th>Fecha de entrega</th>
                    <th>Notas</th>
                    <th>Estatus</th>
                    <th>Registrado</th>
                  </tr>
                </thead>
                <tbody id="branchReportsTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const closeBtn = modal.querySelector(".btn-close");
    closeBtn.addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
  }

  const openAndRender = () => {
    renderBranchHistory(branchName);
    openModal(modal);
  };
  buttons.forEach((btn) => btn.addEventListener("click", (e) => { e.preventDefault(); openAndRender(); }));
}

function getOrderHistoryAll() {
  try {
    if (window.historyService && typeof window.historyService.getAll === "function") {
      return window.historyService.getAll() || [];
    }
  } catch (_) {}
  try {
    const raw = localStorage.getItem("order_history");
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function renderBranchHistory(branchName) {
  const tbody = document.getElementById("branchReportsTableBody");
  if (!tbody) return;
  const all = getOrderHistoryAll();
  const filtered = all.filter((it) => {
    const isSameBranch = normalizeBranchName(it.branch) === normalizeBranchName(branchName);
    const st = String(it.status || '').toLowerCase();
    const isAcceptedOrCanceled = st === 'aceptado' || st === 'cancelado';
    return isSameBranch && isAcceptedOrCanceled;
  });
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin registros</td></tr>';
    return;
  }
  const formatProducts = (arr) => {
    if (!Array.isArray(arr) || !arr.length) return "—";
    return arr.map((p) => `${p.name || p.product || "Producto"} x${p.quantity || p.qty || 1}`).join(", ");
  };
  const formatDate = (iso) => {
    try { return iso ? new Date(iso).toLocaleString("es-NI") : "—"; } catch { return "—"; }
  };
  tbody.innerHTML = filtered.map((it) => `
    <tr>
      <td>${it.id || "—"}</td>
      <td>${formatProducts(it.products)}</td>
      <td>${it.deliveryDate || "—"}</td>
      <td>${it.notes || "—"}</td>
      <td><span class="status-badge ${String(it.status||'').toLowerCase()}">${it.status || "—"}</span></td>
      <td>${formatDate(it.timestamp)}</td>
    </tr>
  `).join("");
}
