import { escapeHtml } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('checkinForm');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const reservaId = document.getElementById('reservaId').value;
      const clienteId = document.getElementById('clienteId').value;
      const clienteNombre = document.getElementById('clienteNombre').value;
      const horaLlegada = document.getElementById('horaLlegada').value;
      const observaciones = document.getElementById('observaciones').value;
      
      const checkins = JSON.parse(localStorage.getItem('hotel_checkins') || '[]');
      
      const nuevoCheckin = {
        id: Date.now(),
        reservaId: reservaId,
        clienteId: clienteId,
        clienteNombre: clienteNombre,
        horaLlegada: horaLlegada,
        observaciones: observaciones,
        fechaCheckin: new Date().toISOString(),
        estado: 'completado'
      };
      
      checkins.push(nuevoCheckin);
      localStorage.setItem('hotel_checkins', JSON.stringify(checkins));
      
      const resultDiv = document.getElementById('checkinResult');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div class="alert alert-success">
          <h5><i class="bi bi-check-circle"></i> Check-in Exitoso</h5>
          <p class="mb-1"><strong>Reserva:</strong> #${escapeHtml(reservaId)}</p>
          <p class="mb-1"><strong>Cliente:</strong> ${escapeHtml(clienteNombre)}</p>
          <p class="mb-1"><strong>Hora:</strong> ${escapeHtml(horaLlegada)}</p>
          <p class="mb-0"><strong>Fecha:</strong> ${escapeHtml(new Date().toLocaleDateString('es-CO'))}</p>
        </div>
      `;
      
      form.reset();
      
      setTimeout(() => {
        resultDiv.style.display = 'none';
      }, 5000);
    });
  }
});