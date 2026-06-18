import { validateProduct } from './validation.js';
import * as storage from './storage.js';

// Low Stock Alert Threshold
export const LOW_STOCK_THRESHOLD = 10;

// ==========================================================================
// TOAST NOTIFICATIONS SYSTEM
// ==========================================================================
/**
 * Show a toast notification on the screen.
 * @param {string} message - Message to display
 * @param {'success'|'danger'|'warning'} type - Type of toast
 */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // SVG Icons based on type
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`;
  } else if (type === 'danger') {
    iconSvg = `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-dismiss: start fade-out after 3s, remove from DOM after 3.3s
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3000);
}

// ==========================================================================
// METRIC CALCULATIONS & RENDERING
// ==========================================================================
/**
 * Re-calculate metrics and update dashboard cards in DOM.
 * @param {Array} products - Array of product objects
 */
export function updateDashboardMetrics(products) {
  const totalProducts = products.length;
  let totalStock = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalValue = 0;

  products.forEach(p => {
    const qty = p.quantity;
    totalStock += qty;
    totalValue += (p.price * qty);

    if (qty === 0) {
      outOfStockCount++;
    } else if (qty <= LOW_STOCK_THRESHOLD) {
      lowStockCount++;
    }
  });

  // Inject values into DOM
  document.getElementById('val-total-products').textContent = totalProducts.toLocaleString();
  document.getElementById('val-total-stock').textContent = totalStock.toLocaleString();
  document.getElementById('val-low-stock').textContent = lowStockCount.toLocaleString();
  document.getElementById('val-out-stock').textContent = outOfStockCount.toLocaleString();
  document.getElementById('val-total-value').textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalValue);

  // Update visual alerts (glows/borders) if metrics have alerts
  const lowStockCard = document.getElementById('card-low-stock');
  if (lowStockCount > 0) {
    lowStockCard.style.borderColor = 'rgba(245, 158, 11, 0.4)';
  } else {
    lowStockCard.style.borderColor = '';
  }

  const outOfStockCard = document.getElementById('card-out-stock');
  if (outOfStockCount > 0) {
    outOfStockCard.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  } else {
    outOfStockCard.style.borderColor = '';
  }
}

// ==========================================================================
// CATEGORY AUTOCOMPLETE
// ==========================================================================
/**
 * Update the datalist suggestions with unique categories currently in store.
 * @param {Array} products - Current product list
 */
export function updateCategoryDatalist(products) {
  const datalist = document.getElementById('categories-list');
  if (!datalist) return;

  const categories = [...new Set(products.map(p => p.category.trim()))]
    .filter(cat => cat.length > 0)
    .sort();

  datalist.innerHTML = categories.map(cat => `<option value="${cat}"></option>`).join('');

  // Also update the main dashboard filter dropdown dynamically
  const filterDropdown = document.getElementById('filter-category');
  if (filterDropdown) {
    const currentValue = filterDropdown.value;
    filterDropdown.innerHTML = '<option value="">All Categories</option>' + 
      categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    filterDropdown.value = currentValue; // Keep selection state
  }
}

// ==========================================================================
// STOCK BADGE HELPERS
// ==========================================================================
/**
 * Generate stock badge metadata.
 * @param {number} quantity - Product stock level
 * @returns {Object} { text, className }
 */
export function getStockStatusInfo(quantity) {
  if (quantity === 0) {
    return { text: 'Out of Stock', className: 'badge-danger' };
  } else if (quantity <= LOW_STOCK_THRESHOLD) {
    return { text: 'Low Stock', className: 'badge-warning' };
  } else {
    return { text: 'In Stock', className: 'badge-success' };
  }
}

// ==========================================================================
// TABLE RENDERING
// ==========================================================================
/**
 * Render products inside the inventory table.
 * @param {Array} products - Array of product objects to render
 */
export function renderProductsTable(products) {
  const table = document.getElementById('products-table');
  const tbody = document.getElementById('table-body');
  const emptyState = document.getElementById('empty-state');

  if (!tbody || !emptyState || !table) return;

  if (products.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'flex';
    tbody.innerHTML = '';
    return;
  }

  table.style.display = 'table';
  emptyState.style.display = 'none';

  tbody.innerHTML = products.map(product => {
    const status = getStockStatusInfo(product.quantity);
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(product.price);

    return `
      <tr data-id="${product.id}">
        <td class="font-mono text-muted" style="font-size: 12px;">${product.id}</td>
        <td style="font-weight: 600;">${escapeHTML(product.name)}</td>
        <td><span class="badge" style="background-color: rgba(255, 255, 255, 0.05); color: var(--text-secondary);">${escapeHTML(product.category)}</span></td>
        <td style="font-weight: 500;">${formattedPrice}</td>
        <td><span class="badge ${status.className}">${status.text}</span></td>
        <td>
          <div class="qty-cell">
            <button class="btn-qty btn-qty-dec" data-id="${product.id}" aria-label="Decrease stock">-</button>
            <span class="qty-val">${product.quantity}</span>
            <button class="btn-qty btn-qty-inc" data-id="${product.id}" aria-label="Increase stock">+</button>
          </div>
        </td>
        <td class="text-secondary">${escapeHTML(product.supplier)}</td>
        <td class="text-right">
          <button class="action-btn btn-edit" data-id="${product.id}" aria-label="Edit product">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="action-btn btn-delete" data-id="${product.id}" aria-label="Delete product">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// FORM VALIDATION & UI FEEDBACK HELPERS
// ==========================================================================
/**
 * Show validation errors on the form fields.
 * @param {Object} errors - Error object matching fields to their messages
 */
export function displayFormErrors(errors) {
  // Clear any existing errors first
  clearFormErrors();

  Object.entries(errors).forEach(([field, msg]) => {
    const input = document.getElementById(`field-${field}`);
    const errSpan = document.getElementById(`err-${field}`);

    if (input) {
      input.parentElement.classList.add('has-error');
    }
    if (errSpan) {
      errSpan.textContent = msg;
    }
  });
}

/**
 * Clear validation errors from all fields.
 */
export function clearFormErrors() {
  const groups = document.querySelectorAll('.form-group');
  groups.forEach(g => g.classList.remove('has-error'));

  const errorSpans = document.querySelectorAll('.error-message');
  errorSpans.forEach(span => span.textContent = '');
}

/**
 * Reset form input values and clear validation styling.
 */
export function resetForm() {
  const form = document.getElementById('product-form');
  if (form) form.reset();
  document.getElementById('field-id').value = '';
  clearFormErrors();
}

// ==========================================================================
// GENERAL SANITIZATION UTILITY
// ==========================================================================
/**
 * Basic HTML escaping to prevent XSS.
 * @param {string} str - Unescaped HTML string
 * @returns {string} Clean, safe HTML string
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
