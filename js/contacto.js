import { escapeHtml } from './utils.js';

// Navbar con efecto scroll - igual que index.html
const nav = document.getElementById('mainNav');

// Aplicar fondo oscuro inmediatamente ya que no tenemos hero fullscreen
nav.classList.add('navbar-scrolled');

window.addEventListener('scroll', function() {
  if (window.scrollY > 50) {
    nav.classList.add('navbar-scrolled');
  } else {
    // En esta página mantener el fondo siempre
    nav.classList.add('navbar-scrolled');
  }
});

// Formulario de contacto
const contactForm = document.getElementById('contactForm');
const alertContainer = document.getElementById('alertContainer');

function showAlert(message, type = 'success') {
  // Scroll suave hacia el contenedor de alertas
  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  const alertClass = type === 'success' ? 'alert-success' : 
                     type === 'warning' ? 'alert-warning' : 
                     'alert-danger';
  
  const iconClass = type === 'success' ? 'bi-check-circle-fill' : 
                    type === 'warning' ? 'bi-exclamation-triangle-fill' : 
                    'bi-x-circle-fill';
  
  alertContainer.innerHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      <i class="bi ${iconClass} me-2"></i>
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    const alert = alertContainer.querySelector('.alert');
    if (alert) {
      alert.classList.remove('show');
      setTimeout(() => {
        alertContainer.innerHTML = '';
      }, 150);
    }
  }, 5000);
}

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const asunto = document.getElementById('asunto').value;
  const mensaje = document.getElementById('mensaje').value.trim();
  
  // Validación
  if (!nombre || !email || !asunto || !mensaje) {
    showAlert('Por favor completa todos los campos obligatorios (*)', 'warning');
    return;
  }
  
  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert('Por favor ingresa un email válido', 'warning');
    return;
  }
  
  // Deshabilitar botón mientras se procesa
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Enviando...';
  
  // Simular envío
  setTimeout(() => {
    showAlert('¡Mensaje enviado exitosamente! Te responderemos pronto.', 'success');
    contactForm.reset();
    
    // Restaurar botón
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    
    console.log('Datos del formulario:', {
      nombre,
      email,
      telefono,
      asunto,
      mensaje,
      fecha: new Date().toISOString()
    });
  }, 1000);
});

// Validación en tiempo real del email
const emailInput = document.getElementById('email');
emailInput.addEventListener('blur', function() {
  const email = this.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    this.classList.add('is-invalid');
  } else {
    this.classList.remove('is-invalid');
  }
});

// Limpiar validación al escribir
emailInput.addEventListener('input', function() {
  this.classList.remove('is-invalid');
});