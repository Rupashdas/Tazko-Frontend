// src/utils/validators.js

/**
 * Lazy-build a single hidden email input and reuse it for validation.
 * The browser's HTML5 email validity check is closer to the WHATWG spec
 * than any regex we'd write — it correctly rejects double @, missing TLD,
 * and most malformed addresses while staying lenient on spec-valid ones.
 */
let _emailEl = null
function emailIsValid(value) {
  if (typeof document === 'undefined') {
    // SSR / non-browser fallback — keep a tighter regex than before.
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
  }
  if (!_emailEl) {
    _emailEl = document.createElement('input')
    _emailEl.type = 'email'
  }
  _emailEl.value = value
  return _emailEl.checkValidity()
}

export const validators = {
  required: (val, label = 'This field') => {
    return !val?.toString().trim() ? `${label} is required` : null
  },
  email: (val) => {
    const trimmed = val?.toString().trim() ?? ''
    if (!trimmed) return 'Email is required'
    if (!emailIsValid(trimmed)) return 'Enter a valid email'
    return null
  },
  passwordMatch: (val, other) => {
    return val !== other ? 'Passwords do not match' : null
  },
}
