// Input Validation & Sanitization Utilities

/**
 * Sanitize string to prevent XSS
 * @param {string} str - Input string
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate password strength
 * @param {string} password
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number (US format)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const regex = /^(\+1)?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
  return regex.test(phone);
};

/**
 * Sanitize HTML content (basic)
 * @param {string} html
 * @returns {string}
 */
export const sanitizeHTML = (html) => {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
};

/**
 * Validate required field
 * @param {any} value
 * @returns {boolean}
 */
export const isRequired = (value) => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
};

/**
 * Validate file type and size
 * @param {File} file
 * @param {string[]} allowedTypes - e.g., ['image/jpeg', 'application/pdf']
 * @param {number} maxSizeMB - Max size in MB
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateFile = (file, allowedTypes = [], maxSizeMB = 10) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type must be one of: ${allowedTypes.join(', ')}` };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  return { valid: true, error: null };
};

/**
 * Format date for display
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Debounce function for search inputs
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Validate symptoms input
 * @param {string} symptoms
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateSymptoms = (symptoms) => {
  if (!symptoms || symptoms.trim().length < 3) {
    return { valid: false, error: 'Please describe your symptoms (at least 3 characters)' };
  }
  if (symptoms.length > 1000) {
    return { valid: false, error: 'Symptom description too long (max 1000 characters)' };
  }
  return { valid: true, error: null };
};
