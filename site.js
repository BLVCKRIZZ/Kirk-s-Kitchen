(function () {
  "use strict";

  var WA = "https://wa.me/27817310083";
  var STORAGE_KEY = "kirks-kitchen-cart";
  var MENU = [
    { cat: "Burgers", items: [
      { id: "classic", name: "Single Cheese Burger", desc: "Single patty with cheese.", price: 80 },
      { id: "double", name: "Double Cheese Burger", desc: "Two patties with cheese.", price: 120 },
      { id: "bacon", name: "Single Artisan Burger", desc: "150g patty with guac, bacon and jalapeño.", price: 120 },
      { id: "double-artisan", name: "Double Artisan Burger", desc: "300g patty with guac, bacon and jalapeño.", price: 150 }
    ] },
    { cat: "Fries", items: [
      { id: "small-fries", name: "Small Fries", desc: "Small serving of fries.", price: 35 },
      { id: "fries", name: "Normal Loaded Fries", desc: "Loaded fries.", price: 60 }
    ] }
  ];
  var all = {};
  MENU.forEach(function (category) {
    category.items.forEach(function (item) { all[item.id] = item; });
  });

  function reportStorageError(message, error) {
    console.error(message, error);
    var notice = document.getElementById("site-error");
    if (notice) {
      notice.hidden = false;
      notice.textContent = "Your cart could not be saved in this browser. It may not be available after you leave this page.";
    }
  }

  function loadCart() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      reportStorageError("Unable to read the saved cart.", error);
      return {};
    }
    if (!raw) return {};

    try {
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Saved cart has an invalid format.");
      var valid = {};
      Object.keys(saved).forEach(function (id) {
        if (all[id] && Number.isInteger(saved[id]) && saved[id] > 0) valid[id] = saved[id];
      });
      return valid;
    } catch (error) {
      reportStorageError("Unable to parse the saved cart.", error);
      return {};
    }
  }

  var cart = loadCart();

  function price(amount) {
    return "R" + amount.toFixed(2).replace(/\.00$/, "");
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      reportStorageError("Unable to save the cart.", error);
    }
  }

  function controls(id) {
    var quantity = cart[id] || 0;
    if (!quantity) return '<button class="btn add" type="button" data-id="' + id + '" data-d="1">Add</button>';
    return '<div class="qty"><button type="button" aria-label="Remove one" data-id="' + id + '" data-d="-1">−</button><output>' +
      quantity + '</output><button type="button" aria-label="Add one" data-id="' + id + '" data-d="1">+</button></div>';
  }

  function renderProducts() {
    var list = document.getElementById("menulist");
    if (!list) return;
    var html = "";
    MENU.forEach(function (category) {
      html += '<div class="cat">' + category.cat + "</div>";
      category.items.forEach(function (item) {
        html += '<div class="item"><h3>' + item.name + "</h3><p>" + item.desc +
          '</p><div class="act"><span class="price">' + price(item.price) +
          '</span><div data-controls="' + item.id + '">' + controls(item.id) + "</div></div></div>";
      });
    });
    list.innerHTML = html;
  }

  function renderCart() {
    var lines = document.getElementById("lines");
    if (!lines) return;
    var count = 0;
    var total = 0;
    var html = "";
    Object.keys(cart).forEach(function (id) {
      var item = all[id];
      var quantity = cart[id];
      if (!item) return;
      count += quantity;
      total += quantity * item.price;
      html += "<li><span>" + quantity + " × " + item.name + "</span><span>" + price(quantity * item.price) + "</span></li>";
    });
    lines.innerHTML = html;
    document.getElementById("total").textContent = price(total);
    document.getElementById("empty").hidden = count > 0;
    document.getElementById("filled").hidden = count === 0;
  }

  function render() {
    var count = 0;
    var total = 0;
    Object.keys(cart).forEach(function (id) {
      if (!all[id]) return;
      count += cart[id];
      total += cart[id] * all[id].price;
    });
    document.querySelectorAll("[data-cart-count]").forEach(function (element) {
      element.textContent = count;
    });
    var bar = document.getElementById("bar");
    if (bar) {
      bar.style.display = count ? "flex" : "none";
      document.getElementById("barcount").textContent = "View cart (" + count + ")";
      document.getElementById("bartotal").textContent = price(total);
      document.body.style.paddingBottom = count ? "64px" : "0";
    }
    renderProducts();
    renderCart();
  }

  function change(id, amount) {
    if (!all[id]) return;
    cart[id] = Math.max(0, (cart[id] || 0) + amount);
    if (!cart[id]) delete cart[id];
    saveCart();
    render();
  }

  function setupNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-navigation");
    if (!toggle || !nav) return;

    document.documentElement.classList.add("js");
    function setOpen(open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 700) setOpen(false);
    });
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-id]");
    if (button) change(button.dataset.id, Number(button.dataset.d));
  });

  var placeButton = document.getElementById("place");
  if (placeButton) {
    placeButton.addEventListener("click", function () {
      var name = document.getElementById("name").value.trim();
      var phone = document.getElementById("phone").value.trim();
      var time = document.getElementById("time").value.trim();
      var notes = document.getElementById("notes").value.trim();
      var error = document.getElementById("err");
      if (!name || !phone || !time) {
        error.textContent = "Please add your name, phone number and pickup time.";
        return;
      }
      error.textContent = "";
      var total = 0;
      var message = "Hi Kirk’s Kitchen, I’d like to pre-order:\n\n";
      Object.keys(cart).forEach(function (id) {
        var item = all[id];
        var quantity = cart[id];
        total += quantity * item.price;
        message += quantity + " × " + item.name + " – " + price(quantity * item.price) + "\n";
      });
      message += "\nTotal: " + price(total) + "\nName: " + name + "\nPhone: " + phone + "\nPickup time: " + time;
      if (notes) message += "\nNotes: " + notes;
      document.getElementById("msg").value = message;
      document.getElementById("wa").href = WA + "?text=" + encodeURIComponent(message);
      document.getElementById("done").style.display = "block";
      this.hidden = true;
      document.getElementById("done").scrollIntoView({ block: "center" });
    });
  }

  var copyButton = document.getElementById("copy");
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var box = document.getElementById("msg");
      box.select();
      try {
        document.execCommand("copy");
        this.textContent = "Copied";
      } catch (error) {
        console.error("Unable to copy the order.", error);
      }
      var button = this;
      setTimeout(function () { button.textContent = "Copy order"; }, 1800);
    });
  }

  setupNavigation();
  render();
})();
