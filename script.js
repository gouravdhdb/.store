let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let currentVoucherDiscount = 0;

document.addEventListener('DOMContentLoaded', () => {
  updateCartDisplay();
  updateOrderDisplay();
  showSection('home');
});

    const vouchersData = {
        "SAVE10": { type: "percentage", value: 2.10, used: false, minCartValue: 100 },
        "FLAT50": { type: "flat", value: 25, used: false, minCartValue: 200 },
        "FREEDEL": { type: "flat", value: 30, used: false, minCartValue: 250 }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        document.body.classList.toggle('dark-mode', isDarkMode);
        document.getElementById('darkModeToggle').checked = isDarkMode;
        updateCartDisplay();
        updateOrderDisplay();
        showSection('home');
    });

    function showNotification(message, isSuccess = true) {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.style.backgroundColor = isSuccess ? '#28a745' : '#dc3545';
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }

    function toggleMenu() {
      document.getElementById('sidebar').classList.toggle('active');
      document.getElementById('sidebarOverlay').classList.toggle('active');
      document.body.classList.toggle('sidebar-open');
    }

    function showSection(sectionId) {
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(sectionId).classList.add('active');
      if (window.innerWidth < 768) {
          toggleMenu();
      }
      if (sectionId === 'cart') {
          updateCartDisplay();
      } else if (sectionId === 'orders') {
          updateOrderDisplay();
      } else if (sectionId === 'vouchers') {
          const voucherMessage = document.getElementById('voucher-message');
          voucherMessage.textContent = '';
          voucherMessage.className = 'voucher-message';
          document.getElementById('voucher-input').value = '';
      }
    }

    function addToCart(name, price) {
      const existingItem = cart.find(item => item.name === name);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ name, price, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      showNotification(`${name} added to cart!`);
      updateCartDisplay();
    }

    function updateCartDisplay() {
      const cartItemsContainer = document.getElementById('cart-items-container');
      const emptyCartMessage = document.getElementById('empty-cart-message');
      const cartSummary = document.getElementById('cart-summary');
      cartItemsContainer.innerHTML = '';
      let subtotal = 0;

      if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartSummary.style.display = 'none';
      } else {
        emptyCartMessage.style.display = 'none';
        cartSummary.style.display = 'block';
        cart.forEach((item, index) => {
          subtotal += item.price * item.quantity;
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('cart-item');
          itemDiv.innerHTML = `
            <div class="cart-item-details">
              <h4 class="item-name">${item.name} (x${item.quantity})</h4>
              <p class="item-price">₹${item.price * item.quantity}</p>
            </div>
            <div class="cart-item-actions">
              <button class="buy-btn" onclick="increaseQuantity(${index})">+</button>
              <button class="remove-btn" onclick="decreaseQuantity(${index})">-</button>
              <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            </div>
          `;
          cartItemsContainer.appendChild(itemDiv);
        });
      }
      calculateTotal(subtotal);
    }

    function increaseQuantity(index) {
        cart[index].quantity++;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }

    function decreaseQuantity(index) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
        } else {
            cart.splice(index, 1);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }

    function removeFromCart(index) {
      const removedItemName = cart[index].name;
      cart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(cart));
      showNotification(`${removedItemName} removed from cart.`, false);
      updateCartDisplay();
    }

    function calculateTotal(subtotal) {
        document.getElementById('cart-total').textContent = subtotal;
        let finalTotal = subtotal;
        const discountDisplay = document.getElementById('discount-display');
        const discountAmountSpan = document.getElementById('discount-amount');
        const finalCartTotalSpan = document.getElementById('final-cart-total');

        if (currentVoucherDiscount > 0) {
            finalTotal = subtotal - currentVoucherDiscount;
            if (finalTotal < 0) finalTotal = 0;
            discountAmountSpan.textContent = currentVoucherDiscount.toFixed(2);
            discountDisplay.style.display = 'inline';
        } else {
            discountDisplay.style.display = 'none';
        }
        finalCartTotalSpan.textContent = finalTotal.toFixed(2);
    }

    function openModal(item, price = 0) {
      if (item === 'cart' && cart.length === 0) {
        showNotification('Your cart is empty. Add items before proceeding to checkout.', false);
        return;
      }

      const modalOverlay = document.getElementById('checkout-modal-overlay');
      const modalTitle = document.getElementById('modal-title');

      if (item === 'cart') {
        modalTitle.textContent = 'Complete Your Order (Cart)';
      } else {
        modalTitle.textContent = `Buy ${item} for ₹${price}`;
      }

      modalOverlay.style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('checkout-modal-overlay').style.display = 'none';
      document.getElementById('name-input').value = '';
      document.getElementById('address-input').value = '';
      document.getElementById('phone-input').value = '';
      document.getElementById('upi-input').value = '';
      document.getElementById('payment-method-select').value = '';
    }

    async function placeOrder() {
      const name = document.getElementById('name-input').value.trim();
      const address = document.getElementById('address-input').value.trim();
      const phone = document.getElementById('phone-input').value.trim();
      const upiId = document.getElementById('upi-input').value.trim();
      const paymentMethod = document.getElementById('payment-method-select').value;

      if (!name || !address || !phone || !paymentMethod) {
        showNotification('Please fill in all delivery details and select a payment method.', false);
        return;
      }
      if (paymentMethod === "online") {
  const newOrder = {
    id: Date.now(),
    items: itemsToOrder,
    total: orderTotal,
    discountApplied: currentVoucherDiscount,
    customer: { name, address, phone, upiId },
    paymentMethod: paymentMethod,
    date: new Date().toLocaleString(),
    status: 'Pending'
  };

  localStorage.setItem("pendingOrder", JSON.stringify(newOrder));
  closeModal();
  window.location.href = "payment.html";
  return; // stop further execution
      }

      let itemsToOrder = [];
      let orderTotal = 0;

      if (document.getElementById('modal-title').textContent.includes('Cart')) {
        itemsToOrder = [...cart];
        orderTotal = parseFloat(document.getElementById('final-cart-total').textContent);
      } else {
        const productName = document.getElementById('modal-title').textContent.split(' for ')[0].replace('Buy ', '');
        const productPrice = parseFloat(document.getElementById('modal-title').textContent.split('₹')[1]);
        itemsToOrder = [{ name: productName, price: productPrice, quantity: 1 }];
        orderTotal = productPrice;
      }

      const newOrder = {
        id: Date.now(),
        items: itemsToOrder,
        total: orderTotal,
        discountApplied: currentVoucherDiscount,
        customer: { name, address, phone, upiId },
        paymentMethod: paymentMethod,
        date: new Date().toLocaleString(),
        status: 'Pending'
      };

      orders.unshift(newOrder);
      localStorage.setItem('orders', JSON.stringify(orders));

      await fetch(`https://api.telegram.org/bot7942211815:AAGo9GylL7zO_SUWWkqJn1AFH40DO-Q0cqY/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '-4891793325',
          text: `🛒 New Order from ${name}
📍 Address: ${address}
📞 Phone: ${phone}
💳 Payment: ${paymentMethod}
📦 Items: ${itemsToOrder.map(i => `${i.name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join(', ')}
💰 Total: ₹${orderTotal}
🧾 Discount: ₹${currentVoucherDiscount}`
        })
      });

      if (document.getElementById('modal-title').textContent.includes('Cart')) {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        currentVoucherDiscount = 0;
      }

      closeModal();
      showNotification('Order placed successfully! Details sent to Telegram.');
      updateCartDisplay();
      updateOrderDisplay();
      showSection('orders');
    }

    function updateOrderDisplay() {
      const orderHistoryContainer = document.getElementById('order-history-container');
      const emptyOrdersMessage = document.getElementById('empty-orders-message');
      orderHistoryContainer.innerHTML = '';

      if (orders.length === 0) {
        emptyOrdersMessage.style.display = 'block';
      } else {
        emptyOrdersMessage.style.display = 'none';
        orders.forEach(order => {
          const orderDiv = document.createElement('div');
          orderDiv.classList.add('order-item');
          const itemsList = order.items.map(item => `${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`).join('<br>');
          const discountInfo = order.discountApplied > 0 ? `<p style="color: var(--button-secondary); font-size:0.9rem;">Discount: -₹${order.discountApplied.toFixed(2)}</p>` : '';
          const upiInfo = order.customer.upiId ? `<p style="font-size: 0.9rem; color: var(--secondary);">UPI ID: ${order.customer.upiId}</p>` : '';

          orderDiv.innerHTML = `
            <div class="order-item-details">
              <h4>Order ID: #${order.id}</h4>
              <p>Items: <br>${itemsList}</p>
              <p>Total: ₹${order.total.toFixed(2)}</p>
              ${discountInfo}
              <p style="font-size: 0.9rem; color: var(--secondary);">Placed on: ${order.date}</p>
              <p style="font-size: 0.9rem; color: var(--secondary);">Payment: ${order.paymentMethod}</p>
              <p style="font-size: 0.9rem; color: var(--secondary);">Name: ${order.customer.name}</p>
              <p style="font-size: 0.9rem; color: var(--secondary);">Address: ${order.customer.address}</p>
              <p style="font-size: 0.9rem; color: var(--secondary);">Phone: ${order.customer.phone}</p>
              ${upiInfo}
            </div>
            <div class="order-item-tracking">
              <p>Status: <span style="font-weight: 600; color: ${order.status === 'Pending' ? '#ffc107' : '#28a745'}">${order.status}</span></p>
            </div>
          `;
          orderHistoryContainer.appendChild(orderDiv);
        });
      }
    }

    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', darkModeToggle.checked);
        localStorage.setItem('darkMode', darkModeToggle.checked);
    });

    function applyVoucher() {
        const voucherInput = document.getElementById('voucher-input');
        const voucherCode = voucherInput.value.trim().toUpperCase();
        const voucherMessage = document.getElementById('voucher-message');
        const currentCartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        voucherMessage.textContent = '';
        voucherMessage.className = 'voucher-message';

        if (!voucherCode) {
            voucherMessage.textContent = 'Please enter a voucher code.';
            voucherMessage.classList.add('error');
            return;
        }

        const voucher = vouchersData[voucherCode];

        if (!voucher) {
            voucherMessage.textContent = 'Invalid voucher code.';
            voucherMessage.classList.add('error');
            return;
        }

        if (voucher.used) {
            voucherMessage.textContent = 'This voucher has already been used.';
            voucherMessage.classList.add('error');
            return;
        }

        if (currentCartSubtotal < voucher.minCartValue) {
            voucherMessage.textContent = `Cart total must be at least ₹${voucher.minCartValue} to use this voucher.`;
            voucherMessage.classList.add('error');
            return;
        }

        let discountAmount = 0;
        if (voucher.type === "percentage") {
            discountAmount = currentCartSubtotal * (voucher.value / 100);
        } else if (voucher.type === "flat") {
            discountAmount = voucher.value;
        }

        currentVoucherDiscount = discountAmount;
        voucher.used = true;
        vouchersData[voucherCode].used = true;

        showNotification(`Voucher "${voucherCode}" applied! You got ₹${discountAmount.toFixed(2)} off.`, true);
        voucherMessage.textContent = `Voucher "${voucherCode}" applied successfully! You saved ₹${discountAmount.toFixed(2)}.`;
        voucherMessage.classList.add('success');

        updateCartDisplay();
          }
document.addEventListener('DOMContentLoaded', () => {
  const paymentSelect = document.getElementById('payment-method-select');

  if (paymentSelect) {
    paymentSelect.addEventListener('change', () => {
      if (paymentSelect.value === 'Online Payment') {
        window.open('payment.html', '_blank', 'width=600,height=600');
      }
    });
  }
});
