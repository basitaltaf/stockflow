/**
 * Validate product data.
 * @param {Object} productData - Object containing name, category, price, quantity, supplier
 * @returns {Object} Validation result containing isValid (boolean) and errors (object mapping field names to error messages)
 */
export function validateProduct(productData) {
  const errors = {};

  // 1. Name Validation
  const name = productData.name ? productData.name.trim() : '';
  if (!name) {
    errors.name = 'Product name is required.';
  } else if (name.length < 2) {
    errors.name = 'Product name must be at least 2 characters long.';
  }

  // 2. Category Validation
  const category = productData.category ? productData.category.trim() : '';
  if (!category) {
    errors.category = 'Category is required.';
  }

  // 3. Price Validation
  const priceRaw = productData.price;
  if (priceRaw === undefined || priceRaw === null || priceRaw === '') {
    errors.price = 'Price is required.';
  } else {
    const price = parseFloat(priceRaw);
    if (isNaN(price)) {
      errors.price = 'Price must be a valid number.';
    } else if (price <= 0) {
      errors.price = 'Price must be a positive number (greater than 0).';
    }
  }

  // 4. Quantity Validation
  const quantityRaw = productData.quantity;
  if (quantityRaw === undefined || quantityRaw === null || quantityRaw === '') {
    errors.quantity = 'Quantity is required.';
  } else {
    const quantity = Number(quantityRaw);
    if (isNaN(quantity) || !Number.isInteger(quantity)) {
      errors.quantity = 'Quantity must be a whole number.';
    } else if (quantity < 0) {
      errors.quantity = 'Quantity cannot be negative.';
    }
  }

  // 5. Supplier Validation
  const supplier = productData.supplier ? productData.supplier.trim() : '';
  if (!supplier) {
    errors.supplier = 'Supplier is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
