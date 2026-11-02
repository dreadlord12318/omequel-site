(function () {
  var d = document, PHONE = "639198954986", EMAIL = "omequelsantiago.realty@gmail.com";

  // header shadow + mobile drawer
  var top = d.querySelector(".top");
  addEventListener("scroll", function () { top && top.classList.toggle("scrolled", scrollY > 8); }, { passive: true });
  var tog = d.querySelector(".nav-toggle"), drawer = d.querySelector(".drawer");
  if (tog && drawer) tog.addEventListener("click", function () {
    var open = drawer.classList.toggle("open");
    tog.setAttribute("aria-expanded", open);
    d.body.style.overflow = open ? "hidden" : "";
  });

  // desktop chat panel
  var chat = d.querySelector(".chat");
  if (chat) {
    chat.querySelector("button").addEventListener("click", function () {
      var o = chat.classList.toggle("open");
      this.setAttribute("aria-expanded", o);
    });
    d.addEventListener("click", function (e) { if (!chat.contains(e.target)) chat.classList.remove("open"); });
  }

  // reveal on scroll
  var rv = d.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  // home search -> properties page
  var hs = d.getElementById("homeSearch");
  if (hs) hs.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = new URLSearchParams();
    new FormData(hs).forEach(function (v, k) { if (v) q.set(k, v); });
    location.href = "properties.html" + (q.toString() ? "?" + q : "");
  });

  // properties filter
  var list = d.getElementById("plist");
  if (list) {
    var cards = [].slice.call(list.children), f = d.getElementById("filters"), cnt = d.getElementById("pcount"), empty = d.getElementById("pempty");
    var qs = new URLSearchParams(location.search);
    ["purpose", "area", "type", "max", "sort"].forEach(function (k) { if (qs.get(k) && f.elements[k]) f.elements[k].value = qs.get(k); });
    // budgets under ₱100,000 are monthly rents, the rest are sale prices; "price on request" never matches a budget
    function inBudget(c, max) {
      var p = +c.dataset.price;
      return p > 0 && p <= max && c.dataset.purpose === (max < 100000 ? "rent" : "sale");
    }
    function run() {
      var v = { purpose: f.purpose.value, area: f.area.value, type: f.type.value, max: +f.max.value || 0, sort: f.sort.value };
      var shown = cards.filter(function (c) {
        var ok = (!v.purpose || c.dataset.purpose === v.purpose) && (!v.area || c.dataset.area === v.area) &&
          (!v.type || c.dataset.type === v.type) && (!v.max || inBudget(c, v.max));
        c.hidden = !ok; return ok;
      });
      shown.sort(function (a, b) { var pa = +a.dataset.price || (v.sort === "low" ? 1e12 : -1), pb = +b.dataset.price || (v.sort === "low" ? 1e12 : -1);
        return v.sort === "low" ? pa - pb : v.sort === "high" ? pb - pa : a.dataset.order - b.dataset.order; })
        .forEach(function (c) { list.appendChild(c); });
      cnt.textContent = shown.length + (shown.length === 1 ? " property" : " properties");
      empty.hidden = shown.length > 0;
      var q = new URLSearchParams(); Object.keys(v).forEach(function (k) { if (v[k] && !(k === "sort" && v[k] === "new")) q.set(k, v[k]); });
      history.replaceState(null, "", q.toString() ? "?" + q : location.pathname);
    }
    f.addEventListener("change", run);
    d.getElementById("preset") && d.getElementById("preset").addEventListener("click", function () { f.reset(); run(); });
    run();
  }

  // listing gallery + lightbox
  var gal = d.querySelector(".gallery");
  if (gal && gal.querySelector(".thumbs")) {
    var main = gal.querySelector(".main img"), th = [].slice.call(gal.querySelectorAll(".thumbs button")), idx = 0;
    var lb = d.querySelector(".lightbox"), lbi = lb.querySelector("img");
    function show(i) {
      idx = (i + th.length) % th.length;
      th.forEach(function (b, j) { b.setAttribute("aria-current", j === idx); });
      main.src = th[idx].dataset.src; main.alt = th[idx].querySelector("img").alt; lbi.src = main.src;
    }
    th.forEach(function (b, i) { b.addEventListener("click", function () { show(i); }); });
    gal.querySelector(".main").addEventListener("click", function () { lbi.src = main.src; lb.classList.add("open"); });
    lb.querySelector(".x").addEventListener("click", function () { lb.classList.remove("open"); });
    lb.querySelector(".pv").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".nx").addEventListener("click", function () { show(idx + 1); });
    d.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") lb.classList.remove("open");
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  // viewing / inquiry form: compose the message and send it by WhatsApp, Viber or email
  var form = d.getElementById("viewForm");
  if (form) {
    var qp = new URLSearchParams(location.search);
    if (qp.get("property") && form.property) form.property.value = qp.get("property");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var g = function (n) { return (form.elements[n] && form.elements[n].value || "").trim(); };
      var lines = ["Hi Omequel, I'd like to " + (g("want") || "ask about a property") + "."];
      if (g("property")) lines.push("Property: " + g("property"));
      if (g("area")) lines.push("Area: " + g("area"));
      if (g("budget")) lines.push("Budget: " + g("budget"));
      if (g("date")) lines.push("Preferred viewing date: " + g("date"));
      if (g("message")) lines.push(g("message"));
      lines.push("", "Name: " + g("name"), "Phone: " + g("phone"));
      if (g("email")) lines.push("Email: " + g("email"));
      var text = lines.join("\n"), via = (form.querySelector("input[name=via]:checked") || {}).value || "whatsapp";
      var url = via === "email" ? "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Viewing request from " + g("name")) + "&body=" + encodeURIComponent(text)
        : via === "viber" ? "viber://chat?number=%2B" + PHONE + "&draft=" + encodeURIComponent(text)
        : "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text);
      d.getElementById("formMsg").classList.add("show");
      location.href = url;
    });
  }

  // video tours: swap the poster for the real video only when play is pressed
  d.querySelectorAll(".vplayer").forEach(function (p) {
    p.querySelector(".vplay").addEventListener("click", function () {
      var v = d.createElement("video");
      v.src = p.dataset.src; v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = "auto";
      v.poster = p.querySelector("img").src;
      p.innerHTML = ""; p.appendChild(v); v.play && v.play().catch(function () {});
    });
  });

  // any image marked data-zoom opens full size
  var zs = d.querySelectorAll("img[data-zoom]");
  if (zs.length) {
    var zb = d.createElement("div"); zb.className = "lightbox"; zb.setAttribute("role", "dialog"); zb.setAttribute("aria-label", "Photo viewer");
    zb.innerHTML = "<img alt=\"\"><button class=\"x\" type=\"button\" aria-label=\"Close\">&times;</button>";
    d.body.appendChild(zb);
    var zi = zb.querySelector("img");
    zs.forEach(function (im) { im.addEventListener("click", function () { zi.src = im.currentSrc || im.src; zi.alt = im.alt; zb.classList.add("open"); }); });
    zb.addEventListener("click", function (e) { if (e.target !== zi) zb.classList.remove("open"); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") zb.classList.remove("open"); });
  }

  var y = d.getElementById("yr"); if (y) y.textContent = new Date().getFullYear();
})();
