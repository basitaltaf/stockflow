import * as storage from './storage.js';
import { validateProduct } from './validation.js';
import * as ui from './ui.js';

// Application State Variables
let currentDeleteId = null;

// ==========================================================================
// FILTERING, SORTING, AND SEARCH PIPELINE
// ==========================================================================
/**
 * Processes products list through active search terms, categories, stock levels, and sorting parameters.
 * @returns {Array} Filtered and sorted products array
 */
function getProcessedProducts() {
  let products = storage.getAllProducts();

  // Get current filter input values
  const searchVal = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  const categoryFilter = document.getElementById('filter-category')?.value || '';
  const stockFilter = document.getElementById('filter-stock')?.value || '';
  const sortType = document.getElementById('sort-by')?.value || 'name-asc';

  // 1. Search Query Filter (Name & Category)
  if (searchVal) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchVal) || 
      p.category.toLowerCase().includes(searchVal)
    );
  }

  // 2. Category Filter dropdown
  if (categoryFilter) {
    products = products.filter(p => p.category === categoryFilter);
  }

  // 3. Stock Level Filter dropdown
  if (stockFilter) {
    products = products.filter(p => {
      const qty = p.quantity;
      if (stockFilter === 'out-of-stock') return qty === 0;
      if (stockFilter === 'low-stock') return qty > 0 && qty <= ui.LOW_STOCK_THRESHOLD;
      if (stockFilter === 'in-stock') return qty > ui.LOW_STOCK_THRESHOLD;
      return true;
    });
  }

  // 4. Sorting Pipeline
  products.sort((a, b) => {
    switch (sortType) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'qty-asc':
        return a.quantity - b.quantity;
      case 'qty-desc':
        return b.quantity - a.quantity;
      default:
        return 0;
    }
  });

  return products;
}

// ==========================================================================
// CORE APP COORDINATION
// ==========================================================================
/**
 * Pull latest storage data, compute stats, and re-render current UI state.
 */
export function refreshApp() {
  const allProducts = storage.getAllProducts();
  const processedProducts = getProcessedProducts();

  // Render elements
  ui.renderProductsTable(processedProducts);
  ui.updateDashboardMetrics(allProducts);
  ui.updateCategoryDatalist(allProducts);
}

/**
 * Initialize application events, date, and initial state rendering.
 */
function initApp() {
  // Set current date in the header
  const dateElement = document.getElementById('current-date');
  if (dateElement) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // Load initial view
  refreshApp();

  // Setup Event Listeners
  setupEventListeners();
}

// ==========================================================================
// EVENT LISTENERS MANAGEMENT
// ==========================================================================
function setupEventListeners() {
  // 1. Mobile Sidebar Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside of it on mobile
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== mobileToggle) {
        sidebar.classList.remove('open');
      }
    });
  }

  // 2. Sidebar Navigation Items (Visual indicator logic)
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // 3. Search, Filter, Sort Live Event Handlers
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => refreshApp(), 250));
  }

  const categoryFilter = document.getElementById('filter-category');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => refreshApp());
  }

  const stockFilter = document.getElementById('filter-stock');
  if (stockFilter) {
    stockFilter.addEventListener('change', () => refreshApp());
  }

  const sortSelect = document.getElementById('sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => refreshApp());
  }

  // 4. Modals - Product Create & Update Form Toggles
  const productModal = document.getElementById('product-modal');
  const addBtn = document.getElementById('btn-add-product');
  const emptyAddBtn = document.getElementById('btn-empty-add');
  const cancelProductBtn = document.getElementById('btn-cancel-product');
  const closeProductBtn = document.getElementById('modal-close');

  const openAddModal = () => {
    ui.resetForm();
    document.getElementById('modal-title').textContent = 'Add New Product';
    productModal.showModal();
  };

  if (addBtn) addBtn.addEventListener('click', openAddModal);
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);

  const closeAddModal = () => {
    productModal.close();
    ui.resetForm();
  };

  if (cancelProductBtn) cancelProductBtn.addEventListener('click', closeAddModal);
  if (closeProductBtn) closeProductBtn.addEventListener('click', closeAddModal);

  // Close modal when clicking on its backdrop
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) {
        closeAddModal();
      }
    });
  }

  // 5. Product Form Submission Handler (Create & Update)
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const id = document.getElementById('field-id').value;
      const productData = {
        name: document.getElementById('field-name').value,
        category: document.getElementById('field-category').value,
        supplier: document.getElementById('field-supplier').value,
        price: document.getElementById('field-price').value,
        quantity: document.getElementById('field-quantity').value
      };

      // Run business rules validation
      const validation = validateProduct(productData);

      if (!validation.isValid) {
        ui.displayFormErrors(validation.errors);
        return;
      }

      if (id) {
        // Edit mode (Update)
        const updated = storage.updateProduct(id, productData);
        if (updated) {
          ui.showToast(`Product "${updated.name}" updated successfully!`, 'success');
        } else {
          ui.showToast('Failed to update product details.', 'danger');
        }
      } else {
        // Create mode (Create)
        const created = storage.createProduct(productData);
        if (created) {
          ui.showToast(`Product "${created.name}" created successfully!`, 'success');
        } else {
          ui.showToast('Failed to save new product.', 'danger');
        }
      }

      // Close modal and sync dashboard
      closeAddModal();
      refreshApp();
    });
  }

  // 6. Delete Modal Dialog triggers
  const deleteModal = document.getElementById('delete-modal');
  const cancelDeleteBtn = document.getElementById('btn-cancel-delete');
  const closeDeleteBtn = document.getElementById('delete-modal-close');
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete');

  const closeDeleteModal = () => {
    deleteModal.close();
    currentDeleteId = null;
  };

  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);

  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (currentDeleteId) {
        const product = storage.getProductById(currentDeleteId);
        const name = product ? product.name : 'Product';
        const deleted = storage.deleteProduct(currentDeleteId);

        if (deleted) {
          ui.showToast(`Product "${name}" has been deleted.`, 'success');
        } else {
          ui.showToast('Failed to delete the selected product.', 'danger');
        }

        closeDeleteModal();
        refreshApp();
      }
    });
  }

  // 7. Dynamic Actions: Edit, Delete, Qty Adjustments (via Event Delegation)
  const tbody = document.getElementById('table-body');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const target = e.target;

      // Handle Edit button click
      const editBtn = target.closest('.btn-edit');
      if (editBtn) {
        const id = editBtn.dataset.id;
        const product = storage.getProductById(id);
        if (product) {
          ui.resetForm();
          document.getElementById('modal-title').textContent = 'Edit Product';
          document.getElementById('field-id').value = product.id;
          document.getElementById('field-name').value = product.name;
          document.getElementById('field-category').value = product.category;
          document.getElementById('field-supplier').value = product.supplier;
          document.getElementById('field-price').value = product.price;
          document.getElementById('field-quantity').value = product.quantity;

          productModal.showModal();
        }
        return;
      }

      // Handle Delete button click
      const deleteBtn = target.closest('.btn-delete');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const product = storage.getProductById(id);
        if (product) {
          currentDeleteId = id;
          document.getElementById('delete-product-name').textContent = product.name;
          deleteModal.showModal();
        }
        return;
      }

      // Handle Quantity Increment (+) button
      const incBtn = target.closest('.btn-qty-inc');
      if (incBtn) {
        const id = incBtn.dataset.id;
        const product = storage.getProductById(id);
        if (product) {
          const newQty = product.quantity + 1;
          storage.updateProduct(id, { quantity: newQty });
          refreshApp();
          ui.showToast(`Stock increased for "${product.name}".`, 'success');
        }
        return;
      }

      // Handle Quantity Decrement (-) button
      const decBtn = target.closest('.btn-qty-dec');
      if (decBtn) {
        const id = decBtn.dataset.id;
        const product = storage.getProductById(id);
        if (product) {
          if (product.quantity <= 0) {
            ui.showToast(`"${product.name}" is already out of stock.`, 'warning');
            return;
          }
          const newQty = product.quantity - 1;
          storage.updateProduct(id, { quantity: newQty });
          refreshApp();
          ui.showToast(`Stock decreased for "${product.name}".`, 'success');
        }
      }
    });
  }
}

/**
 * Debounce helper to limit excessive executions of a function.
 * @param {Function} func - The function to execute
 * @param {number} delay - The debounce timeout in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay = 250) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Start application when DOM is fully parsed
document.addEventListener('DOMContentLoaded', initApp);
