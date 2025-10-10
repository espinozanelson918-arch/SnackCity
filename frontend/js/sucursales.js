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
  const noOrdersRow = document.getElementById("no-orders");

  if (!tbody) {
    console.error("No se encontró el elemento tbody en la tabla de pedidos");
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
    const statusText = isPending ? "Pendiente" : "Completado";

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
          isPending ? "status-pending" : "status-completed"
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
});
