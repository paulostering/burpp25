# Registration Redirect Feature

**Status**: Temporary Feature - To be removed in future

**Created**: January 19, 2026

**Purpose**: When user registration is disabled via admin settings, redirect all user-focused pages to the vendor landing page (`/pros`) to create a vendor-only onboarding experience.

---

## Overview

This feature checks the `user_registration_enabled` setting in the `app_settings` table and conditionally:
1. Redirects user-focused pages to `/pros`
2. Changes Burpp logo links to point to `/pros`
3. Hides search functionality

---

## Files Modified

### 1. Navigation Components

#### `src/components/top-nav.tsx`
**Changes:**
- Added registration setting check in useEffect
- Logo link: `href={registrationEnabled ? "/" : "/pros"}`
- Mobile menu logo: Same conditional routing
- CondensedSearch: Hidden when `registrationEnabled === false`

**Lines affected:** ~30-35, ~109, ~205, ~84

---

### 2. Auth Pages

#### `src/app/(auth)/login/page.tsx`
**Changes:**
- Fetches registration setting (already existed for form)
- Logo link: `href={registrationEnabled ? "/" : "/pros"}`

**Lines affected:** ~52

#### `src/app/(auth)/signup/page.tsx`
**Changes:**
- Uses existing `registrationEnabled` check
- Logo link: `href={registrationEnabled ? "/" : "/pros"}`

**Lines affected:** ~78

---

### 3. User-Focused Pages (Redirect to /pros)

#### `src/app/(main)/home/page.tsx`
**Changes:**
- Added `shouldRender` state (default: false)
- Added registration check in useEffect
- Redirects to `/pros` if disabled using `router.replace('/pros')`
- Shows loading spinner while checking
- Only renders content if `shouldRender === true`

**Lines affected:** ~14-52, ~88-95

#### `src/app/(main)/about/page.tsx`
**Changes:**
- Same pattern as home page
- Added `shouldRender` state
- Registration check with redirect
- Loading spinner

**Lines affected:** ~13-50

#### `src/app/(main)/how-to-use/page.tsx`
**Changes:**
- Same pattern as home page
- Added `shouldRender` state  
- Registration check with redirect
- Loading spinner

**Lines affected:** ~9-46

#### `src/app/(main)/search/search-client.tsx`
**Changes:**
- Added `shouldRender` state
- Registration check with redirect
- Loading spinner before search results

**Lines affected:** ~13-45, ~167-175

---

## How It Works

### Registration Check Logic

```typescript
const checkAndRedirect = async () => {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'user_registration_enabled')
      .single()

    let registrationEnabled = true
    if (data) {
      const value = data.setting_value
      if (typeof value === 'boolean') {
        registrationEnabled = value
      } else if (typeof value === 'string') {
        registrationEnabled = value.toLowerCase().replace(/"/g, '') === 'true'
      }
    }

    if (!registrationEnabled) {
      router.replace('/pros')
      return
    }
    
    setShouldRender(true)
  } catch (error) {
    setShouldRender(true)
  }
}
```

### Loading State Pattern

```typescript
const [shouldRender, setShouldRender] = useState(false)

if (!shouldRender) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
```

---

## Pages Affected by Feature

### Redirects to `/pros` when registration disabled:
- `/home`
- `/how-to-use`
- `/search`

### Logo links change to `/pros`:
- TopNav (all pages)
- Login page
- Signup page

### Search components hidden:
- SearchHero (home page - via redirect)
- MobileSearchHero (home page - via redirect)
- CondensedSearch (TopNav)
- Search results page (via redirect)

### Pages NOT affected (remain accessible):
- `/pros` (vendor landing)
- `/vendor-registration`
- `/about` (accessible even when registration off)
- `/contact`
- `/privacy`
- `/terms`
- `/vendor/terms`
- `/dashboard` (vendor/admin dashboards when logged in)

---

## To Remove This Feature

### Step 1: Remove Registration Checks

Remove the registration check useEffect and shouldRender state from:
- `src/app/(main)/home/page.tsx`
- `src/app/(main)/about/page.tsx`
- `src/app/(main)/how-to-use/page.tsx`
- `src/app/(main)/search/search-client.tsx`

### Step 2: Restore Direct Links

Change all conditional logo links back to `/`:
- `src/components/top-nav.tsx` (2 locations)
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`

Change from:
```typescript
href={registrationEnabled ? "/" : "/pros"}
```

To:
```typescript
href="/"
```

### Step 3: Restore CondensedSearch

In `src/components/top-nav.tsx`, remove `&& registrationEnabled` from `showCondensedSearch` logic:

Change:
```typescript
const showCondensedSearch = !isHomePage && !isAuthPage && !isRegistrationPage && !isVendorDashboard && !isVendor && !roleLoading && registrationEnabled
```

To:
```typescript
const showCondensedSearch = !isHomePage && !isAuthPage && !isRegistrationPage && !isVendorDashboard && !isVendor && !roleLoading
```

Also remove the registration check useEffect from TopNav.

### Step 4: Remove Imports

Remove these imports from files that added them:
- `import { createClient } from "@/lib/supabase/client"` (if only used for registration check)
- `useState` import (if `shouldRender` was the only state)

### Step 5: Clean Up State

Remove:
- `const [shouldRender, setShouldRender] = useState(false)` declarations
- `const [registrationEnabled, setRegistrationEnabled] = useState(true)` (TopNav)
- All `if (!shouldRender)` loading checks

---

## Database Setting

The feature reads from:
- **Table**: `app_settings`
- **Key**: `user_registration_enabled`
- **Type**: JSONB (boolean or string "true"/"false")

Managed via: Admin Dashboard → User Registration Settings

---

## Notes

- Uses `router.replace()` for clean navigation (no back button)
- Shows loading spinner to prevent content flash
- Defaults to "enabled" on error (fail-safe)
- All redirects point to `/pros` (vendor landing page)
- Only affects public user-facing pages, not vendor/admin features

---

**Last Updated**: January 19, 2026


