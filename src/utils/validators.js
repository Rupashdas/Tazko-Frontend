// src/utils/validators.js
export const validators = {
  required: (val, label = 'This field') => {
    return !val?.toString().trim() ? `${label} is required` : null
  },
  email: (val) => {
    if (!val?.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email'
    return null
  },
  passwordMatch: (val, other) => {
    return val !== other ? 'Passwords do not match' : null
  },
}
