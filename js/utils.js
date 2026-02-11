// ========================================
// UTILIDADES DE SEGURIDAD
// ========================================

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} unsafe - Texto potencialmente inseguro
 * @returns {string} - Texto escapado y seguro para HTML
 */
export function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Establece texto de forma segura en un elemento
 * @param {string} id - ID del elemento
 * @param {string} value - Valor a establecer
 */
export function setTextSafe(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
