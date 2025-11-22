# Installation Instructions

## After Completing Task 2: Supabase Backend Configuration

Follow these steps to install dependencies and verify the setup:

## 1. Install Dependencies

Run this command from the project root:

```bash
pnpm install
```

This will install all new dependencies including:
- `@supabase/ssr` for Next.js web app
- `@react-native-async-storage/async-storage` for mobile app
- `react-native-url-polyfill` for mobile app

## 2. Configure Environment Variables

### Web Application

Create `apps/web/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Other services (configure when ready)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_SENTRY_DSN=
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ENCRYPTION_KEY=generate_a_32_character_key_here
```

### Mobile Application

Create `apps/mobile/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Other services (configure when ready)
GOOGLE_MAPS_API_KEY=
FCM_SERVER_KEY=
SENTRY_DSN=
```

## 3. Set Up Supabase Project

Follow the complete guide in `SUPABASE_SETUP.md`:

1. Create Supabase project
2. Enable PostGIS extension
3. Run all 5 migration files
4. Configure phone authentication
5. Verify storage buckets
6. Get your credentials

## 4. Test the Setup

### Test Web Application

```bash
cd apps/web
pnpm dev
```

Open `http://localhost:3000` and check the console for any errors.

### Test Mobile Application

```bash
cd apps/mobile
pnpm start
```

## 5. Verify Database Connection

You can test the database connection with this simple query:

**Web (Server Component):**
```typescript
import { createClient } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('agencies').select('count');
  
  return <div>Agencies count: {JSON.stringify(data)}</div>;
}
```

**Mobile:**
```typescript
import { supabase } from '@/lib/supabase';

const testConnection = async () => {
  const { data, error } = await supabase.from('agencies').select('count');
  console.log('Connection test:', data, error);
};
```

## 6. Optional: Load Seed Data

If you want test data for development:

1. Go to your Supabase dashboard
2. Open SQL Editor
3. Copy contents of `supabase/seed.sql`
4. Paste and run

This will create:
- 3 sample agencies
- 5 sample engineers
- 4 sample jobs
- Sample payments and notifications

## Troubleshooting

### Issue: TypeScript errors in mobile app

**Solution:** Run `pnpm install` to install the missing packages.

### Issue: "Cannot find module '@supabase/ssr'"

**Solution:** 
```bash
cd apps/web
pnpm install @supabase/ssr
```

### Issue: Environment variables not loading

**Solution:** 
- For web: Restart the dev server after creating `.env.local`
- For mobile: Restart the Metro bundler

### Issue: Supabase connection fails

**Solution:**
1. Verify your Supabase URL and keys are correct
2. Check that your Supabase project is running
3. Verify network connectivity
4. Check browser/app console for specific error messages

## Next Steps

After successful installation and verification:

1. ✅ Task 2 Complete: Supabase backend configured
2. ➡️ Task 3: Set up third-party service integrations
3. ➡️ Task 4: Implement data models and TypeScript interfaces
4. ➡️ Task 5: Implement encryption and security utilities

## Need Help?

- Check `SUPABASE_SETUP.md` for detailed Supabase setup
- Check `supabase/README.md` for database documentation
- Check `supabase/IMPLEMENTATION_SUMMARY.md` for what was implemented
- Review the Supabase dashboard for any configuration issues
