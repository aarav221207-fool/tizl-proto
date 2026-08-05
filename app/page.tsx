'use client';

import React, { useState, useEffect, useRef } from 'react';

const NEEDS = [
  { id: 'breakfast', ic: '🍳', lb: 'Breakfast' },
  { id: 'lunch', ic: '🍛', lb: 'Lunch / lunch prep' },
  { id: 'dinner', ic: '🍽️', lb: 'Dinner' },
  { id: 'weekly', ic: '🗓️', lb: 'Weekly meal prep' },
  { id: 'party', ic: '🎉', lb: 'Party cooking' },
  { id: 'senior', ic: '🧓', lb: 'Senior care meals' },
  { id: 'baby', ic: '🍼', lb: 'Baby food' },
  { id: 'healthy', ic: '🥗', lb: 'Healthy meal prep' },
  { id: 'festival', ic: '🪔', lb: 'Festival cooking' },
  { id: 'custom', ic: '📝', lb: 'Custom meal' },
];

const DURATIONS = [
  { id: '1', len: '1 hr', amt: 349 },
  { id: '1.5', len: '1.5 hr', amt: 499 },
  { id: '2', len: '2 hr', amt: 649 },
  { id: '3', len: '3 hr', amt: 999 },
];

const CITIES = ['Delhi NCR', 'Noida', 'Gurugram', 'Bangalore', 'Mumbai', 'Hyderabad'];

const COOKS = [
  { name: 'Rekha S.', initials: 'RS', meta: '8 yrs · North Indian, Tiffin specials', rating: '4.9' },
  { name: 'Anand M.', initials: 'AM', meta: '5 yrs · South Indian, Senior-friendly diets', rating: '4.8' },
  { name: 'Priya J.', initials: 'PJ', meta: '3 yrs · Baby food, Healthy meal prep', rating: '4.9' },
];

const TESTIMONIALS = [
  { q: 'Booking felt as easy as ordering food. My cook arrived right on time and the kitchen was spotless after.', name: 'Kirti', loc: 'Sector 56, Noida', i: 'K' },
  { q: 'Finally a way to get my parents fresh, home-style meals every day without me worrying from another city.', name: 'Neha', loc: 'Sector 57, Gurugram', i: 'N' },
  { q: 'We booked party cooking for 12 people — the cook managed the whole spread on her own. Loved it.', name: 'Pradnyesh', loc: 'Whitefield, Bangalore', i: 'P' },
  { q: 'The pricing was clear before I even confirmed. No haggling, no surprises at the end.', name: 'Ridhi', loc: 'Sector 56, Noida', i: 'R' },
];

const FAQS = [
  { q: 'What is Tizl?', a: 'Tizl is an on-demand home cooking platform. We connect trained, verified cooks with homes that need help with breakfast, lunch, dinner, weekly prep, party cooking, senior care meals, and more — booked by the hour, on any random Tuesday.' },
  { q: 'How is Tizl different from hiring a cook directly?', a: 'With Tizl you get an Aadhaar and police-verified cook, transparent in-app hourly pricing, no advance payment, and the ability to reschedule without an awkward conversation. If a cook can\'t make it, we reassign automatically.' },
  { q: 'How do I book a cook?', a: 'Choose your need — breakfast, lunch, dinner, party, and so on — enter your headcount and dishes, pick a date and time, and confirm. You\'ll see the exact price before you pay.' },
  { q: 'How is pricing calculated?', a: 'Pricing is by the hour and scales with headcount and dish complexity: ₹349 for 1 hour, ₹499 for 1.5 hours, ₹649 for 2 hours, and ₹999 for 3 hours. The price is always shown upfront.' },
  { q: 'Are Tizl cooks background-verified?', a: 'Yes. Every Tizl cook completes Aadhaar verification and a police background check before their first booking, alongside ongoing rating checks after every visit.' },
  { q: 'Can I book instant, scheduled, or recurring?', a: 'Yes — get a cook in about 10 minutes, schedule one for later in the day, or set up a recurring slot for daily or weekly meals.' },
  { q: 'Can I cancel a booking?', a: 'Yes, you can cancel from the app before your cook arrives. Cancellations made well in advance are free; last-minute cancellations may carry a small charge.' },
  { q: 'Which cities is Tizl available in?', a: 'Tizl is live in Delhi NCR, Noida, Gurugram, Bangalore, Mumbai, and Hyderabad, with more cities planned.' },
];

const LOGO_SVG = (
  <svg height="38" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-img" style={{ display: 'block', height: '38px', width: 'auto' }}>
    {/* Three Steam Waves */}
    <path d="M78 44 C82 37 77 31 80 23 C83 15 78 9 82 2" stroke="#1D53DC" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M89 44 C93 37 88 31 91 23 C94 15 89 9 93 2" stroke="#1D53DC" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M100 44 C104 37 99 31 102 23 C105 15 100 9 104 2" stroke="#1D53DC" strokeWidth="4.5" strokeLinecap="round" fill="none" />

    {/* Pan Handle & Body */}
    <path d="M32 46 C32 44.5 33.5 43.5 35 43.5 L58 46 L62 46.5 L62 46.5 C68 47 70 50 78 50 L118 50 C122 50 124 47 125 46.5 L125 46.5 C125 46.5 125 46.5 125 46.5 C125 46.5 125 46.5 125 46.5 Z" fill="none" />
    
    {/* Sizzling Frying Pan */}
    <g fill="#0F1736">
      {/* Handle ring */}
      <path d="M37 50.5 C37 47.5 34.5 45 31.5 45 C28.5 45 26 47.5 26 50.5 C26 53.5 28.5 56 31.5 56 C34.5 56 37 53.5 37 50.5 Z M31.5 48.5 C32.6 48.5 33.5 49.4 33.5 50.5 C33.5 51.6 32.6 52.5 31.5 52.5 C30.4 52.5 29.5 51.6 29.5 50.5 C29.5 49.4 30.4 48.5 31.5 48.5 Z" />
      {/* Handle arm */}
      <path d="M36 52 L57 52 C61 52 64 54 68 56 L73 57.5 C77 58 80 58.5 85 58.5 L120 58.5 C124 58.5 126 55 126 52 L73 52 C68 52 65 50 61 48 L56 46.5 C52 45.5 48 48 42 49 L36 49 Z" />
      {/* Pan Bowl */}
      <path d="M58 52 C58 52 63 60 70 60.5 L116 60.5 C122 60.5 127 52 127 52 Z" />
    </g>

    {/* Typography 'TiZl' */}
    {/* 'T' in Dark Navy */}
    <path d="M84 55 L100 55 L100 66 L94 66 L94 100 L84 100 L84 66 L78 66 L78 55 Z" fill="#0F1736" />
    {/* 'i' in Royal Blue */}
    <circle cx="139" cy="50" r="6" fill="#1D53DC" />
    <rect x="133" y="62" width="12" height="38" rx="6" fill="#1D53DC" />
    {/* 'z' in Royal Blue */}
    <path d="M156 62 L188 62 C192 62 194 64.5 192 68 L168 90 L190 90 C193 90 195 92 195 95 L195 96 C195 98 193 100 190 100 L158 100 C154 100 152 97.5 154 94 L178 72 L158 72 C155 72 153 70 153 67 L153 66 C153 64 155 62 158 62 Z" fill="#1D53DC" />
    {/* 'l' in Dark Navy */}
    <path d="M208 48 C211 48 213 50 213 53 L213 90 C213 96 217 99 223 99 L238 99 C241 99 243 101 243 104 C243 107 241 109 238 109 L221 109 C211 109 203 102 203 91 L203 53 C203 50 205 48 208 48 Z" fill="#0F1736" />
  </svg>
);

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bStep, setBStep] = useState(1);
  const [booking, setBooking] = useState<{
    need: string | null;
    date: string;
    time: string;
    duration: string | null;
    city: string | null;
    cook: string | null;
    headcount: number;
    bookingId?: string;
  }>({
    need: null,
    date: '',
    time: '09:00',
    duration: null,
    city: null,
    cook: null,
    headcount: 2,
  });

  // Partner Modal State
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [pStep, setPStep] = useState(1);
  const [partner, setPartner] = useState<{
    name: string;
    phone: string;
    city: string | null;
    spec: string | null;
    partnerId?: string;
  }>({
    name: '',
    phone: '',
    city: null,
    spec: null,
  });

  const servicesScrollRef = useRef<HTMLDivElement>(null);

  const openBookingModal = (needId?: string) => {
    setBooking({
      need: needId || null,
      date: '',
      time: '09:00',
      duration: null,
      city: null,
      cook: null,
      headcount: 2,
    });
    setBStep(1);
    setIsBookingOpen(true);
  };

  const openPartnerModal = () => {
    setPartner({
      name: '',
      phone: '',
      city: null,
      spec: null,
    });
    setPStep(1);
    setIsPartnerOpen(true);
  };

  const handleBookingNext = () => {
    if (bStep < 4) {
      if (bStep === 3) {
        const id = 'TIZL-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        setBooking(prev => ({ ...prev, bookingId: id }));
      }
      setBStep(prev => prev + 1);
    }
  };

  const handleBookingBack = () => {
    if (bStep > 1) {
      setBStep(prev => prev - 1);
    }
  };

  const handlePartnerNext = () => {
    if (pStep < 3) {
      if (pStep === 2) {
        const id = 'TIZL-COOK-' + Math.random().toString(36).slice(2, 7).toUpperCase();
        setPartner(prev => ({ ...prev, partnerId: id }));
      }
      setPStep(prev => prev + 1);
    }
  };

  const handlePartnerBack = () => {
    if (pStep > 1) {
      setPStep(prev => prev - 1);
    }
  };

  const isBNextEnabled = () => {
    if (bStep === 1) return !!booking.need;
    if (bStep === 2) return !!(booking.date && booking.time && booking.duration && booking.city);
    if (bStep === 3) return !!booking.cook;
    return true;
  };

  const isPNextEnabled = () => {
    if (pStep === 1) return !!(partner.name && partner.phone && partner.city);
    if (pStep === 2) return !!partner.spec;
    return true;
  };

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="logo" aria-label="Tizl Home">
            {LOGO_SVG}
          </a>
          <nav className="main-nav">
            <div className="nav-item"><a href="#why-us">Why us</a></div>
            <div className="nav-item">
              <button type="button">Services <span className="caret">▾</span></button>
              <div className="mega">
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('breakfast'); }}>Breakfast</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('lunch'); }}>Lunch / Lunch Prep</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('dinner'); }}>Dinner</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('weekly'); }}>Weekly Meal Prep</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('party'); }}>Party Cooking</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('senior'); }}>Senior Care Meals</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('baby'); }}>Baby Food</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('healthy'); }}>Healthy Meal Prep</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('festival'); }}>Festival Cooking</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('custom'); }}>Custom Meal</a>
                <a className="view-all" href="#services">View all services →</a>
              </div>
            </div>
            <div className="nav-item">
              <button type="button">Cities <span className="caret">▾</span></button>
              <div className="mega">
                <a href="#cities">Delhi NCR</a><a href="#cities">Noida</a>
                <a href="#cities">Gurugram</a><a href="#cities">Bangalore</a>
                <a href="#cities">Mumbai</a><a href="#cities">Hyderabad</a>
                <a className="view-all" href="#cities">View all cities →</a>
              </div>
            </div>
            <div className="nav-item"><a href="#how-it-works">How it works</a></div>
            <div className="nav-item"><a href="#faqs">FAQs</a></div>
          </nav>
          <div className="header-ctas">
            <button type="button" className="btn btn-ghost btn-small" onClick={openPartnerModal}>Become a partner</button>
            <button type="button" className="btn btn-primary btn-small" onClick={() => openBookingModal()}>Book a cook</button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <div className="trust-line">A real cook, at your stove, in about 10 minutes</div>
          <div className="hero-grid">
            <div>
              <h1>Book a Cook <em>in 10 Minutes.</em></h1>
              <p className="lead">Not a subscription. Not a chef for special occasions. Tizl gets a trained, verified cook into your kitchen — sizzling — on any random Tuesday. Breakfast, lunch, dinner, or a full party spread, priced by the hour.</p>
              <div className="hero-ctas">
                <button type="button" className="btn btn-primary" onClick={() => openBookingModal()}>Book a cook now</button>
                <button type="button" className="btn btn-ghost" onClick={openPartnerModal}>Become a partner cook</button>
              </div>
              <div className="store-badges">
                <div className="store-badge"><span className="ic">▶</span><div className="txt"><small>GET IT ON</small><strong>Google Play</strong></div><span className="soon">Coming soon</span></div>
                <div className="store-badge"><span className="ic"></span><div className="txt"><small>Download on the</small><strong>App Store</strong></div><span className="soon">Coming soon</span></div>
              </div>
              <div className="rating-line"><span className="stars">★★★★★</span> 4.8 from early customer ratings</div>
              <div className="live-in">
                Live in
                <div className="chip-row">
                  <span className="chip">Delhi NCR</span><span className="chip">Noida</span><span className="chip">Gurugram</span>
                  <span className="chip">Bangalore</span><span className="chip">Mumbai</span><span className="chip">Hyderabad</span>
                </div>
              </div>
            </div>
            <div>
              <div className="pan-wrap">
                <div className="steam">
                  <svg viewBox="0 0 20 60"><path d="M4 55 C7 45 1 40 4 30 C7 20 1 15 4 5" stroke="#2F49E8" strokeWidth="3" fill="none" strokeLinecap="round"/></svg>
                  <svg viewBox="0 0 20 60"><path d="M10 58 C13 48 7 42 10 32 C13 22 7 17 10 4" stroke="#2F49E8" strokeWidth="3" fill="none" strokeLinecap="round"/></svg>
                  <svg viewBox="0 0 20 60"><path d="M16 55 C19 45 13 40 16 30 C19 20 13 15 16 5" stroke="#2F49E8" strokeWidth="3" fill="none" strokeLinecap="round"/></svg>
                </div>
                <div className="pan-handle"></div>
                <div className="pan-disc"></div>
                <div className="pan-center"><div className="display">₹349<span className="mono" style={{ fontSize: '11px' }}>/hr</span></div><span>Pick a need,<br />we bring the cook</span></div>
                <button type="button" className="compartment c0" onClick={() => openBookingModal('breakfast')}><span className="ic">🍳</span><span className="lb">Breakfast</span></button>
                <button type="button" className="compartment c1" onClick={() => openBookingModal('lunch')}><span className="ic">🍛</span><span className="lb">Lunch</span></button>
                <button type="button" className="compartment c2" onClick={() => openBookingModal('dinner')}><span className="ic">🍽️</span><span className="lb">Dinner</span></button>
                <button type="button" className="compartment c3" onClick={() => openBookingModal('party')}><span className="ic">🎉</span><span className="lb">Party</span></button>
                <button type="button" className="compartment c4" onClick={() => openBookingModal('weekly')}><span className="ic">🗓️</span><span className="lb">Weekly prep</span></button>
                <button type="button" className="compartment c5" onClick={() => openBookingModal('senior')}><span className="ic">🧓</span><span className="lb">Senior care</span></button>
                <button type="button" className="compartment c6" onClick={() => openBookingModal('baby')}><span className="ic">🍼</span><span className="lb">Baby food</span></button>
                <button type="button" className="compartment c7" onClick={() => openBookingModal('healthy')}><span className="ic">🥗</span><span className="lb">Healthy prep</span></button>
              </div>
              <div className="pan-caption">The Tizl pan — tap a need, we get it sizzling</div>
            </div>
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="wrap">
          <div className="item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/></svg>Aadhaar-verified cooks</div>
          <div className="item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>Police-background checked</div>
          <div className="item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17.3l-6.2 3.3 1.2-6.9L2 8.9l7-1L12 1.5 15 7.9l7 1-5 4.8 1.2 6.9z"/></svg>No advance payment</div>
          <div className="item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>Cook arrives in your slot</div>
        </div>
      </div>

      <section id="why-us">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow-label">Why us</div>
            <h2>Great homes deserve great support.</h2>
            <p>Every household runs on one impossible math problem: someone has to cook, every single day, no matter how the day went. Tizl takes that off your plate — with trained, verified cooks who show up on time and clean up after.</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card"><div className="num">500+</div><div className="lb">Homes onboarded</div></div>
            <div className="stat-card"><div className="num">10,000+</div><div className="lb">Kitchen hours booked</div></div>
            <div className="stat-card"><div className="num">150+</div><div className="lb">Verified Tizl cooks</div></div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section id="services">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow-label">Our services</div>
            <h2>Book by need, not a generic button.</h2>
            <p>Tell us what your kitchen needs right now — Tizl handles the rest, at a clear hourly rate.</p>
          </div>
          <div className="services-scroll" ref={servicesScrollRef}>
            {NEEDS.map(n => (
              <button key={n.id} type="button" className="service-chip" onClick={() => openBookingModal(n.id)}>
                <div className="ic">{n.ic}</div>
                <div className="lb">{n.lb}</div>
              </button>
            ))}
          </div>
          <a className="view-all-link" href="#" onClick={(e) => {
            e.preventDefault();
            if (servicesScrollRef.current) {
              servicesScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
            }
          }}>View all services →</a>
        </div>
      </section>

      <hr className="divider" />

      <section id="how-it-works">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow-label">How it works</div>
            <h2>Simple steps to a sizzling stove.</h2>
            <p>Book instant, scheduled, or recurring — a verified cook is on the way.</p>
          </div>
          <div className="steps-grid">
            <div className="step-col">
              <div className="phone"><div className="phone-notch"></div><div className="phone-screen">
                <div className="phone-title">Tizl · Choose need</div>
                <div className="mini-grid">
                  <div className="mini-card"><div className="mi">🍳</div>Breakfast</div>
                  <div className="mini-card"><div className="mi">🍛</div>Lunch</div>
                  <div className="mini-card"><div className="mi">🍽️</div>Dinner</div>
                  <div className="mini-card"><div className="mi">🎉</div>Party</div>
                  <div className="mini-card"><div className="mi">🧓</div>Senior care</div>
                  <div className="mini-card"><div className="mi">🍼</div>Baby food</div>
                </div>
              </div></div>
              <div className="step-tag">Step 1</div>
              <h3>Pick from 10 meal needs</h3>
              <p>Browse need-based services in the Tizl app — from daily meals to festival cooking.</p>
            </div>
            <div className="step-col">
              <div className="phone"><div className="phone-notch"></div><div className="phone-screen">
                <div className="phone-title">Tizl · Your cart</div>
                <div className="mini-cart-row"><span>Lunch · North Indian</span><span className="mini-stepper"><span>−</span>4<span>+</span></span></div>
                <div className="mini-cart-row"><span>Dishes: 3 selected</span><span>≈ 2 hr</span></div>
                <div className="mini-cart-row"><span>Cook fee</span><span>₹649</span></div>
              </div></div>
              <div className="step-tag">Step 2</div>
              <h3>Add headcount &amp; dishes</h3>
              <p>Tell us people and dishes — Tizl auto-estimates duration and price live.</p>
            </div>
            <div className="step-col">
              <div className="phone"><div className="phone-notch"></div><div className="phone-screen">
                <div className="phone-title">Tizl · Book &amp; pay</div>
                <div className="mini-tabs"><span className="mini-tab on">Instant</span><span className="mini-tab">Scheduled</span><span className="mini-tab">Recurring</span></div>
                <div className="mini-cart-row"><span>Today, 12:30 PM</span><span>2 hr</span></div>
                <div className="mini-pay-btn">Pay ₹649 &amp; confirm</div>
              </div></div>
              <div className="step-tag">Step 3</div>
              <h3>Choose instant, scheduled, or recurring</h3>
              <p>Get a cook in about 10 minutes, book for later, or set a recurring weekly slot. Pay &amp; done.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section id="cities">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow-label">Cities</div>
            <h2>Live in your city</h2>
            <p>Tizl cooks are currently verified and active across six cities, with more on the way.</p>
          </div>
          <div className="live-in"><div className="chip-row">
            <span className="chip">Delhi NCR</span><span className="chip">Noida</span><span className="chip">Gurugram</span>
            <span className="chip">Bangalore</span><span className="chip">Mumbai</span><span className="chip">Hyderabad</span>
          </div></div>
        </div>
      </section>

      <hr className="divider" />

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow-label">Testimonials</div>
            <h2>Loved by Tizl homes.</h2>
            <p>Illustrative early feedback — real reviews go here at launch.</p>
          </div>
          <div className="testi-scroll">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="testi-card">
                <p>&quot;{t.q}&quot;</p>
                <div className="testi-who">
                  <div className="testi-avatar">{t.i}</div>
                  <div>
                    <div className="name">{t.name}</div>
                    <div className="loc">{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section id="faqs">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow-label">FAQ&apos;s</div>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button type="button" className="faq-q" onClick={() => setOpenFaq(isOpen ? null : idx)}>
                    <span>{f.q}</span>
                    <span className="plus">+</span>
                  </button>
                  <div className={`faq-a ${isOpen ? 'open' : ''}`}>
                    <p>{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="closing-cta">
        <div className="wrap">
          <h2>Book a Cook in 10 Minutes.</h2>
          <p>Book your first Tizl cook today — transparent hourly pricing, verified partners.</p>
          <button type="button" className="btn btn-primary" onClick={() => openBookingModal()}>Book a cook now</button>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <div className="footer-top">
            <div style={{ maxWidth: '240px' }}>
              <div className="logo-chip" style={{ marginBottom: '10px' }}>
                {LOGO_SVG}
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.6' }}>Book a Cook in 10 Minutes. Aadhaar &amp; police-verified cooks.</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h4>Support</h4>
                <a href="#faqs">Contact us</a>
                <a href="#faqs">FAQs</a>
                <a href="#">Delete account</a>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); openPartnerModal(); }}>Become a Tizl cook</a>
                <a href="#cities">Request Tizl in your locality</a>
              </div>
              <div className="footer-col">
                <h4>Legal</h4>
                <a href="#">Terms &amp; Conditions</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Cancellation Policy</a>
              </div>
              <div className="footer-col">
                <h4>All services</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('breakfast'); }}>Breakfast</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('lunch'); }}>Lunch Prep</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('party'); }}>Party Cooking</a>
                <a href="#" onClick={(e) => { e.preventDefault(); openBookingModal('senior'); }}>Senior Care Meals</a>
              </div>
              <div className="footer-col">
                <h4>All cities</h4>
                <a href="#cities">Delhi NCR</a>
                <a href="#cities">Noida · Gurugram</a>
                <a href="#cities">Bangalore</a>
                <a href="#cities">Mumbai · Hyderabad</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>Tizl © 2026</span>
            <div className="social-row"><span>Instagram</span><span>LinkedIn</span><span>YouTube</span></div>
          </div>
        </div>
      </footer>

      {/* BOOKING MODAL */}
      <div className={`modal-overlay ${isBookingOpen ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-head">
            <h3>Book a cook</h3>
            <button type="button" className="modal-close" onClick={() => setIsBookingOpen(false)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="step-track">
              <span className={bStep >= 1 ? 'active' : ''}></span>
              <span className={bStep >= 2 ? 'active' : ''}></span>
              <span className={bStep >= 3 ? 'active' : ''}></span>
              <span className={bStep >= 4 ? 'active' : ''}></span>
            </div>

            {bStep === 1 && (
              <div>
                <div className="field-group">
                  <label>What do you need?</label>
                  <div className="option-grid">
                    {NEEDS.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        className={`option-card ${booking.need === n.id ? 'selected' : ''}`}
                        onClick={() => setBooking(prev => ({ ...prev, need: n.id }))}
                      >
                        <div className="ic">{n.ic}</div>
                        <div className="lb">{n.lb}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {bStep === 2 && (
              <div>
                <div className="field-group">
                  <label>Number of people</label>
                  <input
                    type="number"
                    min="1"
                    value={booking.headcount}
                    onChange={(e) => setBooking(prev => ({ ...prev, headcount: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="field-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={booking.date}
                    onChange={(e) => setBooking(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={booking.time}
                    onChange={(e) => setBooking(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label>Duration</label>
                  <div className="duration-grid">
                    {DURATIONS.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        className={`dur-card ${booking.duration === d.id ? 'selected' : ''}`}
                        onClick={() => setBooking(prev => ({ ...prev, duration: d.id }))}
                      >
                        <div className="len">{d.len}</div>
                        <div className="amt">₹{d.amt}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field-group">
                  <label>City</label>
                  <div className="option-grid">
                    {CITIES.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`option-card ${booking.city === c ? 'selected' : ''}`}
                        style={{ padding: '12px 14px' }}
                        onClick={() => setBooking(prev => ({ ...prev, city: c }))}
                      >
                        <div className="lb">{c}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {bStep === 3 && (
              <div>
                <div className="field-group">
                  <label>Available cooks near you</label>
                  <div>
                    {COOKS.map(c => (
                      <div
                        key={c.name}
                        className={`cook-card ${booking.cook === c.name ? 'selected' : ''}`}
                        onClick={() => setBooking(prev => ({ ...prev, cook: c.name }))}
                      >
                        <div className="cook-avatar">{c.initials}</div>
                        <div className="cook-info">
                          <div className="name">{c.name} <span className="verified-badge">✓ Verified</span></div>
                          <div className="meta">{c.meta} · ⭐ {c.rating}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {bStep === 4 && (
              <div>
                <div className="success-box">
                  <div className="success-icon">✓</div>
                  <h3>Booking confirmed</h3>
                  <span className="status-badge success">● Confirmed</span>
                  <p style={{ marginTop: '14px' }}>
                    {booking.cook} will arrive on {booking.date || 'your chosen date'} at {booking.time} for {NEEDS.find(n => n.id === booking.need)?.lb.toLowerCase() || 'your booking'} · {booking.headcount} people in {booking.city}.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', textAlign: 'left' }}>
                    <span>Duration</span>
                    <span>{DURATIONS.find(x => x.id === booking.duration)?.len || ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: 'var(--blue)' }}>
                    <span>Total</span>
                    <span>₹{DURATIONS.find(x => x.id === booking.duration)?.amt || ''}</span>
                  </div>
                  <span className="booking-id">{booking.bookingId}</span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {bStep > 1 && bStep < 4 ? (
              <button type="button" className="btn btn-ghost btn-small" onClick={handleBookingBack}>Back</button>
            ) : (
              <span></span>
            )}
            {bStep < 4 ? (
              <button
                type="button"
                className="btn btn-primary btn-small"
                disabled={!isBNextEnabled()}
                style={!isBNextEnabled() ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                onClick={handleBookingNext}
              >
                {bStep === 3 ? 'Confirm booking' : 'Continue'}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-small" onClick={() => setIsBookingOpen(false)}>Done</button>
            )}
          </div>
        </div>
      </div>

      {/* PARTNER MODAL */}
      <div className={`modal-overlay ${isPartnerOpen ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-head">
            <h3>Register as a cook</h3>
            <button type="button" className="modal-close" onClick={() => setIsPartnerOpen(false)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="step-track">
              <span className={pStep >= 1 ? 'active' : ''}></span>
              <span className={pStep >= 2 ? 'active' : ''}></span>
              <span className={pStep >= 3 ? 'active' : ''}></span>
            </div>

            {pStep === 1 && (
              <div>
                <div className="field-group">
                  <label>Full name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunita Devi"
                    value={partner.name}
                    onChange={(e) => setPartner(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label>Phone number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={partner.phone}
                    onChange={(e) => setPartner(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label>City</label>
                  <div className="option-grid">
                    {CITIES.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`option-card ${partner.city === c ? 'selected' : ''}`}
                        style={{ padding: '12px 14px' }}
                        onClick={() => setPartner(prev => ({ ...prev, city: c }))}
                      >
                        <div className="lb">{c}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {pStep === 2 && (
              <div>
                <div className="field-group">
                  <label>Upload Aadhaar (front)</label>
                  <input type="file" />
                </div>
                <div className="field-group">
                  <label>Cooking speciality</label>
                  <div className="option-grid">
                    {['North Indian', 'South Indian', 'Baking & desserts', 'Baby & senior diets', 'Party & catering', 'Healthy / diet meals'].map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`option-card ${partner.spec === s ? 'selected' : ''}`}
                        style={{ padding: '12px 14px' }}
                        onClick={() => setPartner(prev => ({ ...prev, spec: s }))}
                      >
                        <div className="lb">{s}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                  Your details go through Aadhaar verification and a police background check before you can accept bookings — usually 2–3 business days.
                </p>
              </div>
            )}

            {pStep === 3 && (
              <div>
                <div className="success-box">
                  <div className="success-icon">✓</div>
                  <h3>Application received</h3>
                  <p>
                    Thanks, {partner.name.split(' ')[0] || 'there'}. We&apos;re verifying your Aadhaar and running a police background check for {partner.city}. This usually takes 2–3 business days — we&apos;ll message you on {partner.phone || 'your phone'} once you&apos;re approved.
                  </p>
                  <span className="booking-id">{partner.partnerId}</span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {pStep > 1 && pStep < 3 ? (
              <button type="button" className="btn btn-ghost btn-small" onClick={handlePartnerBack}>Back</button>
            ) : (
              <span></span>
            )}
            {pStep < 3 ? (
              <button
                type="button"
                className="btn btn-primary btn-small"
                disabled={!isPNextEnabled()}
                style={!isPNextEnabled() ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                onClick={handlePartnerNext}
              >
                {pStep === 2 ? 'Submit for verification' : 'Continue'}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-small" onClick={() => setIsPartnerOpen(false)}>Done</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
