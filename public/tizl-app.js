
/* ============ DATA ============ */
const SERVICES = [
  {lb:"Breakfast",sub:"Light, quick starts",img:"/assets/service-breakfast.png",ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18h14M6 18c0-4 2-7 6-7s6 3 6 7"/><path d="M12 11V5M9.5 6.5L12 4l2.5 2.5"/></svg>`},
  {lb:"Lunch",sub:"Everyday midday meals",img:"/assets/service-lunch.png",ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 11h16a8 8 0 01-16 0z"/><path d="M12 11V5"/></svg>`},
  {lb:"Dinner",sub:"A proper end to the day",img:"/assets/service-dinner.png",ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="7.5"/><path d="M12 8v4l3 1.5"/></svg>`},
  {lb:"Party Cooking",sub:"For guests, done right",img:"/assets/service-party-cooking.png",ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3l1.6 4.8L18 9l-4.4 1.7L12 15l-1.6-4.3L6 9l4.4-1.2L12 3z"/><circle cx="18.5" cy="16" r="1.3"/><circle cx="6.5" cy="17" r="1"/></svg>`},
  {lb:"Baby Food",sub:"Soft, age-right portions",img:"/assets/service-baby-food.png",ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9.5" width="6" height="11" rx="2"/><rect x="10" y="4.5" width="4" height="4.5" rx="1"/><path d="M9 13.5h6"/></svg>`},
  {lb:"Meal Prep",sub:"Batch-cooked for the week",img:"/assets/service-meal-prep.png",ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4C10 4 4 10 4 20c10 0 16-6 16-16z"/><path d="M5 19 15 9"/></svg>`},
  {lb:"Weekly Cook",sub:"A regular hand in the kitchen",img:"/assets/service-weekly-cook.png",ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8 3v4M16 3v4"/></svg>`},
  {lb:"Senior Meals",sub:"Gentle, considerate cooking",img:"/assets/service-senior-meals.png",ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 20s-7.2-4.4-9.4-8.8C1.2 8 3 5 6.4 5c2.3 0 4.2 1.4 5.6 3.5C13.4 6.4 15.3 5 17.6 5 21 5 22.8 8 20.4 11.2 18.2 15.6 12 20 12 20z"/></svg>`},
];
const TESTIMONIALS = [
  {n:"Priya Sharma",loc:"Sector 62, Noida",t:"Booked a breakfast cook on a whim before a big meeting day — she was there in 12 minutes, kitchen spotless after.",av:"/assets/avatar-priya-sharma.png"},
  {n:"Rohit Kapoor",loc:"DLF Phase 3, Gurgaon",t:"Used Tizl for a birthday party for 15 people. The pricing was clear upfront, no surprises at the end.",av:"/assets/avatar-rohit-kapoor.png"},
  {n:"Ananya Mehta",loc:"Greater Kailash, Delhi",t:"Our weekly cook has completely changed our routine. Reliable, polite and amazing food!",av:"/assets/avatar-ananya-mehta.png"}
];
const FAQS = [
  {q:"How does pricing work?",a:"Pricing is calculated from your location, meal type, occasion, headcount, number of dishes and any accompaniments — shown before you confirm, with no hidden fees."},
  {q:"Are Tizl cooks verified?",a:"Every cook completes Aadhaar verification, a police background check and a live selfie check before going live on the platform."},
  {q:"Can I cancel or reschedule?",a:"Yes — from My Bookings you can reschedule or cancel a booking up to 2 hours before the slot at no charge."},
  {q:"How do I pay?",a:"Pay after the meal is cooked, via UPI, card, net banking or wallet. No advance payment required."},
  {q:"What if something goes wrong?",a:"Reach live chat, call or WhatsApp support any time from Help & Support — most issues are resolved within minutes."}
];

/* ============ HELPERS ============ */
function scrollToId(id){ setTimeout(()=>{ const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth'}); }, 50); }
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
function money(n){ return '₹' + n.toLocaleString('en-IN'); }

/* ============ OPENSTREETMAP (Leaflet) ============ */
const DELHI_NCR = [28.6139, 77.2090];
let bookingMap = null, bookingMarker = null;
let liveStripMapInstance = null;

// Tile providers to try, in order. No API key required for any of these.
// If one is blocked/rate-limited/unreachable, we automatically fall back to the next.
const TILE_PROVIDERS = [
  {
    name: 'Wikimedia',
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    options: { maxZoom: 19, attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
  },
  {
    name: 'OSM France',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    options: { maxZoom: 20, subdomains: 'abc', attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
  },
  {
    name: 'Esri World Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
  }
];

// Attaches a tile layer to `map`, trying each provider in turn if tiles fail to load.
function attachTilesWithFallback(map, labelForLog){
  let providerIndex = 0;
  let currentLayer = null;
  let errorCount = 0;
  let switched = false;

  function tryProvider(idx){
    if(idx >= TILE_PROVIDERS.length){
      console.error(`[Tizl map:${labelForLog}] all tile providers failed.`);
      return;
    }
    const p = TILE_PROVIDERS[idx];
    console.log(`[Tizl map:${labelForLog}] loading tiles from ${p.name}`);
    if(currentLayer){ map.removeLayer(currentLayer); }
    errorCount = 0;
    switched = false;
    currentLayer = L.tileLayer(p.url, p.options);
    currentLayer.on('tileerror', function(e){
      errorCount++;
      console.warn(`[Tizl map:${labelForLog}] tile error from ${p.name} (#${errorCount})`, e);
      if(errorCount >= 4 && !switched){
        switched = true;
        console.warn(`[Tizl map:${labelForLog}] too many tile errors from ${p.name}, switching provider…`);
        tryProvider(idx + 1);
      }
    });
    currentLayer.on('load', function(){
      console.log(`[Tizl map:${labelForLog}] tiles from ${p.name} loaded OK`);
    });
    currentLayer.addTo(map);
  }

  tryProvider(0);
}

function initBookingMap(){
  const wrap = document.getElementById('bookingMapWrap');
  if(!wrap){ console.warn('[Tizl map] #bookingMapWrap not found in DOM'); return; }
  if(typeof L === 'undefined'){ console.error('[Tizl map] Leaflet (L) is not defined — the library failed to load from cdnjs.cloudflare.com. Check your network/console for a blocked or failed request to that domain.'); return; }
  console.log('[Tizl map] initializing Leaflet map');
  wrap.innerHTML = '';
  bookingMap = L.map(wrap, {zoomControl:true, attributionControl:false}).setView(DELHI_NCR, 11);
  attachTilesWithFallback(bookingMap, 'booking');
  bookingMarker = L.marker(DELHI_NCR, {draggable:true}).addTo(bookingMap);
  bookingMarker.on('dragend', function(){
    const p = bookingMarker.getLatLng();
    reverseGeocode(p.lat, p.lng);
  });
  bookingMap.on('click', function(e){
    bookingMarker.setLatLng(e.latlng);
    reverseGeocode(e.latlng.lat, e.latlng.lng);
  });
  setTimeout(()=>bookingMap && bookingMap.invalidateSize(), 60);
}

function detectLocation(){
  const btn = document.getElementById('autoLocBtn');
  const sub = document.getElementById('autoLocSub');
  console.log('[Tizl geolocation] isSecureContext:', window.isSecureContext, '| protocol:', window.location.protocol, '| has navigator.geolocation:', !!navigator.geolocation);
  // Geolocation only works in a "secure context" (https://, or localhost).
  // Opened directly as a file (file://) or over plain http://, browsers block it outright.
  if(window.isSecureContext === false){
    if(sub) sub.textContent = 'Your browser is blocking location here because this page isn\'t served over HTTPS (or localhost). Host the file on a secure (https) server, or type your address below.';
    return;
  }
  if(!navigator.geolocation){
    if(sub) sub.textContent = 'Location is not supported on this device/browser. Please type your address instead.';
    return;
  }
  if(sub) sub.textContent = 'Detecting your location…';
  navigator.geolocation.getCurrentPosition(function(pos){
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    bookingState.location = 'auto';
    if(btn) btn.classList.add('selected');
    if(bookingMap && bookingMarker){
      bookingMap.setView([lat,lng], 15);
      bookingMarker.setLatLng([lat,lng]);
    }
    reverseGeocode(lat, lng);
  }, function(err){
    let msg;
    if(err.code === 1) msg = 'Location permission was denied. Check your browser/site settings and allow location access, or type your address below.';
    else if(err.code === 2) msg = 'Your position is unavailable right now. Try again, or type your address below.';
    else if(err.code === 3) msg = 'Location request timed out. Try again, or type your address below.';
    else msg = 'Could not get your location (' + err.message + '). Try entering your address instead.';
    if(sub) sub.textContent = msg;
  }, {enableHighAccuracy:true, timeout:10000});
}

function reverseGeocode(lat, lng){
  const sub = document.getElementById('autoLocSub');
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
    .then(r=>r.json())
    .then(data=>{
      const addr = data && data.display_name ? data.display_name : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      bookingState.address = addr;
      bookingState.location = 'auto';
      if(sub) sub.textContent = addr;
      const manualAddr = document.getElementById('manualAddr');
      if(manualAddr) manualAddr.value = addr;
    })
    .catch(()=>{
      bookingState.address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      if(sub) sub.textContent = 'Location detected (address lookup unavailable — check your internet connection).';
    });
}

/* ---- Address autocomplete + forward geocoding for the manual field ---- */
let addrSearchTimer = null;
let addrSuggestions = [];

function onAddrInput(val){
  bookingState.location = 'manual';
  bookingState.address = val;
  clearTimeout(addrSearchTimer);
  const list = document.getElementById('addrSuggestList');
  if(!val || val.trim().length < 3){
    if(list){ list.style.display = 'none'; list.innerHTML = ''; }
    return;
  }
  addrSearchTimer = setTimeout(() => searchAddress(val), 350);
}

function searchAddress(q){
  const list = document.getElementById('addrSuggestList');
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`;
  console.log('[Tizl address search] requesting:', url);
  if(list){ list.innerHTML = '<div class="addr-suggest-item addr-suggest-empty">Searching…</div>'; list.style.display = 'block'; }
  fetch(url)
    .then(r => {
      console.log('[Tizl address search] HTTP status:', r.status);
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      console.log('[Tizl address search] results:', data);
      addrSuggestions = data || [];
      if(!list) return;
      if(!addrSuggestions.length){
        list.innerHTML = '<div class="addr-suggest-item addr-suggest-empty">No matches found</div>';
        list.style.display = 'block';
        return;
      }
      list.innerHTML = addrSuggestions.map((s, i) =>
        `<div class="addr-suggest-item" onmousedown="event.preventDefault(); pickAddrSuggestion(${i});">${s.display_name}</div>`
      ).join('');
      list.style.display = 'block';
    })
    .catch(err => {
      console.error('[Tizl address search] FAILED:', err);
      if(list){ list.innerHTML = `<div class="addr-suggest-item addr-suggest-empty">Search failed: ${err.message}. Open the browser console (F12) for details.</div>`; list.style.display = 'block'; }
    });
}

function pickAddrSuggestion(i){
  const s = addrSuggestions[i];
  if(!s) return;
  const input = document.getElementById('manualAddr');
  if(input) input.value = s.display_name;
  bookingState.location = 'manual';
  bookingState.address = s.display_name;
  const list = document.getElementById('addrSuggestList');
  if(list){ list.style.display = 'none'; list.innerHTML = ''; }
  const lat = parseFloat(s.lat), lng = parseFloat(s.lon);
  if(bookingMap && bookingMarker && !isNaN(lat) && !isNaN(lng)){
    bookingMap.setView([lat, lng], 16);
    bookingMarker.setLatLng([lat, lng]);
  }
}

function geocodeTypedAddress(){
  // Fallback: if the user types an address and hits Enter/leaves the field without
  // picking a suggestion, try to geocode exactly what they typed anyway.
  const input = document.getElementById('manualAddr');
  const list = document.getElementById('addrSuggestList');
  if(list) list.style.display = 'none';
  const q = input ? input.value.trim() : '';
  if(!q) return;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`;
  console.log('[Tizl geocode] requesting:', url);
  if(!bookingMap || !bookingMarker){
    console.warn('[Tizl geocode] map is not initialized yet — Leaflet may have failed to load (check console for a blocked cdnjs.cloudflare.com request).');
  }
  fetch(url)
    .then(r => {
      console.log('[Tizl geocode] HTTP status:', r.status);
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      console.log('[Tizl geocode] result:', data);
      if(data && data[0]){
        const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
        if(bookingMap && bookingMarker && !isNaN(lat) && !isNaN(lng)){
          bookingMap.setView([lat, lng], 16);
          bookingMarker.setLatLng([lat, lng]);
        } else {
          console.warn('[Tizl geocode] got coordinates but map/marker not ready:', lat, lng);
        }
        bookingState.address = data[0].display_name;
        if(input) input.value = data[0].display_name;
      } else {
        console.warn('[Tizl geocode] no match for:', q);
      }
    })
    .catch(err => console.error('[Tizl geocode] FAILED:', err));
}

function initLiveStripMap(){
  const el = document.getElementById('liveStripMap');
  if(!el || typeof L === 'undefined' || liveStripMapInstance) return;
  liveStripMapInstance = L.map(el, {
    zoomControl:false, attributionControl:false, dragging:false,
    scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false, boxZoom:false, keyboard:false
  }).setView(DELHI_NCR, 9);
  attachTilesWithFallback(liveStripMapInstance, 'live-strip');
  const pinIcon = L.divIcon({className:'', html:'<div style="width:14px;height:14px;border-radius:50% 50% 50% 0;background:#D95F3D;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.3);"></div>', iconSize:[14,14], iconAnchor:[7,14]});
  [[28.5355,77.3910],[28.4595,77.0266],[28.7041,77.1025]].forEach(coord=>{
    L.marker(coord,{icon:pinIcon}).addTo(liveStripMapInstance);
  });
  setTimeout(()=>liveStripMapInstance && liveStripMapInstance.invalidateSize(), 60);
}

/* ============ RENDER STATIC CONTENT ============ */
function renderServices(){
  document.getElementById('servicesGrid').innerHTML = SERVICES.map(s=>`
    <button class="service-tile" onclick="openBooking()">
      <div class="tile-photo">
        <div class="tile-photo-inner"><img src="${s.img}" alt="${s.lb}" loading="lazy"></div>
        <div class="tile-ic">${s.ic}</div>
      </div>
      <div class="tile-body">
        <div class="lb">${s.lb}</div><div class="sub">${s.sub}</div>
      </div>
    </button>
  `).join('');
}
function renderTestimonials(){
  document.getElementById('testiScroll').innerHTML = TESTIMONIALS.map(t=>`
    <div class="testi-card">
      <p>"${t.t}"</p>
      <div class="testi-who">
        <div class="testi-who-l"><img class="testi-avatar" src="${t.av}" alt="${t.n}"><div><div class="name">${t.n}</div><div class="loc">${t.loc}</div></div></div>
        <div class="stars">★★★★★</div>
      </div>
    </div>
  `).join('');
}
function renderFaqs(){
  document.getElementById('faqList').innerHTML = FAQS.map((f,i)=>`
    <div class="faq-item" id="faq-${i}">
      <button class="faq-q" onclick="toggleFaq(${i})"><span class="faq-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg></span><span class="txt">${f.q}</span><span class="plus">+</span></button>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>
  `).join('');
}

function toggleFaq(i){
  const item = document.getElementById('faq-'+i);
  const body = item.querySelector('.faq-a');
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el=>{el.classList.remove('open');el.querySelector('.faq-a').style.maxHeight=null;});
  if(!open){ item.classList.add('open'); body.style.maxHeight = body.scrollHeight+'px'; }
}
renderServices(); renderTestimonials(); renderFaqs();

/* ============ SESSION STATE ============ */
let session = { loggedInCustomer:false, loggedInPartner:false, custName:'', custPhone:'', partName:'', partPhone:'' };
let custBookings = [
  {id:'TZL-88213', status:'Completed', meal:'Dinner', date:'2 Aug', price:1240},
  {id:'TZL-88190', status:'Completed', meal:'Weekly Cook', date:'28 Jul', price:3200},
];

function showScreen(name){
  document.getElementById('site').style.display = name==='site' ? 'block' : 'none';
  document.getElementById('customerDashboard').classList.toggle('open', name==='customer');
  document.getElementById('partnerDashboard').classList.toggle('open', name==='partner');
  const cw = document.getElementById('custWelcomeName'); if(cw) cw.textContent = session.custName ? ', '+session.custName : '';
  const pw = document.getElementById('partWelcomeName'); if(pw) pw.textContent = session.partName ? ', '+session.partName : '';
  window.scrollTo({top:0,behavior:'smooth'});
}
function toggleMobileMenu(force){
  const drawer = document.getElementById('mobileNavDrawer');
  const btn = document.getElementById('mobileMenuBtn');
  if(!drawer || !btn) return;
  const isOpen = force !== undefined ? force : !drawer.classList.contains('open');
  if(isOpen){
    drawer.classList.add('open');
    drawer.removeAttribute('aria-hidden');
    btn.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
  } else {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    btn.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
  }
}

function refreshHeader(){
  const el = document.getElementById('headerCtas');
  if(!el) return;
  const loc = `<div class="loc-picker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.6 7-11.2A7 7 0 105 9.8C5 14.4 12 21 12 21z"/><circle cx="12" cy="9.6" r="2.3"/></svg>Delhi NCR <span style="font-size:10px;">▾</span></div>`;
  const hamburger = `<button class="mobile-menu-btn" id="mobileMenuBtn" onclick="toggleMobileMenu()" aria-label="Toggle navigation menu" aria-expanded="false"><span class="bar bar-1"></span><span class="bar bar-2"></span><span class="bar bar-3"></span></button>`;

  if(session.loggedInCustomer){
    const shortName = (session.custName || 'Account').split(' ')[0];
    el.innerHTML = loc + `<div class="header-user" style="cursor:pointer;" onclick="showScreen('customer')"><div class="av">${(session.custName||'U')[0]}</div><span class="user-name-text">${shortName}</span></div><button class="btn btn-primary btn-small" onclick="openBooking()">Book a Cook</button>` + hamburger;
  } else if(session.loggedInPartner){
    const shortName = (session.partName || 'Partner').split(' ')[0];
    el.innerHTML = loc + `<div class="header-user" style="cursor:pointer;" onclick="showScreen('partner')"><div class="av">${(session.partName||'P')[0]}</div><span class="user-name-text">${shortName}</span></div><button class="btn btn-ghost btn-small" onclick="logout()">Logout</button>` + hamburger;
  } else {
    el.innerHTML = loc + `<button class="btn btn-ghost btn-small" onclick="openAuthGate()" aria-label="Login">Login</button><button class="btn btn-primary btn-small" onclick="openBooking()" aria-label="Book a Cook">Book a Cook <span class="arrow">→</span></button>` + hamburger;
  }
}
function logout(){ session.loggedInCustomer=false; session.loggedInPartner=false; refreshHeader(); showScreen('site'); }

/* ============ AUTH GATE ============ */
let pendingAfterAuth = null; // 'booking' | null
function openAuthGate(role){
  if(role==='customer') return openCustomerAuth();
  if(role==='partner') return openPartnerAuth();
  openModal('authGateOverlay');
}
function openCustomerAuth(){ closeModal('authGateOverlay'); setAuthTab('login'); openModal('custAuthOverlay'); }
function openPartnerAuth(){ closeModal('authGateOverlay'); openModal('partAuthOverlay'); }

function setAuthTab(tab){
  document.getElementById('custTabLogin').classList.toggle('on', tab==='login');
  document.getElementById('custTabSignup').classList.toggle('on', tab==='signup');
  document.getElementById('custSignupExtra').style.display = tab==='signup' ? 'block' : 'none';
  document.getElementById('custAuthPhoneStep').style.display='block';
  document.getElementById('custAuthOtpStep').style.display='none';
  document.getElementById('custAuthOverlay').dataset.mode = tab;
}
function sendCustOtp(){
  const phone = document.getElementById('custPhone').value.trim();
  if(phone.length<10){ alert('Enter a valid 10-digit phone number'); return; }
  session.custPhone = phone;
  document.getElementById('custAuthPhoneStep').style.display='none';
  document.getElementById('custAuthOtpStep').style.display='block';
}
function verifyCustOtp(){
  const mode = document.getElementById('custAuthOverlay').dataset.mode || 'login';
  if(mode==='signup'){
    const name = document.getElementById('custName').value.trim();
    session.custName = name || 'Guest';
  } else {
    session.custName = session.custName || 'Aisha';
  }
  session.loggedInCustomer = true;
  document.getElementById('profName').textContent = session.custName;
  document.getElementById('profPhone').textContent = session.custPhone || '—';
  closeModal('custAuthOverlay');
  refreshHeader();
  if(pendingAfterAuth==='booking'){
    pendingAfterAuth = null;
    bookingState.step = STEPS.indexOf('slots');
    renderBookingStep();
    openModal('bookingOverlay');
  } else {
    renderCustBookings();
    showScreen('customer');
  }
}
function sendPartOtp(){
  const phone = document.getElementById('partLoginPhone').value.trim();
  if(phone.length<10){ alert('Enter a valid 10-digit phone number'); return; }
  session.partPhone = phone;
  document.getElementById('partAuthPhoneStep').style.display='none';
  document.getElementById('partAuthOtpStep').style.display='block';
}
function verifyPartOtp(){
  session.loggedInPartner = true;
  session.partName = session.partName || 'Sunita';
  closeModal('partAuthOverlay');
  refreshHeader();
  renderJobs();
  showScreen('partner');
}

function retryPayment(id){
  const b = custBookings.find(x=>x.id===id);
  if(b){ b.status = 'Upcoming'; renderCustBookings(); window.location.href = '/customer/dashboard'; }
}
/* ============ CUSTOMER DASHBOARD ============ */
function setCustTab(tab, btn){
  document.querySelectorAll('.dash-nav button').forEach(b=>b.classList.remove('on'));
  if(btn) btn.classList.add('on');
  ['bookings','addresses','payments','support','profile'].forEach(t=>{
    const el = document.getElementById('custPane'+t.charAt(0).toUpperCase()+t.slice(1));
    if(el) el.style.display = t===tab ? 'block' : 'none';
  });
  if(tab === 'payments'){
    loadCustomerPaymentRecords();
  }
}

async function loadCustomerPaymentRecords(){
  const pane = document.getElementById('custPanePayments');
  if(!pane) return;
  try {
    const res = await fetch('/api/customer/dashboard');
    if(!res.ok) return;
    const json = await res.json();
    if(json.success && json.data && json.data.payments && json.data.payments.length > 0){
      pane.innerHTML = '<div style="margin-bottom:16px;"><h3 style="font-size:16px;font-weight:700;">Paytm Payment Gateway Transactions</h3><p style="font-size:12px;color:var(--text-dim);margin-top:4px;">Authoritative records directly verified with Paytm PG and bank networks.</p></div>' + json.data.payments.map(p => '<div class="booking-row"><div class="left"><strong>₹' + p.amount + ' · ' + (p.method || 'Paytm PG') + '</strong><span class="booking-id">Order: ' + p.provider_order_id + (p.provider_payment_id ? ' · Txn: ' + p.provider_payment_id : '') + '</span><span style="font-size:11px;color:var(--text-faint);">' + new Date(p.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + '</span></div><div class="actions"><span class="status-badge ' + (p.status === 'captured' ? 'success' : (p.status === 'refunded' || p.status === 'failed' ? 'fail' : 'pending')) + '">' + p.status.toUpperCase() + '</span></div></div>').join('') + '<div style="margin-top:16px;"><a href="/customer/dashboard" class="btn btn-ghost btn-small">Open Full Dashboard</a></div>';
    }
  } catch(e) {
    console.error('Error fetching payments in widget:', e);
  }
}
let bookingTabState = 'Upcoming';
function renderNextBooking(){
  const slot = document.getElementById('nextBookingSlot');
  if(!slot) return;
  const next = custBookings.find(b=>b.status==='Upcoming');
  if(!next){ slot.innerHTML=''; return; }
  slot.innerHTML = `
    <div class="next-booking-card">
      <div><div class="eyebrow">Next booking · ${next.date}</div><h3>${next.meal} — ${money(next.price)}</h3><div class="meta">${next.id}</div></div>
      <div class="actions"><button class="btn btn-gold btn-small">Track Cook</button><button class="btn btn-ghost btn-small" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.28);color:#fff;">View Details</button></div>
    </div>`;
}
function renderCustBookings(){
  renderNextBooking();
  const tabs = ['Upcoming','Completed','Cancelled','Failed Payments'];
  document.getElementById('bookingTabs').innerHTML = tabs.map(t=>
    `<button class="${t===bookingTabState?'on':''}" onclick="bookingTabState='${t}';renderCustBookings();">${t}</button>`
  ).join('');
  const filtered = custBookings.filter(b=>b.status===bookingTabState);
  const list = document.getElementById('bookingList');
  if(filtered.length===0){
    list.innerHTML = `<div class="empty-state"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/></svg></div><p>No ${bookingTabState.toLowerCase()} bookings yet.</p></div>`;
    return;
  }
  list.innerHTML = filtered.map(b=>`
    <div class="booking-row">
      <div class="left"><strong>${b.meal} — ${money(b.price)}</strong><span class="booking-id">${b.id}</span> <span>${b.date}</span></div>
      <div class="actions">
        <span class="status-badge ${b.status==='Completed'?'success':(b.status==='Failed Payments'?'fail':'pending')}">${b.status}</span>
        ${b.status==='Completed' ? '<button class="btn btn-ghost btn-small">Rebook</button><button class="btn btn-ghost btn-small">Invoice</button>' : ''}
        ${b.status==='Failed Payments' ? `<button class="btn btn-primary btn-small" onclick="retryPayment('${b.id}')">Retry Payment</button><button class="btn btn-ghost btn-small" onclick="setCustTab('support',null);document.querySelector('[onclick*=support]').classList.add('on')">Support</button>` : ''}
        ${b.status==='Upcoming' ? '<button class="btn btn-ghost btn-small">Track Cook</button>' : ''}
      </div>
    </div>
  `).join('');
}

/* ============ PARTNER DASHBOARD ============ */
let jobsData = [
  {id:1, name:'Rohit Kapoor', area:'Sector 50, Noida', meal:'Dinner · 4 people', dur:'1.5 hrs', pay:640, stage:0, accepted:false},
  {id:2, name:'Meera Nair', area:'DLF Phase 2, Gurgaon', meal:'Breakfast · 2 people', dur:'1 hr', pay:400, stage:0, accepted:false},
];
const PIPELINE = ['Navigate','Reach Customer','Start Cooking','Complete Service','Upload Photo','Collect OTP','Payment Released'];
function renderJobs(){
  document.getElementById('jobList').innerHTML = jobsData.map(j=>{
    if(!j.accepted){
      return `<div class="job-card">
        <div class="review-row"><span class="v">${j.name}</span><span class="k">${money(j.pay)}</span></div>
        <div class="review-row"><span class="k">${j.area}</span><span class="k">${j.dur}</span></div>
        <div class="review-row"><span class="k">${j.meal}</span></div>
        <div style="display:flex;gap:10px;margin-top:12px;">
          <button class="btn btn-primary btn-small" onclick="acceptJob(${j.id})">Accept</button>
          <button class="btn btn-ghost btn-small" onclick="rejectJob(${j.id})">Reject</button>
        </div>
      </div>`;
    }
    return `<div class="job-card">
      <div class="review-row"><span class="v">${j.name}</span><span class="k">${money(j.pay)}</span></div>
      <div class="review-row"><span class="k">${j.area}</span><span class="k">${j.dur}</span></div>
      <div class="job-pipeline">${PIPELINE.map((p,i)=>`<span class="${i<j.stage?'done':(i===j.stage?'now':'')}">${p}</span>`).join('')}</div>
      ${j.stage < PIPELINE.length ? `<button class="btn btn-primary btn-small" onclick="advanceJob(${j.id})">${j.stage===PIPELINE.length-1?'Mark Payment Released':'Advance: '+PIPELINE[j.stage]}</button>` : '<span class="status-badge success">Job complete</span>'}
    </div>`;
  }).join('');
}
function acceptJob(id){ jobsData = jobsData.map(j=> j.id===id ? {...j, accepted:true, stage:0} : j); renderJobs(); }
function rejectJob(id){ jobsData = jobsData.filter(j=>j.id!==id); renderJobs(); }
function advanceJob(id){ jobsData = jobsData.map(j=> j.id===id ? {...j, stage: Math.min(j.stage+1, PIPELINE.length)} : j); renderJobs(); }
function setPartTab(tab, btn){
  document.querySelectorAll('#partnerDashboard .dash-nav button').forEach(b=>b.classList.remove('on'));
  if(btn) btn.classList.add('on');
  ['today','earnings','ratings','training'].forEach(t=>{
    const el = document.getElementById('partPane'+t.charAt(0).toUpperCase()+t.slice(1));
    if(el) el.style.display = t===tab ? 'block' : 'none';
  });
}

/* ============ BOOKING FLOW ============ */
const STEPS = ['location','meal','cooking','people','dishes','accompaniments','login','slots','review','payment','confirmation'];
const STEP_LABELS = {
  location:'Where should the cook come?', meal:'Any meal preference?', cooking:"What's the occasion?",
  people:'How many people?', dishes:'How many dishes?', accompaniments:'Anything to go with it? (optional)',
  login:'Sign in to see slots & pricing', slots:'Choose a day & time', review:'Review your booking', payment:'Choose payment method',
  confirmation:'Booking status'
};
let bookingState = { step:0, location:'', mealType:'', cookingType:'', people:'', dishes:'', accompaniments:[], note:'', date:'Today', slot:'', payment:'' };

function openBooking(){
  bookingState = { step:0, location:'', mealType:'', cookingType:'', people:'', dishes:'', accompaniments:[], note:'', date:'Today', slot:'', payment:'' };
  renderBookingStep();
  openModal('bookingOverlay');
}
function bookingStepIndexVisible(){
  // login step is skipped from progress display if already logged in
  return STEPS.filter((s,i)=> i<=bookingState.step && !(s==='login' && session.loggedInCustomer)).length;
}
function estimatePrice(){
  const base = {breakfast:349, lunch:399, dinner:449, custom:399}[bookingState.mealType] || 399;
  const peopleMult = {'1-2':1, '3-4':1.4, '5-6':1.8, '7-10':2.4, '10+':3.2}[bookingState.people] || 1;
  const dishExtra = {'1':0, '2':80, '3':160, '4+':260}[bookingState.dishes] || 0;
  const cookMult = {daily:1, weekend:1.05, special:1.15, party:1.35, festival:1.25}[bookingState.cookingType] || 1;
  const accExtra = (bookingState.accompaniments.length||0) * 60;
  return Math.round((base*peopleMult + dishExtra + accExtra) * cookMult);
}
function replayStepAnim(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}
let bPriceCurrent = 0;
function animatePriceTo(target){
  const el = document.getElementById('bPriceAmt');
  const from = bPriceCurrent;
  const start = performance.now();
  const dur = 350;
  el.style.transition = 'color .2s ease';
  el.style.color = 'var(--blue)';
  function step(t){
    const p = Math.min(1, (t-start)/dur);
    const eased = 1 - Math.pow(1-p, 3);
    const val = Math.round(from + (target-from)*eased);
    el.textContent = money(val);
    if(p<1){ requestAnimationFrame(step); } else { bPriceCurrent = target; el.style.color=''; }
  }
  requestAnimationFrame(step);
}
function renderBookingStep(){
  const step = STEPS[bookingState.step];
  document.getElementById('bookingTitle').textContent = STEP_LABELS[step];
  const totalVisible = STEPS.length - (session.loggedInCustomer?1:0);
  document.getElementById('bookingSub').textContent = step==='confirmation' ? 'All done' : `Step ${bookingStepIndexVisible()} of ${totalVisible-1}`;
  document.getElementById('bProgress').style.width = (bookingStepIndexVisible()/(totalVisible-1)*100)+'%';
  const body = document.getElementById('bookingStepBody');
  const backBtn = document.getElementById('bBackBtn');
  const nextBtn = document.getElementById('bNextBtn');
  backBtn.style.display = (bookingState.step===0) ? 'none' : 'inline-flex';
  nextBtn.style.display = 'inline-flex';
  nextBtn.textContent = 'Continue';

  const priceStrip = document.getElementById('bPriceStrip');
  const showPriceFrom = STEPS.indexOf('people');
  if(bookingState.step >= showPriceFrom && step!=='confirmation' && bookingState.mealType && bookingState.people){
    priceStrip.style.display = 'flex';
    animatePriceTo(estimatePrice());
  } else {
    priceStrip.style.display = 'none';
  }

  if(step==='location'){
    body.innerHTML = `
      <div class="option-grid cols-1">
        <button class="option-card ${bookingState.location==='auto'?'selected':''}" id="autoLocBtn" onclick="detectLocation()"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 21s7-6.6 7-11.2A7 7 0 105 9.8C5 14.4 12 21 12 21z"/><circle cx="12" cy="9.6" r="2.3"/></svg></div><div class="lb" id="autoLocLabel">Auto-detect my location</div><div class="sub" id="autoLocSub">Uses your device's GPS/location</div></button>
      </div>
      <div class="field-group" style="margin-top:14px;position:relative;z-index:10;">
        <label>Or enter address</label>
        <input type="text" id="manualAddr" placeholder="Flat, street, area, city" autocomplete="off" value="${bookingState.location==='manual'?bookingState.address||'':''}" oninput="onAddrInput(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault(); geocodeTypedAddress();}" onblur="setTimeout(()=>{const l=document.getElementById('addrSuggestList'); if(l) l.style.display='none';}, 200);">
        <div id="addrSuggestList" class="addr-suggest-list"></div>
      </div>
      <div id="bookingMapWrap" style="position:relative;z-index:1;margin-top:14px;border-radius:14px;overflow:hidden;height:180px;border:1px solid var(--line);"></div>
      <div style="font-size:11.5px;color:var(--text-faint);margin-top:8px;">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" style="color:var(--text-faint);">OpenStreetMap</a> contributors</div>
    `;
    setTimeout(initBookingMap, 30);
  } else if(step==='meal'){
    body.innerHTML = `<p style="color:var(--text-faint);font-size:13px;margin-bottom:16px;">Optional — helps us match the right cook. Skip if you're not sure yet.</p><div class="option-grid cols-3">
      ${[['breakfast',`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="14" r="5"/><path d="M12 3v3M6.5 6.5l1.8 1.8M17.5 6.5l-1.8 1.8"/></svg>`,'Breakfast'],['lunch',`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 11h16a8 8 0 01-16 0z"/><path d="M12 11V5"/></svg>`,'Lunch'],['dinner',`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4"/></svg>`,'Dinner']].map(([v,ic,lb])=>`
        <button class="option-card ${bookingState.mealType===v?'selected':''}" onclick="setB('mealType','${v}')"><div class="ic">${ic}</div><div class="lb">${lb}</div></button>
      `).join('')}</div>`;
    nextBtn.textContent = 'Continue';
  } else if(step==='cooking'){
    body.innerHTML = `<div class="option-grid">
      ${[['daily','Daily Cooking'],['special','Special Occasion'],['party','Party / Guests'],['festival','Festival Cooking'],['weekend','Weekend Cooking']].map(([v,lb])=>`
        <button class="option-card ${bookingState.cookingType===v?'selected':''}" onclick="setB('cookingType','${v}')"><div class="lb">${lb}</div></button>
      `).join('')}</div>`;
  } else if(step==='people'){
    body.innerHTML = `<div class="option-grid cols-3">
      ${['1-2','3-4','5-6','7-10','10+'].map(v=>`
        <button class="option-card ${bookingState.people===v?'selected':''}" onclick="setB('people','${v}')"><div class="lb">${v} people</div></button>
      `).join('')}</div>`;
  } else if(step==='dishes'){
    body.innerHTML = `<div class="option-grid cols-3">
      ${['1','2','3','4+'].map(v=>`
        <button class="option-card ${bookingState.dishes===v?'selected':''}" onclick="setB('dishes','${v}')"><div class="lb">${v} ${v==='1'?'dish':'dishes'}</div></button>
      `).join('')}</div>`;
  } else if(step==='accompaniments'){
    const opts = ['Rotis','Rice','Salad','Dessert','Snacks','Breakfast Items'];
    body.innerHTML = `
      <div class="chip-select">
        ${opts.map(o=>`<button class="chip-opt ${bookingState.accompaniments.includes(o)?'selected':''}" onclick="toggleAcc('${o}')">${o}</button>`).join('')}
      </div>
      <div class="field-group" style="margin-top:20px;"><label>Anything specific you'd like the cook to prepare? (optional)</label><textarea id="bNote" placeholder="e.g. less spicy, jain food, no onion-garlic">${bookingState.note||''}</textarea></div>
    `;
  } else if(step==='login'){
    if(session.loggedInCustomer){ bookingNext(); return; }
    body.innerHTML = `
      <p style="color:var(--text-dim);font-size:14.5px;margin-bottom:18px;">Sign in to view available cooks, pricing and confirm your booking.</p>
      <div class="tab-row"><button class="tab-btn on" id="bTabLogin" onclick="setBAuthTab('login')">Login</button><button class="tab-btn" id="bTabSignup" onclick="setBAuthTab('signup')">Create Account</button></div>
      <div id="bAuthPhoneStep">
        <div class="field-group"><label>Phone number</label><input type="tel" id="bPhone" placeholder="10-digit mobile number" maxlength="10"></div>
        <button class="btn btn-primary btn-full" onclick="sendBOtp()">Send OTP</button>
      </div>
      <div id="bAuthOtpStep" style="display:none;">
        <div class="field-group"><label>Enter OTP</label>
          <div class="otp-row"><input type="text" maxlength="1" class="bOtp"><input type="text" maxlength="1" class="bOtp"><input type="text" maxlength="1" class="bOtp"><input type="text" maxlength="1" class="bOtp"></div>
          <div class="hint">Demo mode — enter any 4 digits to continue.</div>
        </div>
        <div id="bSignupExtra" style="display:none;">
          <div class="field-group"><label>Full name</label><input type="text" id="bName" placeholder="e.g. Aisha Khan"></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="verifyBOtp()">Verify &amp; Continue</button>
      </div>
    `;
    nextBtn.style.display = 'none';
  } else if(step==='slots'){
    const durMap = {'1-2':'1 hr','3-4':'1.5 hrs','5-6':'2 hrs','7-10':'2.5 hrs','10+':'3+ hrs'};
    body.innerHTML = `
      <p style="color:var(--text-dim);font-size:13.5px;margin-bottom:16px;">Estimated cooking time for ${bookingState.people||'—'} people: <strong>${durMap[bookingState.people]||'—'}</strong></p>
      <div class="option-grid cols-3" style="margin-bottom:16px;">
        ${['Today','Tomorrow','Choose Date'].map(v=>`<button class="option-card ${bookingState.date===v?'selected':''}" onclick="setB('date','${v}')"><div class="lb">${v}</div></button>`).join('')}
      </div>
      <div class="option-grid">
        ${['Morning','Afternoon','Evening','Night'].map(v=>`<button class="option-card ${bookingState.slot===v?'selected':''}" onclick="setB('slot','${v}')"><div class="lb">${v}</div></button>`).join('')}
      </div>
    `;
  } else if(step==='review'){
    const price = estimatePrice();
    bookingState.price = price;
    body.innerHTML = `
      <div class="review-card">
        <div class="review-row"><span class="k">Location</span><span class="v">${bookingState.location==='auto'?'Current location':(bookingState.address||'—')}</span></div>
        <div class="review-row"><span class="k">Meal</span><span class="v">${cap(bookingState.mealType)}</span></div>
        <div class="review-row"><span class="k">Occasion</span><span class="v">${cap(bookingState.cookingType)}</span></div>
        <div class="review-row"><span class="k">People</span><span class="v">${bookingState.people}</span></div>
        <div class="review-row"><span class="k">Dishes</span><span class="v">${bookingState.dishes}</span></div>
        <div class="review-row"><span class="k">Slot</span><span class="v">${bookingState.date}, ${bookingState.slot}</span></div>
      </div>
      <div class="price-line total"><span class="lb">Estimated total</span><span>${money(price)}</span></div>
    `;
    nextBtn.textContent = 'Book Now';
  } else if(step==='payment'){
    const PAY_ICONS = {
      upi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l8-8 8 8-8 8-8-8z"/><path d="M9 12l3-3 3 3-3 3-3-3z"/></svg>',
      card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
      netbanking:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><rect x="5" y="10" width="14" height="8" rx="1"/><path d="M9 18v-5M15 18v-5"/></svg>',
      wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14.5" r="1"/></svg>'
    };
    body.innerHTML = `
      ${[['upi','UPI'],['card','Card'],['netbanking','Net Banking'],['wallet','Wallet']].map(([v,lb])=>`
        <div class="pay-method ${bookingState.payment===v?'selected':''}" onclick="setB('payment','${v}');renderBookingStep();"><span class="ic">${PAY_ICONS[v]}</span><span>${lb}</span></div>
      `).join('')}
    `;
    nextBtn.textContent = 'Pay & Confirm';
  } else if(step==='confirmation'){
    if(bookingState.outcome === undefined){
      bookingState.outcome = 'processing';
      body.innerHTML = '<div class="success-box" style="text-align:center;padding:40px 20px;"><div class="spin-loader" style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--spice);border-radius:50%;margin:0 auto 16px;animation:spin 0.8s linear infinite;"></div><h3>Connecting to Paytm PG...</h3><p style="font-size:13px;color:var(--text-dim);margin-top:8px;">Please wait while we initialize your secure payment session.</p></div>';
      (async function(){
        try {
          const dateStr = (bookingState.date === 'Tomorrow') ? new Date(Date.now() + 86400000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
          const rawSlot = bookingState.slot || '7:30 PM - 8:30 PM';
          const startTimeStr = rawSlot.includes(' - ') ? rawSlot.split(' - ')[0].trim() : '19:30';
          const bRes = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id: bookingState.mealType || 'dinner',
              address_id: 'default',
              address_text: bookingState.address || 'Noida, Sector 62',
              booking_date: dateStr,
              start_time: startTimeStr,
              duration_hours: 2,
              guest_count: parseInt(bookingState.people, 10) || 4,
              cooking_notes: 'Meal: ' + bookingState.mealType + ', Occasion: ' + bookingState.cookingType + ', Note: ' + (bookingState.note || 'None'),
              client_request_id: 'req_' + Date.now(),
            })
          });
          const bData = await bRes.json();
          if(!bRes.ok || !bData.success || !bData.data?.booking){
            throw new Error(bData?.error?.message || 'Failed to create booking.');
          }
          const realBooking = bData.data.booking;
          bookingState.bookingId = realBooking.booking_number;

          const pRes = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: realBooking.id,
              paymentMethod: (bookingState.payment || 'UPI').toUpperCase(),
            })
          });
          const pData = await pRes.json();
          if(!pRes.ok || !pData.success || !pData.data?.payment){
            throw new Error(pData?.error?.message || 'Failed to initiate Paytm session.');
          }
          const pOrder = pData.data.payment;

          if(window.Paytm && window.Paytm.CheckoutJS && pOrder.txnToken){
            const config = {
              root: '',
              flow: 'DEFAULT',
              data: {
                orderId: pOrder.orderId,
                token: pOrder.txnToken,
                tokenType: 'TXN_TOKEN',
                amount: String(pOrder.amount)
              },
              handler: {
                notifyMerchant: function(eventName, data){
                  console.info('[Paytm Event]', eventName, data);
                },
                transactionStatus: function(paymentStatus){
                  console.info('[Paytm Status]', paymentStatus);
                  window.location.href = '/customer/dashboard?orderId=' + encodeURIComponent(pOrder.orderId);
                }
              }
            };
            await window.Paytm.CheckoutJS.init(config);
            window.Paytm.CheckoutJS.invoke();
            return;
          }

          bookingState.outcome = 'success';
          custBookings.unshift({
            id: realBooking.booking_number,
            status: 'Upcoming',
            meal: cap(bookingState.mealType)!=='—' ? cap(bookingState.mealType) : cap(bookingState.cookingType),
            date: bookingState.date,
            price: realBooking.total_amount || bookingState.price || 559
          });
          renderBookingStep();
        } catch(err){
          console.error('[Booking/Paytm Error]', err);
          bookingState.outcome = 'failed';
          renderBookingStep();
        }
      })();
      return;
    }    if(bookingState.outcome === 'success'){
      body.innerHTML = `
        <div class="success-box">
          <div class="success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.8 4.8L19 7.5"/></svg></div>
          <h3>Payment successful — booking confirmed</h3>
          <p>Your cook has been assigned and will arrive during your ${bookingState.slot.toLowerCase()} slot, ${bookingState.date.toLowerCase()}.</p>
          <div class="booking-id">${bookingState.bookingId}</div>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div class="success-box">
          <div class="success-icon" style="background:var(--red-dim);color:var(--red);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg></div>
          <h3>Payment failed</h3>
          <p>Your payment couldn't be processed. Your booking details are saved under Failed Payments in My Bookings — you can retry anytime.</p>
          <div class="booking-id">${bookingState.bookingId}</div>
        </div>
      `;
    }
    backBtn.style.display = 'none';
    nextBtn.textContent = 'View My Bookings';
  }
}
function cap(s){ if(!s) return '—'; return s.charAt(0).toUpperCase()+s.slice(1); }
function setB(key,val){ bookingState[key]=val; if(key==='location'&&val==='auto'){bookingState.address='Current location (GPS)';} renderBookingStep(); }
function toggleAcc(o){
  const i = bookingState.accompaniments.indexOf(o);
  if(i>-1) bookingState.accompaniments.splice(i,1); else bookingState.accompaniments.push(o);
  renderBookingStep();
}
function setBAuthTab(tab){
  document.getElementById('bTabLogin').classList.toggle('on', tab==='login');
  document.getElementById('bTabSignup').classList.toggle('on', tab==='signup');
  document.getElementById('bSignupExtra').style.display = tab==='signup' ? 'block':'none';
  document.getElementById('bAuthPhoneStep').style.display='block';
  document.getElementById('bAuthOtpStep').style.display='none';
  document.getElementById('bookingOverlay').dataset.mode = tab;
}
function sendBOtp(){
  const phone = document.getElementById('bPhone').value.trim();
  if(phone.length<10){ alert('Enter a valid 10-digit phone number'); return; }
  session.custPhone = phone;
  document.getElementById('bAuthPhoneStep').style.display='none';
  document.getElementById('bAuthOtpStep').style.display='block';
}
function verifyBOtp(){
  const mode = document.getElementById('bookingOverlay').dataset.mode || 'login';
  if(mode==='signup'){
    session.custName = document.getElementById('bName').value.trim() || 'Guest';
  } else {
    session.custName = session.custName || 'Aisha';
  }
  session.loggedInCustomer = true;
  refreshHeader();
  bookingNext();
}
function bookingNext(){
  const step = STEPS[bookingState.step];
  if(step==='location' && bookingState.location!=='auto'){
    const v = document.getElementById('manualAddr')?.value.trim();
    if(!v){ alert('Please enter your address or use auto-detect.'); return; }
    bookingState.location='manual'; bookingState.address=v;
  }
  if(step==='cooking' && !bookingState.cookingType){ alert('Please select an occasion.'); return; }
  if(step==='people' && !bookingState.people){ alert('Please select number of people.'); return; }
  if(step==='dishes' && !bookingState.dishes){ alert('Please select number of dishes.'); return; }
  if(step==='accompaniments'){ bookingState.note = document.getElementById('bNote')?.value || ''; }
  if(step==='slots' && !bookingState.slot){ alert('Please choose a time slot.'); return; }
  if(step==='payment' && !bookingState.payment){ alert('Please choose a payment method.'); return; }
  if(step==='confirmation'){ closeModal('bookingOverlay'); renderCustBookings(); showScreen('customer'); return; }

  let nextIdx = bookingState.step+1;
  if(STEPS[nextIdx]==='login' && session.loggedInCustomer) nextIdx++;
  bookingState.step = nextIdx;
  renderBookingStep();
  replayStepAnim('bookingStepBody');
}
function bookingBack(){
  let prevIdx = bookingState.step-1;
  if(STEPS[prevIdx]==='login' && session.loggedInCustomer) prevIdx--;
  bookingState.step = Math.max(0,prevIdx);
  renderBookingStep();
  replayStepAnim('bookingStepBody');
}

/* ============ PARTNER REGISTRATION FLOW ============ */
const PSTEPS = ['basics','cuisine','availability','bank','verify','review-status','dashboard'];
const PSTEP_LABELS = {
  basics:'Tell us about you', cuisine:'Cuisine expertise', availability:'Areas &amp; availability',
  bank:'Payout details', verify:'Security verification', 'review-status':'Verification under review', dashboard:'Welcome to Tizl'
};
let partnerReg = { name:'', phone:'', dob:'', gender:'', languages:'', exp:'', cuisines:[], areas:'', availability:[], bank:'', upi:'', emergency:'', docsUploaded:false };

function openPartner(){
  partnerReg = { name:'', phone:'', dob:'', gender:'', languages:'', exp:'', cuisines:[], areas:'', availability:[], bank:'', upi:'', emergency:'', docsUploaded:false };
  pStep = 0;
  renderPartnerStep();
  openModal('partnerOverlay');
}
let pStep = 0;
function renderPartnerStep(){
  const step = PSTEPS[pStep];
  document.getElementById('partnerTitle').innerHTML = PSTEP_LABELS[step];
  document.getElementById('partnerSub').textContent = (step==='dashboard') ? 'All set' : (step==='review-status' ? 'Almost done' : `Step ${pStep+1} of ${PSTEPS.length-1} · About 4 minutes to complete`);
  document.getElementById('pProgress').style.width = (Math.min(pStep,PSTEPS.length-1)/(PSTEPS.length-1)*100)+'%';
  const body = document.getElementById('partnerStepBody');
  const backBtn = document.getElementById('pBackBtn');
  const nextBtn = document.getElementById('pNextBtn');
  backBtn.style.display = pStep===0 ? 'none' : 'inline-flex';
  nextBtn.style.display = 'inline-flex';
  nextBtn.textContent = 'Continue';

  if(step==='basics'){
    body.innerHTML = `
      <div class="field-group"><label>Full name</label><input type="text" id="pName" value="${partnerReg.name}" placeholder="e.g. Sunita Devi"></div>
      <div class="field-group"><label>Phone number</label><input type="tel" id="pPhone" value="${partnerReg.phone}" placeholder="10-digit mobile number" maxlength="10"></div>
      <div class="field-group"><label>Date of birth</label><input type="date" id="pDob" value="${partnerReg.dob}"></div>
      <div class="field-group"><label>Gender</label><div class="chip-select">
        ${['Female','Male','Other'].map(g=>`<button class="chip-opt ${partnerReg.gender===g?'selected':''}" onclick="setPReg('gender','${g}')">${g}</button>`).join('')}
      </div></div>
      <div class="field-group"><label>Languages spoken</label><input type="text" id="pLang" value="${partnerReg.languages}" placeholder="e.g. Hindi, English"></div>
      <div class="field-group"><label>Years of cooking experience</label><input type="number" id="pExp" value="${partnerReg.exp}" placeholder="e.g. 6"></div>
    `;
  } else if(step==='cuisine'){
    const opts = ['North Indian','South Indian','Chinese','Continental','Punjabi','Gujarati','Jain','Healthy Meals','Baby Food'];
    body.innerHTML = `<div class="chip-select">${opts.map(o=>`<button class="chip-opt ${partnerReg.cuisines.includes(o)?'selected':''}" onclick="togglePCuisine('${o}')">${o}</button>`).join('')}</div>`;
  } else if(step==='availability'){
    body.innerHTML = `
      <div class="field-group"><label>Preferred areas</label><input type="text" id="pAreas" value="${partnerReg.areas}" placeholder="e.g. Sector 50-62 Noida"></div>
      <div class="field-group"><label>Availability</label><div class="chip-select">
        ${['Morning','Afternoon','Evening','Night'].map(a=>`<button class="chip-opt ${partnerReg.availability.includes(a)?'selected':''}" onclick="togglePAvail('${a}')">${a}</button>`).join('')}
      </div></div>
    `;
  } else if(step==='bank'){
    body.innerHTML = `
      <div class="field-group"><label>Bank account number</label><input type="text" id="pBank" value="${partnerReg.bank}" placeholder="Account number"></div>
      <div class="field-group"><label>UPI ID</label><input type="text" id="pUpi" value="${partnerReg.upi}" placeholder="name@upi"></div>
      <div class="field-group"><label>Emergency contact</label><input type="tel" id="pEmergency" value="${partnerReg.emergency}" placeholder="10-digit mobile number"></div>
    `;
  } else if(step==='verify'){
    body.innerHTML = `
      <div class="field-group"><label>Aadhaar upload</label><input type="file"></div>
      <div class="field-group"><label>PAN upload</label><input type="file"></div>
      <div class="field-group"><label>Police verification certificate</label><input type="file"></div>
      <div class="field-group"><label>Address proof</label><input type="file"></div>
      <div class="field-group"><label>Live selfie verification</label><button class="btn btn-ghost btn-full" type="button" onclick="this.textContent='Selfie captured'">Capture selfie</button></div>
      <label style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--text-dim);margin-top:6px;"><input type="checkbox" checked style="margin-top:3px;"> I consent to a background check as part of Tizl partner verification.</label>
    `;
    nextBtn.textContent = 'Submit for Verification';
  } else if(step==='review-status'){
    body.innerHTML = `
      <div class="success-box">
        <div class="success-icon" style="background:var(--gold-dim);color:var(--gold);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3.6 2"/></svg></div>
        <h3>Verification under review</h3>
        <p>We're checking your documents. This usually takes 24–48 hours — we'll notify you the moment you're approved.</p>
        <div class="hint" style="margin-top:14px;">Demo mode: click below to simulate approval.</div>
      </div>
    `;
    nextBtn.textContent = 'Simulate Approval (Demo)';
    backBtn.style.display = 'none';
  } else if(step==='dashboard'){
    session.loggedInPartner = true;
    session.partName = partnerReg.name || 'Sunita';
    refreshHeader();
    body.innerHTML = `
      <div class="success-box">
        <div class="success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.8 4.8L19 7.5"/></svg></div>
        <h3>You're approved, ${session.partName}!</h3>
        <p>Go online whenever you're ready to start accepting jobs near ${partnerReg.areas || 'your area'}.</p>
      </div>
    `;
    backBtn.style.display = 'none';
    nextBtn.textContent = 'Go to Partner Dashboard';
  }
}
function setPReg(k,v){ partnerReg[k]=v; renderPartnerStep(); }
function togglePCuisine(o){ const i=partnerReg.cuisines.indexOf(o); i>-1?partnerReg.cuisines.splice(i,1):partnerReg.cuisines.push(o); renderPartnerStep(); }
function togglePAvail(o){ const i=partnerReg.availability.indexOf(o); i>-1?partnerReg.availability.splice(i,1):partnerReg.availability.push(o); renderPartnerStep(); }
function partnerNext(){
  const step = PSTEPS[pStep];
  if(step==='basics'){
    partnerReg.name = document.getElementById('pName').value.trim();
    partnerReg.phone = document.getElementById('pPhone').value.trim();
    partnerReg.dob = document.getElementById('pDob').value;
    partnerReg.languages = document.getElementById('pLang').value.trim();
    partnerReg.exp = document.getElementById('pExp').value.trim();
    if(!partnerReg.name || partnerReg.phone.length<10){ alert('Please fill in your name and a valid phone number.'); return; }
  }
  if(step==='bank'){
    partnerReg.bank = document.getElementById('pBank').value.trim();
    partnerReg.upi = document.getElementById('pUpi').value.trim();
    partnerReg.emergency = document.getElementById('pEmergency').value.trim();
  }
  if(step==='dashboard'){ closeModal('partnerOverlay'); renderJobs(); showScreen('partner'); return; }
  pStep = Math.min(pStep+1, PSTEPS.length-1);
  renderPartnerStep();
  replayStepAnim('partnerStepBody');
}
function partnerBack(){ pStep = Math.max(0,pStep-1); renderPartnerStep(); replayStepAnim('partnerStepBody'); }

/* ============ MOTION SYSTEM ============ */
(function(){
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('in');
          if(e.target.classList.contains('journey')){
            const fill = document.getElementById('journeyFill');
            if(fill) fill.style.width = '100%';
          }
          io.unobserve(e.target);
        }
      });
    }, {threshold:0.15});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
  }
})();

/* ============ INTERACTIVE PHONE DEMO CAROUSEL ============ */
let currentPhoneStep = 0;
let phoneTimer = null;
let isPhonePaused = false;

function switchPhoneStep(index) {
  currentPhoneStep = index;
  const screens = document.querySelectorAll('.phone-screen');
  const pills = document.querySelectorAll('.phone-step-pill');
  if(!screens.length) return;
  screens.forEach((s, i) => {
    if(i === index) {
      s.classList.add('active');
      s.removeAttribute('aria-hidden');
    } else {
      s.classList.remove('active');
      s.setAttribute('aria-hidden', 'true');
    }
  });
  pills.forEach((p, i) => {
    if(i === index) {
      p.classList.add('active');
      p.setAttribute('aria-selected', 'true');
    } else {
      p.classList.remove('active');
      p.setAttribute('aria-selected', 'false');
    }
  });

  // Reset timer on user interaction so manual interaction gets full 4s view time
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (phoneTimer && !isReduced) {
    clearInterval(phoneTimer);
    phoneTimer = setInterval(() => {
      if (isPhonePaused) return;
      currentPhoneStep = (currentPhoneStep + 1) % 4;
      switchPhoneStep(currentPhoneStep);
    }, 4000);
  }
}

function initPhoneCarousel() {
  const wrap = document.getElementById('phoneMockupWrap');
  if (!wrap) return;

  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Desktop hover and focus
  wrap.addEventListener('mouseenter', () => { isPhonePaused = true; });
  wrap.addEventListener('mouseleave', () => { isPhonePaused = false; });
  wrap.addEventListener('focusin', () => { isPhonePaused = true; });
  wrap.addEventListener('focusout', () => { isPhonePaused = false; });

  // Mobile touch interaction
  wrap.addEventListener('touchstart', () => { isPhonePaused = true; }, { passive: true });
  wrap.addEventListener('touchend', () => { isPhonePaused = false; }, { passive: true });

  // Page visibility awareness
  document.addEventListener('visibilitychange', () => {
    isPhonePaused = document.hidden;
  });

  if (isReduced) return;

  if (phoneTimer) clearInterval(phoneTimer);
  phoneTimer = setInterval(() => {
    if (isPhonePaused) return;
    currentPhoneStep = (currentPhoneStep + 1) % 4;
    switchPhoneStep(currentPhoneStep);
  }, 4000);
}

// Window unmount cleanup
window.__cleanupTizlPhone = function() {
  if (phoneTimer) {
    clearInterval(phoneTimer);
    phoneTimer = null;
  }
};

/* init */
setTimeout(initLiveStripMap, 100);
setTimeout(initPhoneCarousel, 120);
refreshHeader();
renderCustBookings();
renderJobs();
