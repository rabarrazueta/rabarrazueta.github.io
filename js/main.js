// processia-landing/js/main.js
// Configuración
const CONFIG = {
  webhookUrl: 'https://voltifyec.me/webhook/processia-contact-form',
  apiKey: 'PrOc3ss1A_2026_k3Y_s3cUr3_9X7zQ0915', // Mismo token del webhook
  timeout: 10000 // 10 segundos
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit);
  }
});

// Manejador principal del formulario
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const submitButton = e.target.querySelector('button[type="submit"]');
  const formData = new FormData(e.target);
  
  // Preparar datos
  const data = {
    nombre: formData.get('nombre')?.trim(),
    email: formData.get('email')?.trim().toLowerCase(),
    empresa: formData.get('empresa')?.trim() || 'No especificada',
    telefono: formData.get('telefono')?.trim() || '',
    mensaje: formData.get('mensaje')?.trim(),
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'processia.online',
      userAgent: navigator.userAgent,
      language: navigator.language,
      referrer: document.referrer || 'direct'
    }
  };
  
  // Validación frontend
  if (!validateFormData(data)) {
    showMessage('Por favor completa todos los campos requeridos.', 'error');
    return;
  }
  
  // UI feedback
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
  
  try {
    const response = await sendToWebhook(data);
    
    if (response.success) {
      showMessage('¡Gracias! Nos pondremos en contacto pronto.', 'success');
      e.target.reset();
      
      // Analytics (opcional)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submission', {
          'event_category': 'Contact',
          'event_label': 'Processia Contact Form'
        });
      }
    } else {
      throw new Error(response.message || 'Error al enviar el formulario');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage(
      'Hubo un problema al enviar tu mensaje. Por favor intenta nuevamente o escríbenos a contacto@processia.online',
      'error'
    );
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Enviar Mensaje';
  }
}

// Enviar datos al webhook con timeout y retry
async function sendToWebhook(data) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
  
  try {
    const response = await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Processia-Key': CONFIG.apiKey
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Verifica tu conexión.');
    }
    throw error;
  }
}

// Validación de datos
function validateFormData(data) {
  if (!data.nombre || data.nombre.length < 2) return false;
  if (!data.email || !isValidEmail(data.email)) return false;
  if (!data.mensaje || data.mensaje.length < 10) return false;
  return true;
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Mostrar mensajes al usuario
function showMessage(message, type = 'info') {
  // Buscar o crear contenedor de mensajes
  let messageContainer = document.getElementById('formMessage');
  
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'formMessage';
    messageContainer.style.cssText = 'margin-top: 1rem;';
    const form = document.getElementById('contactForm');
    form.parentNode.insertBefore(messageContainer, form.nextSibling);
  }
  
  const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
  messageContainer.innerHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  // Auto-cerrar después de 8 segundos
  setTimeout(() => {
    messageContainer.innerHTML = '';
  }, 8000);
  
  // Scroll suave al mensaje
  messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Validación en tiempo real (UX mejorada)
document.addEventListener('DOMContentLoaded', function() {
  const emailInput = document.querySelector('input[name="email"]');
  
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      if (this.value && !isValidEmail(this.value)) {
        this.classList.add('is-invalid');
      } else {
        this.classList.remove('is-invalid');
      }
    });
  }
});

