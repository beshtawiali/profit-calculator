// FinCalc Common Utilities & Navigation Logic

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initCurrencySelector();
  initSearchFilter();
  initCopyButtons();
  initPrintButtons();
  initFAQAccordions();
});

// Mobile Navigation Menu Toggle
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');

  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
}

// Global Currency Selection Handling
let currentCurrency = localStorage.getItem('fincalc_currency') || '$';
const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$'
};

function initCurrencySelector() {
  const selector = document.getElementById('currency-select');
  if (selector) {
    selector.value = currentCurrency;
    selector.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem('fincalc_currency', currentCurrency);
      updateCurrencySymbolsInUI();
      // Dispatch custom event for calculators to recalculate if needed
      window.dispatchEvent(new CustomEvent('currencyChange', { detail: { symbol: currentCurrency } }));
    });
  }
  updateCurrencySymbolsInUI();
}

export function getCurrencySymbol() {
  return currentCurrency || '$';
}

function updateCurrencySymbolsInUI() {
  const symbolElements = document.querySelectorAll('.curr-symbol');
  symbolElements.forEach(el => {
    el.textContent = currentCurrency;
  });
}

// Format numbers nicely as currency
export function formatCurrency(amount) {
  if (isNaN(amount) || amount === null) return `${currentCurrency}0.00`;
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return amount < 0 ? `-${currentCurrency}${formatted}` : `${currentCurrency}${formatted}`;
}

export function formatPercent(val) {
  if (isNaN(val) || val === null) return '0.00%';
  return `${val.toFixed(2)}%`;
}

// Homepage Live Search Filter
function initSearchFilter() {
  const searchInput = document.getElementById('tool-search');
  if (!searchInput) return;

  const toolCards = document.querySelectorAll('.tool-card');
  const noResults = document.getElementById('no-search-results');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    let visibleCount = 0;

    toolCards.forEach(card => {
      const title = card.getAttribute('data-title')?.toLowerCase() || '';
      const desc = card.getAttribute('data-desc')?.toLowerCase() || '';
      const tags = card.getAttribute('data-tags')?.toLowerCase() || '';

      if (title.includes(query) || desc.includes(query) || tags.includes(query)) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  });
}

// Copy Results to Clipboard
function initCopyButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-results-btn');
    if (!btn) return;

    const targetId = btn.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const textToCopy = targetEl.innerText || targetEl.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Results copied to clipboard!');
    }).catch(() => {
      showToast('Failed to copy results');
    });
  });
}

// Print Handler
function initPrintButtons() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.print-calc-btn')) {
      window.print();
    }
  });
}

// Toast Notification
export function showToast(message) {
  let toast = document.getElementById('fincalc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fincalc-toast';
    toast.className = 'fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 opacity-0 transform translate-y-2 z-50 flex items-center space-x-2';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<svg class="w-4 h-4 text-emerald-400 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>${message}</span>`;
  
  // Show
  setTimeout(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');
  }, 10);

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-2');
  }, 3000);
}

// FAQ Accordions
function initFAQAccordions() {
  const faqButtons = document.querySelectorAll('.faq-accordion-btn');
  faqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      
      content.classList.toggle('hidden');
      if (icon) {
        icon.classList.toggle('rotate-180');
      }
    });
  });
}
