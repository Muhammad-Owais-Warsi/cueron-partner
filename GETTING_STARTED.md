# Getting Started with Supabase User Management

## How to Get Your Supabase Service Role Key

To create users programmatically, you need the Supabase service role key:

1. **Access Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Sign in to your account
   - Select your project

2. **Navigate to API Settings**
   - In the left sidebar, click **Settings** (gear icon)
   - Click **API** in the settings menu

3. **Copy Service Role Key**
   - Scroll down to the **Project API keys** section
   - Find the **service_role** secret key
   - Click the copy icon to copy it to your clipboard

4. **Update Environment Variables**
   - Open `apps/web/.env.local`
   - Replace `your-service-role-key-here` with your actual service role key
   - Save the file

## Creating Users

Once you've set up your service role key, you can create users using the script:

```bash
# Create a user with email, password, name, and phone
node create-user.js user@example.com password123 "John Doe" "+1234567890"

# Create a user with just email and password
node create-user.js user@example.com password123
```

## Security Notes

⚠️ **Important Security Considerations:**
- Never commit your service role key to version control
- Keep your service role key secret - it has full access to your database
- Use environment variables to store sensitive credentials
- Rotate your keys regularly for better security

## Troubleshooting

If you encounter issues:

1. **"SUPABASE_SERVICE_ROLE_KEY is not set"**
   - Make sure you've updated the [.env.local](file:///d:/vendor/apps/web/.env.local) file with your actual service role key

2. **"Invalid API key"**
   - Verify that your service role key is correct
   - Make sure there are no extra spaces or characters

3. **Network errors**
   - Check your internet connection
   - Verify that your Supabase project URL is correct