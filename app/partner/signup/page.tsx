'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';

const CUISINES = ['North Indian', 'South Indian', 'Chinese', 'Continental', 'Punjabi', 'Gujarati', 'Jain', 'Healthy Meals', 'Baby Food'];
const AVAIL_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

function PartnerSignupContent() {
  const router = useRouter();
  const { signup } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Female',
    languages: 'Hindi, English',
    experience: '5',
    cuisines: ['North Indian', 'Healthy Meals'],
    areas: 'Noida, Sector 50-62',
    availability: ['Morning', 'Evening'],
    bankAccount: '',
    upiId: '',
    emergencyContact: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleCuisine = (c: string) => {
    setFormData(prev => {
      const exists = prev.cuisines.includes(c);
      return {
        ...prev,
        cuisines: exists ? prev.cuisines.filter(x => x !== c) : [...prev.cuisines, c]
      };
    });
  };

  const toggleAvail = (a: string) => {
    setFormData(prev => {
      const exists = prev.availability.includes(a);
      return {
        ...prev,
        availability: exists ? prev.availability.filter(x => x !== a) : [...prev.availability, a]
      };
    });
  };

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await signup({ 
        email: formData.email, 
        password: formData.password, 
        fullName: formData.fullName, 
        phone: formData.phone, 
        role: 'cook' 
      });

      if (res.requiresEmailConfirmation) {
        setSuccessMessage(res.message || 'Partner application submitted! Please check your email to verify your email address before signing in.');
      } else {
        router.push('/partner/verification');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register partner account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError('');
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/partner/verification&role=cook`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Google signup failed. Please verify Supabase OAuth setup.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)]">
      <header className="site-header" style={{ position: 'relative', background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap flex items-center h-[78px]">
          <Link href="/" className="logo text-[#0F1736] font-bold text-2xl flex items-center gap-1">
            <span className="text-[#2E46E0]">Ti</span>zl
          </Link>
          <span className="ml-4 pl-4 border-l border-gray-200 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Become a Partner Cook
          </span>
          <div className="ml-auto">
            <Link href="/partner/login" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              Already a partner? Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl">
          <h2 className="mt-4 text-center text-3xl font-bold text-[var(--ink)]">
            Apply to Cook on Tizl
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--text-dim)]">
            Turn your cooking skills into steady income with same-day payouts.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[var(--line)] sm:px-10">
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-200">
                {error}
              </div>
            )}

            {successMessage ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[var(--blue)] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Check Your Email</h3>
                <p className="text-sm text-[var(--text-dim)] mb-6">{successMessage}</p>
                <Link
                  href="/partner/login"
                  className="inline-block w-full py-3 px-4 rounded-full text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--blue)] transition"
                >
                  Return to Partner Sign In
                </Link>
              </div>
            ) : (
              <>
                {/* Stepper Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-dim)]">
                    <span className={step >= 1 ? 'text-[var(--blue)]' : ''}>1. Profile</span>
                    <span className={step >= 2 ? 'text-[var(--blue)]' : ''}>2. Skills &amp; Area</span>
                    <span className={step >= 3 ? 'text-[var(--blue)]' : ''}>3. Account</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-[var(--surface)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--blue)] rounded-full transition-all duration-300"
                      style={{ width: `${(step / 3) * 100}%` }}
                    />
                  </div>
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Sunita Devi"
                        className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="10-digit mobile"
                          className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                          Languages Spoken
                        </label>
                        <input
                          type="text"
                          value={formData.languages}
                          onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                          placeholder="Hindi, English, etc."
                          className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                          Cooking Experience (Years)
                        </label>
                        <input
                          type="number"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          placeholder="e.g. 5"
                          className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.fullName || !formData.phone) {
                            setError('Please enter your full name and phone number.');
                            return;
                          }
                          setError('');
                          setStep(2);
                        }}
                        className="w-full flex justify-center py-3.5 px-4 rounded-full text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--blue)] transition duration-150 shadow-sm cursor-pointer"
                      >
                        Continue to Skills &amp; Area
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-2 font-mono">
                        Cuisines You Cook Best
                      </label>
                      <div className="chip-select">
                        {CUISINES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleCuisine(c)}
                            className={`chip-opt ${formData.cuisines.includes(c) ? 'selected' : ''}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                        Preferred Localities / Areas
                      </label>
                      <input
                        type="text"
                        value={formData.areas}
                        onChange={(e) => setFormData({ ...formData, areas: e.target.value })}
                        placeholder="e.g. Sector 50-62 Noida, Indirapuram"
                        className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-2 font-mono">
                        Available Time Slots
                      </label>
                      <div className="chip-select">
                        {AVAIL_SLOTS.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => toggleAvail(a)}
                            className={`chip-opt ${formData.availability.includes(a) ? 'selected' : ''}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 px-4 border border-[var(--line)] rounded-full text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface)] cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.areas) {
                            setError('Please specify your preferred areas.');
                            return;
                          }
                          setError('');
                          setStep(3);
                        }}
                        className="flex-1 py-3 px-4 rounded-full text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--blue)] cursor-pointer"
                      >
                        Next: Account &amp; Payout
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                        Account Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="cook@example.com"
                        className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                          UPI ID for Same-Day Payout
                        </label>
                        <input
                          type="text"
                          value={formData.upiId}
                          onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                          placeholder="e.g. mobile@upi"
                          className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                          Emergency Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                          placeholder="Emergency contact"
                          className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Min 6 characters"
                          className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="Repeat password"
                          className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex-1 py-3.5 px-4 border border-[var(--line)] rounded-full text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface)] cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleSignup}
                        className="flex-1 py-3.5 px-4 rounded-full text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--blue)] transition disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? 'Submitting Application...' : 'Submit Partner Application'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--line)]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-[var(--text-faint)] font-mono">
                        Or apply with Google
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleGoogleSignup}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[var(--line-strong)] rounded-full text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface)] transition duration-150 cursor-pointer"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>Apply with Google</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 text-center text-xs text-[var(--text-faint)]">
                  Already applied? <Link href="/partner/login" className="text-[var(--blue)] font-semibold hover:underline">Partner Sign In →</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PartnerSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">Loading...</div>}>
      <PartnerSignupContent />
    </Suspense>
  );
}
