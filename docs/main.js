(() => {
  const ACCESS_CODE = "5947666";
  const SESSION_KEY = "fake-location-access";
  const countries = [
    "Japan",
    "United States",
    "France",
    "Singapore",
    "Germany",
    "Australia",
    "Brazil",
    "Canada",
    "United Kingdom",
    "South Korea",
    "Italy",
    "New Zealand"
  ];

  const gate = document.getElementById("gate");
  const site = document.getElementById("site");
  const form = document.getElementById("gate-form");
  const password = document.getElementById("password");
  const error = document.getElementById("gate-error");
  const countryName = document.getElementById("country-name");

  function unlock() {
    gate.classList.add("is-hidden");
    site.classList.add("is-visible");
    site.setAttribute("aria-hidden", "false");
    startGlobe();
  }

  if (sessionStorage.getItem(SESSION_KEY) === "unlocked") {
    unlock();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (password.value.trim() === ACCESS_CODE) {
      sessionStorage.setItem(SESSION_KEY, "unlocked");
      unlock();
      return;
    }

    error.textContent = "Incorrect password.";
    password.select();
  });

  let countryIndex = 0;
  window.setInterval(() => {
    countryIndex = (countryIndex + 1) % countries.length;
    countryName.textContent = countries[countryIndex];
    countryName.classList.remove("is-changing");
    void countryName.offsetWidth;
    countryName.classList.add("is-changing");
  }, 1800);

  function startGlobe() {
    const canvas = document.getElementById("globe");
    if (canvas.dataset.started === "true") return;
    canvas.dataset.started = "true";

    const ctx = canvas.getContext("2d", { alpha: true });
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = {
      rotationY: -0.56,
      rotationX: -0.24,
      dragging: false,
      lastX: 0,
      lastY: 0,
      lastTime: performance.now()
    };

    const pins = [
      { lat: 35.6762, lon: 139.6503 },
      { lat: 40.7128, lon: -74.006 },
      { lat: 48.8566, lon: 2.3522 },
      { lat: 1.3521, lon: 103.8198 },
      { lat: -33.8688, lon: 151.2093 },
      { lat: -23.5505, lon: -46.6333 },
      { lat: 51.5072, lon: -0.1276 }
    ];

    function resize() {
      const box = canvas.getBoundingClientRect();
      const size = Math.max(280, Math.floor(Math.min(box.width, box.height)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function project(lat, lon, radius, cx, cy) {
      const phi = (lat * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180 + state.rotationY;
      let x = Math.cos(phi) * Math.sin(theta);
      let y = Math.sin(phi);
      let z = Math.cos(phi) * Math.cos(theta);

      const cosX = Math.cos(state.rotationX);
      const sinX = Math.sin(state.rotationX);
      const y2 = y * cosX - z * sinX;
      const z2 = y * sinX + z * cosX;

      return {
        x: cx + x * radius,
        y: cy - y2 * radius,
        z: z2
      };
    }

    function drawLine(points, radius, cx, cy, color, width) {
      let drawing = false;
      ctx.beginPath();

      for (const point of points) {
        const p = project(point.lat, point.lon, radius, cx, cy);
        if (p.z <= -0.08) {
          drawing = false;
          continue;
        }

        if (!drawing) {
          ctx.moveTo(p.x, p.y);
          drawing = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    function greatCircle(from, to, steps = 56) {
      const out = [];
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        out.push({
          lat: from.lat + (to.lat - from.lat) * t + Math.sin(t * Math.PI) * 18,
          lon: from.lon + (to.lon - from.lon) * t
        });
      }
      return out;
    }

    function draw(now) {
      const elapsed = Math.min(40, now - state.lastTime);
      state.lastTime = now;
      if (!state.dragging && !prefersReducedMotion) {
        state.rotationY += elapsed * 0.00016;
      }

      const size = canvas.width / Math.min(window.devicePixelRatio || 1, 2);
      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.405;

      ctx.clearRect(0, 0, size, size);

      const halo = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.28, radius * 0.1, cx, cy, radius * 1.28);
      halo.addColorStop(0, "rgba(255,255,255,0.88)");
      halo.addColorStop(0.5, "rgba(255,255,255,0.32)");
      halo.addColorStop(1, "rgba(0,138,120,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.22, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(cx - radius * 0.34, cy - radius * 0.4, radius * 0.1, cx, cy, radius);
      body.addColorStop(0, "#ffffff");
      body.addColorStop(0.58, "#f8f6ef");
      body.addColorStop(1, "#dad6cb");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      for (let lat = -60; lat <= 60; lat += 20) {
        const points = [];
        for (let lon = -180; lon <= 180; lon += 4) points.push({ lat, lon });
        drawLine(points, radius, cx, cy, "rgba(16,18,17,0.16)", 1);
      }

      for (let lon = -180; lon < 180; lon += 20) {
        const points = [];
        for (let lat = -84; lat <= 84; lat += 4) points.push({ lat, lon });
        drawLine(points, radius, cx, cy, "rgba(16,18,17,0.13)", 1);
      }

      for (let i = 1; i < pins.length; i += 1) {
        drawLine(greatCircle(pins[0], pins[i]), radius, cx, cy, "rgba(0,138,120,0.26)", 1.6);
      }

      for (const pin of pins) {
        const p = project(pin.lat, pin.lon, radius, cx, cy);
        if (p.z > 0) {
          const scale = 0.72 + p.z * 0.36;
          ctx.fillStyle = "rgba(0,138,120,0.95)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.6 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.92)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      ctx.restore();

      ctx.strokeStyle = "rgba(16,18,17,0.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0,138,120,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.08, radius * 0.16, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      requestAnimationFrame(draw);
    }

    function pointerDown(event) {
      state.dragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    }

    function pointerMove(event) {
      if (!state.dragging) return;
      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.rotationY += dx * 0.006;
      state.rotationX = Math.max(-1.1, Math.min(1.1, state.rotationX + dy * 0.006));
    }

    function pointerUp(event) {
      state.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    }

    window.addEventListener("resize", resize, { passive: true });
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);

    resize();
    requestAnimationFrame(draw);
  }
})();
