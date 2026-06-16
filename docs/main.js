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
      lastTime: performance.now(),
      lastDraw: 0
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

    const landMasses = [
      [
        { lat: 58, lon: -168 }, { lat: 70, lon: -132 }, { lat: 62, lon: -92 },
        { lat: 50, lon: -62 }, { lat: 30, lon: -82 }, { lat: 16, lon: -104 },
        { lat: 27, lon: -122 }, { lat: 46, lon: -128 }
      ],
      [
        { lat: 13, lon: -82 }, { lat: 5, lon: -64 }, { lat: -16, lon: -54 },
        { lat: -34, lon: -62 }, { lat: -54, lon: -70 }, { lat: -28, lon: -78 },
        { lat: -4, lon: -78 }
      ],
      [
        { lat: 72, lon: -22 }, { lat: 66, lon: 42 }, { lat: 45, lon: 74 },
        { lat: 34, lon: 42 }, { lat: 52, lon: 10 }, { lat: 38, lon: -10 },
        { lat: 55, lon: -22 }
      ],
      [
        { lat: 32, lon: -18 }, { lat: 34, lon: 35 }, { lat: 12, lon: 50 },
        { lat: -34, lon: 28 }, { lat: -28, lon: 6 }, { lat: 2, lon: -18 }
      ],
      [
        { lat: 58, lon: 62 }, { lat: 70, lon: 110 }, { lat: 54, lon: 154 },
        { lat: 34, lon: 142 }, { lat: 12, lon: 104 }, { lat: 7, lon: 78 },
        { lat: 28, lon: 58 }
      ],
      [
        { lat: -10, lon: 112 }, { lat: -20, lon: 154 }, { lat: -42, lon: 145 },
        { lat: -36, lon: 112 }
      ]
    ];

    const graticules = [];
    for (let lat = -60; lat <= 60; lat += 20) {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 4) points.push({ lat, lon });
      graticules.push(points);
    }
    for (let lon = -180; lon < 180; lon += 20) {
      const points = [];
      for (let lat = -84; lat <= 84; lat += 4) points.push({ lat, lon });
      graticules.push(points);
    }

    function greatCircle(from, to, steps = 46) {
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

    const routes = pins.slice(1).map((pin) => greatCircle(pins[0], pin));
    const targetFrameMs = prefersReducedMotion ? 1000 : 1000 / 45;

    function resize() {
      const box = canvas.getBoundingClientRect();
      const size = Math.max(220, Math.floor(Math.min(box.width, box.height)));
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

    function drawLand(points, radius, cx, cy) {
      const projected = points.map((point) => project(point.lat, point.lon, radius, cx, cy)).filter((point) => point.z > -0.05);
      if (projected.length < 3) return;

      ctx.beginPath();
      projected.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(218, 255, 195, 0.66)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.44)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function draw(now) {
      if (now - state.lastDraw < targetFrameMs) {
        requestAnimationFrame(draw);
        return;
      }

      const elapsed = Math.min(40, now - state.lastTime);
      state.lastDraw = now;
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
      halo.addColorStop(0, "rgba(246,255,249,0.95)");
      halo.addColorStop(0.48, "rgba(68,206,184,0.24)");
      halo.addColorStop(0.78, "rgba(0,114,120,0.16)");
      halo.addColorStop(1, "rgba(0,138,120,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.22, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(cx - radius * 0.34, cy - radius * 0.4, radius * 0.1, cx, cy, radius);
      body.addColorStop(0, "#fbfff7");
      body.addColorStop(0.24, "#bdf7df");
      body.addColorStop(0.58, "#46cbb8");
      body.addColorStop(0.84, "#138887");
      body.addColorStop(1, "#0b4252");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const oceanSheen = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      oceanSheen.addColorStop(0, "rgba(255,255,255,0.35)");
      oceanSheen.addColorStop(0.42, "rgba(150,255,226,0.16)");
      oceanSheen.addColorStop(1, "rgba(2,45,68,0.22)");
      ctx.fillStyle = oceanSheen;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      for (const land of landMasses) {
        drawLand(land, radius, cx, cy);
      }

      for (const line of graticules) {
        drawLine(line, radius, cx, cy, "rgba(243,255,247,0.34)", 1);
      }

      for (const route of routes) {
        drawLine(route, radius, cx, cy, "rgba(212,255,236,0.64)", 1.8);
      }

      for (const pin of pins) {
        const p = project(pin.lat, pin.lon, radius, cx, cy);
        if (p.z > 0) {
          const scale = 0.72 + p.z * 0.36;
          ctx.fillStyle = "rgba(247,255,198,0.96)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.6 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,103,98,0.8)";
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      ctx.restore();

      const rim = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      rim.addColorStop(0, "rgba(255,255,255,0.9)");
      rim.addColorStop(0.52, "rgba(106,232,207,0.6)");
      rim.addColorStop(1, "rgba(3,58,72,0.55)");
      ctx.strokeStyle = rim;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(194,255,231,0.46)";
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
