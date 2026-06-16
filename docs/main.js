(() => {
  const ACCESS_CODE = "5947666";
  const SESSION_KEY = "fake-location-access";
  const regionCodes = [
    "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
    "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
    "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
    "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO",
    "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF",
    "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY",
    "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM",
    "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY",
    "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX",
    "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI",
    "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH",
    "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC",
    "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS",
    "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
    "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "UM", "US", "UY", "UZ", "VU",
    "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW", "XK"
  ];
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = regionCodes.map((code) => regionNames.of(code)).filter(Boolean);

  const gate = document.getElementById("gate");
  const site = document.getElementById("site");
  const form = document.getElementById("gate-form");
  const password = document.getElementById("password");
  const error = document.getElementById("gate-error");
  const countryName = document.getElementById("country-name");
  let countryIndex = 0;
  let countryTimer = null;

  function showNextCountry() {
    countryIndex = (countryIndex + 1) % countries.length;
    countryName.textContent = countries[countryIndex];
    countryName.classList.remove("is-changing");
    void countryName.offsetWidth;
    countryName.classList.add("is-changing");
  }

  function startCountryRotation() {
    if (countryTimer) return;
    countryName.textContent = countries[countryIndex];
    countryTimer = window.setInterval(showNextCountry, 1800);
  }

  function unlock() {
    gate.classList.add("is-hidden");
    site.classList.add("is-visible");
    site.setAttribute("aria-hidden", "false");
    startCountryRotation();
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

    const landBlobs = [
      { lat: 48, lon: -104, latRadius: 28, lonRadius: 48, tilt: -0.48, seed: 1.1 },
      { lat: -18, lon: -62, latRadius: 34, lonRadius: 24, tilt: 0.32, seed: 2.7 },
      { lat: 50, lon: 24, latRadius: 24, lonRadius: 38, tilt: -0.18, seed: 4.2 },
      { lat: 8, lon: 20, latRadius: 36, lonRadius: 29, tilt: -0.08, seed: 6.3 },
      { lat: 44, lon: 102, latRadius: 33, lonRadius: 57, tilt: 0.16, seed: 8.4 },
      { lat: -25, lon: 134, latRadius: 18, lonRadius: 28, tilt: 0.18, seed: 9.9 }
    ];

    const surface = {
      canvas: document.createElement("canvas"),
      ctx: null,
      image: null,
      size: 0
    };
    surface.ctx = surface.canvas.getContext("2d", { alpha: true });

    function clamp(value, min = 0, max = 1) {
      return Math.max(min, Math.min(max, value));
    }

    function mix(from, to, amount) {
      return from + (to - from) * amount;
    }

    function smoothNoise(x, y, seed) {
      return Math.sin(x * 7.1 + seed) * 0.08 + Math.cos(y * 8.6 - seed) * 0.07 + Math.sin((x + y) * 12.4 + seed) * 0.05;
    }

    function wrapDeltaLon(delta) {
      return ((((delta + 180) % 360) + 360) % 360) - 180;
    }

    function landBlendAt(lat, lon) {
      let blend = 0;
      for (const blob of landBlobs) {
        const cos = Math.cos(blob.tilt);
        const sin = Math.sin(blob.tilt);
        const localLon = wrapDeltaLon(lon - blob.lon) / blob.lonRadius;
        const localLat = (lat - blob.lat) / blob.latRadius;
        const x = localLon * cos + localLat * sin;
        const y = -localLon * sin + localLat * cos;
        const dist = Math.hypot(x, y);
        const edge = 1 + smoothNoise(x, y, blob.seed);
        const feather = 0.24;
        const amount = clamp((edge - dist) / feather);
        blend = Math.max(blend, amount * amount * (3 - 2 * amount));
      }

      return blend;
    }

    function ensureSurface(size) {
      const nextSize = Math.max(128, Math.min(170, Math.round(size * 0.34)));
      if (surface.size === nextSize) return;

      surface.size = nextSize;
      surface.canvas.width = nextSize;
      surface.canvas.height = nextSize;
      surface.image = surface.ctx.createImageData(nextSize, nextSize);
    }

    function renderSurface(size) {
      ensureSurface(size);
      const n = surface.size;
      const data = surface.image.data;
      const cosX = Math.cos(state.rotationX);
      const sinX = Math.sin(state.rotationX);
      let offset = 0;

      for (let py = 0; py < n; py += 1) {
        const sy = (py / (n - 1)) * 2 - 1;
        for (let px = 0; px < n; px += 1) {
          const sx = (px / (n - 1)) * 2 - 1;
          const d2 = sx * sx + sy * sy;

          if (d2 > 1) {
            data[offset] = 0;
            data[offset + 1] = 0;
            data[offset + 2] = 0;
            data[offset + 3] = 0;
            offset += 4;
            continue;
          }

          const z2 = Math.sqrt(1 - d2);
          const y2 = -sy;
          const worldY = y2 * cosX + z2 * sinX;
          const worldZ = -y2 * sinX + z2 * cosX;
          const lat = (Math.asin(clamp(worldY, -1, 1)) * 180) / Math.PI;
          const lon = ((Math.atan2(sx, worldZ) - state.rotationY) * 180) / Math.PI;
          const land = landBlendAt(lat, lon);
          const edge = Math.pow(d2, 1.55);
          const light = clamp(0.6 + z2 * 0.24 - sx * 0.22 - sy * 0.28);
          const oceanDepth = clamp(edge * 0.82 + (1 - light) * 0.25);

          let r = mix(24, 82, light) - oceanDepth * 36;
          let g = mix(126, 221, light) - oceanDepth * 56;
          let b = mix(137, 205, light) - oceanDepth * 58;

          if (land > 0) {
            const landLight = clamp(light + 0.08);
            const landR = mix(170, 226, landLight);
            const landG = mix(222, 255, landLight);
            const landB = mix(164, 196, landLight);
            const amount = land * 0.88;
            r = mix(r, landR, amount);
            g = mix(g, landG, amount);
            b = mix(b, landB, amount);
          }

          data[offset] = clamp(Math.round(r), 0, 255);
          data[offset + 1] = clamp(Math.round(g), 0, 255);
          data[offset + 2] = clamp(Math.round(b), 0, 255);
          data[offset + 3] = 255;
          offset += 4;
        }
      }

      surface.ctx.putImageData(surface.image, 0, 0);
      return surface.canvas;
    }

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
    const targetFrameMs = prefersReducedMotion ? 1000 : 1000 / 30;

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

      ctx.drawImage(renderSurface(size), cx - radius, cy - radius, radius * 2, radius * 2);

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

      const shine = ctx.createRadialGradient(cx - radius * 0.38, cy - radius * 0.42, 0, cx - radius * 0.25, cy - radius * 0.32, radius * 0.92);
      shine.addColorStop(0, "rgba(255,255,236,0.34)");
      shine.addColorStop(0.32, "rgba(236,255,226,0.14)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shine;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

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
