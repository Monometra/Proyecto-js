// ========================================
// NAVBAR - Menú de Usuario (CORREGIDO)
// ========================================

import { escapeHtml } from './utils.js';

/**
 * Detecta si estamos en un subdirectorio (como /html/)
 * @returns {string} Prefijo de ruta ('/' o '../')
 */
function getPathPrefix() {
  const path = window.location.pathname;
  if (path.includes('/html/')) {
    return '../';
  }
  return '';
}

/**
 * Verifica si hay un usuario autenticado
 * @returns {Object|null} Objeto de usuario o null si no está autenticado
 */
function checkAuth() {
  try {
    const userStr = localStorage.getItem('hotel_current_user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    
    if (!user || !user.id || !user.email || !user.nombre) {
      console.warn('Usuario inválido en localStorage');
      localStorage.removeItem('hotel_current_user');
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    localStorage.removeItem('hotel_current_user');
    return null;
  }
}

/**
 * Obtiene el primer nombre del usuario
 * @param {string} fullName - Nombre completo del usuario
 * @returns {string} Primer nombre o 'Usuario' por defecto
 */
function getFirstName(fullName) {
  if (!fullName) return 'Usuario';
  return fullName.trim().split(' ')[0];
}

/**
 * Cierra la sesión del usuario
 */
function performLogout() {
  localStorage.removeItem('hotel_current_user');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  sessionStorage.clear();
  
  console.log('Sesión cerrada correctamente');
  
  const prefix = getPathPrefix();
  window.location.href = prefix + 'index.html';
}

/**
 * Actualiza el menú de usuario en el navbar
 */
function updateUserMenu() {
  const userMenuItem = document.getElementById('userMenuItem');
  if (!userMenuItem) {
    console.warn('Elemento #userMenuItem no encontrado en el DOM');
    return;
  }
  
  const user = checkAuth();
  const prefix = getPathPrefix();
  
  if (user) {
    const firstName = escapeHtml(getFirstName(user.nombre));
    
    userMenuItem.innerHTML = `
      <div class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" 
           data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle"></i> ${firstName}
        </a>
        <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark" aria-labelledby="userDropdown">
          <li>
            <a class="dropdown-item" href="${prefix}mis-reservas.html">
              <i class="bi bi-calendar-check"></i> Mis Reservas
            </a>
          </li>
          ${user.role === 'admin' ? `
          <li>
            <a class="dropdown-item" href="${prefix}admin.html">
              <i class="bi bi-gear"></i> Administración
            </a>
          </li>
          ` : ''}
          <li><hr class="dropdown-divider"></li>
          <li>
            <a class="dropdown-item" href="#" id="navLogoutBtn">
              <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
            </a>
          </li>
        </ul>
      </div>
    `;
    
    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
          performLogout();
        }
      });
    }
  } else {
    userMenuItem.innerHTML = `
      <a class="nav-link" href="${prefix}login.html">
        <i class="bi bi-person-circle"></i> Ingresar
      </a>
    `;
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateUserMenu);
} else {
  updateUserMenu();
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    updateUserMenu();
  }
});

window.addEventListener('storage', (e) => {
  if (e.key === 'hotel_current_user' || e.key === 'isLoggedIn') {
    updateUserMenu();
  }
});

console.log('Navbar User JS cargado - Prefijo de ruta:', getPathPrefix());