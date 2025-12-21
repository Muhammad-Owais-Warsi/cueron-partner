// 'use client';

// import { useState, useRef, useEffect } from 'react';
// // import { verifyOTP } from '@/lib/auth';
// import { validateOTP } from '@cueron/utils';
// import { useRouter } from 'next/navigation';

// interface OTPInputProps {
//   phone: string;
//   onBack: () => void;
//   onSuccess?: () => void;
// }

// export function OTPInput({ phone, onBack, onSuccess }: OTPInputProps) {
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
//   const router = useRouter();

//   useEffect(() => {
//     // Focus first input on mount
//     inputRefs.current[0]?.focus();
//   }, []);

//   const handleChange = (index: number, value: string) => {
//     // Only allow digits
//     if (value && !/^\d$/.test(value)) {
//       return;
//     }

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     setError(null);

//     // Auto-focus next input
//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }

//     // Auto-submit when all digits entered
//     if (newOtp.every((digit) => digit !== '') && index === 5) {
//       handleVerify(newOtp.join(''));
//     }
//   };

//   const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       // Move to previous input on backspace if current is empty
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault();
//     const pastedData = e.clipboardData.getData('text').slice(0, 6);

//     if (!/^\d+$/.test(pastedData)) {
//       return;
//     }

//     const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
//     setOtp(newOtp);

//     // Focus last filled input or first empty
//     const lastFilledIndex = newOtp.findIndex((digit) => digit === '');
//     const focusIndex = lastFilledIndex === -1 ? 5 : lastFilledIndex;
//     inputRefs.current[focusIndex]?.focus();

//     // Auto-submit if complete
//     if (newOtp.every((digit) => digit !== '')) {
//       handleVerify(newOtp.join(''));
//     }
//   };

//   const handleVerify = async (otpValue: string) => {
//     setError(null);
//     setLoading(true);

//     try {
//       // Validate OTP format
//       if (!validateOTP(otpValue)) {
//         throw new Error('Invalid OTP format');
//       }

//       // Verify OTP
//       await verifyOTP(phone, otpValue);

//       // Success - redirect to dashboard
//       if (onSuccess) {
//         onSuccess();
//       } else {
//         router.push('/dashboard');
//         router.refresh();
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
//       // Clear OTP on error
//       setOtp(['', '', '', '', '', '']);
//       inputRefs.current[0]?.focus();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     const otpValue = otp.join('');

//     if (otpValue.length !== 6) {
//       setError('Please enter all 6 digits');
//       return;
//     }

//     handleVerify(otpValue);
//   };

//   return (
//     <div className="w-full max-w-md space-y-6">
//       <div className="text-center">
//         <h1 className="text-3xl font-bold text-gray-900">Enter OTP</h1>
//         <p className="mt-2 text-sm text-gray-600">We've sent a 6-digit code to</p>
//         <p className="text-sm font-medium text-gray-900">{phone}</p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* OTP Input boxes */}
//         <div className="flex gap-2 justify-center">
//           {otp.map((digit, index) => (
//             <input
//               key={index}
//               ref={(el) => {
//                 inputRefs.current[index] = el;
//               }}
//               type="text"
//               inputMode="numeric"
//               maxLength={1}
//               value={digit}
//               onChange={(e) => handleChange(index, e.target.value)}
//               onKeyDown={(e) => handleKeyDown(index, e)}
//               onPaste={index === 0 ? handlePaste : undefined}
//               disabled={loading}
//               className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//             />
//           ))}
//         </div>

//         {/* Error message */}
//         {error && (
//           <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//             <p className="text-sm text-red-600 text-center">{error}</p>
//           </div>
//         )}

//         {/* Submit button */}
//         <button
//           type="submit"
//           disabled={loading || otp.some((digit) => digit === '')}
//           className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {loading ? (
//             <span className="flex items-center justify-center gap-2">
//               <svg
//                 className="animate-spin h-5 w-5"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 ></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                 ></path>
//               </svg>
//               Verifying...
//             </span>
//           ) : (
//             'Verify OTP'
//           )}
//         </button>

//         {/* Back button */}
//         <button
//           type="button"
//           onClick={onBack}
//           disabled={loading}
//           className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
//         >
//           ← Back to login
//         </button>
//       </form>

//       <div className="text-center">
//         <button
//           type="button"
//           disabled={loading}
//           className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
//         >
//           Resend OTP
//         </button>
//       </div>
//     </div>
//   );
// }
