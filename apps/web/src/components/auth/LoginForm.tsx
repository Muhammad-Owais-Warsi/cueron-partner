'use client';

import { useState } from 'react';
import { sendOTP, sendMagicLink } from '@/lib/auth';
import { validatePhoneNumber } from '@cueron/utils';

interface LoginFormProps {
  onOTPSent: (phone: string) => void;
  onEmailSent?: (email: string) => void;
}

export function LoginForm({ onOTPSent, onEmailSent }: LoginFormProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [usePhone, setUsePhone] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (usePhone) {
        // Validate phone number
        if (!validatePhoneNumber(phone)) {
          throw new Error('Please enter a valid phone number (10 digits)');
        }

        // Send OTP
        await sendOTP(phone);
        onOTPSent(phone);
      } else {
        // Email authentication (Supabase magic link)
        if (!email || !email.includes('@')) {
          throw new Error('Please enter a valid email address');
        }

        // Send magic link
        await sendMagicLink(email);
        setEmailSent(true);
        if (onEmailSent) {
          onEmailSent(email);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to access your agency dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle between phone and email */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setUsePhone(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              usePhone
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Phone
          </button>
          <button
            type="button"
            onClick={() => setUsePhone(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !usePhone
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email
          </button>
        </div>

        {/* Input field */}
        {usePhone ? (
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter 10-digit mobile number
            </p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
              disabled={loading}
            />
          </div>
        )}

        {/* Success message for email */}
        {emailSent && !usePhone && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Check your email!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  We've sent a magic link to <strong>{email}</strong>. Click the
                  link in the email to sign in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || emailSent}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {usePhone ? 'Sending OTP...' : 'Sending magic link...'}
            </span>
          ) : emailSent ? (
            'Email sent! Check your inbox'
          ) : (
            'Continue'
          )}
        </button>
      </form>

      <div className="text-center text-sm text-gray-500">
        <p>
          By continuing, you agree to Cueron's Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
