# Database Migrations

## Applying Migrations

To apply the user_vendor_favorites migration to your Supabase database:

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `001_create_user_vendor_favorites.sql`
4. Click "Run" to execute the migration

### Option 2: Using Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase db push
```

## Migration Details

### 001_create_user_vendor_favorites.sql
- Creates the `user_vendor_favorites` table for storing user's favorite vendors
- Sets up proper foreign key relationships with auth.users and vendor_profiles
- Creates indexes for optimal query performance
- Implements Row Level Security (RLS) policies:
  - Users can only view, add, and remove their own favorites
  - Proper cascade deletion when users or vendors are removed