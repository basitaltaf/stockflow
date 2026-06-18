// Storage Key
const STORAGE_KEY = 'stockflow_inventory_products';

/**
 * Generate a unique Product ID with a 'PRD-' prefix.
 * It uses a combination of random alphanumeric characters and verifies uniqueness against current products.
 * @returns {string} Unique product ID
 */
function generateUniqueId() {
  const products = getAllProducts();
  let uniqueId = '';
  let isDuplicate = true;

  while (isDuplicate) {
    // Generate a random 6-character uppercase alphanumeric string
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    uniqueId = `PRD-${randomPart}`;
    isDuplicate = products.some(p => p.id === uniqueId);
  }
  return uniqueId;
}

/**
 * Get all products from local storage.
 * @returns {Array} Array of product objects
 */
export function getAllProducts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // Seed mock products if database is empty (first-time visitor UX)
    const mockProducts = [
      {
        id: 'PRD-MAC16P',
        name: 'MacBook Pro 16"',
        category: 'Electronics',
        price: 2499.00,
        quantity: 15,
        supplier: 'Apple Inc.',
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        id: 'PRD-HERMCH',
        name: 'Ergonomic Office Chair',
        category: 'Furniture',
        price: 349.99,
        quantity: 4, // Low Stock (<= 10)
        supplier: 'Herman Miller Inc.',
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        id: 'PRD-KEYCHB',
        name: 'Mechanical Gaming Keyboard',
        category: 'Electronics',
        price: 129.00,
        quantity: 0, // Out of Stock
        supplier: 'Keychron Ltd.',
        dateAdded: new Date().toISOString().split('T')[0]
      }
    ];

    saveAllProducts(mockProducts);
    return mockProducts;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

/**
 * Save the entire list of products to local storage.
 * @param {Array} products - Array of product objects
 * @returns {boolean} True if successful, false otherwise
 */
export function saveAllProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

/**
 * Add a new product to the inventory.
 * @param {Object} productData - Product details (name, category, price, quantity, supplier)
 * @returns {Object|null} The created product object, or null if creation failed
 */
export function createProduct(productData) {
  const products = getAllProducts();

  const newProduct = {
    id: generateUniqueId(),
    name: productData.name.trim(),
    category: productData.category.trim(),
    price: parseFloat(productData.price),
    quantity: parseInt(productData.quantity, 10),
    supplier: productData.supplier.trim(),
    dateAdded: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
  };

  products.push(newProduct);
  const success = saveAllProducts(products);
  return success ? newProduct : null;
}

/**
 * Retrieve a specific product by its ID.
 * @param {string} id - Product ID
 * @returns {Object|undefined} The product object or undefined
 */
export function getProductById(id) {
  const products = getAllProducts();
  return products.find(p => p.id === id);
}

/**
 * Update an existing product in the inventory.
 * @param {string} id - Product ID to update
 * @param {Object} updatedData - Object containing updated fields
 * @returns {Object|null} The updated product object, or null if update failed
 */
export function updateProduct(id, updatedData) {
  const products = getAllProducts();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    console.error(`Product with ID ${id} not found.`);
    return null;
  }

  const existingProduct = products[index];

  // Merge existing product with updated data, preserving the ID and dateAdded
  const updatedProduct = {
    ...existingProduct,
    name: updatedData.name ? updatedData.name.trim() : existingProduct.name,
    category: updatedData.category ? updatedData.category.trim() : existingProduct.category,
    price: updatedData.price !== undefined ? parseFloat(updatedData.price) : existingProduct.price,
    quantity: updatedData.quantity !== undefined ? parseInt(updatedData.quantity, 10) : existingProduct.quantity,
    supplier: updatedData.supplier ? updatedData.supplier.trim() : existingProduct.supplier
  };

  products[index] = updatedProduct;
  const success = saveAllProducts(products);
  return success ? updatedProduct : null;
}

/**
 * Delete a product from the inventory.
 * @param {string} id - Product ID to delete
 * @returns {boolean} True if deleted successfully, false otherwise
 */
export function deleteProduct(id) {
  const products = getAllProducts();
  const initialLength = products.length;
  const filteredProducts = products.filter(p => p.id !== id);

  if (filteredProducts.length === initialLength) {
    console.error(`Product with ID ${id} not found for deletion.`);
    return false;
  }

  return saveAllProducts(filteredProducts);
}
