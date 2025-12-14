// Mobile Navigation
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if(bar){
  bar.addEventListener('click', () => {
    nav.classList.add('active');
  })
}
if (close){
  close.addEventListener('click', () => {
    nav.classList.remove('active');
  })
}

// ==================== CART FUNCTIONALITY ====================

class ShoppingCart {
  constructor() {
    this.items = this.loadCart();
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.attachProductClickHandlers();
    this.updateCartDisplay();
    this.updateCartCount();
  }

  attachProductClickHandlers() {
    // Handle product card clicks for navigation to detail page
    document.querySelectorAll('.pro').forEach(productCard => {
      // Remove any inline onclick attributes to prevent conflicts
      productCard.removeAttribute('onclick');
      
      productCard.addEventListener('click', (e) => {
        // Don't navigate if clicking the cart icon
        if (e.target.closest('.cart')) {
          return;
        }
        
        // Navigate to product detail page
        window.location.href = 'sproduct.html';
      });
      
      // Make cursor pointer for the whole card
      productCard.style.cursor = 'pointer';
    });
  }

  loadCart() {
    const saved = localStorage.getItem('localArtHubCart');
    return saved ? JSON.parse(saved) : [];
  }

  saveCart() {
    localStorage.setItem('localArtHubCart', JSON.stringify(this.items));
  }

  attachEventListeners() {
    // Add to cart buttons - ONLY for cart icon clicks
    document.querySelectorAll('.pro .cart').forEach(cartIcon => {
      cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productCard = e.target.closest('.pro');
        if (productCard) {
          this.addToCart(productCard);
        }
      });
    });

    // Cart page - remove items
    document.querySelectorAll('#cart .fa-times-circle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const row = e.target.closest('tr');
        const productName = row.querySelector('td:nth-child(3)').textContent;
        this.removeFromCart(productName);
      });
    });

    // Cart page - quantity changes
    document.querySelectorAll('#cart input[type="number"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const row = e.target.closest('tr');
        const productName = row.querySelector('td:nth-child(3)').textContent;
        const newQuantity = parseInt(e.target.value) || 1;
        this.updateQuantity(productName, newQuantity);
      });
    });

    // Single product page - Add to cart
    const singleProductBtn = document.querySelector('#prodetails button.normal');
    if (singleProductBtn) {
      singleProductBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.addSingleProductToCart();
      });
    }

    // Checkout button
    const checkoutBtn = document.querySelector('#subtotal button.normal');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.checkout();
      });
    }

    // Apply coupon
    const couponBtn = document.querySelector('#coupon button.normal');
    if (couponBtn) {
      couponBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyCoupon();
      });
    }
  }

  addToCart(productCard) {
    const name = productCard.querySelector('.des h5').textContent;
    const priceText = productCard.querySelector('.des h4').textContent;
    const price = parseInt(priceText.replace(/[^0-9]/g, ''));
    const image = productCard.querySelector('img').src;
    const category = productCard.querySelector('.des span').textContent;

    const existingItem = this.items.find(item => item.name === name);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        name,
        price,
        image,
        category,
        quantity: 1
      });
    }

    this.saveCart();
    this.updateCartCount();
    this.showNotification(`${name} added to cart!`);
  }

  addSingleProductToCart() {
    const name = document.querySelector('#prodetails .single-pro-details h4').textContent;
    const priceText = document.querySelector('#prodetails .single-pro-details h2').textContent;
    const price = parseInt(priceText.replace(/[^0-9]/g, ''));
    const image = document.querySelector('#prodetails #MainImg').src;
    const quantity = parseInt(document.querySelector('#prodetails input[type="number"]').value) || 1;
    const size = document.querySelector('#prodetails select').value;

    const existingItem = this.items.find(item => item.name === name && item.size === size);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        name,
        price,
        image,
        size,
        quantity
      });
    }

    this.saveCart();
    this.updateCartCount();
    this.showNotification(`${quantity} x ${name} added to cart!`);
  }

  removeFromCart(productName) {
    this.items = this.items.filter(item => item.name !== productName);
    this.saveCart();
    this.updateCartDisplay();
    this.updateCartCount();
    this.showNotification('Item removed from cart');
  }

  updateQuantity(productName, newQuantity) {
    const item = this.items.find(item => item.name === productName);
    if (item) {
      item.quantity = Math.max(1, newQuantity);
      this.saveCart();
      this.updateCartDisplay();
    }
  }

  updateCartDisplay() {
    const cartTableBody = document.querySelector('#cart tbody');
    if (!cartTableBody) return;

    cartTableBody.innerHTML = '';

    if (this.items.length === 0) {
      cartTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 50px;">
            Your cart is empty. <a href="shop.html" style="color: #088178;">Continue shopping</a>
          </td>
        </tr>
      `;
      this.updateCartTotals(0);
      return;
    }

    this.items.forEach(item => {
      const subtotal = item.price * item.quantity;
      const row = `
        <tr>
          <td><a href="#"><i class="far fa-times-circle"></i></a></td>
          <td><img src="${item.image}" alt="${item.name}"></td>
          <td>${item.name}</td>
          <td>Rs. ${item.price}</td>
          <td><input type="number" value="${item.quantity}" min="1"></td>
          <td>Rs. ${subtotal}</td>
        </tr>
      `;
      cartTableBody.innerHTML += row;
    });

    // Re-attach event listeners for new elements
    this.attachCartPageListeners();

    const total = this.calculateTotal();
    this.updateCartTotals(total);
  }

  attachCartPageListeners() {
    document.querySelectorAll('#cart .fa-times-circle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const row = e.target.closest('tr');
        const productName = row.querySelector('td:nth-child(3)').textContent;
        this.removeFromCart(productName);
      });
    });

    document.querySelectorAll('#cart input[type="number"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const row = e.target.closest('tr');
        const productName = row.querySelector('td:nth-child(3)').textContent;
        const newQuantity = parseInt(e.target.value) || 1;
        this.updateQuantity(productName, newQuantity);
      });
    });
  }

  calculateTotal() {
    return this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  updateCartTotals(subtotal) {
    const discount = this.getDiscount();
    const shipping = subtotal > 0 ? 0 : 0; // Free shipping
    const total = subtotal - discount + shipping;

    const subtotalTable = document.querySelector('#subtotal table');
    if (subtotalTable) {
      subtotalTable.innerHTML = `
        <tr>
          <td>Cart Subtotal</td>
          <td>Rs. ${subtotal}</td>
        </tr>
        ${discount > 0 ? `<tr><td>Discount</td><td>- Rs. ${discount}</td></tr>` : ''}
        <tr>
          <td>Shipping</td>
          <td>Free</td>
        </tr>
        <tr>
          <td><strong>Total</strong></td>
          <td><strong>Rs. ${total}</strong></td>
        </tr>
      `;
    }
  }

  updateCartCount() {
    const count = this.items.reduce((total, item) => total + item.quantity, 0);
    const cartIcons = document.querySelectorAll('.fa-shopping-cart');
    
    cartIcons.forEach(icon => {
      let badge = icon.parentElement.querySelector('.cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        icon.parentElement.style.position = 'relative';
        icon.parentElement.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  applyCoupon() {
    const couponInput = document.querySelector('#coupon input');
    const code = couponInput.value.trim().toUpperCase();
    
    const validCoupons = {
      'SAVE10': 10,
      'WELCOME20': 20,
      'ART50': 50
    };

    if (validCoupons[code]) {
      localStorage.setItem('appliedCoupon', code);
      localStorage.setItem('discountPercent', validCoupons[code]);
      this.updateCartDisplay();
      this.showNotification(`Coupon applied! ${validCoupons[code]}% discount`);
    } else {
      this.showNotification('Invalid coupon code', 'error');
    }
  }

  getDiscount() {
    const coupon = localStorage.getItem('appliedCoupon');
    const discountPercent = parseInt(localStorage.getItem('discountPercent')) || 0;
    
    if (coupon && discountPercent) {
      const subtotal = this.calculateTotal();
      return Math.floor(subtotal * discountPercent / 100);
    }
    return 0;
  }

  checkout() {
    if (this.items.length === 0) {
      this.showNotification('Your cart is empty!', 'error');
      return;
    }

    const total = this.calculateTotal() - this.getDiscount();
    const confirmed = confirm(`Proceed to checkout?\n\nTotal: Rs. ${total}\n\nNote: This is a demo. Payment integration coming soon.`);
    
    if (confirmed) {
      // Clear cart
      this.items = [];
      this.saveCart();
      localStorage.removeItem('appliedCoupon');
      localStorage.removeItem('discountPercent');
      
      this.showNotification('Order placed successfully! (Demo)', 'success');
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    }
  }

  showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// ==================== FORM VALIDATION ====================

class FormHandler {
  constructor() {
    this.init();
  }

  init() {
    // Newsletter forms
    document.querySelectorAll('#newsletter .form').forEach(form => {
      const button = form.querySelector('button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleNewsletterSubmit(form);
        });
      }
    });

    // Contact form
    const contactForm = document.querySelector('#form-details form');
    if (contactForm) {
      const submitBtn = contactForm.querySelector('button');
      if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleContactSubmit(contactForm);
        });
      }
    }
  }

  handleNewsletterSubmit(form) {
    const input = form.querySelector('input[type="text"]');
    const email = input.value.trim();

    if (!this.validateEmail(email)) {
      this.showFormNotification('Please enter a valid email address', 'error');
      input.focus();
      return;
    }

    // Save to localStorage (in production, send to backend)
    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    
    if (subscribers.includes(email)) {
      this.showFormNotification('You are already subscribed!', 'info');
      return;
    }

    subscribers.push(email);
    localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));

    this.showFormNotification('Successfully subscribed to newsletter!', 'success');
    input.value = '';
  }

  handleContactSubmit(form) {
    const name = form.querySelector('input[placeholder="Your Name"]').value.trim();
    const email = form.querySelector('input[placeholder="Your Email"]').value.trim();
    const subject = form.querySelector('input[placeholder="Subject"]').value.trim();
    const message = form.querySelector('textarea').value.trim();

    // Validation
    if (!name) {
      this.showFormNotification('Please enter your name', 'error');
      return;
    }

    if (!this.validateEmail(email)) {
      this.showFormNotification('Please enter a valid email address', 'error');
      return;
    }

    if (!subject) {
      this.showFormNotification('Please enter a subject', 'error');
      return;
    }

    if (!message || message.length < 10) {
      this.showFormNotification('Please enter a message (at least 10 characters)', 'error');
      return;
    }

    // Save message (in production, send to backend)
    const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
    messages.push({
      name,
      email,
      subject,
      message,
      date: new Date().toISOString()
    });
    localStorage.setItem('contact_messages', JSON.stringify(messages));

    this.showFormNotification('Message sent successfully! We will get back to you soon.', 'success');
    
    // Clear form
    form.reset();
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  showFormNotification(message, type = 'success') {
    const existing = document.querySelector('.form-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `form-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

// ==================== PRODUCT FILTERING & SEARCH ====================

class ProductFilter {
  constructor() {
    this.products = this.getAllProducts();
    this.init();
  }

  init() {
    this.createSearchBar();
    this.createFilterOptions();
  }

  getAllProducts() {
    const products = [];
    document.querySelectorAll('.pro').forEach(pro => {
      const name = pro.querySelector('.des h5')?.textContent || '';
      const category = pro.querySelector('.des span')?.textContent || '';
      const priceText = pro.querySelector('.des h4')?.textContent || '0';
      const price = parseInt(priceText.replace(/[^0-9]/g, ''));
      
      products.push({
        element: pro,
        name: name.toLowerCase(),
        category: category.toLowerCase(),
        price: price
      });
    });
    return products;
  }

  createSearchBar() {
    const shopHeader = document.querySelector('#page-header');
    if (!shopHeader || !document.querySelector('#product1')) return;

    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-filter-container';
    searchContainer.innerHTML = `
      <div class="search-box">
        <input type="text" id="productSearch" placeholder="Search products...">
        <i class="fas fa-search"></i>
      </div>
      <div class="filter-box">
        <select id="categoryFilter">
          <option value="">All Categories</option>
          <option value="vase">Vase</option>
          <option value="painting">Painting</option>
          <option value="textile">Textile</option>
          <option value="weapon">Weapon</option>
          <option value="woodwork">Woodwork</option>
        </select>
        <select id="priceFilter">
          <option value="">All Prices</option>
          <option value="0-1500">Under Rs. 1500</option>
          <option value="1500-3000">Rs. 1500 - 3000</option>
          <option value="3000-5000">Rs. 3000 - 5000</option>
          <option value="5000+">Above Rs. 5000</option>
        </select>
      </div>
    `;

    const productSection = document.querySelector('#product1');
    if (productSection) {
      productSection.insertBefore(searchContainer, productSection.firstChild);
    }

    // Attach event listeners
    document.getElementById('productSearch')?.addEventListener('input', (e) => this.filterProducts());
    document.getElementById('categoryFilter')?.addEventListener('change', () => this.filterProducts());
    document.getElementById('priceFilter')?.addEventListener('change', () => this.filterProducts());
  }

  createFilterOptions() {
    // Already created in searchBar
  }

  filterProducts() {
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value.toLowerCase() || '';
    const priceFilter = document.getElementById('priceFilter')?.value || '';

    let visibleCount = 0;

    this.products.forEach(product => {
      let visible = true;

      // Search filter
      if (searchTerm && !product.name.includes(searchTerm)) {
        visible = false;
      }

      // Category filter
      if (categoryFilter && product.category !== categoryFilter) {
        visible = false;
      }

      // Price filter
      if (priceFilter) {
        const [min, max] = priceFilter.split('-').map(p => p === '+' ? Infinity : parseInt(p.replace('+', '')));
        if (max) {
          if (product.price < min || product.price > max) visible = false;
        } else {
          if (product.price < min) visible = false;
        }
      }

      product.element.style.display = visible ? 'block' : 'none';
      if (visible) visibleCount++;
    });

    // Show message if no results
    this.showResultsMessage(visibleCount);
  }

  showResultsMessage(count) {
    let message = document.querySelector('.filter-results-message');
    
    if (count === 0) {
      if (!message) {
        message = document.createElement('div');
        message.className = 'filter-results-message';
        document.querySelector('.pro-container')?.appendChild(message);
      }
      message.textContent = 'No products found. Try adjusting your filters.';
      message.style.display = 'block';
    } else if (message) {
      message.style.display = 'none';
    }
  }
}

// ==================== INITIALIZE ====================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize shopping cart
  window.cart = new ShoppingCart();
  
  // Initialize form handlers
  window.formHandler = new FormHandler();
  
  // Initialize product filter (only on shop page)
  if (document.querySelector('#product1')) {
    window.productFilter = new ProductFilter();
  }
});