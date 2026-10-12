'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

declare global {
  interface Window {
    L?: any;
  }
}

interface ServiceItem {
  id: string;
  lb: string;
  sub: string;
  img: string;
  ic: React.ReactNode;
}

const SERVICES: ServiceItem[] = [
  {
    id: 'breakfast',
    lb: 'Breakfast',
    sub: 'Light, quick starts',
    img: '/assets/service-breakfast.jpeg',
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4">
        <circle cx="12" cy="14" r="5" />
        <path d="M12 3v3M6.5 6.5l1.8 1.8M17.5 6.5l-1.8 1.8" />
      </svg>
    ),
  },
  {
    id: 'lunch',
    lb: 'Lunch',
    sub: 'Everyday midday meals',
    img: '/assets/service-lunch.jpeg',
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4">
        <path d="M4 11h16a8 8 0 01-16 0z" />
        <path d="M12 11V5" />
      </svg>
    ),
  },
  {
    id: 'dinner',
    lb: 'Dinner',
    sub: 'A proper end to the day',
    img: '/assets/service-dinner.jpeg',
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2.4" />
      </svg>
    ),
  },
  {
    id: 'party',
    lb: 'Party Cooking',
    sub: 'For guests, done right',
    img: '/assets/service-party-cooking.jpeg',
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4">
        <path d="M7 11V7a5 5 0 0110 0v4" />
        <path d="M5 11h14v10H5z" />
      </svg>
    ),
  },
  {
    id: 'baby-food',
    lb: 'Baby Food',
    sub: 'Soft, age-right portions',
    img: '/assets/service-baby-food.jpeg',
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a6 6 0 0112 0v2" />
      </svg>
    ),
  },
  {
    id: 'meal-prep',
    lb: 'Meal Prep',
    sub: 'Batch-cooked for the week',
    img: '/assets/service-meal-prep.jpeg',
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: 'weekly-cook',
    lb: 'Weekly Cook',
    sub: 'A regular hand in the kitchen',
    img: '/assets/service-weekly-cook.jpeg',
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: 'senior-meals',
    lb: 'Senior Meals',
    sub: 'Gentle, considerate cooking',
    img: '/assets/service-senior-meals.jpeg',
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    n: 'Priya Sharma',
    loc: 'Sector 62, Noida',
    t: 'Booked a cook for dinner after a crazy workday. She was here in 8 minutes with her own apron and kit. Food was delicious and home-style.',
    av: '/assets/avatar-priya-sharma.jpeg',
  },
  {
    n: 'Rohit Kapoor',
    loc: 'DLF Phase 3, Gurgaon',
    t: 'We used Tizl for a small house gathering of 8 people. No stress, no catering bill — just great food cooked in our own kitchen.',
    av: '/assets/avatar-rohit-kapoor.jpeg',
  },
  {
    n: 'Ananya Mehta',
    loc: 'Greater Kailash, Delhi',
    t: 'Our weekly cook has completely changed our routine. Reliable, polite and amazing food!',
    av: '/assets/avatar-ananya-mehta.jpeg',
  },
];

const FAQS = [
  {
    q: 'How does pricing work?',
    a: 'Pricing is calculated from your location, meal type, occasion, headcount, number of dishes and any accompaniments — shown before you confirm, with no hidden fees.',
  },
  {
    q: 'Are Tizl cooks verified?',
    a: 'Every cook completes Aadhaar verification, a police background check and a live selfie check before going live on the platform.',
  },
  {
    q: 'Can I cancel or reschedule?',
    a: 'Yes — from My Bookings you can reschedule or cancel a booking up to 2 hours before the slot at no charge.',
  },
  {
    q: 'How do I pay?',
    a: 'Pay after the meal is cooked, via UPI, card, net banking or wallet. No advance payment required.',
  },
  {
    q: 'What if something goes wrong?',
    a: 'Reach live chat, call or WhatsApp support any time from Help & Support — most issues are resolved within minutes.',
  },
];

const DELHI_NCR = [28.6139, 77.209];

const STEPS = [
  'location',
  'meal',
  'cooking',
  'people',
  'dishes',
  'accompaniments',
  'login',
  'slots',
  'review',
  'payment',
  'confirmation',
];

const STEP_LABELS: Record<string, string> = {
  location: 'Where should the cook come?',
  meal: 'Any meal preference?',
  cooking: "What's the occasion?",
  people: 'How many people?',
  dishes: 'How many dishes?',
  accompaniments: 'Anything to go with it? (optional)',
  login: 'Sign in to see slots & pricing',
  slots: 'Choose a day & time',
  review: 'Review your booking',
  payment: 'Choose payment method',
  confirmation: 'Booking status',
};

const PSTEPS = ['basics', 'cuisine', 'availability', 'bank', 'verify', 'review-status'];
const PSTEP_LABELS: Record<string, string> = {
  basics: 'About you',
  cuisine: 'What do you cook best?',
  availability: 'When & where can you work?',
  bank: 'Bank details for payouts',
  verify: 'Document verification',
  'review-status': 'Verification Under Review',
};

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();

  // Scroll reveal setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            if (entry.target.classList.contains('journey')) {
              const fill = document.getElementById('journeyFill');
              if (fill) fill.style.width = '100%';
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Live strip map setup
  const liveStripMapRef = useRef<HTMLDivElement>(null);
  const liveStripMapInstance = useRef<any>(null);

  useEffect(() => {
    const initLiveMap = () => {
      if (!liveStripMapRef.current || !window.L || liveStripMapInstance.current) return;
      try {
        const L = window.L;
        const map = L.map(liveStripMapRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
          keyboard: false,
        }).setView(DELHI_NCR, 9);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
          maxZoom: 18,
          subdomains: 'abc',
        }).addTo(map);

        const pinIcon = L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;border-radius:50% 50% 50% 0;background:#D95F3D;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.3);"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 14],
        });

        [[28.5355, 77.391], [28.4595, 77.0266], [28.7041, 77.1025]].forEach((coord) => {
          L.marker(coord, { icon: pinIcon }).addTo(map);
        });

        liveStripMapInstance.current = map;
      } catch (e) {
        console.warn('Map initialization error:', e);
      }
    };

    const timer = setTimeout(initLiveMap, 300);
    return () => clearTimeout(timer);
  }, []);

  // FAQs state
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // Modals state
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [custAuthOpen, setCustAuthOpen] = useState(false);
  const [partAuthOpen, setPartAuthOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);

  // Customer Auth Modal State
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [custPhone, setCustPhone] = useState('');
  const [custOtpStep, setCustOtpStep] = useState(false);
  const [custOtpDigits, setCustOtpDigits] = useState(['', '', '', '', '', '']);
  const [custName, setCustName] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custAuthLoading, setCustAuthLoading] = useState(false);
  const [custAuthError, setCustAuthError] = useState<string | null>(null);

  // Partner Auth Modal State
  const [partPhone, setPartPhone] = useState('');
  const [partOtpStep, setPartOtpStep] = useState(false);
  const [partOtpDigits, setPartOtpDigits] = useState(['', '', '', '', '', '']);
  const [partAuthLoading, setPartAuthLoading] = useState(false);
  const [partAuthError, setPartAuthError] = useState<string | null>(null);

  // Booking Wizard State
  const [bStep, setBStep] = useState(0);
  const [bState, setBState] = useState({
    location: 'auto',
    address: 'B-42, Sector 62, Noida, Uttar Pradesh',
    mealType: 'dinner',
    cookingType: 'daily',
    people: '4',
    dishes: '2',
    accompaniments: ['Rotis', 'Salad'] as string[],
    note: '',
    date: 'Today',
    slot: '7:30 PM - 8:30 PM',
    payment: 'pay_after',
  });
  const [bPrice, setBPrice] = useState(559);
  const [bookingSubmitted, setBookingSubmitted] = useState<any>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Partner Registration Wizard State
  const [pStep, setPStep] = useState(0);
  const [pState, setPState] = useState({
    name: '',
    phone: '',
    dob: '1992-05-14',
    gender: 'Female',
    languages: 'Hindi, English',
    exp: '5',
    cuisines: ['North Indian', 'Punjabi', 'Healthy Meals'] as string[],
    areas: 'Sector 62, Noida & Indirapuram',
    availability: ['Morning', 'Evening'] as string[],
    bank: '',
    upi: '',
    emergency: '',
  });

  // Calculate booking price
  const calculatePrice = useCallback((state: typeof bState) => {
    const basePrices: Record<string, number> = { breakfast: 349, lunch: 399, dinner: 449, custom: 399 };
    const base = basePrices[state.mealType] || 399;
    const peopleMultipliers: Record<string, number> = { '1-2': 1, '3-4': 1.4, '5-6': 1.8, '7-10': 2.4, '10+': 3.2 };
    const peopleMult = peopleMultipliers[state.people] || 1.4;
    const dishExtras: Record<string, number> = { '1': 0, '2': 80, '3': 160, '4+': 260 };
    const dishExtra = dishExtras[state.dishes] || 80;
    const cookMultipliers: Record<string, number> = { daily: 1, weekend: 1.05, special: 1.15, party: 1.35, festival: 1.25 };
    const cookMult = cookMultipliers[state.cookingType] || 1;
    const accExtra = (state.accompaniments?.length || 0) * 60;
    return Math.round((base * peopleMult + dishExtra + accExtra) * cookMult);
  }, []);

  useEffect(() => {
    setBPrice(calculatePrice(bState));
  }, [bState, calculatePrice]);

  // Open booking if ?book=true in query
  useEffect(() => {
    if (searchParams.get('book') === 'true') {
      setBookingOpen(true);
    }
  }, [searchParams]);

  const openBookingModal = (initialMeal?: string) => {
    if (initialMeal) {
      setBState((prev) => ({ ...prev, mealType: initialMeal }));
    }
    setBStep(0);
    setBookingSubmitted(null);
    setBookingOpen(true);
  };

  const openPartnerModal = () => {
    setPStep(0);
    setPartnerOpen(true);
  };

  const openAuthGate = (role?: 'customer' | 'partner') => {
    if (role === 'customer') {
      setCustAuthOpen(true);
    } else if (role === 'partner') {
      setPartAuthOpen(true);
    } else {
      setAuthGateOpen(true);
    }
  };

  // Location detection
  const [detectingLocation, setDetectingLocation] = useState(false);
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Location is not supported on this browser. Please type your address.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        )
          .then((r) => r.json())
          .then((data) => {
            const addr = data?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setBState((prev) => ({ ...prev, location: 'auto', address: addr }));
            setDetectingLocation(false);
          })
          .catch(() => {
            setBState((prev) => ({
              ...prev,
              location: 'auto',
              address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`,
            }));
            setDetectingLocation(false);
          });
      },
      (err) => {
        setDetectingLocation(false);
        alert('Could not retrieve your location. Please type your address.');
      },
      { timeout: 8000 }
    );
  };

  // Confirm booking to backend
  const handleFinalBooking = async () => {
    setIsSubmittingBooking(true);
    setBookingError(null);

    // Require customer authentication before placing real booking
    if (!isAuthenticated) {
      setIsSubmittingBooking(false);
      setBookingError('Please log in or create an account to confirm your verified cook booking.');
      openAuthGate('customer');
      return;
    }

    try {
      const today = new Date();
      if (bState.date === 'Tomorrow') {
        today.setDate(today.getDate() + 1);
      }
      const bookingDateStr = today.toISOString().slice(0, 10);
      const rawSlot = bState.slot || '7:30 PM - 8:30 PM';
      const startTimeStr = rawSlot.includes(' - ') ? rawSlot.split(' - ')[0].trim() : '19:30';

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: bState.mealType || 'dinner',
          address_id: 'default',
          address_text: bState.address,
          booking_date: bookingDateStr,
          start_time: startTimeStr,
          duration_hours: 2,
          guest_count: parseInt(bState.people, 10) || 4,
          cooking_notes: 'Meal: ' + bState.mealType + '. Occasion: ' + bState.cookingType + '. Dishes: ' + bState.dishes + '. Accompaniments: ' + bState.accompaniments.join(', ') + '. Note: ' + (bState.note || 'None') + '. Address: ' + bState.address,
          client_request_id: 'req_' + Date.now(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.data?.booking) {
        const errorMsg = data?.error?.message || data?.error || 'Failed to create booking in database. Please verify details and retry.';
        setBookingError(errorMsg);
        return;
      }

      const realBooking = data.data.booking;
      setBookingSubmitted({
        id: realBooking.booking_number,
        bookingId: realBooking.id,
        ...bState,
        price: realBooking.total_amount || bPrice,
      });
      setBStep(STEPS.length - 1);
    } catch (err: any) {
      console.error('Booking creation error:', err);
      setBookingError(err?.message || 'Network error connecting to booking service. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };;

  return (
    <>
      <SiteHeader
        onOpenBooking={() => openBookingModal()}
        onOpenAuth={(role) => openAuthGate(role)}
        onOpenPartner={() => openPartnerModal()}
      />

      <main id="site">
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-photo-wrap">
            <img
              src="/assets/hero-cook.jpeg"
              alt="Tizl cook preparing a meal"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '50% 20%',
              }}
            />
          </div>
          <div className="wrap hero-inner">
            <div className="hero-copy">
              <div className="hero-badge">Verified cooks · Arrival in 10 minutes</div>
              <h1>
                A home cook at your <span className="accent-serif">doorstep</span> in 10 minutes.
              </h1>
              <p className="lead">
                Tell us your location, headcount and occasion — we handle the matching, pricing and the cook. No menus to plan, no one to manage.
              </p>

              {/* BOOKING BAR */}
              <div className="booking-bar">
                <div className="bb-field" onClick={() => openBookingModal()}>
                  <span className="bb-lb">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s7-6.6 7-11.2A7 7 0 105 9.8C5 14.4 12 21 12 21z" />
                      <circle cx="12" cy="9.6" r="2.3" />
                    </svg>
                    Location
                  </span>
                  <span className="bb-val truncate max-w-[140px] sm:max-w-none">{bState.address.split(',')[1] || 'Sector 62, Noida'}</span>
                </div>
                <div className="bb-sep" />
                <div className="bb-field" onClick={() => openBookingModal()}>
                  <span className="bb-lb">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="3.2" />
                      <path d="M5 20c0-4.2 3.1-6.4 7-6.4s7 2.2 7 6.4" />
                    </svg>
                    No. of people
                  </span>
                  <span className="bb-val">{bState.people}</span>
                </div>
                <div className="bb-sep" />
                <div className="bb-field" onClick={() => openBookingModal()}>
                  <span className="bb-lb">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    Occasion
                  </span>
                  <span className="bb-val capitalize">{bState.cookingType} Cooking</span>
                </div>
                <div className="bb-cta">
                  <button className="btn btn-blue" onClick={() => openBookingModal()}>
                    Book a Cook <span className="arrow">→</span>
                  </button>
                </div>
              </div>

              <a
                href="#partners"
                className="hero-partner-link"
                onClick={(e) => {
                  e.preventDefault();
                  openPartnerModal();
                }}
              >
                Become a Partner <span className="arrow">→</span>
              </a>

              {/* HERO STATS */}
              <div className="hero-stats-row">
                <div className="hero-stat">
                  <div className="ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 17.3l-6.2 3.3 1.2-6.9L2 8.9l7-1L12 1.5 15 7.9l7 1-5 4.8 1.2 6.9z" />
                    </svg>
                  </div>
                  <div className="tx">
                    <strong>4.9 rating</strong>
                    <span>20,000+ meals cooked</span>
                  </div>
                </div>
                <div className="hero-stat">
                  <div className="ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                    </svg>
                  </div>
                  <div className="tx">
                    <strong>Police-verified cooks</strong>
                    <span>Aadhaar &amp; background checked</span>
                  </div>
                </div>
                <div className="hero-stat">
                  <div className="ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <div className="tx">
                    <strong>Under 10 minutes</strong>
                    <span>Cook arrives in your slot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE STRIP */}
        <div className="live-strip-wrap">
          <div className="wrap">
            <div className="live-strip reveal">
              <div className="live-head">
                <div className="lv">
                  <span className="dotlive" />
                  Tizl right now
                </div>
                <div className="cnt">12 cooks currently cooking across Delhi NCR</div>
              </div>
              <div className="live-cities">
                <div className="live-city">
                  <div className="cityname">
                    <span className="dot" />
                    Noida
                  </div>
                  <img src="/assets/city-noida.jpeg" alt="Noida cooks" />
                  <span className="avail">4 available</span>
                </div>
                <div className="live-city">
                  <div className="cityname">
                    <span className="dot" />
                    Gurgaon
                  </div>
                  <img src="/assets/city-gurgaon.jpeg" alt="Gurgaon cooks" />
                  <span className="avail">6 available</span>
                </div>
                <div className="live-city">
                  <div className="cityname">
                    <span className="dot" />
                    Delhi
                  </div>
                  <img src="/assets/city-delhi.jpeg" alt="Delhi cooks" />
                  <span className="avail">2 available</span>
                </div>
              </div>
              <div className="live-map" id="liveStripMap" ref={liveStripMapRef}>
                <div className="note">
                  Cooks near you
                  <br />
                  in real time
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WHY US */}
        <section id="why-us">
          <div className="wrap">
            <div className="why-grid reveal">
              <div className="why-copy">
                <div className="eyebrow-label">Why Tizl</div>
                <h2>Great homes deserve great support.</h2>
                <p>
                  Every household runs on one impossible problem: someone has to cook, every single day. Tizl handles the matching, pricing and logistics — you just tell us what you need.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Learn more about Tizl <span className="arrow">→</span>
                </button>
                <div className="why-stats">
                  <div className="why-stat">
                    <div className="ic">🍲</div>
                    <div className="num">20,000+</div>
                    <div className="lb">Meals cooked</div>
                  </div>
                  <div className="why-stat">
                    <div className="ic">👥</div>
                    <div className="num">500+</div>
                    <div className="lb">Verified home cooks</div>
                  </div>
                  <div className="why-stat">
                    <div className="ic">★</div>
                    <div className="num">4.9/5</div>
                    <div className="lb">Average customer rating</div>
                  </div>
                </div>
              </div>
              <div className="why-photo">
                <img
                  src="/assets/why-family.jpeg"
                  alt="Family enjoying a home-cooked meal together"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* SERVICES */}
        <section id="services">
          <div className="wrap">
            <div className="services-head-row">
              <div className="section-head" style={{ maxWidth: '560px', marginBottom: 0 }}>
                <div className="eyebrow-label">What we cover</div>
                <h2>
                  One cook.
                  <br />
                  Every meal that matters.
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <a
                  href="#services"
                  className="view-all-link"
                  onClick={(e) => {
                    e.preventDefault();
                    openBookingModal();
                  }}
                >
                  View all services <span className="arrow">→</span>
                </a>
                <div className="services-nav-arrows">
                  <button aria-label="Previous" onClick={() => openBookingModal('breakfast')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                  <button aria-label="Next" onClick={() => openBookingModal('dinner')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="services-grid reveal-stagger reveal" id="servicesGrid">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  className="service-tile"
                  onClick={() => openBookingModal(s.id)}
                  type="button"
                >
                  <div className="tile-photo">
                    <div className="tile-photo-inner">
                      <img src={s.img} alt={s.lb} loading="lazy" />
                    </div>
                    <div className="tile-ic">{s.ic}</div>
                  </div>
                  <div className="tile-body">
                    <div className="lb">{s.lb}</div>
                    <div className="sub">{s.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* HOW IT WORKS */}
        <section id="how-it-works">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow-label">How it works</div>
              <h2>Book in a minute. Cooking starts on time.</h2>
              <p>Tell us what you need — we match you with a verified cook, calculate a fair price, and confirm a slot.</p>
            </div>
            <div className="journey reveal">
              <div className="journey-line">
                <div className="journey-line-fill" id="journeyFill" />
              </div>
              <div className="journey-grid">
                <div className="journey-step">
                  <div className="journey-num-row">
                    <div className="journey-ic" style={{ background: '#fff', overflow: 'hidden' }}>
                      <img src="/assets/journey-1.jpeg" alt="Step 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="journey-num">01</div>
                  </div>
                  <h3>Tell us what you need</h3>
                  <p>Location, meal, occasion, headcount and dishes. Takes under a minute.</p>
                </div>
                <div className="journey-step">
                  <div className="journey-num-row">
                    <div className="journey-ic" style={{ background: '#fff', overflow: 'hidden' }}>
                      <img src="/assets/journey-2.jpeg" alt="Step 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="journey-num">02</div>
                  </div>
                  <h3>We match &amp; price it</h3>
                  <p>Tizl calculates a fair price from availability, complexity and party size, then shows you the nearest open slot.</p>
                </div>
                <div className="journey-step">
                  <div className="journey-num-row">
                    <div className="journey-ic" style={{ background: '#fff', overflow: 'hidden' }}>
                      <img src="/assets/journey-3.jpeg" alt="Step 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="journey-num">03</div>
                  </div>
                  <h3>Your cook arrives</h3>
                  <p>A verified cook shows up in your slot, cooks in your kitchen, and cleans up.</p>
                </div>
                <div className="journey-step">
                  <div className="journey-num-row">
                    <div className="journey-ic" style={{ background: '#fff', overflow: 'hidden' }}>
                      <img src="/assets/journey-4.jpeg" alt="Step 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="journey-num">04</div>
                  </div>
                  <h3>Enjoy your meal</h3>
                  <p>Pay securely after the meal is served.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* FOR COOKS / PARTNERS */}
        <section id="partners">
          <div className="wrap">
            <div className="partner-teaser reveal">
              <div className="partner-photo">
                <img
                  src="/assets/partner-cook.jpeg"
                  alt="Tizl partner cook at work"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="partner-copy">
                <div className="eyebrow-label">For cooks</div>
                <h2>Turn your cooking into a steady income.</h2>
                <p>Join as a Tizl partner cook. Set your areas and availability, accept jobs you want, and get paid the same day.</p>
                <button
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => openPartnerModal()}
                >
                  Become a Partner <span className="arrow">→</span>
                </button>
              </div>
              <div className="partner-perks">
                <div className="perk">
                  <span className="ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v10M9 9.5c0-1.4 1.3-2 3-2s3 .8 3 2c0 1.4-1.3 2-3 2s-3 .8-3 2 1.3 2 3 2 3-.6 3-2" />
                    </svg>
                  </span>
                  <div className="tx">
                    <strong>Same-day payouts</strong>
                    <span>Earnings released right after each job.</span>
                  </div>
                </div>
                <div className="perk">
                  <span className="ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s7-6.6 7-11.2A7 7 0 105 9.8C5 14.4 12 21 12 21z" />
                      <circle cx="12" cy="9.6" r="2.3" />
                    </svg>
                  </span>
                  <div className="tx">
                    <strong>Choose your areas</strong>
                    <span>Work only where and when it suits you.</span>
                  </div>
                </div>
                <div className="perk">
                  <span className="ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
                    </svg>
                  </span>
                  <div className="tx">
                    <strong>Verified &amp; protected</strong>
                    <span>Background-checked customers, in-app support.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section>
          <div className="wrap">
            <div className="services-head-row">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <div className="eyebrow-label">Customers love Tizl</div>
                <h2>Trusted by families across Delhi NCR.</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <a href="#services" className="view-all-link" onClick={() => openBookingModal()}>
                  View all reviews <span className="arrow">→</span>
                </a>
                <div className="services-nav-arrows">
                  <button aria-label="Previous">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                  <button aria-label="Next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="testi-scroll reveal" id="testiScroll">
              {TESTIMONIALS.map((t, idx) => (
                <div className="testi-card" key={idx}>
                  <p>&ldquo;{t.t}&rdquo;</p>
                  <div className="testi-who">
                    <div className="testi-who-l">
                      <img className="testi-avatar" src={t.av} alt={t.n} />
                      <div>
                        <div className="name">{t.n}</div>
                        <div className="loc">{t.loc}</div>
                      </div>
                    </div>
                    <div className="stars">★★★★★</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* FAQS & APP CARD */}
        <section id="faqs">
          <div className="wrap">
            <div className="faqapp-grid">
              <div className="reveal">
                <div className="section-head" style={{ marginBottom: '24px' }}>
                  <div className="eyebrow-label">FAQs</div>
                  <h2>Good to know.</h2>
                </div>
                <div className="faq-list" id="faqList">
                  {FAQS.map((f, i) => (
                    <div className={`faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
                      <button className="faq-q" onClick={() => toggleFaq(i)}>
                        <span className="faq-ic">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 16v-4M12 8h.01" />
                          </svg>
                        </span>
                        <span className="txt">{f.q}</span>
                        <span className="plus">{openFaq === i ? '−' : '+'}</span>
                      </button>
                      <div
                        className="faq-a"
                        style={{
                          maxHeight: openFaq === i ? '200px' : 0,
                          overflow: 'hidden',
                          transition: 'max-height .3s ease',
                        }}
                      >
                        <p>{f.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="app-card reveal">
                <h2>Book faster from the Tizl app.</h2>
                <p>Track your cook live, manage bookings and pay in one tap.</p>
                <div className="store-badges">
                  <div className="store-badge">
                    <span>▶</span>
                    <div className="txt">
                      <small>GET IT ON</small>
                      <strong>Google Play</strong>
                    </div>
                  </div>
                  <div className="store-badge">
                    <span></span>
                    <div className="txt">
                      <small>Download on the</small>
                      <strong>App Store</strong>
                    </div>
                  </div>
                </div>
                <img
                  className="phone-mock"
                  src="/assets/phone-mock.jpeg"
                  alt="Tizl app"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
          </div>
        </section>

        <SiteFooter
          onOpenBooking={() => openBookingModal()}
          onOpenPartner={() => openPartnerModal()}
          onOpenAuth={(role) => openAuthGate(role)}
        />
      </main>

      {/* ========================================================
          WHO ARE YOU MODAL (AUTH GATE)
      ======================================================== */}
      {authGateOpen && (
        <div className="modal-overlay auth-overlay open" onClick={() => setAuthGateOpen(false)}>
          <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-photo">
              <div className="tag">Good food starts at home.</div>
            </div>
            <div className="modal-head">
              <div>
                <h3>Who are you?</h3>
                <div className="sub">This keeps your customer and partner experiences separate.</div>
              </div>
              <button className="modal-close" onClick={() => setAuthGateOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <button
                className="role-card"
                onClick={() => {
                  setAuthGateOpen(false);
                  setCustAuthOpen(true);
                }}
              >
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3.2" />
                    <path d="M5 20c0-4.2 3.1-6.4 7-6.4s7 2.2 7 6.4" />
                  </svg>
                </div>
                <h4>Customer</h4>
                <p>Book a cook and manage your bookings.</p>
              </button>
              <button
                className="role-card"
                onClick={() => {
                  setAuthGateOpen(false);
                  setPartAuthOpen(true);
                }}
              >
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 12.5a5 5 0 0110 0" />
                    <path d="M5.5 12.5h13v3a2 2 0 01-2 2h-9a2 2 0 01-2-2v-3z" />
                    <path d="M9.5 17.5v2.5h5v-2.5" />
                  </svg>
                </div>
                <h4>Partner</h4>
                <p>Accept cooking jobs and manage your earnings.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CUSTOMER AUTH MODAL
      ======================================================== */}
      {custAuthOpen && (
        <div className="modal-overlay auth-overlay open" onClick={() => setCustAuthOpen(false)}>
          <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-photo">
              <div className="tag">
                Almost there.
                <br />
                Your cook is waiting.
              </div>
            </div>
            <div className="modal-head">
              <div>
                <h3>Continue to Tizl</h3>
                <div className="sub">Sign in with phone OTP or email to manage bookings.</div>
              </div>
              <button className="modal-close" onClick={() => setCustAuthOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="tab-row">
                <button
                  className={'tab-btn ' + (authTab === 'login' ? 'on' : '')}
                  onClick={() => { setAuthTab('login'); setCustAuthError(null); }}
                >
                  Login
                </button>
                <button
                  className={'tab-btn ' + (authTab === 'signup' ? 'on' : '')}
                  onClick={() => { setAuthTab('signup'); setCustAuthError(null); }}
                >
                  Create Account
                </button>
              </div>

              {custAuthError && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {custAuthError}
                </div>
              )}

              {!custOtpStep ? (
                <div>
                  <div className="field-group">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      disabled={custAuthLoading}
                    />
                  </div>
                  <button
                    className="btn btn-primary btn-full mt-3"
                    disabled={custAuthLoading}
                    onClick={async () => {
                      if (!/^[6-9]\d{9}$/.test(custPhone)) {
                        setCustAuthError('Please enter a valid 10-digit Indian mobile number');
                        return;
                      }
                      setCustAuthLoading(true);
                      setCustAuthError(null);
                      try {
                        const res = await fetch('/api/auth/otp/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone: custPhone }),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.success) {
                          setCustAuthError(data?.error?.message || data?.error || 'Failed to send OTP.');
                          return;
                        }
                        setCustOtpStep(true);
                      } catch (err: any) {
                        setCustAuthError(err?.message || 'Network error sending OTP');
                      } finally {
                        setCustAuthLoading(false);
                      }
                    }}
                  >
                    {custAuthLoading ? 'Sending OTP...' : 'Send OTP'} <span className="arrow">→</span>
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)', marginTop: '14px' }}>
                    Or sign in with password:{' '}
                    <Link href="/customer/login" className="text-[var(--blue)] font-bold">
                      Email &amp; Password Login →
                    </Link>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="field-group">
                    <label>Enter 6-digit OTP sent to +91 {custPhone}</label>
                    <div className="otp-row">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          className="otp-box text-center"
                          value={custOtpDigits[idx] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = [...custOtpDigits];
                            next[idx] = val;
                            setCustOtpDigits(next);
                            if (val && e.target.nextElementSibling) {
                              (e.target.nextElementSibling as HTMLInputElement).focus();
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {authTab === 'signup' && (
                    <div className="mt-3">
                      <div className="field-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          placeholder="e.g. Aisha Khan"
                        />
                      </div>
                      <div className="field-group">
                        <label>Delivery Address</label>
                        <input
                          type="text"
                          value={custAddress}
                          onChange={(e) => setCustAddress(e.target.value)}
                          placeholder="Flat, street, area, city"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => { setCustOtpStep(false); setCustOtpDigits(['', '', '', '', '', '']); setCustAuthError(null); }}
                    >
                      Change Number
                    </button>
                    <button
                      className="btn btn-primary flex-1"
                      disabled={custAuthLoading}
                      onClick={async () => {
                        const token = custOtpDigits.join('').trim();
                        if (token.length < 4) {
                          setCustAuthError('Please enter the complete OTP code');
                          return;
                        }
                        setCustAuthLoading(true);
                        setCustAuthError(null);
                        try {
                          const res = await fetch('/api/auth/otp/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              phone: custPhone,
                              token,
                              role: 'customer',
                              full_name: custName || undefined,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok || !data.success) {
                            setCustAuthError(data?.error?.message || data?.error || 'Invalid or expired OTP code');
                            return;
                          }
                          await refreshUser();
                          setCustAuthOpen(false);
                          router.push('/customer/dashboard');
                        } catch (err: any) {
                          setCustAuthError(err?.message || 'Authentication error');
                        } finally {
                          setCustAuthLoading(false);
                        }
                      }}
                    >
                      {custAuthLoading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PARTNER AUTH MODAL
      ======================================================== */}
      {partAuthOpen && (
        <div className="modal-overlay auth-overlay open" onClick={() => setPartAuthOpen(false)}>
          <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-photo">
              <div className="tag">
                Your kitchen skills.
                <br />
                Your schedule.
                <br />
                Your income.
              </div>
            </div>
            <div className="modal-head">
              <div>
                <h3>Partner Login</h3>
                <div className="sub">Registered Tizl partner cook sign-in</div>
              </div>
              <button className="modal-close" onClick={() => setPartAuthOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {partAuthError && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {partAuthError}
                </div>
              )}

              {!partOtpStep ? (
                <div>
                  <div className="field-group">
                    <label>Registered Mobile Number</label>
                    <input
                      type="tel"
                      value={partPhone}
                      onChange={(e) => setPartPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      disabled={partAuthLoading}
                    />
                  </div>
                  <button
                    className="btn btn-primary btn-full mt-3"
                    disabled={partAuthLoading}
                    onClick={async () => {
                      if (!/^[6-9]\d{9}$/.test(partPhone)) {
                        setPartAuthError('Please enter a valid 10-digit Indian mobile number');
                        return;
                      }
                      setPartAuthLoading(true);
                      setPartAuthError(null);
                      try {
                        const res = await fetch('/api/auth/otp/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone: partPhone }),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.success) {
                          setPartAuthError(data?.error?.message || data?.error || 'Failed to dispatch OTP.');
                          return;
                        }
                        setPartOtpStep(true);
                      } catch (err: any) {
                        setPartAuthError(err?.message || 'Network error sending OTP');
                      } finally {
                        setPartAuthLoading(false);
                      }
                    }}
                  >
                    {partAuthLoading ? 'Sending OTP...' : 'Send OTP'} <span className="arrow">→</span>
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)', marginTop: '16px' }}>
                    New cook?{' '}
                    <button
                      type="button"
                      style={{ color: 'var(--blue)', fontWeight: 600 }}
                      onClick={() => {
                        setPartAuthOpen(false);
                        openPartnerModal();
                      }}
                    >
                      Register as a partner →
                    </button>
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)', marginTop: '8px' }}>
                    Or sign in with email: <Link href="/partner/login" className="text-[var(--blue)] font-bold">Partner Email Login →</Link>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="field-group">
                    <label>Enter 6-digit OTP sent to +91 {partPhone}</label>
                    <div className="otp-row">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          className="otp-box text-center"
                          value={partOtpDigits[idx] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = [...partOtpDigits];
                            next[idx] = val;
                            setPartOtpDigits(next);
                            if (val && e.target.nextElementSibling) {
                              (e.target.nextElementSibling as HTMLInputElement).focus();
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => { setPartOtpStep(false); setPartOtpDigits(['', '', '', '', '', '']); setPartAuthError(null); }}
                    >
                      Back
                    </button>
                    <button
                      className="btn btn-primary flex-1"
                      disabled={partAuthLoading}
                      onClick={async () => {
                        const token = partOtpDigits.join('').trim();
                        if (token.length < 4) {
                          setPartAuthError('Please enter the complete OTP code');
                          return;
                        }
                        setPartAuthLoading(true);
                        setPartAuthError(null);
                        try {
                          const res = await fetch('/api/auth/otp/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              phone: partPhone,
                              token,
                              role: 'cook',
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok || !data.success) {
                            setPartAuthError(data?.error?.message || data?.error || 'Invalid or expired OTP code');
                            return;
                          }
                          await refreshUser();
                          setPartAuthOpen(false);
                          router.push('/partner/dashboard');
                        } catch (err: any) {
                          setPartAuthError(err?.message || 'Authentication error');
                        } finally {
                          setPartAuthLoading(false);
                        }
                      }}
                    >
                      {partAuthLoading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FULL 9-STEP BOOKING MODAL
      ======================================================== */}
      {bookingOpen && (
        <div className="modal-overlay open" onClick={() => setBookingOpen(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 id="bookingTitle">{STEP_LABELS[STEPS[bStep]]}</h3>
                <div className="sub" id="bookingSub">
                  {STEPS[bStep] === 'confirmation' ? 'All done' : `Step ${bStep + 1} of ${STEPS.length - 1}`}
                </div>
              </div>
              <button className="modal-close" onClick={() => setBookingOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  id="bProgress"
                  style={{ width: `${(bStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {/* DYNAMIC PRICE STRIP */}
              {bStep >= 3 && STEPS[bStep] !== 'confirmation' && (
                <div className="price-strip">
                  <div>
                    <div className="lb">Estimated price</div>
                    <div className="note">Updates as you add details</div>
                  </div>
                  <div className="amt">₹{bPrice.toLocaleString('en-IN')}</div>
                </div>
              )}

              {/* STEP 0: LOCATION */}
              {STEPS[bStep] === 'location' && (
                <div>
                  <div className="option-grid cols-1">
                    <button
                      className={`option-card ${bState.location === 'auto' ? 'selected' : ''}`}
                      onClick={detectLocation}
                      type="button"
                    >
                      <div className="ic">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M12 21s7-6.6 7-11.2A7 7 0 105 9.8C5 14.4 12 21 12 21z" />
                          <circle cx="12" cy="9.6" r="2.3" />
                        </svg>
                      </div>
                      <div className="lb">{detectingLocation ? 'Detecting your location…' : 'Auto-detect my location'}</div>
                      <div className="sub">Uses your device GPS / IP location</div>
                    </button>
                  </div>
                  <div className="field-group" style={{ marginTop: '14px', position: 'relative' }}>
                    <label>Or enter address</label>
                    <input
                      type="text"
                      placeholder="Flat, street, area, city"
                      value={bState.address}
                      onChange={(e) => setBState((prev) => ({ ...prev, location: 'manual', address: e.target.value }))}
                    />
                  </div>
                  <div
                    id="bookingMapWrap"
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      marginTop: '14px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      height: '180px',
                      border: '1px solid var(--line)',
                      background: 'radial-gradient(circle at 60% 40%, #E8EFE8, #D8E5D8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                        📍 {bState.address.split(',')[0] || 'Noida Sector 62'}
                      </div>
                      Cook available nearby · Estimated arrival: 10 mins
                    </div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '8px' }}>
                    Map data © <span style={{ color: 'var(--text-faint)' }}>OpenStreetMap</span> contributors
                  </div>
                </div>
              )}

              {/* STEP 1: MEAL PREFERENCE */}
              {STEPS[bStep] === 'meal' && (
                <div>
                  <p style={{ color: 'var(--text-faint)', fontSize: '13px', marginBottom: '16px' }}>
                    Helps us match the right cook.
                  </p>
                  <div className="option-grid cols-3">
                    {[
                      {
                        id: 'breakfast',
                        label: 'Breakfast',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-5 h-5">
                            <circle cx="12" cy="14" r="5" />
                            <path d="M12 3v3M6.5 6.5l1.8 1.8M17.5 6.5l-1.8 1.8" />
                          </svg>
                        ),
                      },
                      {
                        id: 'lunch',
                        label: 'Lunch',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-5 h-5">
                            <path d="M4 11h16a8 8 0 01-16 0z" />
                            <path d="M12 11V5" />
                          </svg>
                        ),
                      },
                      {
                        id: 'dinner',
                        label: 'Dinner',
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-5 h-5">
                            <circle cx="12" cy="12" r="7" />
                            <circle cx="12" cy="12" r="2.4" />
                          </svg>
                        ),
                      },
                    ].map((m) => (
                      <button
                        key={m.id}
                        className={`option-card ${bState.mealType === m.id ? 'selected' : ''}`}
                        onClick={() => setBState((prev) => ({ ...prev, mealType: m.id }))}
                        type="button"
                      >
                        <div className="ic">{m.icon}</div>
                        <div className="lb">{m.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: COOKING OCCASION */}
              {STEPS[bStep] === 'cooking' && (
                <div className="option-grid">
                  {[
                    ['daily', 'Daily Cooking'],
                    ['special', 'Special Occasion'],
                    ['party', 'Party / Guests'],
                    ['festival', 'Festival Cooking'],
                    ['weekend', 'Weekend Cooking'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      className={`option-card ${bState.cookingType === val ? 'selected' : ''}`}
                      onClick={() => setBState((prev) => ({ ...prev, cookingType: val }))}
                      type="button"
                    >
                      <div className="lb">{label}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 3: PEOPLE */}
              {STEPS[bStep] === 'people' && (
                <div className="option-grid cols-3">
                  {['1-2', '3-4', '5-6', '7-10', '10+'].map((cnt) => (
                    <button
                      key={cnt}
                      className={`option-card ${bState.people === cnt ? 'selected' : ''}`}
                      onClick={() => setBState((prev) => ({ ...prev, people: cnt }))}
                      type="button"
                    >
                      <div className="lb">{cnt} people</div>
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 4: DISHES */}
              {STEPS[bStep] === 'dishes' && (
                <div className="option-grid cols-3">
                  {['1', '2', '3', '4+'].map((cnt) => (
                    <button
                      key={cnt}
                      className={`option-card ${bState.dishes === cnt ? 'selected' : ''}`}
                      onClick={() => setBState((prev) => ({ ...prev, dishes: cnt }))}
                      type="button"
                    >
                      <div className="lb">
                        {cnt} {cnt === '1' ? 'dish' : 'dishes'}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 5: ACCOMPANIMENTS */}
              {STEPS[bStep] === 'accompaniments' && (
                <div>
                  <div className="chip-select">
                    {['Rotis', 'Rice', 'Salad', 'Dessert', 'Snacks', 'Breakfast Items'].map((item) => {
                      const selected = bState.accompaniments.includes(item);
                      return (
                        <button
                          key={item}
                          className={`chip-opt ${selected ? 'selected' : ''}`}
                          onClick={() => {
                            setBState((prev) => ({
                              ...prev,
                              accompaniments: selected
                                ? prev.accompaniments.filter((x) => x !== item)
                                : [...prev.accompaniments, item],
                            }));
                          }}
                          type="button"
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="field-group" style={{ marginTop: '20px' }}>
                    <label>Anything specific you would like the cook to prepare? (optional)</label>
                    <textarea
                      placeholder="e.g. less spicy, jain food, no onion-garlic"
                      value={bState.note}
                      onChange={(e) => setBState((prev) => ({ ...prev, note: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* STEP 6: SIGN IN */}
              {STEPS[bStep] === 'login' && (
                <div>
                  {isAuthenticated ? (
                    <div className="success-box">
                      <div className="success-icon">✓</div>
                      <h3>You are signed in as {user?.fullName || user?.email}</h3>
                      <p>Click Continue to choose your date &amp; time slot.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="field-group">
                        <label>Phone number</label>
                        <input
                          type="tel"
                          value={custPhone}
                          onChange={(e) => setCustPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                        />
                      </div>
                      <div className="field-group">
                        <label>Your full name</label>
                        <input
                          type="text"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          placeholder="e.g. Rahul Verma"
                        />
                      </div>
                      <div className="hint">We verify phone numbers to protect your home safety.</div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 7: SLOTS */}
              {STEPS[bStep] === 'slots' && (
                <div>
                  <div className="tab-row">
                    {['Today', 'Tomorrow', 'This Weekend'].map((d) => (
                      <button
                        key={d}
                        className={`tab-btn ${bState.date === d ? 'on' : ''}`}
                        onClick={() => setBState((prev) => ({ ...prev, date: d }))}
                        type="button"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="option-grid cols-3">
                    {[
                      '12:30 PM - 1:30 PM',
                      '1:30 PM - 2:30 PM',
                      '7:00 PM - 8:00 PM',
                      '7:30 PM - 8:30 PM',
                      '8:00 PM - 9:00 PM',
                      '8:30 PM - 9:30 PM',
                    ].map((slot) => (
                      <button
                        key={slot}
                        className={`option-card ${bState.slot === slot ? 'selected' : ''}`}
                        onClick={() => setBState((prev) => ({ ...prev, slot }))}
                        type="button"
                      >
                        <div className="lb">{slot}</div>
                        <div className="sub">Cook ready</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 8: REVIEW */}
              {STEPS[bStep] === 'review' && (
                <div>
                  <div className="review-card">
                    <div className="review-row">
                      <span className="k">Meal</span>
                      <span className="v capitalize">{bState.mealType} ({bState.cookingType})</span>
                    </div>
                    <div className="review-row">
                      <span className="k">Headcount</span>
                      <span className="v">{bState.people} people</span>
                    </div>
                    <div className="review-row">
                      <span className="k">Dishes</span>
                      <span className="v">{bState.dishes} dishes + {bState.accompaniments.join(', ')}</span>
                    </div>
                    <div className="review-row">
                      <span className="k">Slot</span>
                      <span className="v">{bState.date}, {bState.slot}</span>
                    </div>
                    <div className="review-row">
                      <span className="k">Location</span>
                      <span className="v">{bState.address}</span>
                    </div>
                  </div>

                  <div className="price-line">
                    <span className="lb">Base Cooking Fee</span>
                    <span>₹{bPrice - 80}</span>
                  </div>
                  <div className="price-line">
                    <span className="lb">Safety &amp; Verification Fee</span>
                    <span>₹80</span>
                  </div>
                  <div className="price-line total">
                    <span className="lb">Total Amount</span>
                    <span className="text-[var(--blue-deep)]">₹{bPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* STEP 9: PAYMENT */}
              {STEPS[bStep] === 'payment' && (
                <div>
                  {bookingError && (
                    <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                      <strong>Booking submission error:</strong> {bookingError}
                    </div>
                  )}
                  {[
                    { id: 'pay_after', label: 'Pay After Cooking', sub: 'Pay via UPI / Card once the cook finishes', ic: '🍽️' },
                    { id: 'upi', label: 'UPI (GPay / PhonePe / Paytm)', sub: 'Instant payment verification', ic: '⚡' },
                    { id: 'card', label: 'Credit or Debit Card', sub: 'Visa, Mastercard, RuPay', ic: '💳' },
                  ].map((pm) => (
                    <div
                      key={pm.id}
                      className={`pay-method ${bState.payment === pm.id ? 'selected' : ''}`}
                      onClick={() => setBState((prev) => ({ ...prev, payment: pm.id }))}
                    >
                      <div className="ic">{pm.ic}</div>
                      <div>
                        <strong>{pm.label}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{pm.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 10: CONFIRMATION */}
              {STEPS[bStep] === 'confirmation' && bookingSubmitted && (
                <div className="success-box">
                  <div className="success-icon">✓</div>
                  <h3>Booking Confirmed!</h3>
                  <p>
                    A verified cook is assigned to your slot at{' '}
                    <strong>{bookingSubmitted.address.split(',')[0]}</strong>.
                  </p>
                  <div className="booking-id">Booking ID: {bookingSubmitted.id}</div>
                  <p style={{ marginTop: '16px', fontSize: '13px' }}>
                    You can track your cook live and manage this slot anytime in your customer dashboard.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {bStep > 0 && STEPS[bStep] !== 'confirmation' && (
                <button
                  className="btn btn-ghost"
                  id="bBackBtn"
                  onClick={() => setBStep((prev) => Math.max(0, prev - 1))}
                  disabled={isSubmittingBooking}
                >
                  Back
                </button>
              )}
              {STEPS[bStep] !== 'confirmation' ? (
                <button
                  className="btn btn-primary"
                  id="bNextBtn"
                  onClick={() => {
                    if (STEPS[bStep] === 'payment') {
                      handleFinalBooking();
                    } else {
                      setBStep((prev) => Math.min(STEPS.length - 1, prev + 1));
                    }
                  }}
                  disabled={isSubmittingBooking}
                >
                  {isSubmittingBooking
                    ? 'Confirming...'
                    : STEPS[bStep] === 'payment'
                    ? 'Confirm Booking'
                    : 'Continue'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setBookingOpen(false);
                    router.push('/customer/dashboard');
                  }}
                >
                  Go to My Bookings <span className="arrow">→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FULL 7-STEP PARTNER REGISTRATION MODAL
      ======================================================== */}
      {partnerOpen && (
        <div className="modal-overlay open" onClick={() => setPartnerOpen(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 id="partnerTitle">{PSTEP_LABELS[PSTEPS[pStep]]}</h3>
                <div className="sub" id="partnerSub">
                  {PSTEPS[pStep] === 'dashboard'
                    ? 'All set'
                    : PSTEPS[pStep] === 'review-status'
                    ? 'Almost done'
                    : `Step ${pStep + 1} of ${PSTEPS.length - 1} · About 4 minutes to complete`}
                </div>
              </div>
              <button className="modal-close" onClick={() => setPartnerOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  id="pProgress"
                  style={{ width: `${(pStep / (PSTEPS.length - 1)) * 100}%` }}
                />
              </div>

              {/* STEP 0: BASICS */}
              {PSTEPS[pStep] === 'basics' && (
                <div>
                  <div className="field-group">
                    <label>Full name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunita Devi"
                      value={pState.name}
                      onChange={(e) => setPState((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="field-group">
                    <label>Phone number</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={pState.phone}
                      onChange={(e) => setPState((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="field-group">
                    <label>Date of birth</label>
                    <input
                      type="date"
                      value={pState.dob}
                      onChange={(e) => setPState((prev) => ({ ...prev, dob: e.target.value }))}
                    />
                  </div>
                  <div className="field-group">
                    <label>Gender</label>
                    <div className="chip-select">
                      {['Female', 'Male', 'Other'].map((g) => (
                        <button
                          key={g}
                          className={`chip-opt ${pState.gender === g ? 'selected' : ''}`}
                          onClick={() => setPState((prev) => ({ ...prev, gender: g }))}
                          type="button"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Languages spoken</label>
                    <input
                      type="text"
                      value={pState.languages}
                      onChange={(e) => setPState((prev) => ({ ...prev, languages: e.target.value }))}
                    />
                  </div>
                  <div className="field-group">
                    <label>Years of cooking experience</label>
                    <input
                      type="number"
                      value={pState.exp}
                      onChange={(e) => setPState((prev) => ({ ...prev, exp: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* STEP 1: CUISINES */}
              {PSTEPS[pStep] === 'cuisine' && (
                <div className="chip-select">
                  {[
                    'North Indian',
                    'South Indian',
                    'Chinese',
                    'Continental',
                    'Punjabi',
                    'Gujarati',
                    'Jain',
                    'Healthy Meals',
                    'Baby Food',
                  ].map((c) => {
                    const sel = pState.cuisines.includes(c);
                    return (
                      <button
                        key={c}
                        className={`chip-opt ${sel ? 'selected' : ''}`}
                        onClick={() => {
                          setPState((prev) => ({
                            ...prev,
                            cuisines: sel ? prev.cuisines.filter((x) => x !== c) : [...prev.cuisines, c],
                          }));
                        }}
                        type="button"
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP 2: AVAILABILITY & AREAS */}
              {PSTEPS[pStep] === 'availability' && (
                <div>
                  <div className="field-group">
                    <label>Preferred areas</label>
                    <input
                      type="text"
                      value={pState.areas}
                      onChange={(e) => setPState((prev) => ({ ...prev, areas: e.target.value }))}
                      placeholder="e.g. Sector 50-62 Noida"
                    />
                  </div>
                  <div className="field-group">
                    <label>Availability timing</label>
                    <div className="chip-select">
                      {['Morning', 'Afternoon', 'Evening', 'Night'].map((a) => {
                        const sel = pState.availability.includes(a);
                        return (
                          <button
                            key={a}
                            className={`chip-opt ${sel ? 'selected' : ''}`}
                            onClick={() => {
                              setPState((prev) => ({
                                ...prev,
                                availability: sel
                                  ? prev.availability.filter((x) => x !== a)
                                  : [...prev.availability, a],
                              }));
                            }}
                            type="button"
                          >
                            {a}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: BANK DETAILS */}
              {PSTEPS[pStep] === 'bank' && (
                <div>
                  <div className="field-group">
                    <label>Bank account number</label>
                    <input
                      type="text"
                      placeholder="Account number"
                      value={pState.bank}
                      onChange={(e) => setPState((prev) => ({ ...prev, bank: e.target.value }))}
                    />
                  </div>
                  <div className="field-group">
                    <label>UPI ID</label>
                    <input
                      type="text"
                      placeholder="name@upi"
                      value={pState.upi}
                      onChange={(e) => setPState((prev) => ({ ...prev, upi: e.target.value }))}
                    />
                  </div>
                  <div className="field-group">
                    <label>Emergency contact</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={pState.emergency}
                      onChange={(e) => setPState((prev) => ({ ...prev, emergency: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: VERIFICATION */}
              {PSTEPS[pStep] === 'verify' && (
                <div>
                  <div className="field-group">
                    <label>Aadhaar Card Upload</label>
                    <input type="file" />
                  </div>
                  <div className="field-group">
                    <label>PAN Card Upload</label>
                    <input type="file" />
                  </div>
                  <div className="field-group">
                    <label>Police verification certificate</label>
                    <input type="file" />
                  </div>
                  <div className="field-group">
                    <label>Live selfie verification</label>
                    <button
                      className="btn btn-ghost btn-full"
                      type="button"
                      onClick={(e) => (e.currentTarget.textContent = 'Selfie captured ✓')}
                    >
                      Capture selfie
                    </button>
                  </div>
                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px' }}>
                    <input type="checkbox" defaultChecked style={{ marginTop: '3px' }} />
                    I consent to a background check as part of Tizl partner verification.
                  </label>
                </div>
              )}

              {/* STEP 5: REVIEW STATUS */}
              {PSTEPS[pStep] === 'review-status' && (
                <div className="success-box">
                  <div className="success-icon" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
                    ⏳
                  </div>
                  <h3>Verification Under Review</h3>
                  <p>Your partner registration details have been securely recorded. Verified cook approval requires administrative document review and background validation.</p>
                  <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-dim)' }}>
                    Once our compliance team approves your credentials, your status will change to verified and you can accept incoming bookings.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {pStep > 0 && PSTEPS[pStep] !== 'review-status' && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setPStep((prev) => Math.max(0, prev - 1))}
                >
                  Back
                </button>
              )}
              {PSTEPS[pStep] !== 'review-status' ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (PSTEPS[pStep] === 'verify') {
                      setPStep(PSTEPS.indexOf('review-status'));
                    } else {
                      setPStep((prev) => Math.min(PSTEPS.length - 1, prev + 1));
                    }
                  }}
                >
                  {PSTEPS[pStep] === 'verify' ? 'Submit for Verification' : 'Continue'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setPartnerOpen(false);
                    router.push('/partner/verification');
                  }}
                >
                  Check Verification Status <span className="arrow">→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
