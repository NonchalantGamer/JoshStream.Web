/* VoxelFlow AI - Contact Form & FAQ Accordions */

class ContactFormHandler {
  constructor() {
    this.form = document.getElementById('contact-form');
    this.faqItems = document.querySelectorAll('.faq-item');
    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;

        if (!name || !email) {
          if (window.showToast) window.showToast('Please complete all required fields.', 'error');
          return;
        }

        // Simulate successful form submission
        if (window.showToast) {
          window.showToast(`Thank you, ${name}! Your demo request has been received. Our spatial expert will reach out within 2 hours.`);
        }

        this.form.reset();
      });
    }

    this.faqItems.forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('open');
      });
    });
  }
}

window.ContactFormHandler = ContactFormHandler;
