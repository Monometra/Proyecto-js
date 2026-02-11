// ========================================
// SCRIPT: MIS RESERVAS (Solo Visualización)
// ========================================

import {
  isAuthenticated,
  getCurrentUser,
  getUserBookings,
  getRoomById,
  formatPrice,
  formatDate
} from './storage.js';
import { escapeHtml } from './utils.js';

let allBookings = [];
let currentFilter = 'all';
let detailsModal = null;

document.addEventListener('DOMContentLoaded', init);

function init() {
  verifyAuthentication();
  setupUserProfile();
  setupModal();
  setupFilters();
  loadBookings();
}

function verifyAuthentication() {
  if (!isAuthenticated()) {
    alert('Debes iniciar sesión para ver tus reservas');
    window.location.href = 'login.html';
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    alert('Error al cargar los datos del usuario');
    window.location.href = 'login.html';
  }
}

function setupUserProfile() {
  const user = getCurrentUser();
  if (!user) return;

  const userNameEl = document.getElementById('userName');
  const profileNameEl = document.getElementById('profileName');
  const profileEmailEl = document.getElementById('profileEmail');

  if (userNameEl) userNameEl.textContent = user.nombre.split(' ')[0];
  if (profileNameEl) profileNameEl.textContent = user.nombre;
  if (profileEmailEl) profileEmailEl.textContent = user.email;
}

function setupModal() {
  const detailsModalEl = document.getElementById('detailsModal');
  if (detailsModalEl) {
    detailsModal = new bootstrap.Modal(detailsModalEl);
  }
}

function loadBookings() {
  try {
    const user = getCurrentUser();
    allBookings = getUserBookings(user.id) || [];
    console.log('Reservas cargadas:', allBookings);
    updateStats();
    renderBookings();
  } catch (error) {
    console.error('Error al cargar reservas:', error);
    showAlert('Error al cargar las reservas', 'danger');
  }
}

function updateStats() {
  const active = allBookings.filter(b => b.estado === 'confirmada').length;
  const totalSpent = allBookings
    .filter(b => b.estado === 'confirmada')
    .reduce((sum, b) => sum + b.total, 0);

  setText('totalBookings', allBookings.length);
  setText('activeBookings', active);
  setText('totalSpent', formatPrice(totalSpent));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderBookings() {
  const container = document.getElementById('bookingsContainer');
  if (!container) return;

  const filteredBookings = getFilteredBookings();

  if (filteredBookings.length === 0) {
    container.innerHTML = renderEmptyState();
    return;
  }

  container.innerHTML = filteredBookings.map(createBookingCard).join('');
  attachDetailListeners();
}

function getFilteredBookings() {
  switch (currentFilter) {
    case 'active':
      return allBookings.filter(b => b.estado === 'confirmada' && new Date(b.fechaFin) >= new Date());
    case 'past':
      return allBookings.filter(b => new Date(b.fechaFin) < new Date());
    default:
      return allBookings;
  }
}

function createBookingCard(booking) {
  const room = getRoomById(booking.roomId);
  if (!room) {
    return `
      <div class="booking-card">
        <div class="booking-header bg-danger text-white">
          Error: Habitación no encontrada (ID: ${escapeHtml(booking.roomId)})
        </div>
      </div>`;
  }

  const isActive = booking.estado === 'confirmada';
  const isPast = new Date(booking.fechaFin) < new Date();

  return `
    <div class="booking-card">
      <div class="booking-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="mb-1">${escapeHtml(room.nombre)}</h5>
          <small>Reserva #${escapeHtml(booking.id)}</small>
        </div>
        <span class="booking-status status-${booking.estado}">
          <i class="bi bi-${isActive ? 'check-circle' : 'x-circle'}"></i>
          ${isActive ? 'Confirmada' : 'Cancelada'}
        </span>
      </div>

      <div class="booking-body row">
        <div class="col-md-4 mb-3 mb-md-0">
          <img src="assets/img/rooms/${escapeHtml(room.imagen)}" 
               alt="${escapeHtml(room.nombre)}" 
               class="booking-image"
               onerror="this.src='https://picsum.photos/400/300?random=${booking.id}'">
        </div>

        <div class="col-md-8">
          ${renderBookingInfo(booking, room, isActive, isPast)}
        </div>
      </div>
    </div>`;
}

function renderBookingInfo(booking, room, isActive, isPast) {
  return `
    <div class="info-row">
      <i class="bi bi-calendar-check text-gold"></i> Check-in: 
      <strong>${escapeHtml(formatDate(booking.fechaInicio))}</strong>
    </div>
    <div class="info-row">
      <i class="bi bi-calendar-x text-gold"></i> Check-out: 
      <strong>${escapeHtml(formatDate(booking.fechaFin))}</strong>
    </div>
    <div class="info-row">
      <i class="bi bi-people text-gold"></i> Personas: 
      <strong>${escapeHtml(booking.personas)}</strong>
    </div>
    <div class="info-row">
      <i class="bi bi-currency-dollar text-gold"></i> Total: 
      <strong class="text-gold">${escapeHtml(formatPrice(booking.total))}</strong>
    </div>

    <div class="mt-3 d-flex gap-2 flex-wrap">
      <button class="btn btn-sm btn-outline-dark btn-view-details" data-booking-id="${booking.id}">
        <i class="bi bi-eye"></i> Ver Detalles Completos
      </button>
      ${isPast && isActive ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Completada</span>' : ''}
      ${!isPast && isActive ? '<span class="badge bg-info"><i class="bi bi-clock"></i> Próxima</span>' : ''}
    </div>`;
}

function attachDetailListeners() {
  document.querySelectorAll('.btn-view-details').forEach(btn => {
    btn.addEventListener('click', () => showDetails(parseInt(btn.dataset.bookingId)));
  });
}

function showDetails(bookingId) {
  const booking = allBookings.find(b => b.id === bookingId);
  if (!booking) return showAlert('Reserva no encontrada', 'danger');

  const room = getRoomById(booking.roomId);
  if (!room) return showAlert('Información de la habitación no disponible', 'danger');

  const nights = getNightsBetween(booking.fechaInicio, booking.fechaFin);

  document.getElementById('detailsBody').innerHTML = renderBookingDetails(booking, room, nights);

  if (detailsModal) detailsModal.show();
}

function getNightsBetween(start, end) {
  return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
}

function renderBookingDetails(booking, room, nights) {
  return `
    <div class="row">
      <div class="col-md-6">
        <img src="assets/img/rooms/${escapeHtml(room.imagen)}" 
             class="img-fluid rounded mb-3" 
             alt="${escapeHtml(room.nombre)}"
             onerror="this.src='https://picsum.photos/500/400?random=${booking.id}'">
      </div>

      <div class="col-md-6">
        <h4 class="mb-3">${escapeHtml(room.nombre)}</h4>
        <p class="text-muted">${escapeHtml(room.descripcion)}</p>

        ${renderBookingDetailsInfo(booking, nights)}
        ${renderServices(room.servicios)}
        ${renderCostDetails(room, nights, booking.total)}
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
        <i class="bi bi-x-circle"></i> Cerrar
      </button>
    </div>`;
}

function renderBookingDetailsInfo(booking, nights) {
  return `
    <h6 class="mt-4 mb-3 text-gold"><i class="bi bi-info-circle"></i> Información de la Reserva</h6>
    <ul class="list-unstyled">
      <li><i class="bi bi-hash text-gold"></i> <strong>ID:</strong> ${escapeHtml(booking.id)}</li>
      <li><i class="bi bi-calendar-check text-gold"></i> <strong>Check-in:</strong> ${escapeHtml(formatDate(booking.fechaInicio))}</li>
      <li><i class="bi bi-calendar-x text-gold"></i> <strong>Check-out:</strong> ${escapeHtml(formatDate(booking.fechaFin))}</li>
      <li><i class="bi bi-moon-stars text-gold"></i> <strong>Noches:</strong> ${escapeHtml(nights)}</li>
      <li><i class="bi bi-people text-gold"></i> <strong>Personas:</strong> ${escapeHtml(booking.personas)}</li>
      <li><i class="bi bi-clock text-gold"></i> <strong>Fecha de reserva:</strong> ${escapeHtml(formatDate(booking.fechaReserva))}</li>
      <li><i class="bi bi-info-circle text-gold"></i> <strong>Estado:</strong> 
        <span class="booking-status status-${booking.estado}">
          ${booking.estado === 'confirmada' ? 'Confirmada' : 'Cancelada'}
        </span>
      </li>
    </ul>`;
}

function renderServices(services = []) {
  return `
    <h6 class="mt-4 mb-3 text-gold"><i class="bi bi-star"></i> Servicios Incluidos</h6>
    <div class="mb-3">
      ${services.map(s => `<span class="service-badge"><i class="bi bi-check2"></i> ${escapeHtml(s)}</span>`).join('')}
    </div>`;
}

function renderCostDetails(room, nights, total) {
  return `
    <div class="alert alert-info">
      <h6 class="alert-heading"><i class="bi bi-currency-dollar"></i> Detalles del Costo</h6>
      <div class="d-flex justify-content-between mb-1">
        <span>Precio por noche:</span><strong>${escapeHtml(formatPrice(room.precio))}</strong>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span>Noches (${escapeHtml(nights)}):</span><strong>${escapeHtml(formatPrice(room.precio * nights))}</strong>
      </div>
      <hr>
      <div class="d-flex justify-content-between">
        <span><strong>Total Pagado:</strong></span>
        <h5 class="text-gold mb-0">${escapeHtml(formatPrice(total))}</h5>
      </div>
    </div>`;
}

function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

function setupFilters() {
  const filters = {
    filterAll: 'all',
    filterActive: 'active',
    filterPast: 'past'
  };

  Object.entries(filters).forEach(([id, filter]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      currentFilter = filter;
      renderBookings();
    });
  });
}

function renderEmptyState() {
  return `
    <div class="empty-bookings text-center">
      <i class="bi bi-calendar-x fs-1 text-muted"></i>
      <h3 class="text-muted">No tienes reservas</h3>
      <p class="text-muted">¡Haz tu primera reserva y disfruta de nuestras suites de lujo!</p>
      <a href="reservas.html" class="btn btn-gold mt-3">
        <i class="bi bi-plus-circle"></i> Nueva Reserva
      </a>
    </div>`;
}
