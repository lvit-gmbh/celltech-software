# Environment Setup

Please create a `.env.local` file in the root directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Note:** Replace `your_supabase_url` and `your_anon_key` with your actual Supabase project credentials.

You can find these values in your Supabase project settings:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Important:** The service role key is not needed for client-side operations and should not be included in client-side environment variables for security reasons.

