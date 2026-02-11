// ========================================
// SCRIPT LOGIN - CORREGIDO
// ========================================

import { login, isAuthenticated, isAdmin } from './storage.js';
import { escapeHtml } from './utils.js';

// Redirigir si ya está autenticado
if (isAuthenticated()) {
  if (isAdmin()) {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'mis-reservas.html';
  }
}

const form = document.getElementById('loginForm');
const alertContainer = document.getElementById('alertContainer');

function showAlert(message, type = 'danger') {
  alertContainer.innerHTML = `
    <div class="alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show" role="alert">
      <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  setTimeout(() => {
    alertContainer.innerHTML = '';
  }, 5000);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    showAlert('Por favor completa todos los campos');
    return;
  }
  
  const result = login(email, password);
  
  if (result.success) {
    localStorage.setItem('userEmail', result.user.email);
    localStorage.setItem('userName', result.user.nombre || result.user.name || 'Usuario');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', result.user.id);
    
    showAlert('Inicio de sesión exitoso. Redirigiendo...', 'success');
    
    setTimeout(() => {
      if (result.user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'mis-reservas.html';
      }
    }, 1500);
  } else {
    showAlert(result.error || 'Error al iniciar sesión');
  }
});