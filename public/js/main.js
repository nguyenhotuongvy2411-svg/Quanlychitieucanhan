// Main JavaScript file for Personal Finance Manager

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeComponents();
    setupEventListeners();
    initializeAnimations();
});

// Initialize Components
function initializeComponents() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Format currency inputs
    formatCurrencyInputs();

    // Initialize number formatting
    formatNumbers();
}

// Setup Event Listeners
function setupEventListeners() {
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Confirm delete actions
    const deleteButtons = document.querySelectorAll('[data-confirm-delete]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm-delete') || 'Bạn có chắc chắn muốn xóa?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });

    // Toggle password visibility
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    // Auto-submit forms on change (for filters)
    const autoSubmitForms = document.querySelectorAll('.auto-submit');
    autoSubmitForms.forEach(form => {
        form.addEventListener('change', function() {
            this.submit();
        });
    });

    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('[data-copy]');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const text = this.getAttribute('data-copy');
            navigator.clipboard.writeText(text).then(() => {
                showToast('Đã sao chép vào clipboard!', 'success');
            });
        });
    });
}

// Initialize Animations
function initializeAnimations() {
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });

    // Add slide-in animations for dashboard elements
    const leftElements = document.querySelectorAll('.slide-in-left');
    const rightElements = document.querySelectorAll('.slide-in-right');

    leftElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('slide-in-left');
        }, index * 150);
    });

    rightElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('slide-in-right');
        }, index * 150);
    });
}

// Format Currency Inputs
function formatCurrencyInputs() {
    const currencyInputs = document.querySelectorAll('.currency-input');
    currencyInputs.forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/[^\d]/g, '');
            if (value) {
                value = parseInt(value).toLocaleString('vi-VN');
                this.value = value;
            }
        });

        // Format on load
        if (input.value) {
            let value = input.value.replace(/[^\d]/g, '');
            if (value) {
                input.value = parseInt(value).toLocaleString('vi-VN');
            }
        }
    });
}

// Format Numbers
function formatNumbers() {
    const numberElements = document.querySelectorAll('.format-number');
    numberElements.forEach(element => {
        const value = parseFloat(element.textContent.replace(/[^\d.-]/g, ''));
        if (!isNaN(value)) {
            element.textContent = value.toLocaleString('vi-VN');
        }
    });
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Create Toast Container
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Loading State Management
function showLoading(button) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...';
    button.setAttribute('data-original-text', originalText);
}

function hideLoading(button) {
    button.disabled = false;
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
        button.innerHTML = originalText;
    }
}

// Form Validation Helpers
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });

    return isValid;
}

// Date Helpers
function formatDate(date) {
    return new Date(date).toLocaleDateString('vi-VN');
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('vi-VN');
}

// Currency Helpers
function formatCurrency(amount, currency = 'VND') {
    return `${currency} ${parseFloat(amount).toLocaleString('vi-VN')}`;
}

// Export functions for global use
window.PFM = {
    showLoading,
    hideLoading,
    validateForm,
    formatDate,
    formatDateTime,
    formatCurrency,
    showToast
};
