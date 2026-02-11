// ========================================
// SCRIPT PANEL ADMINISTRATIVO
// ========================================

import {
  isAdmin,
  logout,
  getCurrentUser,
  getStatistics,
  getRooms,
  getBookings,
  getUsers,
  getRoomById,
  getUserById,
  addRoom,
  updateRoom,
  deleteRoom,
  cancelBooking as cancelBookingStorage,
  formatPrice,
  formatDate
} from './storage.js';
import { escapeHtml } from './utils.js';

// Verificar que sea admin
if (!isAdmin()) {
  alert('Acceso denegado. Solo administradores.');
  window.location.href = 'index.html';
}

const user = getCurrentUser();
const adminNameEl = document.getElementById('adminName');
if (adminNameEl) adminNameEl.textContent = user.nombre;

// Variables globales
let currentRoomId = null;
const roomModal = new bootstrap.Modal(document.getElementById('roomModal'));

// Sidebar toggle móvil
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.toggle('show');
});

// Navegación
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    
    // Actualizar menú activo
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    // Mostrar sección
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(`${section}-section`).style.display = 'block';
    
    // Cargar datos
    if (section === 'rooms') loadRooms();
    else if (section === 'bookings') loadBookings();
    
    // Ocultar sidebar en móvil
    document.getElementById('adminSidebar').classList.remove('show');
  });
});

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  logout();
  window.location.href = 'login.html';
});

// Cargar habitaciones inicialmente
loadRooms();

// Funciones de carga de datos
function loadRooms() {
  const rooms = getRooms();
  const tbody = document.querySelector('#roomsTable tbody');
  tbody.innerHTML = '';

  if (rooms.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay habitaciones</td></tr>';
    return;
  }

  rooms.forEach(room => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(room.id)}</td>
      <td>${escapeHtml(room.nombre)}</td>
      <td>${escapeHtml(room.personas)}</td>
      <td>${escapeHtml(room.camas)}</td>
      <td>${escapeHtml(formatPrice(room.precioNoche || room.precio))}</td>
      <td>${escapeHtml(room.servicios.slice(0, 3).join(', '))}${room.servicios.length > 3 ? '...' : ''}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline-primary" onclick="window.openRoomModal(${room.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="window.deleteRoomById(${room.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function loadBookings() {
  filterBookings();
  
  // Configurar event listeners para filtros
  document.getElementById('allBookings').addEventListener('change', filterBookings);
  document.getElementById('confirmedBookings').addEventListener('change', filterBookings);
  document.getElementById('cancelledBookings').addEventListener('change', filterBookings);
}

function filterBookings() {
  const all = document.getElementById('allBookings').checked;
  const confirmed = document.getElementById('confirmedBookings').checked;
  const cancelled = document.getElementById('cancelledBookings').checked;

  const bookings = getBookings();
  const tbody = document.querySelector('#bookingsTable tbody');
  tbody.innerHTML = '';

  let filteredBookings = bookings;
  if (confirmed) {
    filteredBookings = bookings.filter(b => b.estado === 'confirmada');
  } else if (cancelled) {
    filteredBookings = bookings.filter(b => b.estado === 'cancelada');
  }

  if (filteredBookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No hay reservas</td></tr>';
    return;
  }

  filteredBookings.forEach(booking => {
    const room = getRoomById(booking.roomId || booking.habitacionId);
    const user = getUserById(booking.userId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(booking.id)}</td>
      <td>${escapeHtml(room ? room.nombre : 'N/A')}</td>
      <td>${escapeHtml(user ? user.nombre : (booking.nombreCliente || 'N/A'))}</td>
      <td>${escapeHtml(formatDate(booking.fechaInicio || booking.checkIn))}</td>
      <td>${escapeHtml(formatDate(booking.fechaFin || booking.checkOut))}</td>
      <td>${escapeHtml(booking.personas)}</td>
      <td>${escapeHtml(formatPrice(booking.total))}</td>
      <td>
        <span class="badge bg-${booking.estado === 'confirmada' ? 'success' : 'danger'}">
          ${escapeHtml(booking.estado.charAt(0).toUpperCase() + booking.estado.slice(1))}
        </span>
      </td>
      <td class="table-actions">
        ${booking.estado === 'confirmada' ? `
          <button class="btn btn-sm btn-outline-danger" onclick="window.cancelBooking(${booking.id})">
            <i class="bi bi-x-circle"></i> Cancelar
          </button>
        ` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Funciones de gestión de habitaciones
window.openRoomModal = function(id = null) {
  currentRoomId = id;
  document.getElementById('roomForm').reset();
  document.getElementById('servicesContainer').innerHTML = `
    <div class="input-group mb-2">
      <input type="text" class="form-control service-input" placeholder="Ej: WiFi">
      <button type="button" class="btn btn-outline-secondary" onclick="window.addServiceInput()">
        <i class="bi bi-plus"></i>
      </button>
    </div>
  `;

  if (id) {
    const room = getRoomById(id);
    if (room) {
      document.getElementById('roomModalTitle').innerHTML = `<i class="bi bi-pencil"></i> Editar Habitación`;
      document.getElementById('roomId').value = room.id;
      document.getElementById('roomName').value = room.nombre;
      document.getElementById('roomImage').value = room.imagen;
      document.getElementById('roomDescription').value = room.descripcion;
      document.getElementById('roomBeds').value = room.camas;
      document.getElementById('roomPersons').value = room.personas;
      document.getElementById('roomPrice').value = room.precioNoche || room.precio;

      const servicesContainer = document.getElementById('servicesContainer');
      servicesContainer.innerHTML = '';
      room.servicios.forEach((servicio) => {
        const div = document.createElement('div');
        div.className = 'input-group mb-2';
        div.innerHTML = `
          <input type="text" class="form-control service-input" value="${escapeHtml(servicio)}" placeholder="Ej: WiFi">
          <button type="button" class="btn btn-outline-danger" onclick="window.removeServiceInput(this)">
            <i class="bi bi-dash"></i>
          </button>
        `;
        servicesContainer.appendChild(div);
      });

      const addDiv = document.createElement('div');
      addDiv.className = 'input-group mb-2';
      addDiv.innerHTML = `
        <input type="text" class="form-control service-input" placeholder="Ej: WiFi">
        <button type="button" class="btn btn-outline-secondary" onclick="window.addServiceInput()">
          <i class="bi bi-plus"></i>
        </button>
      `;
      servicesContainer.appendChild(addDiv);
    }
  } else {
    document.getElementById('roomModalTitle').innerHTML = `<i class="bi bi-door-closed"></i> Nueva Habitación`;
    document.getElementById('roomId').value = '';
  }
  roomModal.show();
};

window.addServiceInput = function() {
  const servicesContainer = document.getElementById('servicesContainer');
  const div = document.createElement('div');
  div.className = 'input-group mb-2';
  div.innerHTML = `
    <input type="text" class="form-control service-input" placeholder="Ej: WiFi">
    <button type="button" class="btn btn-outline-danger" onclick="window.removeServiceInput(this)">
      <i class="bi bi-dash"></i>
    </button>
  `;
  servicesContainer.appendChild(div);
};

window.removeServiceInput = function(button) {
  button.parentElement.remove();
};

document.getElementById('roomForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const id = document.getElementById('roomId').value;
  const nombre = document.getElementById('roomName').value.trim();
  const imagen = document.getElementById('roomImage').value.trim();
  const descripcion = document.getElementById('roomDescription').value.trim();
  const camas = parseInt(document.getElementById('roomBeds').value);
  const personas = parseInt(document.getElementById('roomPersons').value);
  const precioNoche = parseFloat(document.getElementById('roomPrice').value);
  
  const servicios = Array.from(document.querySelectorAll('.service-input'))
    .map(input => input.value.trim())
    .filter(val => val !== '');
  
  if (!nombre || !imagen || !descripcion || isNaN(camas) || isNaN(personas) || isNaN(precioNoche)) {
    alert('Por favor, completa todos los campos obligatorios.');
    return;
  }
  
  const roomData = { 
    nombre, 
    imagen, 
    descripcion, 
    camas, 
    personas, 
    precioNoche, 
    precio: precioNoche,
    servicios 
  };
  
  if (id) {
    updateRoom(parseInt(id), roomData);
    alert('Habitación actualizada correctamente.');
  } else {
    addRoom(roomData);
    alert('Nueva habitación añadida correctamente.');
  }
  
  roomModal.hide();
  loadRooms();
});

window.deleteRoomById = function(id) {
  if (confirm('¿Estás seguro de eliminar esta habitación? Esta acción no se puede deshacer.')) {
    deleteRoom(id);
    alert('Habitación eliminada correctamente.');
    loadRooms();
  }
};

window.cancelBooking = function(id) {
  if (confirm('¿Estás seguro de cancelar esta reserva?')) {
    cancelBookingStorage(id);
    alert('Reserva cancelada correctamente.');
    loadBookings();
  }
};

window.viewUser = function(id) {
  const user = getUserById(id);
  if (user) {
    const bookingsCount = getBookings().filter(b => b.userId === user.id).length;
    const activeBookingsCount = getBookings().filter(b => b.userId === user.id && b.estado === 'confirmada').length;
    
    alert(`


ID: ${user.id}
Nombre: ${user.nombre}
Email: ${user.email}
Teléfono: ${user.telefono || 'N/A'}
Identificación: ${user.identificacion || 'N/A'}
Nacionalidad: ${user.nacionalidad || 'N/A'}
Rol: ${user.role === 'admin' ? 'Administrador' : 'Usuario'}
Fecha de Registro: ${formatDate(user.fechaRegistro)}
Total de Reservas: ${bookingsCount}
Reservas Activas: ${activeBookingsCount}
    `);
  } else {
    alert('Usuario no encontrado.');
  }
};