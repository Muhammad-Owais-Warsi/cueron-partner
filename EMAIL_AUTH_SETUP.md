# Email Authentication Setup Guide

## ✅ What I've Implemented

I've added **Email Magic Link authentication** to your Cueron Partner Platform. Now you have two authentication options:

1. **Phone/OTP** - SMS-based authentication (requires Twilio/MSG91 setup)
2. **Email Magic Link** - Email-based passwordless authentication (works immediately!)

## 🚀 How to Use Email Authentication

### For Development (Works Now!)

1. **Open your app**: http://localhost:3001
2. **Go to login page**: Click on the "Email" tab
3. **Enter any email address** (e.g., your@email.com)
4. **Click "Continue"**
5. **Check your email** for the magic link
6. **Click the link** in the email to sign in

### How It Works

1. User enters their email address
2. Supabase sends a magic link to that email
3. User clicks the link in their email
4. They're automatically signed in and redirected to the dashboard

## 📧 Enable Email Provider in Supabase

To make email authentication work in production:

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **dkaqkhfqnmjynkdrnjek**
3. Navigate to **Authentication** → **Providers**
4. Find **Email** provider
5. Make sure it's **Enabled** (it should be by default)
6. Configure settings:
   - **Confirm email**: Toggle ON for production (users must verify email)
   - **Secure email change**: Toggle ON for security
   - **Double confirm email changes**: Toggle ON for extra security

### Email Templates (Optional Customization)

You can customize the email templates:

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Magic Link** - The email users receive to sign in
   - **Confirm signup** - Email verification (if enabled)
   - **Change Email Address** - When users change their email

## 🔧 What Was Changed

### 1. Added Email Magic Link Function
**File**: `apps/web/src/lib/auth/index.ts`
```typescript
export async function sendMagicLink(email: string) {
  // Sends magic link to user's email
}
```

### 2. Updated Login Form
**File**: `apps/web/src/components/auth/LoginForm.tsx`
- Added email input handling
- Shows success message after sending magic link
- Improved button text based on auth method

### 3. Created Auth Callback Route
**File**: `apps/web/src/app/auth/callback/route.ts`
- Handles the magic link redirect
- Exchanges code for session
- Redirects to dashboard

## 🎯 Testing Email Authentication

### Development Testing

For development, Supabase will send real emails to any address you enter. Check your spam folder if you don't see the email.

### Test Flow

1. Open http://localhost:3001/login
2. Click "Email" tab
3. Enter: `test@example.com` (or your real email)
4. Click "Continue"
5. You'll see: "Check your email! We've sent a magic link..."
6. Check your email inbox
7. Click the magic link
8. You'll be redirected to the dashboard

## 📱 Phone vs Email Authentication

| Feature | Phone/OTP | Email Magic Link |
|---------|-----------|------------------|
| **Setup Required** | Yes (Twilio/MSG91) | No (works immediately) |
| **Cost** | Per SMS | Free |
| **Speed** | Instant OTP | Email delivery time |
| **Best For** | Mobile users, India | Web users, global |
| **Security** | High | High |

## 🔐 Security Features

Both authentication methods include:
- ✅ Passwordless authentication
- ✅ Secure session management
- ✅ Automatic token refresh
- ✅ Row Level Security (RLS)
- ✅ JWT-based authentication

## 🐛 Troubleshooting

### "Email not received"
- Check spam/junk folder
- Verify email provider is enabled in Supabase
- Check Supabase logs: Authentication → Logs

### "Invalid magic link"
- Links expire after 1 hour
- Request a new magic link
- Clear browser cache and try again

### "Redirect not working"
- Verify callback route exists: `apps/web/src/app/auth/callback/route.ts`
- Check Supabase redirect URLs: Authentication → URL Configuration
- Add `http://localhost:3001/auth/callback` to allowed redirect URLs

## 🎉 You're All Set!

Your app now supports both Phone and Email authentication. For development, **Email authentication works immediately** without any additional setup!

**Current App URL**: http://localhost:3001

Try it now:
1. Go to http://localhost:3001/login
2. Switch to "Email" tab
3. Enter your email
4. Check your inbox for the magic link!
