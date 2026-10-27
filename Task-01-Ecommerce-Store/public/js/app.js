// Application Initialization

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Lumina E-Commerce Application...');

  // Initialize all client modules
  window.UI.init();
  window.CartModule.init();
  window.ProductsModule.init();
  window.DetailsModule.init();
  window.CheckoutModule.init();
  window.AuthModule.init();

  // Hero Explore Button smooth scroll
  const exploreBtn = document.getElementById('btn-hero-explore');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  console.log('Lumina E-Commerce ready.');
});
