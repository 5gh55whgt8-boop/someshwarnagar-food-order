const API_BASE = "http://localhost:5000";

const categoriesBox = document.getElementById("categories");
const menuContainer = document.getElementById("menuContainer");
const searchInput = document.getElementById("searchInput");

let allMenuItems = [];
let couponDiscount = Number(localStorage.getItem("couponDiscount")) || 0;
let appliedCoupon = localStorage.getItem("appliedCoupon") || "";

/* CUSTOM TOAST */
function showToast(message, actionText = "", actionLink = "") {
  const oldToast = document.querySelector(".custom-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "custom-toast";
  toast.innerHTML = `
    <span>${message}</span>
    ${
      actionText
        ? `<a href="${actionLink}">${actionText} ›</a>`
        : `<button onclick="this.parentElement.remove()">OK</button>`
    }
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast) toast.remove();
  }, 3500);
}

/* COOKING MODAL */
function showCookingModal() {
  const oldRequest = localStorage.getItem("cookingRequest") || "";

  const overlay = document.createElement("div");
  overlay.className = "custom-modal-overlay";
  overlay.innerHTML = `
    <div class="custom-modal">
      <h3>Cooking Request</h3>
      <p style="color:#666;">Example: Less spicy, no onion, extra cheese</p>
      <textarea id="customCookingText" placeholder="Add your cooking request...">${oldRequest}</textarea>
      <div class="modal-actions">
        <button class="modal-cancel" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
        <button class="modal-save" onclick="saveCookingRequestFromModal()">Save Request</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

/* FOOD IMAGE */
function getFoodImage(item) {
  const name = (item.name || "").toLowerCase().trim();

  const imageMap = [
    { keys: ["paneer butter", "butter masala"], url: "https://www.indianhealthyrecipes.com/wp-content/uploads/2023/07/paneer-butter-masala-recipe.jpg" },
    { keys: ["paneer tikka"], url: "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/paneer-tikka-masala-recipe.jpg" },
    { keys: ["paneer chilli", "chilli paneer"], url: "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/chilli-paneer-recipe.jpg" },
    { keys: ["margherita pizza"], url: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=900&q=80" },
    { keys: ["paneer cheese pizza", "paneer pizza"], url: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80" },
    { keys: ["cheese burst pizza", "cheese pizza"], url: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=900&q=80" },
    { keys: ["veg burger"], url: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=900&q=80" },
    { keys: ["cheese burger"], url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80" },
    { keys: ["hakka noodles", "noodles"], url: "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/07/hakka-noodles-recipe.jpg" },
    { keys: ["manchurian"], url: "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/07/veg-manchurian-recipe.jpg" },
    { keys: ["fried rice"], url: "https://www.australianeggs.org.au/assets/Uploads/Egg-fried-rice-2.jpg" },
    { keys: ["french fries", "fries"], url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80" },
    { keys: ["masala maggi", "maggi"], url: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=900&q=80" },
    { keys: ["cheese sandwich", "sandwich"], url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80" },
    { keys: ["cold coffee", "coffee"], url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80" },
    { keys: ["lemon soda", "soda"], url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80" },
    { keys: ["mango shake", "mango"], url: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=900&q=80" },
    { keys: ["veg thali"], url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80" },
    { keys: ["special thali", "thali"], url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80" },
    { keys: ["poha"], url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHSbWRcPzYN8rkcLNtVwN3osFcFlMc7ij6ZA&s" },
    { keys: ["upma"], url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw46aSML4LeHSoPq36pB67U5ptkJBKa6mVsw&s" },
    { keys: ["misal pav", "misal"], url: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80" }
  ];

  const matched = imageMap.find(img => img.keys.some(key => name.includes(key)));

  return matched
    ? matched.url
    : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80";
}

/* CATEGORIES */
async function loadCategories() {
  if (!categoriesBox) return;

  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    const data = await res.json();

    categoriesBox.innerHTML = `<button class="category-btn active" onclick="showAllMenu()">All</button>`;

    (data.categories || []).forEach(cat => {
      categoriesBox.innerHTML += `
        <button class="category-btn" onclick="filterByCategory(${cat.id}, this)">
          ${cat.name}
        </button>
      `;
    });
  } catch {
    categoriesBox.innerHTML = `<p>Failed to load categories</p>`;
  }
}

/* MENU */
async function loadMenu() {
  if (!menuContainer) return;

  try {
    const res = await fetch(`${API_BASE}/api/menu`);
    const data = await res.json();

    allMenuItems = data.menu || [];
    renderMenu(allMenuItems);
  } catch {
    menuContainer.innerHTML = `<p>Failed to load menu items</p>`;
  }
}

function renderMenu(items) {
  if (!menuContainer) return;

  if (!items || items.length === 0) {
    menuContainer.innerHTML = `<p>No food items found.</p>`;
    return;
  }

  menuContainer.innerHTML = items.map(item => `
    <div class="food-card">
      <div class="food-img" style="background-image:url('${getFoodImage(item)}')"></div>

      <div class="food-content">
        <div class="food-title">${item.name}</div>
        <p class="food-desc">${item.description || ""}</p>

        <div class="food-meta">
          <span class="badge">${item.food_type || "VEG"}</span>
          <span>⭐ ${item.rating || "4.5"}</span>
        </div>

        <div class="food-meta">
          <span>${item.prep_time || "20-25 mins"}</span>
          ${
            Number(item.is_future_booking) === 1
              ? `<span class="badge future">24hr Booking</span>`
              : `<span class="badge">Available Now</span>`
          }
        </div>

        <div class="price-row">
          <div class="price">₹${Number(item.price).toFixed(2)}</div>
          <button class="add-btn" onclick="addToCart(${item.id})">Add +</button>
        </div>
      </div>
    </div>
  `).join("");
}

function showAllMenu() {
  document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
  const firstBtn = document.querySelector(".category-btn");
  if (firstBtn) firstBtn.classList.add("active");

  renderMenu(allMenuItems);
}

function filterByCategory(categoryId, button) {
  document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");

  const filtered = allMenuItems.filter(item => Number(item.category_id) === Number(categoryId));
  renderMenu(filtered);
}

function addToCart(itemId) {
  const item = allMenuItems.find(food => Number(food.id) === Number(itemId));

  if (!item) {
    showToast("Item not found");
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find(cartItem => Number(cartItem.id) === Number(itemId));

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: Number(item.id),
      name: item.name,
      price: Number(item.price),
      category_name: item.category_name,
      is_future_booking: Number(item.is_future_booking),
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showToast(`${item.name} added`, "View Cart", "cart.html");
  updateMenuNavbar();
}

/* SEARCH */
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const searchText = searchInput.value.toLowerCase();

    const filtered = allMenuItems.filter(item =>
      item.name.toLowerCase().includes(searchText) ||
      (item.description || "").toLowerCase().includes(searchText) ||
      item.category_name.toLowerCase().includes(searchText)
    );

    renderMenu(filtered);
  });
}

/* CART */
function loadCartPage() {
  const cartItemsBox = document.getElementById("cartItems");
  const itemTotalBox = document.getElementById("itemTotal");
  const deliveryChargeBox = document.getElementById("deliveryCharge");
  const gstChargeBox = document.getElementById("gstCharge");
  const discountAmountBox = document.getElementById("discountAmount");
  const cartTotal = document.getElementById("cartTotal");
  const bottomTotal = document.getElementById("bottomTotal");
  const orderType = document.getElementById("orderType");
  const futureDateBox = document.getElementById("futureDateBox");
  const savedCookingRequest = document.getElementById("savedCookingRequest");
  const couponInput = document.getElementById("couponInput");
  const couponMessage = document.getElementById("couponMessage");
  const customerNameInput = document.getElementById("customerName");
  const customerPhoneInput = document.getElementById("customerPhone");
  const customerAddressInput = document.getElementById("customerAddress");
  const locationStatus = document.getElementById("locationStatus");
  const cartAddressTitle = document.getElementById("cartAddressTitle");
  const cartAddressText = document.getElementById("cartAddressText");
  const cartItemCountText = document.getElementById("cartItemCountText");

  if (!cartItemsBox) return;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (customerNameInput) customerNameInput.value = localStorage.getItem("customerName") || "";
  if (customerPhoneInput) customerPhoneInput.value = localStorage.getItem("customerPhone") || "";
  if (customerAddressInput) customerAddressInput.value = localStorage.getItem("customerAddress") || "";

  function updateAddressCard() {
    const address = localStorage.getItem("customerAddress") || customerAddressInput?.value || "";

    if (cartAddressTitle) {
      cartAddressTitle.innerText = address ? "Saved Delivery Address" : "No Address Added";
    }

    if (cartAddressText) {
      cartAddressText.innerText = address || "Add your delivery address before placing order";
    }
  }

  function updateCookingRequestText() {
    const request = localStorage.getItem("cookingRequest");

    if (savedCookingRequest) {
      savedCookingRequest.innerText = request || "No special request added";
    }
  }

  function calculateBill() {
    let itemTotal = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
      itemTotal += Number(item.price) * Number(item.quantity);
      totalQuantity += Number(item.quantity);
    });

    const deliveryCharge = Math.min(totalQuantity, 3) * 50;
    const gstCharge = 0;

    if (cart.length === 0) {
      couponDiscount = 0;
      appliedCoupon = "";
      localStorage.removeItem("couponDiscount");
      localStorage.removeItem("appliedCoupon");
    }

    const validDiscount = Math.min(couponDiscount, itemTotal + deliveryCharge + gstCharge);
    const grandTotal = itemTotal + deliveryCharge + gstCharge - validDiscount;

    return { itemTotal, totalQuantity, deliveryCharge, gstCharge, discount: validDiscount, grandTotal };
  }

  function renderCouponMessage() {
    if (!couponMessage) return;

    if (appliedCoupon === "STUDENT50") {
      couponMessage.innerText = "Coupon applied successfully ✅";
      couponMessage.style.color = "#19a974";
    } else {
      couponMessage.innerText = "";
    }

    if (couponInput && appliedCoupon) {
      couponInput.value = appliedCoupon;
    }
  }

  function renderCart() {
    const bill = calculateBill();

    if (cartItemCountText) {
      cartItemCountText.innerText = `${bill.totalQuantity} item${bill.totalQuantity !== 1 ? "s" : ""} selected`;
    }

    updateAddressCard();

    if (cart.length === 0) {
      cartItemsBox.innerHTML = `
        <div class="empty-cart-premium">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add tasty food from the menu and it will appear here.</p>
          <a href="menu.html" class="outline-btn">Browse Menu</a>
        </div>
      `;

      if (itemTotalBox) itemTotalBox.innerText = "₹0";
      if (deliveryChargeBox) deliveryChargeBox.innerText = "₹0";
      if (gstChargeBox) gstChargeBox.innerText = "₹0";
      if (discountAmountBox) discountAmountBox.innerText = "-₹0";
      if (cartTotal) cartTotal.innerText = "₹0";
      if (bottomTotal) bottomTotal.innerText = "₹0";

      updateCookingRequestText();
      renderCouponMessage();
      return;
    }

    cartItemsBox.innerHTML = cart.map((item, index) => {
      const price = Number(item.price);
      const qty = Number(item.quantity);
      const foodTotal = price * qty;

      return `
        <div class="cart-item">
          <img class="cart-food-img" src="${getFoodImage(item)}" alt="${item.name}">

          <div>
            <h3>${item.name}</h3>
            <p class="item-price">₹${price.toFixed(2)} × ${qty}</p>
            <p class="item-subtotal">Food Total: ₹${foodTotal.toFixed(2)}</p>
            ${
              Number(item.is_future_booking) === 1
                ? `<span class="badge future">24hr Booking</span>`
                : `<span class="badge">Available Now</span>`
            }
          </div>

          <div class="qty-box">
            <button onclick="changeQty(${index}, -1)">−</button>
            <span>${qty}</span>
            <button onclick="changeQty(${index}, 1)">+</button>
            <button class="remove-btn" onclick="removeItem(${index})">✕</button>
          </div>
        </div>
      `;
    }).join("");

    if (itemTotalBox) itemTotalBox.innerText = `₹${bill.itemTotal.toFixed(2)}`;
    if (deliveryChargeBox) {
      deliveryChargeBox.innerText =
        bill.totalQuantity > 3
          ? `₹${bill.deliveryCharge.toFixed(2)} (max 3 items)`
          : `₹${bill.deliveryCharge.toFixed(2)}`;
    }
    if (gstChargeBox) gstChargeBox.innerText = `₹${bill.gstCharge.toFixed(2)}`;
    if (discountAmountBox) discountAmountBox.innerText = `-₹${bill.discount.toFixed(2)}`;
    if (cartTotal) cartTotal.innerText = `₹${bill.grandTotal.toFixed(2)}`;
    if (bottomTotal) bottomTotal.innerText = `₹${bill.grandTotal.toFixed(2)}`;

    updateCookingRequestText();
    renderCouponMessage();
  }

  window.changeQty = function(index, change) {
    cart[index].quantity = Number(cart[index].quantity) + change;

    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    updateMenuNavbar();
  };

  window.removeItem = function(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    showToast("Item removed");
    renderCart();
    updateMenuNavbar();
  };

  window.openCookingRequest = function() {
    showCookingModal();
  };

  window.saveCookingRequestFromModal = function() {
    const textBox = document.getElementById("customCookingText");
    const request = textBox ? textBox.value.trim() : "";

    if (request) {
      localStorage.setItem("cookingRequest", request);
      showToast("Cooking request saved ✅");
    } else {
      localStorage.removeItem("cookingRequest");
      showToast("Cooking request removed");
    }

    const overlay = document.querySelector(".custom-modal-overlay");
    if (overlay) overlay.remove();

    updateCookingRequestText();
  };

  window.applyCoupon = function() {
    const code = couponInput ? couponInput.value.trim().toUpperCase() : "";

    if (cart.length === 0) {
      showToast("Add items before applying coupon");
      return;
    }

    if (code === "STUDENT50") {
      couponDiscount = 50;
      appliedCoupon = "STUDENT50";
      localStorage.setItem("couponDiscount", "50");
      localStorage.setItem("appliedCoupon", "STUDENT50");
      showToast("₹50 coupon applied ✅");
      renderCart();
      return;
    }

    couponDiscount = 0;
    appliedCoupon = "";
    localStorage.removeItem("couponDiscount");
    localStorage.removeItem("appliedCoupon");

    showToast("Invalid coupon code");
    renderCart();
  };

  window.addSuggestedItem = function(name, price, category) {
    const suggestedId = `suggested-${name.toLowerCase().replace(/\s+/g, "-")}`;
    const existingItem = cart.find(item => item.id === suggestedId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: suggestedId,
        name,
        price: Number(price),
        category_name: category,
        is_future_booking: 0,
        quantity: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    showToast(`${name} added`);
    renderCart();
    updateMenuNavbar();
  };

  window.useCurrentLocation = function() {
    if (!navigator.geolocation) {
      showToast("Location not supported");
      return;
    }

    if (locationStatus) locationStatus.innerText = "Detecting your location...";

    navigator.geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const address = data.display_name || `Latitude: ${lat}, Longitude: ${lon}`;

          if (customerAddressInput) customerAddressInput.value = address;

          localStorage.setItem("customerAddress", address);
          localStorage.setItem("customerLatitude", lat);
          localStorage.setItem("customerLongitude", lon);

          if (locationStatus) locationStatus.innerText = "Location added successfully ✅";

          updateAddressCard();
          showToast("Location detected ✅");
        } catch {
          const coords = `Latitude: ${lat}, Longitude: ${lon}`;
          if (customerAddressInput) customerAddressInput.value = coords;

          localStorage.setItem("customerAddress", coords);
          updateAddressCard();
          showToast("Location saved with coordinates");
        }
      },
      () => {
        if (locationStatus) locationStatus.innerText = "Location permission denied";
        showToast("Please allow location permission");
      }
    );
  };

  function isFutureDateValid(dateValue) {
    if (!dateValue) return false;

    const selectedDate = new Date(dateValue);
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return selectedDate >= minDate;
  }

  function showSuccessModal(orderData) {
    const modal = document.createElement("div");

    modal.innerHTML = `
      <div class="custom-modal-overlay">
        <div class="custom-modal" style="text-align:center;">
          <div style="font-size:60px;">✅</div>
          <h3>Order Placed Successfully</h3>
          <p style="color:#666; line-height:1.7;">
            Order ID: <b>#${orderData.orderId}</b><br>
            Customer: <b>${orderData.customerName}</b><br>
            Phone: <b>${orderData.customerPhone}</b><br>
            Type: <b>${orderData.orderType}</b><br>
            Amount: <b>₹${orderData.totalAmount.toFixed(2)}</b>
          </p>
          <div class="modal-actions">
            <button class="modal-save" onclick="window.location.href='orders.html'">View Orders</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  window.placeOrder = async function() {
    if (cart.length === 0) {
      showToast("Cart is empty");
      return;
    }

    const customerName = customerNameInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();
    const customerAddress = customerAddressInput.value.trim();
    const selectedOrderType = orderType ? orderType.value : "NOW";
    const deliveryDate = document.getElementById("deliveryDate")
      ? document.getElementById("deliveryDate").value
      : "";

    if (!customerName || !customerPhone || !customerAddress) {
      showToast("Please fill delivery details");
      return;
    }

    if (!/^[0-9]{10}$/.test(customerPhone)) {
      showToast("Enter valid 10 digit phone number");
      return;
    }

    if (selectedOrderType === "FUTURE" && !isFutureDateValid(deliveryDate)) {
      showToast("Select time minimum 24 hours later");
      return;
    }

    localStorage.setItem("customerName", customerName);
    localStorage.setItem("customerPhone", customerPhone);
    localStorage.setItem("customerAddress", customerAddress);

    const bill = calculateBill();
    const customerId = localStorage.getItem("customerId") || 1;

    const orderPayload = {
      user_id: Number(customerId),
      customer_name: customerName,
      phone: customerPhone,
      address: customerAddress,
      total_amount: bill.grandTotal,
      order_type: selectedOrderType,
      delivery_date: selectedOrderType === "FUTURE" ? deliveryDate : null,
      items: cart.map(item => ({
        id: Number(item.id) || null,
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.price)
      }))
    };

    try {
      const res = await fetch(`${API_BASE}/api/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!data.success) {
        showToast(data.message || data.error || "Order failed");
        return;
      }

      localStorage.removeItem("cart");
      localStorage.removeItem("cookingRequest");
      localStorage.removeItem("couponDiscount");
      localStorage.removeItem("appliedCoupon");

      showSuccessModal({
        orderId: data.order_id,
        customerName,
        customerPhone,
        orderType: selectedOrderType,
        totalAmount: bill.grandTotal
      });

      setTimeout(() => {
        window.location.href = "orders.html";
      }, 2000);
    } catch {
      showToast("Server error. Try again.");
    }
  };

  if (orderType) {
    orderType.addEventListener("change", () => {
      if (futureDateBox) {
        futureDateBox.style.display = orderType.value === "FUTURE" ? "block" : "none";
      }
    });
  }

  renderCart();
}

/* ORDERS PAGE */
async function loadOrdersPage() {
  const ordersContainer = document.getElementById("ordersContainer");
  const totalOrdersBox = document.getElementById("totalOrders");
  const activeOrdersBox = document.getElementById("activeOrders");
  const deliveredOrdersBox = document.getElementById("deliveredOrders");

  if (!ordersContainer) return;

  const customerId = localStorage.getItem("customerId") || 1;

  try {
    const res = await fetch(`${API_BASE}/api/orders/${customerId}`);
    const data = await res.json();

    if (!data.success || !data.orders || data.orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <div style="font-size:60px;">📦</div>
          <h3>No orders yet</h3>
          <p style="color:#777; margin-bottom:20px;">Your food orders will appear here.</p>
          <a href="menu.html" class="outline-btn">Browse Menu</a>
        </div>
      `;
      return;
    }

    const orders = data.orders;

    if (totalOrdersBox) totalOrdersBox.innerText = orders.length;
    if (activeOrdersBox) {
      activeOrdersBox.innerText = orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED").length;
    }
    if (deliveredOrdersBox) {
      deliveredOrdersBox.innerText = orders.filter(o => o.status === "DELIVERED").length;
    }

    function getStatusClass(status) {
      if (status === "PENDING") return "status-pending";
      if (status === "ACCEPTED") return "status-accepted";
      if (status === "PREPARING") return "status-preparing";
      if (status === "OUT_FOR_DELIVERY") return "status-out";
      if (status === "DELIVERED") return "status-delivered";
      if (status === "CANCELLED") return "status-cancelled";
      return "";
    }

    function trackingIcons(status) {
      const steps = [
        { key: "PENDING", label: "Placed", icon: "🧾" },
        { key: "ACCEPTED", label: "Accepted", icon: "✅" },
        { key: "PREPARING", label: "Cooking", icon: "👨‍🍳" },
        { key: "OUT_FOR_DELIVERY", label: "Delivery", icon: "🛵" },
        { key: "DELIVERED", label: "Delivered", icon: "🏠" }
      ];

      if (status === "CANCELLED") {
        return `<div class="eta-box" style="background:#fdecea;color:#c62828;">❌ This order has been cancelled.</div>`;
      }

      const currentIndex = steps.findIndex(step => step.key === status);

      return `
        <div class="tracking-icons">
          ${steps.map((step, index) => `
            <div class="track-step ${index <= currentIndex ? "done" : ""}">
              <div class="icon">${step.icon}</div>
              <span>${step.label}</span>
            </div>
          `).join("")}
        </div>
      `;
    }

    function getETA(order) {
      if (order.status === "DELIVERED") return "✅ Delivered successfully";
      if (order.status === "CANCELLED") return "❌ Order cancelled";
      if (order.order_type === "FUTURE" && order.delivery_date) {
        return `⏰ Scheduled for ${new Date(order.delivery_date).toLocaleString()}`;
      }
      if (order.status === "PENDING") return "⏳ Waiting for restaurant confirmation";
      if (order.status === "ACCEPTED") return "⏰ Estimated delivery: 25-35 mins";
      if (order.status === "PREPARING") return "👨‍🍳 Food is being prepared";
      if (order.status === "OUT_FOR_DELIVERY") return "🛵 Rider is on the way";

      return "⏰ Estimated delivery: 20-30 mins";
    }

    window.cancelOrderFrontend = function() {
      showToast("Cancel API next step मध्ये connect करू");
    };

    window.reorderItems = function(items) {
      const cart = items.map((item, index) => ({
        id: `reorder-${Date.now()}-${index}`,
        name: item.item_name,
        price: Number(item.price),
        category_name: "Snacks",
        is_future_booking: 0,
        quantity: Number(item.quantity)
      }));

      localStorage.setItem("cart", JSON.stringify(cart));
      showToast("Items added to cart ✅", "View Cart", "cart.html");

      setTimeout(() => {
        window.location.href = "cart.html";
      }, 900);
    };

    window.downloadInvoice = function(order) {
      const itemsText = (order.items || []).map(item =>
        `${item.item_name} x ${item.quantity} = ₹${Number(item.price * item.quantity).toFixed(2)}`
      ).join("\n");

      const invoiceText = `
SOMESHWARNAGAR FOOD
--------------------------
Invoice for Order #${order.order_id}

Customer: ${order.customer_name}
Phone: ${order.phone}
Address: ${order.address}

Order Type: ${order.order_type}
Status: ${order.status}
Date: ${new Date(order.created_at).toLocaleString()}

Items:
${itemsText || "Items not available"}

Total Paid: ₹${Number(order.total_amount).toFixed(2)}

Thank you for ordering!
`;

      const blob = new Blob([invoiceText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `invoice-order-${order.order_id}.txt`;
      a.click();

      URL.revokeObjectURL(url);
    };

    ordersContainer.innerHTML = orders.map(order => {
      const itemsHtml =
        order.items && order.items.length > 0
          ? order.items.map(item => `
              <div class="order-item-line">
                <span>${item.item_name} × ${item.quantity}</span>
                <strong>₹${Number(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            `).join("")
          : `
              <div class="order-item-line">
                <span style="color:#777;">Items not available for this old order</span>
                <strong>₹${Number(order.total_amount).toFixed(2)}</strong>
              </div>
            `;

      const encodedItems = encodeURIComponent(JSON.stringify(order.items || []));
      const encodedOrder = encodeURIComponent(JSON.stringify(order));

      return `
        <div class="order-card">
          <div class="order-top">
            <div>
              <h3>Order #${order.order_id}</h3>
              <p class="order-meta">${new Date(order.created_at).toLocaleString()}</p>
            </div>
            <span class="status-badge ${getStatusClass(order.status)}">${order.status.replaceAll("_", " ")}</span>
          </div>

          ${trackingIcons(order.status)}

          <div class="eta-box">${getETA(order)}</div>

          ${
            order.order_type === "FUTURE"
              ? `<div class="future-order-badge">24hr Future Booking: ${new Date(order.delivery_date).toLocaleString()}</div>`
              : ""
          }

          <div class="order-items">${itemsHtml}</div>

          <div class="order-meta">
            <b>Order Type:</b> ${order.order_type}<br>
            <b>Phone:</b> ${order.phone}<br>
            <b>Address:</b> ${order.address}
          </div>

          <div class="order-total">
            Total Paid: ₹${Number(order.total_amount).toFixed(2)}
          </div>

          <div class="order-actions">
            <button class="reorder-btn" onclick="reorderItems(JSON.parse(decodeURIComponent('${encodedItems}')))">Reorder</button>

            ${
              order.status === "PENDING"
                ? `<button class="cancel-order-btn" onclick="cancelOrderFrontend(${order.order_id})">Cancel Order</button>`
                : ""
            }

            <button class="invoice-btn" onclick="downloadInvoice(JSON.parse(decodeURIComponent('${encodedOrder}')))">Download Bill</button>
          </div>
        </div>
      `;
    }).join("");
  } catch {
    ordersContainer.innerHTML = `
      <div class="empty-orders">
        <h3>Failed to load orders</h3>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

/* AUTH */
function showLogin() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotForm");

  if (!loginForm) return;

  loginForm.style.display = "block";
  if (registerForm) registerForm.style.display = "none";
  if (forgotForm) forgotForm.style.display = "none";

  document.getElementById("loginTab")?.classList.add("active");
  document.getElementById("registerTab")?.classList.remove("active");
}

function showRegister() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotForm");

  if (!registerForm) return;

  if (loginForm) loginForm.style.display = "none";
  registerForm.style.display = "block";
  if (forgotForm) forgotForm.style.display = "none";

  document.getElementById("registerTab")?.classList.add("active");
  document.getElementById("loginTab")?.classList.remove("active");
}

function showForgotPassword() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotForm");

  if (!forgotForm) return;

  if (loginForm) loginForm.style.display = "none";
  if (registerForm) registerForm.style.display = "none";
  forgotForm.style.display = "block";
}

async function customerRegister() {
  const name = document.getElementById("registerName")?.value.trim();
  const email = document.getElementById("registerEmail")?.value.trim();
  const phone = document.getElementById("registerPhone")?.value.trim();
  const password = document.getElementById("registerPassword")?.value.trim();
  const address = document.getElementById("registerAddress")?.value.trim();
  const termsCheck = document.getElementById("termsCheck");

  if (!name || !email || !phone || !password) {
    showToast("Please fill all required fields");
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    showToast("Enter valid 10 digit phone number");
    return;
  }

  if (termsCheck && !termsCheck.checked) {
    showToast("Please accept terms and privacy policy");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, address })
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message || data.error || "Registration failed");
      return;
    }

    showToast("Account created successfully ✅");
    showLogin();

    const loginEmail = document.getElementById("loginEmail");
    if (loginEmail) loginEmail.value = email;
  } catch {
    showToast("Server error. Try again.");
  }
}

async function customerLogin() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    showToast("Enter email and password");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message || data.error || "Login failed");
      return;
    }

    localStorage.setItem("customerId", data.user.id);
    localStorage.setItem("customerName", data.user.name);
    localStorage.setItem("customerEmail", data.user.email);
    localStorage.setItem("customerPhone", data.user.phone || "");

    const rememberMe = document.getElementById("rememberMe");
    if (rememberMe && rememberMe.checked) {
      localStorage.setItem("rememberedEmail", data.user.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    showToast("Login successful ✅");

    setTimeout(() => {
      window.location.href = "menu.html";
    }, 900);
  } catch {
    showToast("Server error. Try again.");
  }
}

async function sendForgotOtp() {
  const email = document.getElementById("forgotEmail")?.value.trim();

  if (!email) {
    showToast("Enter registered email");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message || data.error || "OTP failed");
      return;
    }

    showToast("OTP sent ✅ Check terminal");
  } catch {
    showToast("Server error. Try again.");
  }
}

async function resetCustomerPassword() {
  const email = document.getElementById("forgotEmail")?.value.trim();
  const otp = document.getElementById("resetOtp")?.value.trim();
  const newPassword = document.getElementById("newPassword")?.value.trim();

  if (!email || !otp || !newPassword) {
    showToast("Enter email, OTP and new password");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message || data.error || "Password reset failed");
      return;
    }

    showToast("Password reset successful ✅");
    showLogin();

    const loginEmail = document.getElementById("loginEmail");
    if (loginEmail) loginEmail.value = email;
  } catch {
    showToast("Server error. Try again.");
  }
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.type = input.type === "password" ? "text" : "password";
}

function googleLoginDemo() {
  showToast("Google Login Coming Soon 🚀");
}

function protectLoginPage() {
  const isLoginPage = document.getElementById("loginForm");
  const customerId = localStorage.getItem("customerId");

  if (isLoginPage && customerId) {
    window.location.href = "menu.html";
  }
}

function loadRememberedEmail() {
  const loginEmail = document.getElementById("loginEmail");
  const rememberMe = document.getElementById("rememberMe");
  const savedEmail = localStorage.getItem("rememberedEmail");

  if (loginEmail && savedEmail) loginEmail.value = savedEmail;
  if (rememberMe && savedEmail) rememberMe.checked = true;
}

function setupPasswordStrength() {
  const passwordInput = document.getElementById("registerPassword");
  const bar = document.getElementById("passwordStrengthBar");
  const text = document.getElementById("passwordStrengthText");

  if (!passwordInput || !bar || !text) return;

  passwordInput.addEventListener("input", () => {
    const value = passwordInput.value;
    let score = 0;

    if (value.length >= 6) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (score <= 1) {
      bar.style.width = "25%";
      bar.style.background = "#ef4444";
      text.innerText = "Weak password";
      text.style.color = "#ef4444";
    } else if (score <= 3) {
      bar.style.width = "65%";
      bar.style.background = "#f59e0b";
      text.innerText = "Medium password";
      text.style.color = "#f59e0b";
    } else {
      bar.style.width = "100%";
      bar.style.background = "#19a974";
      text.innerText = "Strong password";
      text.style.color = "#19a974";
    }
  });
}

function customerLogout() {
  localStorage.removeItem("customerId");
  localStorage.removeItem("customerName");
  localStorage.removeItem("customerEmail");
  localStorage.removeItem("customerPhone");

  showToast("Logged out successfully");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
}

/* NAVBAR + HERO */
function updateMenuNavbar() {
  const welcomeUser = document.getElementById("welcomeUser");
  const cartCountBadge = document.getElementById("cartCountBadge");

  const customerName = localStorage.getItem("customerName") || "Guest";
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  if (welcomeUser) welcomeUser.innerText = `Hi, ${customerName} 👋`;
  if (cartCountBadge) cartCountBadge.innerText = totalQty;
}

function updateMenuHero() {
  const heroTitle = document.getElementById("dynamicHeroTitle");
  const savedAddressText = document.getElementById("savedAddressText");

  const name = localStorage.getItem("customerName") || "Foodie";
  const address = localStorage.getItem("customerAddress") || "Someshwarnagar";

  if (heroTitle) {
    heroTitle.innerText = `Hi, ${name} 👋 What would you like to eat today?`;
  }

  if (savedAddressText) {
    savedAddressText.innerText = `📍 Delivering to ${address}`;
  }
}

/* INIT */
protectLoginPage();
loadRememberedEmail();
setupPasswordStrength();

loadCategories();
loadMenu();
loadCartPage();
loadOrdersPage();

updateMenuNavbar();
updateMenuHero();
/* ADMIN LIVE ORDERS PANEL */

async function loadAdminOrders() {
  const container = document.getElementById("adminOrdersContainer");
  const totalBox = document.getElementById("totalAdminOrders");
  const pendingBox = document.getElementById("pendingAdminOrders");
  const activeBox = document.getElementById("activeAdminOrders");
  const deliveredBox = document.getElementById("deliveredAdminOrders");

  if (!container) return;

  container.innerHTML = `<div class="loading-box">Loading orders...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`);
    const data = await res.json();

    if (!data.success || !data.orders || data.orders.length === 0) {
      container.innerHTML = `
        <div class="loading-box">
          No orders found.
        </div>
      `;
      return;
    }

    const orders = data.orders;

    if (totalBox) totalBox.innerText = orders.length;
    if (pendingBox) pendingBox.innerText = orders.filter(o => o.status === "PENDING").length;
    if (activeBox) {
      activeBox.innerText = orders.filter(o =>
        !["PENDING", "DELIVERED", "CANCELLED"].includes(o.status)
      ).length;
    }
    if (deliveredBox) deliveredBox.innerText = orders.filter(o => o.status === "DELIVERED").length;

    container.innerHTML = orders.map(order => {
      const itemsHtml = order.items && order.items.length > 0
        ? order.items.map(item => `
            <div class="order-line">
              <span>${item.item_name} × ${item.quantity}</span>
              <strong>₹${Number(item.price * item.quantity).toFixed(2)}</strong>
            </div>
          `).join("")
        : `<p class="admin-order-meta">Items not available</p>`;

      const statusClass = String(order.status || "").toLowerCase().replaceAll("_", "-");

      return `
        <div class="admin-order-card">
          <div class="admin-order-top">
            <div>
              <h3>Order #${order.order_id}</h3>
              <p class="admin-order-meta">
                ${new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <span class="status-chip ${statusClass}">
              ${String(order.status || "").replaceAll("_", " ")}
            </span>
          </div>

          <p class="admin-order-meta">
            <b>Customer:</b> ${order.customer_name}<br>
            <b>Phone:</b> ${order.phone}<br>
            <b>Address:</b> ${order.address}<br>
            <b>Type:</b> ${order.order_type}
            ${
              order.delivery_date
                ? `<br><b>Delivery Date:</b> ${new Date(order.delivery_date).toLocaleString()}`
                : ""
            }
          </p>

          <div class="order-items-box">
            ${itemsHtml}
          </div>

          <h3>Total: ₹${Number(order.total_amount).toFixed(2)}</h3>

          <div class="admin-btn-grid">
            <button class="btn-accept" onclick="updateAdminOrderStatus(${order.order_id}, 'ACCEPTED')">
              Accept
            </button>

            <button class="btn-prep" onclick="updateAdminOrderStatus(${order.order_id}, 'PREPARING')">
              Preparing
            </button>

            <button class="btn-out" onclick="updateAdminOrderStatus(${order.order_id}, 'OUT_FOR_DELIVERY')">
              Out
            </button>

            <button class="btn-done" onclick="updateAdminOrderStatus(${order.order_id}, 'DELIVERED')">
              Delivered
            </button>

            <button class="btn-cancel" onclick="updateAdminOrderStatus(${order.order_id}, 'CANCELLED')">
              Cancel
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    container.innerHTML = `
      <div class="loading-box">
        Failed to load admin orders.
      </div>
    `;
  }
}

async function updateAdminOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message || data.error || "Status update failed");
      return;
    }

    showToast(`Order #${orderId} updated to ${status.replaceAll("_", " ")}`);
    loadAdminOrders();

  } catch {
    showToast("Server error while updating order");
  }
}

loadAdminOrders();
/* KANBAN ADMIN PANEL */

async function loadAdminKanban() {
  const pendingCol = document.getElementById("pendingCol");
  const preparingCol = document.getElementById("preparingCol");
  const deliveryCol = document.getElementById("deliveryCol");
  const deliveredCol = document.getElementById("deliveredCol");

  const kTotal = document.getElementById("kTotal");
  const kPending = document.getElementById("kPending");
  const kPreparing = document.getElementById("kPreparing");
  const kDelivered = document.getElementById("kDelivered");

  if (!pendingCol) return;

  pendingCol.innerHTML = `<div class="empty-col">Loading...</div>`;
  preparingCol.innerHTML = `<div class="empty-col">Loading...</div>`;
  deliveryCol.innerHTML = `<div class="empty-col">Loading...</div>`;
  deliveredCol.innerHTML = `<div class="empty-col">Loading...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`);
    const data = await res.json();

    if (!data.success || !data.orders || data.orders.length === 0) {
      pendingCol.innerHTML = `<div class="empty-col">No orders yet</div>`;
      preparingCol.innerHTML = `<div class="empty-col">No orders</div>`;
      deliveryCol.innerHTML = `<div class="empty-col">No orders</div>`;
      deliveredCol.innerHTML = `<div class="empty-col">No orders</div>`;
      return;
    }

    const orders = data.orders;

    const pendingOrders = orders.filter(o => o.status === "PENDING");
    const preparingOrders = orders.filter(o =>
      o.status === "ACCEPTED" || o.status === "PREPARING"
    );
    const deliveryOrders = orders.filter(o => o.status === "OUT_FOR_DELIVERY");
    const deliveredOrders = orders.filter(o =>
      o.status === "DELIVERED" || o.status === "CANCELLED"
    );

    if (kTotal) kTotal.innerText = orders.length;
    if (kPending) kPending.innerText = pendingOrders.length;
    if (kPreparing) kPreparing.innerText = preparingOrders.length;
    if (kDelivered) kDelivered.innerText = deliveredOrders.length;

    function orderCard(order) {
      const itemsHtml = order.items && order.items.length > 0
        ? order.items.map(item => `
          <div class="k-item">
            <span>${item.item_name} × ${item.quantity}</span>
            <strong>₹${Number(item.price * item.quantity).toFixed(2)}</strong>
          </div>
        `).join("")
        : `<div class="k-item"><span>Items not available</span></div>`;

      return `
        <div class="kanban-card">
          <div class="kanban-card-top">
            <div>
              <h3>Order #${order.order_id}</h3>
              <p class="k-time">${new Date(order.created_at).toLocaleString()}</p>
            </div>
            <span class="k-chip">${String(order.status).replaceAll("_", " ")}</span>
          </div>

          <div class="k-meta">
            <b>${order.customer_name}</b><br>
            📞 ${order.phone}<br>
            📍 ${order.address}<br>
            🍽️ ${order.order_type}
            ${
              order.delivery_date
                ? `<br>⏰ ${new Date(order.delivery_date).toLocaleString()}`
                : ""
            }
          </div>

          <div class="k-items">
            ${itemsHtml}
          </div>

          <div class="k-total">
            Total: ₹${Number(order.total_amount).toFixed(2)}
          </div>

          <div class="k-actions">
            ${
              order.status === "PENDING"
                ? `<button class="k-accept" onclick="updateKanbanStatus(${order.order_id}, 'ACCEPTED')">Accept</button>`
                : ""
            }

            ${
              order.status === "ACCEPTED"
                ? `<button class="k-prep" onclick="updateKanbanStatus(${order.order_id}, 'PREPARING')">Preparing</button>`
                : ""
            }

            ${
              order.status === "PREPARING"
                ? `<button class="k-out" onclick="updateKanbanStatus(${order.order_id}, 'OUT_FOR_DELIVERY')">Out</button>`
                : ""
            }

            ${
              order.status === "OUT_FOR_DELIVERY"
                ? `<button class="k-deliver" onclick="updateKanbanStatus(${order.order_id}, 'DELIVERED')">Delivered</button>`
                : ""
            }

            ${
              order.status !== "DELIVERED" && order.status !== "CANCELLED"
                ? `<button class="k-cancel" onclick="updateKanbanStatus(${order.order_id}, 'CANCELLED')">Cancel</button>`
                : ""
            }
          </div>
        </div>
      `;
    }

    pendingCol.innerHTML = pendingOrders.length
      ? pendingOrders.map(orderCard).join("")
      : `<div class="empty-col">No pending orders</div>`;

    preparingCol.innerHTML = preparingOrders.length
      ? preparingOrders.map(orderCard).join("")
      : `<div class="empty-col">No preparing orders</div>`;

    deliveryCol.innerHTML = deliveryOrders.length
      ? deliveryOrders.map(orderCard).join("")
      : `<div class="empty-col">No delivery orders</div>`;

    deliveredCol.innerHTML = deliveredOrders.length
      ? deliveredOrders.map(orderCard).join("")
      : `<div class="empty-col">No delivered orders</div>`;

  } catch {
    pendingCol.innerHTML = `<div class="empty-col">Failed to load orders</div>`;
  }
}

async function updateKanbanStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message || data.error || "Status update failed");
      return;
    }

    showToast(`Order #${orderId} → ${status.replaceAll("_", " ")}`);
    loadAdminKanban();

  } catch {
    showToast("Server error while updating status");
  }
}

loadAdminKanban();
/* KANBAN ADMIN PANEL WITH CUSTOMER FILTER */

let allAdminOrders = [];
let selectedAdminCustomerId = null;

async function loadAdminKanban() {
  const pendingCol = document.getElementById("pendingCol");
  const preparingCol = document.getElementById("preparingCol");
  const deliveryCol = document.getElementById("deliveryCol");
  const deliveredCol = document.getElementById("deliveredCol");

  if (!pendingCol) return;

  pendingCol.innerHTML = `<div class="empty-col">Loading...</div>`;
  preparingCol.innerHTML = `<div class="empty-col">Loading...</div>`;
  deliveryCol.innerHTML = `<div class="empty-col">Loading...</div>`;
  deliveredCol.innerHTML = `<div class="empty-col">Loading...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`);
    const data = await res.json();

    if (!data.success || !data.orders) {
      showToast("Failed to load orders");
      return;
    }

    allAdminOrders = data.orders;
    renderAdminKanban(allAdminOrders);

  } catch {
    showToast("Server error while loading orders");
  }
}

function renderAdminKanban(orders) {
  const pendingCol = document.getElementById("pendingCol");
  const preparingCol = document.getElementById("preparingCol");
  const deliveryCol = document.getElementById("deliveryCol");
  const deliveredCol = document.getElementById("deliveredCol");

  const kTotal = document.getElementById("kTotal");
  const kPending = document.getElementById("kPending");
  const kPreparing = document.getElementById("kPreparing");
  const kDelivered = document.getElementById("kDelivered");

  if (!pendingCol) return;

  const filteredOrders = selectedAdminCustomerId
    ? orders.filter(o => Number(o.user_id) === Number(selectedAdminCustomerId))
    : orders;

  const pendingOrders = filteredOrders.filter(o => o.status === "PENDING");
  const preparingOrders = filteredOrders.filter(o =>
    o.status === "ACCEPTED" || o.status === "PREPARING"
  );
  const deliveryOrders = filteredOrders.filter(o => o.status === "OUT_FOR_DELIVERY");
  const deliveredOrders = filteredOrders.filter(o =>
    o.status === "DELIVERED" || o.status === "CANCELLED"
  );

  if (kTotal) kTotal.innerText = filteredOrders.length;
  if (kPending) kPending.innerText = pendingOrders.length;
  if (kPreparing) kPreparing.innerText = preparingOrders.length;
  if (kDelivered) kDelivered.innerText = deliveredOrders.length;

  function orderCard(order) {
    const itemsHtml = order.items && order.items.length > 0
      ? order.items.map(item => `
        <div class="k-item">
          <span>${item.item_name} × ${item.quantity}</span>
          <strong>₹${Number(item.price * item.quantity).toFixed(2)}</strong>
        </div>
      `).join("")
      : `<div class="k-item"><span>Items not available</span></div>`;

    return `
      <div class="kanban-card">
        <div class="kanban-card-top">
          <div>
            <h3>Order #${order.order_id}</h3>
            <p class="k-time">${new Date(order.created_at).toLocaleString()}</p>
          </div>
          <span class="k-chip">${String(order.status).replaceAll("_", " ")}</span>
        </div>

        <div class="k-meta">
          <b class="customer-click"
             onclick="filterOrdersByCustomer(${order.user_id}, '${String(order.customer_name).replace(/'/g, "\\'")}')">
             👤 ${order.customer_name}
          </b><br>
          📞 ${order.phone}<br>
          📍 ${order.address}<br>
          🍽️ ${order.order_type}
          ${
            order.delivery_date
              ? `<br>⏰ ${new Date(order.delivery_date).toLocaleString()}`
              : ""
          }
        </div>

        <div class="k-items">
          ${itemsHtml}
        </div>

        <div class="k-total">
          Total: ₹${Number(order.total_amount).toFixed(2)}
        </div>

        <div class="k-actions">
          ${
            order.status === "PENDING"
              ? `<button class="k-accept" onclick="updateKanbanStatus(${order.order_id}, 'ACCEPTED')">Accept</button>`
              : ""
          }

          ${
            order.status === "ACCEPTED"
              ? `<button class="k-prep" onclick="updateKanbanStatus(${order.order_id}, 'PREPARING')">Preparing</button>`
              : ""
          }

          ${
            order.status === "PREPARING"
              ? `<button class="k-out" onclick="updateKanbanStatus(${order.order_id}, 'OUT_FOR_DELIVERY')">Out</button>`
              : ""
          }

          ${
            order.status === "OUT_FOR_DELIVERY"
              ? `<button class="k-deliver" onclick="updateKanbanStatus(${order.order_id}, 'DELIVERED')">Delivered</button>`
              : ""
          }

          ${
            order.status !== "DELIVERED" && order.status !== "CANCELLED"
              ? `<button class="k-cancel" onclick="updateKanbanStatus(${order.order_id}, 'CANCELLED')">Cancel</button>`
              : ""
          }
        </div>
      </div>
    `;
  }

  pendingCol.innerHTML = pendingOrders.length
    ? pendingOrders.map(orderCard).join("")
    : `<div class="empty-col">No pending orders</div>`;

  preparingCol.innerHTML = preparingOrders.length
    ? preparingOrders.map(orderCard).join("")
    : `<div class="empty-col">No preparing orders</div>`;

  deliveryCol.innerHTML = deliveryOrders.length
    ? deliveryOrders.map(orderCard).join("")
    : `<div class="empty-col">No delivery orders</div>`;

  deliveredCol.innerHTML = deliveredOrders.length
    ? deliveredOrders.map(orderCard).join("")
    : `<div class="empty-col">No delivered orders</div>`;
}

function filterOrdersByCustomer(userId, customerName) {
  selectedAdminCustomerId = userId;

  showToast(`Showing orders for ${customerName}`);
  renderCustomerFilterBanner(customerName);
  renderAdminKanban(allAdminOrders);
}

function clearCustomerFilter() {
  selectedAdminCustomerId = null;

  const banner = document.getElementById("customerFilterBanner");
  if (banner) banner.remove();

  renderAdminKanban(allAdminOrders);
}

function renderCustomerFilterBanner(customerName) {
  let banner = document.getElementById("customerFilterBanner");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "customerFilterBanner";
    banner.className = "customer-filter-banner";

    const board = document.querySelector(".kanban-board");
    if (board) {
      board.parentNode.insertBefore(banner, board);
    }
  }

  banner.innerHTML = `
    <div>
      <b>👤 Customer Filter Active</b>
      <p>Showing all orders of <strong>${customerName}</strong></p>
    </div>
    <button onclick="clearCustomerFilter()">Show All Orders</button>
  `;
}

async function updateKanbanStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message || data.error || "Status update failed");
      return;
    }

    showToast(`Order #${orderId} → ${status.replaceAll("_", " ")}`);

    await loadAdminKanban();

  } catch {
    showToast("Server error while updating status");
  }
}

loadAdminKanban();
/* ADMIN LIVE NOTIFICATIONS */

let lastAdminOrderIds = new Set();
let adminLiveStarted = false;

function playNewOrderSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.08;

    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 180);
  } catch {
    // sound ignored if browser blocks it
  }
}

function showBrowserNotification(title, body) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

async function checkNewAdminOrders() {
  const badge = document.getElementById("newOrderBadge");
  const pendingCol = document.getElementById("pendingCol");

  if (!pendingCol) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`);
    const data = await res.json();

    if (!data.success || !data.orders) return;

    const currentIds = new Set(data.orders.map(order => order.order_id));

    if (lastAdminOrderIds.size === 0) {
      lastAdminOrderIds = currentIds;
      return;
    }

    const newOrders = data.orders.filter(order => !lastAdminOrderIds.has(order.order_id));

    if (newOrders.length > 0) {
      if (badge) {
        badge.style.display = "inline-block";
        badge.innerText = `${newOrders.length} New`;
      }

      showToast(`🔔 ${newOrders.length} new order received`);
      playNewOrderSound();

      showBrowserNotification(
        "New Order Received",
        `${newOrders.length} new customer order received`
      );

      await loadAdminKanban();
    }

    lastAdminOrderIds = currentIds;

  } catch {
    // ignore silent polling errors
  }
}

function startAdminLiveNotifications() {
  const pendingCol = document.getElementById("pendingCol");
  if (!pendingCol || adminLiveStarted) return;

  adminLiveStarted = true;

  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  loadAdminKanban();

  setInterval(checkNewAdminOrders, 10000);
}

function clearNewOrderBadge() {
  const badge = document.getElementById("newOrderBadge");
  if (badge) {
    badge.style.display = "none";
    badge.innerText = "0 New";
  }
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".kanban-actions button")) {
    clearNewOrderBadge();
  }
});

startAdminLiveNotifications();