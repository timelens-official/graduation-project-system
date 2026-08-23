/**
 * Animations Module
 */
const Animations = {
  // Slide up
  slideUp(element, duration = 350) {
    if (!element) return;
    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.transform = 'translateY(0)';
        element.style.opacity = '1';
      });
    });
  },

  // Stagger animation for list items
  staggerIn(elements, delay = 80) {
    elements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      
      setTimeout(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * delay);
    });
  },

  // Show toast notification
  showToast(message, type = 'info', duration = 3500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="color:#16A34A"><path d="M20 6L9 17l-5-5"/></svg>`,
      error: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="color:#DC2626"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
      info: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="color:#2563EB"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconWrap = document.createElement('span');
    iconWrap.innerHTML = icons[type] || icons.info; // fixed markup, no user input

    const text = document.createElement('span');
    text.textContent = message; // user-facing text stays as text, never parsed as HTML

    toast.append(iconWrap.firstElementChild, text);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  },

  // Loading button state
  setLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = `<div class="loading-spinner"></div><span>Processing...</span>`;
      button.disabled = true;
      button.style.opacity = '0.8';
    } else {
      button.innerHTML = button.dataset.originalText || button.innerHTML;
      button.disabled = false;
      button.style.opacity = '1';
    }
  },

  // Simple confetti burst inside a container element
  confetti(container, pieceCount = 60, clearAfter = 6000) {
    if (!container) return;
    const colors = ['#2563EB', '#16A34A', '#7C3AED', '#F59E0B', '#EC4899'];

    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.width = `${Math.random() * 10 + 6}px`;
      piece.style.height = `${Math.random() * 6 + 4}px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.opacity = Math.random() * 0.8 + 0.2;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.animationDuration = `${Math.random() * 3 + 2}s`;
      piece.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(piece);
    }

    setTimeout(() => { container.innerHTML = ''; }, clearAfter);
  }
};

// Intersection Observer for scroll animations
(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  });
})();