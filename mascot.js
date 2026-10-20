/* K-PEDIA 7.0 — Maskot login "Si Loko" (versi clay).
   Loko berwujud anak kecil: helm kubah dengan lampu depan dan cerobong beruap, kacamata, syal oranye, ransel.
   Interaksi: mata & kepala mengikuti kursor/jari, menutup mata saat sandi diketik, mengintip saat sandi ditampilkan,
   bereaksi saat salah/terkunci, melompat + berangkat saat berhasil masuk, klik = tarik peluit (dengan suara klakson).
   Saat diam ia melakukan gerakan acak: melambai, melompat kecil, mengepulkan uap, membetulkan kacamata, menoleh kiri-kanan.
   API publik tetap: window.KP_MASCOT.react("bad" | "lock") dan window.KP_MASCOT.depart() (Promise). */
"use strict";
(function () {
  const $ = (s, p = document) => p.querySelector(s);
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = -1, b = 1) => Math.min(b, Math.max(a, v));

  /* Membuat bagian yang berputar/menskala terhadap titik tumpu (x, y): isi digambar dengan koordinat absolut. */
  const P = (x, y, cls, inner) => `<g transform="translate(${x} ${y})"><g class="${cls}"><g transform="translate(${-x} ${-y})">${inner}</g></g></g>`;
  /* Filter clay: bayangan dalam di sisi kanan-bawah dan kilau di sisi kiri-atas, mengikuti siluet bentuk. */
  const F = (id, shade, so, lo) => `<filter id="${id}" x="-14%" y="-14%" width="128%" height="128%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="3.6" result="b"/><feOffset in="b" dx="-4" dy="-6" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="r1"/><feFlood flood-color="${shade}" flood-opacity="${so}"/><feComposite in2="r1" operator="in" result="s1"/><feOffset in="b" dx="4" dy="5" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="r2"/><feFlood flood-color="#fff" flood-opacity="${lo}"/><feComposite in2="r2" operator="in" result="s2"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="s1"/><feMergeNode in="s2"/></feMerge></filter>`;
  const G = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

  /* Lengan: sisi kiri (viewer) dan kanan dicerminkan. */
  const arm = (side) => {
    const m = side === "l" ? 1 : -1, X = x => side === "l" ? x : 320 - x;
    const sh = [X(112), 256], el = [X(111), 282];
    const fore = `<rect x="${side === "l" ? 100 : 198}" y="276" width="22" height="34" rx="11" fill="url(#kl-skin)" filter="url(#kl-f-skin)"/><ellipse cx="${X(111)}" cy="313" rx="13.5" ry="12.5" fill="url(#kl-skin)" filter="url(#kl-f-skin)"/><ellipse cx="${X(111) - 11 * m}" cy="310" rx="5.5" ry="7" fill="url(#kl-skin)" transform="rotate(${-18 * m} ${X(111) - 11 * m} 310)"/>`;
    const sleeve = `<rect x="${side === "l" ? 93 : 193}" y="243" width="34" height="42" rx="16" fill="url(#kl-navy)" filter="url(#kl-f-navy)"/><rect x="${side === "l" ? 93 : 193}" y="274" width="34" height="9" rx="4.5" fill="#fff" opacity=".16"/>`;
    return P(sh[0], sh[1], `arm arm-${side}`, sleeve + P(el[0], el[1], `fore fore-${side}`, fore));
  };

  const eye = (cx, side) => P(cx, 168, `eye-look eye-${side}`, P(cx, 168, "eye-blink", `<circle cx="${cx}" cy="168" r="18.5" fill="url(#kl-iris)"/><g class="pupil"><circle cx="${cx}" cy="169" r="10.8" fill="#1A1110"/></g><circle cx="${cx + 6.5}" cy="161" r="5.2" fill="#fff"/><circle cx="${cx - 6.5}" cy="177" r="2.5" fill="#fff" opacity=".85"/>`));

  const shoe = (side) => {
    const X = x => side === "l" ? x : 320 - x;
    return P(X(138), 332, `leg leg-${side}`,
      `<rect x="${X(138) - 13}" y="326" width="26" height="22" rx="10" fill="url(#kl-skin)"/>` +
      `<path d="M${X(112)} 354C${X(112)} 340 ${X(124)} 336 ${X(138)} 336S${X(160)} 344 ${X(160)} 354C${X(160)} 360 ${X(156)} 363 ${X(150)} 363H${X(120)}C${X(114)} 363 ${X(112)} 360 ${X(112)} 354Z" fill="url(#kl-shoe)" filter="url(#kl-f-shoe)"/>` +
      `<rect x="${Math.min(X(110), X(162))}" y="356" width="52" height="9" rx="4.5" fill="url(#kl-white)"/>` +
      `<path d="M${X(125)} 344q${side === "l" ? "8-5 15-2" : "-8-5-15-2"}M${X(128)} 351q${side === "l" ? "8-4 15-2" : "-8-4-15-2"}" stroke="url(#kl-orange)" stroke-width="4" stroke-linecap="round" fill="none"/>`);
  };

  const SVG = `<svg viewBox="0 -26 320 406" aria-hidden="true" focusable="false">
<defs>
${G("kl-navy", "#3F6AB6", "#203F7A")}${G("kl-navy2", "#2F539B", "#162E60")}${G("kl-orange", "#FFA845", "#F2700F")}${G("kl-khaki", "#E6CF9F", "#C6A86F")}${G("kl-shoe", "#555B6E", "#15171F")}${G("kl-white", "#FFFFFF", "#E8E0CC")}${G("kl-gold", "#FFE48F", "#EFA318")}${G("kl-lens", "#F9C48C", "#E8934C")}
<radialGradient id="kl-skin" cx=".36" cy=".28" r=".95"><stop offset="0" stop-color="#FFE5CF"/><stop offset=".55" stop-color="#FBCBA6"/><stop offset="1" stop-color="#EEA67C"/></radialGradient>
<radialGradient id="kl-iris" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#B27A40"/><stop offset="1" stop-color="#5E3718"/></radialGradient>
<radialGradient id="kl-lamp" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFFFF0"/><stop offset=".6" stop-color="#FFE66B"/><stop offset="1" stop-color="#FFC21F"/></radialGradient>
<radialGradient id="kl-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF0A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF0A0" stop-opacity="0"/></radialGradient>
<radialGradient id="kl-hi" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="kl-steam" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D5E0F0"/></radialGradient>
${F("kl-f-skin", "#C25E2E", .34, .6)}${F("kl-f-navy", "#06163A", .5, .45)}${F("kl-f-orange", "#B13A00", .38, .55)}${F("kl-f-shoe", "#000", .55, .35)}${F("kl-f-khaki", "#6B4A12", .36, .5)}${F("kl-f-gold", "#8A5200", .4, .6)}
<filter id="kl-blur" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>

<ellipse class="m-shadow" cx="160" cy="366" rx="80" ry="9" fill="#1b2f5a" opacity=".24" filter="url(#kl-blur)"/>

${P(160, 364, "m-all", P(160, 364, "m-lean", `
  <g class="bag"><rect x="90" y="248" width="140" height="70" rx="28" fill="url(#kl-navy2)" filter="url(#kl-f-navy)"/><path d="M118 250q42-22 84 0" stroke="#162E60" stroke-width="7" fill="none" stroke-linecap="round"/></g>
  ${shoe("l")}${shoe("r")}
  <path d="M108 312H212L216 338Q216 343 210 343H168L160 326L152 343H110Q104 343 104 338Z" fill="url(#kl-khaki)" filter="url(#kl-f-khaki)"/>
  <g class="torso">
    <rect x="108" y="238" width="104" height="82" rx="30" fill="url(#kl-navy)" filter="url(#kl-f-navy)"/>
    <path d="M126 244L123 316M194 244L197 316" stroke="#172F63" stroke-width="8" stroke-linecap="round" opacity=".7"/>
    <ellipse cx="136" cy="262" rx="14" ry="22" fill="url(#kl-hi)" opacity=".5"/>
    <g class="print"><text x="160" y="308" text-anchor="middle" font-family="Fredoka, 'Baloo 2', 'Trebuchet MS', sans-serif" font-weight="700" font-style="italic" font-size="19" fill="#fff" letter-spacing="1">KAI</text><path d="M141 313q19-6 38-1" stroke="url(#kl-orange)" stroke-width="3" stroke-linecap="round" fill="none"/>
    <g transform="translate(172 262)" fill="#fff"><rect width="30" height="11" rx="5.5"/><rect x="4" y="3" width="5" height="4" rx="1.4" fill="#27478C"/><rect x="11" y="3" width="5" height="4" rx="1.4" fill="#27478C"/><rect x="18" y="3" width="5" height="4" rx="1.4" fill="#27478C"/><rect x="4" y="13" width="22" height="2.4" rx="1.2" opacity=".75"/></g></g>
  </g>
  <g class="scarf"><path d="M103 228C128 254 192 254 217 228L211 252C190 270 130 270 109 252Z" fill="url(#kl-orange)" filter="url(#kl-f-orange)"/><path d="M139 258H181L160 286Z" fill="url(#kl-orange)" stroke="#F58421" stroke-width="10" stroke-linejoin="round" filter="url(#kl-f-orange)"/><circle cx="160" cy="257" r="13" fill="url(#kl-orange)" filter="url(#kl-f-orange)"/></g>

  ${P(160, 238, "m-head", `
    <ellipse cx="73" cy="168" rx="15" ry="19" fill="url(#kl-skin)" filter="url(#kl-f-skin)"/><ellipse cx="76" cy="169" rx="6.5" ry="10" fill="#EE9A74" opacity=".7"/>
    <ellipse cx="247" cy="168" rx="15" ry="19" fill="url(#kl-skin)" filter="url(#kl-f-skin)"/><ellipse cx="244" cy="169" rx="6.5" ry="10" fill="#EE9A74" opacity=".7"/>
    <ellipse cx="160" cy="154" rx="91" ry="80" fill="url(#kl-skin)" filter="url(#kl-f-skin)"/>
    <path d="M71 132q-5 30 8 48 8-12 6-40ZM249 132q5 30-8 48-8-12-6-40Z" fill="#4A3427"/>

    <g class="face">
      <ellipse cx="97" cy="207" rx="15" ry="10" fill="#FF8A78" opacity=".4"/><ellipse cx="223" cy="207" rx="15" ry="10" fill="#FF8A78" opacity=".4"/>
      ${eye(124, "l")}${eye(196, "r")}
      <path class="eye-happy" d="M106 174Q124 152 142 174M178 174Q196 152 214 174" stroke="#3A241B" stroke-width="6.5" fill="none" stroke-linecap="round"/>
      <path class="eye-sleep" d="M106 166Q124 182 142 166M178 166Q196 182 214 166" stroke="#3A241B" stroke-width="6" fill="none" stroke-linecap="round"/>
      <g class="glasses">
        <rect x="90" y="142" width="64" height="50" rx="20" fill="url(#kl-lens)" opacity=".5"/><rect x="166" y="142" width="64" height="50" rx="20" fill="url(#kl-lens)" opacity=".5"/>
        <rect x="90" y="142" width="64" height="50" rx="20" fill="none" stroke="#3A2A22" stroke-opacity=".55" stroke-width="3"/><rect x="166" y="142" width="64" height="50" rx="20" fill="none" stroke="#3A2A22" stroke-opacity=".55" stroke-width="3"/>
        <path d="M88 157Q88 140 106 140H138Q156 140 156 157M164 157Q164 140 182 140H214Q232 140 232 157" stroke="#1E212B" stroke-width="8.5" fill="none" stroke-linecap="round"/>
        <path d="M156 151Q160 146 164 151M89 152 72 159M231 152 248 159" stroke="#1E212B" stroke-width="5.5" fill="none" stroke-linecap="round"/>
        <path d="M100 152q9-5 22-3M176 152q9-5 22-3" stroke="#fff" stroke-opacity=".7" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
      ${P(121, 138, "brow brow-l", `<path d="M102 140Q121 128 140 138" stroke="#5A3B2C" stroke-width="7.5" fill="none" stroke-linecap="round"/>`)}
      ${P(199, 138, "brow brow-r", `<path d="M180 138Q199 128 218 140" stroke="#5A3B2C" stroke-width="7.5" fill="none" stroke-linecap="round"/>`)}
      <ellipse cx="160" cy="191" rx="7.5" ry="5.4" fill="#F0A07A"/><ellipse cx="158.5" cy="189.5" rx="3" ry="1.8" fill="#fff" opacity=".6"/>
      <path class="mouth mouth-smile" d="M143 208Q160 222 177 208" stroke="#8A3F2F" stroke-width="4.4" fill="none" stroke-linecap="round"/>
      <path class="mouth mouth-sad" d="M146 218Q160 205 174 218" stroke="#8A3F2F" stroke-width="4.4" fill="none" stroke-linecap="round"/>
      <ellipse class="mouth mouth-oh" cx="160" cy="214" rx="8" ry="9.5" fill="#7A2A2A"/>
      <g class="mouth mouth-grin"><path d="M139 205Q160 236 181 205Z" fill="#7A2A2A" stroke="#7A2A2A" stroke-width="3" stroke-linejoin="round"/><ellipse cx="160" cy="220" rx="9.5" ry="5" fill="#FF7E8A"/></g>
    </g>

    <g class="helmet">
      <path d="M59 146C54 74 108 33 160 33S266 74 261 146C243 127 202 115 160 115S77 127 59 146Z" fill="url(#kl-navy)" filter="url(#kl-f-navy)"/>
      <path d="M57 148C78 129 120 117 160 117S242 129 263 148C247 143 204 131 160 131S73 143 57 148Z" fill="url(#kl-navy2)"/>
      <path d="M71 121C97 94 128 86 160 86S223 94 249 121" stroke="url(#kl-orange)" stroke-width="9.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="112" cy="66" rx="32" ry="13" transform="rotate(-30 112 66)" fill="url(#kl-hi)"/>
      <path d="M147 42 151 19H169L173 42Z" fill="url(#kl-navy2)"/><rect x="144" y="12" width="32" height="10" rx="5" fill="url(#kl-orange)" filter="url(#kl-f-orange)"/>
      <circle class="lamp-glow" cx="160" cy="65" r="40" fill="url(#kl-glow)"/>
      <g class="rays" stroke="#FFD94A" stroke-width="4" stroke-linecap="round"><path d="M160 36v-9M137 45l-6-6M183 45l6-6M126 65h-9M194 65h9"/></g>
      <circle cx="160" cy="65" r="18" fill="url(#kl-gold)" filter="url(#kl-f-gold)"/><circle class="lamp" cx="160" cy="65" r="12" fill="url(#kl-lamp)"/><ellipse cx="156" cy="60" rx="4" ry="2.6" fill="#fff" opacity=".9"/>
    </g>

    <g class="steam">
      ${P(160, 8, "puff p1", `<circle cx="160" cy="8" r="8" fill="url(#kl-steam)"/>`)}${P(160, 8, "puff p2", `<circle cx="160" cy="8" r="8" fill="url(#kl-steam)"/>`)}${P(160, 8, "puff p3", `<circle cx="160" cy="8" r="8" fill="url(#kl-steam)"/>`)}${P(160, 8, "puff p4", `<circle cx="160" cy="8" r="8" fill="url(#kl-steam)"/>`)}
    </g>
    <path class="sweat" d="M244 142q-9 14-9 20a9 9 0 0 0 18 0q0-6-9-20Z" fill="#9AD3FF" stroke="#fff" stroke-width="2"/>
    <g class="zzz" font-family="Fredoka, 'Trebuchet MS', sans-serif" font-weight="700" fill="#5E7FC4"><text class="z1" x="236" y="86" font-size="22">z</text><text class="z2" x="252" y="62" font-size="28">z</text><text class="z3" x="270" y="34" font-size="34">Z</text></g>
  `)}

  ${arm("l")}${arm("r")}
  <g class="speed" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0"><path d="M30 200h50M10 240h60M36 280h46M20 320h54"/></g>
`))}
</svg>`;

  /* Klakson dua nada ala lokomotif. Hanya dibunyikan oleh tindakan pengguna (klik/ketuk atau tombol Masuk). */
  let ac;
  function horn(long) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const t = ac.currentTime, dur = long ? 1.15 : .62, out = ac.createGain(), lp = ac.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 1100; out.gain.setValueAtTime(0, t);
      out.gain.linearRampToValueAtTime(.07, t + .06); out.gain.setValueAtTime(.07, t + dur - .22); out.gain.exponentialRampToValueAtTime(.0008, t + dur);
      [311, 392].forEach((f, i) => { const o = ac.createOscillator(); o.type = i ? "sawtooth" : "triangle"; o.frequency.setValueAtTime(f * .96, t); o.frequency.linearRampToValueAtTime(f, t + .1); o.connect(lp); o.start(t); o.stop(t + dur); });
      lp.connect(out); out.connect(ac.destination);
    } catch (_) {}
  }

  function start() {
    const panel = $(".login-panel"), screen = $("#loginScreen"), U = $("#agentId"), PW = $("#agentPassword");
    if (!panel || !screen || !U || !PW) return;
    const root = document.createElement("div"); root.className = "mascot"; root.dataset.state = "idle";
    root.innerHTML = `<p class="m-say" aria-live="polite"></p><div class="m-wrap" role="button" tabindex="0" aria-label="Maskot Si Loko. Ketuk untuk menarik peluit.">${SVG}</div>`;
    panel.prepend(root);

    const ACTS = ["wave", "hop", "steam", "glasses", "around", "toot"];
    const state = () => root.dataset.state, set = s => { root.dataset.state = s; };
    const free = () => state() === "idle" || state() === "user";
    const covered = () => state() === "pass" || state() === "peek";
    const say = t => { const el = $(".m-say", root); el.textContent = t; el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; };
    const act = (name, ms) => { if (reduce() && name !== "toot") return; clearTimeout(act.t); ACTS.forEach(a => root.classList.remove("act-" + a)); void root.offsetWidth; root.classList.add("act-" + name); act.t = setTimeout(() => root.classList.remove("act-" + name), ms); };
    const look = (dx, dy) => {
      const s = root.style;
      s.setProperty("--ex", dx * 4.2 + "px"); s.setProperty("--ey", dy * 3.2 + "px");
      s.setProperty("--px", dx * 3.6 + "px"); s.setProperty("--py", dy * 2.8 + "px");
      s.setProperty("--fx", dx * 6 + "px"); s.setProperty("--fy", dy * 3.4 + "px");
      s.setProperty("--tilt", dx * 5 + "deg"); s.setProperty("--lean", dx * 2.2 + "deg");
    };
    const hello = () => { const h = new Date().getHours(), k = h >= 4 && h < 11 ? "pagi" : h >= 11 && h < 15 ? "siang" : h >= 15 && h < 18 ? "sore" : "malam"; say(`Selamat ${k}! Aku Loko. Ayo masuk, keretanya siap berangkat.`); };

    let hold = 0, raf = 0;
    addEventListener("pointermove", e => {
      if (screen.hidden || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; hold = Date.now();
        const r = $(".m-wrap", root).getBoundingClientRect();
        if (free() && state() !== "user" && !root.classList.contains("act-around")) look(clamp((e.clientX - r.left - r.width / 2) / (innerWidth * .32)), clamp((e.clientY - r.top - r.height * .42) / (innerHeight * .32)));
        if (e.pointerType === "mouse" && !reduce()) {
          const px = clamp((e.clientX / innerWidth - .5) * 2), py = clamp((e.clientY / innerHeight - .5) * 2);
          panel.style.transform = `perspective(1000px) rotateX(${-py * 2.2}deg) rotateY(${px * 3}deg)`;
          screen.style.setProperty("--bx", px.toFixed(3)); screen.style.setProperty("--by", py.toFixed(3));
        }
      });
    }, { passive: true });
    screen.addEventListener("mouseleave", () => { panel.style.transform = ""; });

    U.addEventListener("focus", () => { set("user"); say("Tulis akunmu ya, aku ikut membaca."); });
    U.addEventListener("input", () => look(clamp(-.8 + Math.min(U.value.length, 20) / 20 * 1.6), .75));
    U.addEventListener("blur", () => { if (state() === "user") { set("idle"); look(0, 0); } });
    PW.addEventListener("focus", () => { set(PW.type === "text" ? "peek" : "pass"); say(PW.type === "text" ? "Aku intip sedikit ya." : "Aku tutup mata. Kata sandimu aman."); });
    PW.addEventListener("blur", e => { if (covered() && !e.relatedTarget?.closest?.("#togglePassword")) { set("idle"); say("Sudah kubuka lagi."); } });
    $("#togglePassword")?.addEventListener("click", () => { set(PW.type === "text" ? "peek" : "pass"); say(PW.type === "text" ? "Aku intip sedikit ya." : "Mataku tertutup lagi."); });
    document.addEventListener("pointerdown", e => { if (covered() && !e.target.closest("#agentPassword,#togglePassword")) set("idle"); });

    window.KP_MASCOT = {
      react(type) {
        if (type === "lock") { set("lock"); say("Aku ngantuk dulu… tunggu sebentar ya."); }
        else { set("bad"); say("Wah, belum cocok. Coba lagi ya."); }
        setTimeout(() => { if (state() === "bad" || state() === "lock") set("idle"); }, type === "lock" ? 4200 : 1500);
      },
      depart() {
        set("ok"); say("Tuut tuut! Selamat jalan."); horn(true); navigator.vibrate?.(30);
        return new Promise(res => setTimeout(() => { root.classList.add("leave"); setTimeout(res, reduce() ? 0 : 700); }, reduce() ? 250 : 900));
      },
      /* Hanya untuk pratinjau/uji: set status secara langsung. */
      _set: set
    };

    const toot = () => {
      if (!free()) return;
      horn(false); navigator.vibrate?.(20); act("toot", 1200); say(["Tuuut! Tuuut!", "Peluit sudah ditarik!", "Tuut! Semua naik!"][Math.floor(Math.random() * 3)]);
      clearTimeout(toot.t); toot.t = setTimeout(() => { if (state() === "idle") hello(); }, 2600);
    };
    const wrap = $(".m-wrap", root);
    wrap.addEventListener("click", toot);
    wrap.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toot(); } });

    /* Gerakan acak saat diam: dipilih tiap beberapa detik bila tidak ada interaksi. */
    const IDLE = [
      ["wave", 2000, "Halo! Selamat datang di K-Pedia."], ["hop", 800, null], ["steam", 1800, "Pfft… uapnya sudah panas."],
      ["glasses", 1500, "Kacamataku miring ya?"], ["around", 2800, "Kereta sudah datang belum, ya?"]
    ];
    let last = -1;
    setInterval(() => {
      if (screen.hidden || reduce() || state() !== "idle" || Date.now() - hold < 4500 || root.classList.contains("leave")) return;
      let i; do { i = Math.floor(Math.random() * IDLE.length); } while (i === last); last = i;
      const [name, ms, line] = IDLE[i]; act(name, ms); if (line) say(line);
      if (name === "around") { look(-.9, .1); setTimeout(() => look(.9, .1), 900); setTimeout(() => look(0, 0), 1900); }
    }, 7200);

    new MutationObserver(() => { if (!screen.hidden) { root.classList.remove("leave"); set("idle"); look(0, 0); hello(); } }).observe(screen, { attributes: true, attributeFilter: ["hidden"] });
    hello();
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start, { once: true }) : start();
})();
