// ========================================
// SISTEMA DE RESERVAS
// ========================================

import { 
  checkAvailability, 
  getRoomById, 
  addBooking, 
  isAuthenticated, 
  getCurrentUser,
  calculateNights,
  calculateTotal,
  formatPrice,
  isRoomAvailable,
  logout
} from './storage.js';
import { escapeHtml } from './utils.js';

const searchForm = document.getElementById('searchForm');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchInfo = document.getElementById('searchInfo');
const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
const modalBody = document.getElementById('modalBody');
const userMenuItem = document.getElementById('userMenuItem');

function init() {
  setupUserMenu();
  setupDateInputs();
  setupEventListeners();
}

function setupUserMenu() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    userMenuItem.innerHTML = `
      <div class="dropdown">
        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle"></i> ${escapeHtml(currentUser.nombre)}
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="mis-reservas.html">
            <i class="bi bi-calendar"></i> Mis Reservas
          </a></li>
          ${currentUser.role === 'admin' ? '<li><a class="dropdown-item" href="admin.html"><i class="bi bi-gear"></i> Administración</a></li>' : ''}
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" id="logoutBtn">
            <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
          </a></li>
        </ul>
      </div>
    `;
    
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
      window.location.reload();
    });
  }
}

function setupDateInputs() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const fechaInicioInput = document.getElementById('fechaInicio');
  const fechaFinInput = document.getElementById('fechaFin');
  
  fechaInicioInput.min = today;
  fechaFinInput.min = tomorrow;
  fechaInicioInput.value = today;
  fechaFinInput.value = tomorrow;
  
  fechaInicioInput.addEventListener('change', (e) => {
    const fechaInicio = new Date(e.target.value);
    const minFechaFin = new Date(fechaInicio.getTime() + 86400000).toISOString().split('T')[0];
    fechaFinInput.min = minFechaFin;
    
    if (fechaFinInput.value <= e.target.value) {
      fechaFinInput.value = minFechaFin;
    }
  });
}

function setupEventListeners() {
  searchForm.addEventListener('submit', handleSearch);
}

async function handleSearch(e) {
  e.preventDefault();
  
  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFin = document.getElementById('fechaFin').value;
  const personas = parseInt(document.getElementById('personas').value);
  
  if (!fechaInicio || !fechaFin) {
    alert('Por favor selecciona las fechas');
    return;
  }
  
  if (new Date(fechaInicio) >= new Date(fechaFin)) {
    alert('La fecha de salida debe ser posterior a la fecha de entrada');
    return;
  }
  
  loadingSpinner.style.display = 'block';
  resultsContainer.innerHTML = '';
  
  setTimeout(() => {
    const availableRooms = checkAvailability(fechaInicio, fechaFin, personas);
    displayResults(availableRooms, fechaInicio, fechaFin, personas);
    loadingSpinner.style.display = 'none';
    
    const nights = calculateNights(fechaInicio, fechaFin);
    searchInfo.innerHTML = `
      <i class="bi bi-info-circle"></i> 
      Mostrando ${escapeHtml(availableRooms.length)} habitación(es) disponible(s) 
      para ${escapeHtml(personas)} persona(s) durante ${escapeHtml(nights)} noche(s)
    `;
    searchInfo.style.display = 'block';
  }, 500);
}

function displayResults(rooms, fechaInicio, fechaFin, personas) {
  if (rooms.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-emoji-frown"></i>
        <h3 class="text-muted">No hay habitaciones disponibles</h3>
        <p class="text-muted">Por favor intenta con otras fechas o menos personas</p>
      </div>
    `;
    return;
  }
  
  const nights = calculateNights(fechaInicio, fechaFin);
  
  resultsContainer.innerHTML = `
    <h3 class="mb-4">
      <i class="bi bi-check-circle text-success"></i> 
      ${escapeHtml(rooms.length)} Habitación(es) Disponible(s)
    </h3>
    <div class="row g-4">
      ${rooms.map(room => createRoomCard(room, fechaInicio, fechaFin, personas, nights)).join('')}
    </div>
  `;
  
  document.querySelectorAll('.btn-reserve').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = parseInt(btn.dataset.roomId);
      showBookingModal(roomId, fechaInicio, fechaFin, personas, nights);
    });
  });
}

function createRoomCard(room, fechaInicio, fechaFin, personas, nights) {
  const total = room.precio * nights;
  
  return `
    <div class="col-md-6 col-lg-4">
      <div class="room-result-card">
        <div class="room-image-container">
          <img src="assets/img/rooms/${escapeHtml(room.imagen)}" alt="${escapeHtml(room.nombre)}" class="room-image" 
               onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(room.nombre)}'">
          <div class="room-badge">
            <i class="bi bi-star-fill"></i> Premium
          </div>
        </div>
        
        <div class="p-3">
          <h4 class="mb-2">${escapeHtml(room.nombre)}</h4>
          <p class="text-muted small mb-3">${escapeHtml(room.descripcion)}</p>
          
          <div class="mb-3">
            <span class="service-badge">
              <i class="bi bi-people-fill"></i> Hasta ${escapeHtml(room.personas)} personas
            </span>
            <span class="service-badge">
              <i class="bi bi-door-closed-fill"></i> ${escapeHtml(room.camas)} cama(s)
            </span>
          </div>
          
          <div class="mb-3">
            ${room.servicios.map(servicio => `
              <span class="service-badge">
                <i class="bi bi-check2"></i> ${escapeHtml(servicio)}
              </span>
            `).join('')}
          </div>
          
          <div class="price-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span>Precio por noche:</span>
              <strong>${escapeHtml(formatPrice(room.precio))}</strong>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span>${escapeHtml(nights)} noche(s):</span>
              <strong>${escapeHtml(formatPrice(total))}</strong>
            </div>
            <hr class="my-2 border-white">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Total:</h5>
              <h4 class="mb-0">${escapeHtml(formatPrice(total))}</h4>
            </div>
          </div>
          
          <button class="btn btn-dark w-100 mt-3 btn-reserve" data-room-id="${room.id}">
            <i class="bi bi-calendar-check"></i> Reservar Ahora
          </button>
        </div>
      </div>
    </div>
  `;
}

function showBookingModal(roomId, fechaInicio, fechaFin, personas, nights) {
  if (!isAuthenticated()) {
    if (confirm('Debes iniciar sesión para hacer una reserva. ¿Deseas ir al login?')) {
      window.location.href = 'login.html';
    }
    return;
  }
  
  const room = getRoomById(roomId);
  const total = room.precio * nights;
  const user = getCurrentUser();
  
  if (!isRoomAvailable(roomId, fechaInicio, fechaFin)) {
    alert('Lo sentimos, esta habitación ya no está disponible para las fechas seleccionadas.');
    searchForm.dispatchEvent(new Event('submit'));
    return;
  }
  
  modalBody.innerHTML = `
    <div class="row">
      <div class="col-md-5">
        <img src="assets/img/rooms/${escapeHtml(room.imagen)}" class="img-fluid rounded mb-3" alt="${escapeHtml(room.nombre)}"
             onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(room.nombre)}'">
      </div>
      <div class="col-md-7">
        <h4 class="mb-3">${escapeHtml(room.nombre)}</h4>
        
        <div class="mb-3">
          <h6 class="text-muted">Detalles de la Reserva:</h6>
          <ul class="list-unstyled">
            <li><i class="bi bi-calendar-check text-gold"></i> <strong>Entrada:</strong> ${escapeHtml(new Date(fechaInicio).toLocaleDateString('es-CO', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}))}</li>
            <li><i class="bi bi-calendar-x text-gold"></i> <strong>Salida:</strong> ${escapeHtml(new Date(fechaFin).toLocaleDateString('es-CO', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}))}</li>
            <li><i class="bi bi-moon-stars text-gold"></i> <strong>Noches:</strong> ${escapeHtml(nights)}</li>
            <li><i class="bi bi-people text-gold"></i> <strong>Personas:</strong> ${escapeHtml(personas)}</li>
          </ul>
        </div>
        
        <div class="mb-3">
          <h6 class="text-muted">Servicios Incluidos:</h6>
          <div>
            ${room.servicios.map(s => `<span class="service-badge"><i class="bi bi-check2"></i> ${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>
        
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> 
          <strong>Importante:</strong> Una vez confirmada, podrás gestionar tu reserva desde "Mis Reservas".
        </div>
      </div>
    </div>
    
    <hr>
    
    <div class="row">
      <div class="col-md-6">
        <h6 class="text-muted mb-3">Resumen de Costos:</h6>
        <table class="table">
          <tbody>
            <tr>
              <td>Precio por noche</td>
              <td class="text-end">${escapeHtml(formatPrice(room.precio))}</td>
            </tr>
            <tr>
              <td>Cantidad de noches (${escapeHtml(nights)})</td>
              <td class="text-end">${escapeHtml(formatPrice(room.precio * nights))}</td>
            </tr>
            <tr class="table-dark">
              <td><strong>Total a Pagar</strong></td>
              <td class="text-end"><strong>${escapeHtml(formatPrice(total))}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col-md-6">
        <h6 class="text-muted mb-3">Datos del Huésped:</h6>
        <p class="mb-1"><strong>Nombre:</strong> ${escapeHtml(user.nombre)}</p>
        <p class="mb-1"><strong>Email:</strong> ${escapeHtml(user.email)}</p>
        <p class="mb-3"><i class="bi bi-shield-check text-success"></i> Usuario verificado</p>
      </div>
    </div>
    
    <hr>
    
    <div class="">
      <h6 class="mb-2"><i class=""></i>Check-in</h6>
      <ul class="mb-2 small">
        <li>Check-in disponible a partir de las 14:00</li>
        <li>Si no realiza el check-in efectivo antes de las 16:00, su reserva será cancelada automáticamente</li>
        <li>La habitación quedará disponible para otros huéspedes sin previo aviso</li>
      </ul>
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="acceptPolicies" required>
        <label class="form-check-label small" for="acceptPolicies">
         <a href="politicas.html" target="_blank" class="text-decoration-underline"> He leído y acepto las políticas del hotel</a>
        </label>
      </div>
    </div>
    
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
        <i class="bi bi-x-circle"></i> Cancelar
      </button>
      <button type="button" class="btn btn-gold" id="confirmBookingBtn" disabled>
        <i class="bi bi-check-circle"></i> Confirmar Reserva
      </button>
    </div>
  `;
  
  bookingModal.show();
  
  const acceptPolicies = document.getElementById('acceptPolicies');
  const confirmBtn = document.getElementById('confirmBookingBtn');
  
  acceptPolicies.addEventListener('change', function() {
    confirmBtn.disabled = !this.checked;
  });
  
  document.getElementById('confirmBookingBtn').addEventListener('click', () => {
    confirmBooking(roomId, fechaInicio, fechaFin, personas, total);
  });
}

function confirmBooking(roomId, fechaInicio, fechaFin, personas, total) {
  const user = getCurrentUser();
  
  const booking = addBooking({
    roomId: roomId,
    userId: user.id,
    fechaInicio: fechaInicio,
    fechaFin: fechaFin,
    personas: personas,
    total: total
  });
  
  if (booking) {
    bookingModal.hide();
    
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    successAlert.style.zIndex = '9999';
    successAlert.innerHTML = `
      <i class="bi bi-check-circle-fill"></i>
      <strong>¡Reserva Confirmada!</strong> Tu reserva ha sido creada exitosamente.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(successAlert);
    
    setTimeout(() => {
      successAlert.remove();
      window.location.href = 'mis-reservas.html';
    }, 3000);
  } else {
    alert('Error al crear la reserva. Por favor intenta nuevamente.');
  }
}

init();