# Burpp Mobile App - Requirements & Specifications

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [User Roles](#user-roles)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Mobile-Specific Requirements](#mobile-specific-requirements)
9. [Third-Party Integrations](#third-party-integrations)
10. [File Structure](#file-structure)
11. [Environment Variables](#environment-variables)
12. [Key Business Logic](#key-business-logic)

---

## Project Overview

**App Name:** Burpp

**Description:** A marketplace platform connecting service providers (vendors) with clients. Clients can browse, search, and contact vendors for various services. Vendors can create profiles, showcase their work, and connect with potential clients.

**Platform:** Mobile (iOS & Android) using React Native + Expo

**Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)

---

## Tech Stack

### Mobile App (New)
- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **State Management:** React Context API (same as web)
- **UI Components:** React Native Paper or React Native Elements
- **Storage:** AsyncStorage (for auth persistence)
- **HTTP Client:** Fetch API / Axios
- **Maps:** react-native-maps
- **Location:** expo-location
- **Image Handling:** expo-image-picker, react-native-fast-image
- **Push Notifications:** Expo Notifications

### Backend (Existing - Reuse)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (for images)
- **Realtime:** Supabase Realtime (for messaging)
- **API:** Supabase REST API + Custom Next.js API routes (to be adapted)

### External Services
- **AI:** OpenAI GPT-4 (profile generation, content moderation)
- **Maps:** Mapbox API
- **Email:** Resend (via Supabase Edge Functions)

---

## User Roles

### 1. Client (Customer)
- Browse and search for vendors
- View vendor profiles
- Favorite/bookmark vendors
- Message vendors
- Leave reviews and ratings
- Manage their profile

### 2. Vendor (Service Provider)
- Create and manage business profile
- Showcase services and products
- Set service area and pricing
- Receive and respond to messages
- View reviews
- Manage availability
- Upload profile/cover photos and product images

### 3. Admin
- Manage all users (clients and vendors)
- Approve/reject vendor registrations
- Moderate reviews
- Manage categories
- Manage email templates
- View system analytics
- *Note: Admin panel may be web-only initially*

---

## Core Features

### Authentication & Onboarding

#### Client Authentication
- Email/password signup
- Email/password login
- Password reset flow
- Email verification
- Profile creation (first name, last name, email, phone)
- Welcome email sent on signup

#### Vendor Authentication
- Multi-step registration process:
  1. **Step 1:** Business name & service categories
  2. **Step 2:** Profile title & about/bio (AI-assisted generation available)
  3. **Step 3:** Service area (virtual/in-person), zip code, service radius, hourly rate
  4. **Step 4:** Upload profile photo & cover photo (with image cropping)
  5. **Step 5:** Create account credentials
- Welcome email sent on registration
- Account pending approval by admin
- Post-approval email notification

#### Session Management
- Persistent sessions using AsyncStorage
- Auto-refresh tokens
- Logout functionality

---

### Home & Discovery

#### Home Screen
- Featured categories carousel
- Popular vendors
- Recent vendors
- Categories grid
- Search bar (quick access)

#### Category Browsing
- Grid/list of all service categories
- Each category has:
  - Icon image
  - Name
  - Description
  - Vendor count
- Tap to view vendors in category

#### Search & Filters
- Search by:
  - Keyword (business name, services)
  - Location (zip code + radius)
  - Category
  - Price range
- Sort by:
  - Relevance
  - Rating (highest first)
  - Price (low to high, high to low)
  - Distance (nearest first)
  - Newest
- Real-time search results
- Infinite scroll for results
- Empty states for no results

#### Location Services
- Request user location permission
- Auto-detect current location
- Calculate distance to vendors
- Filter by service radius
- Map view of vendor locations (optional enhancement)

---

### Vendor Profiles

#### Public Vendor Profile View
- Business name
- Profile photo
- Cover photo
- Profile title
- About/bio
- Star rating and review count
- Service categories (badges)
- Service area information:
  - Virtual services indicator
  - In-person services with zip code and radius
- Hourly rate
- Contact information:
  - Email
  - Phone number
  - Business address (if available)
- Products/services showcase:
  - Image gallery
  - Product titles
  - Product descriptions
  - Pricing (if available)
- Reviews & ratings section:
  - Average rating
  - Total review count
  - Individual reviews with:
    - Reviewer name
    - Star rating
    - Review title
    - Review comment
    - Date posted
  - Approved reviews only shown to public
- Actions:
  - Favorite/unfavorite button
  - Message vendor button
  - Leave a review button (if client and not already reviewed)

#### Vendor Dashboard (For Vendors)
- Profile edit mode
- Business information editing
- Profile photo/cover photo upload with cropping
- Service categories management
- Service area and pricing updates
- Products/services manager:
  - Add new products/services
  - Upload product images
  - Edit product details
  - Delete products
- Review management (view only, cannot delete)
- Account settings
- Analytics (future enhancement):
  - Profile views
  - Message count
  - Favorite count

---

### Favorites

#### Favorites List
- List of all favorited vendors
- Quick access to vendor profiles
- Remove from favorites
- Empty state when no favorites
- Real-time updates using Supabase subscription

#### Favorites Management
- Add/remove favorites from vendor profile
- Visual feedback (heart icon filled/unfilled)
- Persist across sessions

---

### Messaging

#### Conversations List
- List of all conversations
- Show most recent message
- Unread indicator
- Timestamp of last message
- Vendor/client name and avatar
- Empty state when no conversations
- Real-time updates using Supabase Realtime

#### Conversation View
- Message thread between client and vendor
- Messages show:
  - Sender name
  - Message content
  - Timestamp
  - Read status (future enhancement)
- Message composer:
  - Text input
  - Send button
  - Character limit (if needed)
- Real-time message updates
- Auto-scroll to latest message
- Load message history (pagination)

#### Messaging Rules
- Only logged-in users can message
- Clients can only message vendors
- Vendors can message clients who contacted them
- Messages stored in database
- Conversations auto-created on first message

---

### Reviews & Ratings

#### Leave a Review
- Star rating (1-5 stars)
- Optional review title
- Optional review comment
- Submit for moderation
- One review per client per vendor
- Cannot review your own vendor profile

#### Review Moderation
- AI-powered content moderation using OpenAI:
  - Checks for inappropriate content
  - Checks for spam
  - Auto-approval for genuine reviews
- Reviews pending admin approval shown to vendor only
- Approved reviews shown publicly
- Flagged reviews not displayed

#### Review Display
- Average rating calculation
- Total review count
- Individual reviews sorted by date (newest first)
- Star rating visualization
- Reviewer name and date
- Review title and comment

---

### User Profile Management

#### Client Profile
- View/edit personal information:
  - First name
  - Last name
  - Email (read-only)
  - Phone number
  - Profile photo (future enhancement)
- View favorites
- View conversations
- Logout

#### Vendor Profile (In Dashboard)
- Everything from public profile
- Plus editing capabilities:
  - Business name
  - Profile title
  - About section
  - Service categories
  - Service area and pricing
  - Contact information
  - Profile and cover photos
  - Products/services

---

## Database Schema

### Supabase Tables

#### 1. `user_profiles`
```sql
- id: uuid (PK, references auth.users)
- first_name: text
- last_name: text
- email: text
- phone_number: text
- created_at: timestamp
- updated_at: timestamp
```

#### 2. `vendor_profiles`
```sql
- id: uuid (PK, auto-generated)
- user_id: uuid (FK to auth.users)
- business_name: text (required)
- profile_title: text
- about: text
- service_categories: text[] (array of category IDs)
- offers_virtual_services: boolean (default: true)
- offers_in_person_services: boolean (default: true)
- zip_code: text
- service_radius: integer (miles)
- hourly_rate: numeric
- profile_photo_url: text
- cover_photo_url: text
- first_name: text
- last_name: text
- email: text
- phone_number: text
- status: text (enum: 'pending', 'approved', 'rejected', 'inactive')
- created_at: timestamp
- updated_at: timestamp
- average_rating: numeric (computed)
- review_count: integer (computed)
```

#### 3. `categories`
```sql
- id: uuid (PK, auto-generated)
- name: text (required, unique)
- description: text
- icon_url: text
- is_featured: boolean (default: false)
- created_at: timestamp
- updated_at: timestamp
```

#### 4. `vendor_products`
```sql
- id: uuid (PK, auto-generated)
- vendor_id: uuid (FK to vendor_profiles)
- title: text (required)
- description: text
- price: numeric
- image_url: text
- is_active: boolean (default: true)
- created_at: timestamp
- updated_at: timestamp
```

#### 5. `reviews`
```sql
- id: uuid (PK, auto-generated)
- user_id: uuid (FK to auth.users)
- vendor_id: uuid (FK to vendor_profiles)
- rating: integer (1-5, required)
- title: text
- comment: text
- approved: boolean (default: false)
- created_at: timestamp
- updated_at: timestamp
```

#### 6. `user_vendor_favorites`
```sql
- id: uuid (PK, auto-generated)
- user_id: uuid (FK to auth.users)
- vendor_id: uuid (FK to vendor_profiles)
- created_at: timestamp
- UNIQUE constraint on (user_id, vendor_id)
```

#### 7. `conversations`
```sql
- id: uuid (PK, auto-generated)
- client_id: uuid (FK to auth.users)
- vendor_id: uuid (FK to vendor_profiles)
- created_at: timestamp
- updated_at: timestamp
- UNIQUE constraint on (client_id, vendor_id)
```

#### 8. `messages`
```sql
- id: uuid (PK, auto-generated)
- conversation_id: uuid (FK to conversations)
- sender_id: uuid (FK to auth.users)
- content: text (required)
- created_at: timestamp
```

#### 9. `email_templates` (Admin only)
```sql
- id: uuid (PK, auto-generated)
- name: text (required, unique)
- subject: text (required)
- html_content: text (required)
- text_content: text
- variables: jsonb (template variables)
- created_at: timestamp
- updated_at: timestamp
```

#### 10. `admin_activity_log` (Admin only)
```sql
- id: uuid (PK, auto-generated)
- admin_id: uuid (FK to auth.users)
- action: text (required)
- entity_type: text (e.g., 'vendor', 'review', 'category')
- entity_id: uuid
- details: jsonb
- created_at: timestamp
```

---

## API Endpoints

### Authentication Endpoints (Supabase Auth)
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/reset-password` - Request password reset
- `POST /auth/update-password` - Update password with token

### Vendor Endpoints
- `GET /api/search-vendors` - Search vendors with filters
  - Query params: `keyword`, `category`, `zipCode`, `radius`, `minPrice`, `maxPrice`, `sortBy`
- `GET /vendors/:id` - Get vendor profile by ID
  - Includes: profile info, products, reviews, ratings
- `POST /api/admin/vendors` - Create vendor profile (registration)
- `PUT /api/admin/vendors/:id/profile` - Update vendor profile
- `POST /api/admin/vendors/:id/photo` - Upload profile photo
- `POST /api/admin/vendors/:id/product-image` - Upload product image
- `PUT /api/admin/vendors/:id/status` - Update vendor status (admin)

### Category Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/categories/featured` - Get featured categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Product Endpoints
- `GET /api/admin/vendors/:id/products` - Get vendor products
- `POST /api/admin/vendors/:id/products` - Create product
- `PUT /api/admin/vendors/:id/products/:productId` - Update product
- `DELETE /api/admin/vendors/:id/products/:productId` - Delete product

### Favorites Endpoints
- `GET /api/favorites` - Get user's favorite vendors
- `POST /api/favorites` - Add vendor to favorites
  - Body: `{ vendorId }`
- `DELETE /api/favorites` - Remove vendor from favorites
  - Body: `{ vendorId }`

### Reviews Endpoints
- `GET /vendors/:id/reviews` - Get vendor reviews (approved only for public)
- `POST /api/moderate-review` - Submit review (includes AI moderation)
  - Body: `{ vendorId, rating, title, comment }`
- `POST /api/admin/reviews/:id/approve` - Approve review (admin)
- `DELETE /api/admin/reviews/:id` - Delete review (admin)

### Messaging Endpoints (Use Supabase directly)
- Real-time subscriptions for conversations and messages
- Direct database queries for:
  - Fetch conversations
  - Fetch messages
  - Send message
  - Create conversation

### Profile Endpoints
- `GET /users/:id/profile` - Get user profile
- `PUT /users/:id/profile` - Update user profile

### AI-Powered Endpoints
- `POST /api/generate-profile` - Generate vendor profile content
  - Body: `{ type: 'title' | 'description', businessName, categories, currentText? }`
  - Uses OpenAI GPT-4o-mini

### Contact Endpoint
- `POST /api/contact` - Send contact form submission
  - Body: `{ name, email, subject, message }`

### Email Endpoints (Admin)
- `POST /api/send-welcome-email` - Send welcome email to client
- `POST /api/send-vendor-welcome-email` - Send welcome email to vendor
- `POST /api/send-password-reset-email` - Send password reset email
- `POST /api/send-password-reset-confirmation` - Send password reset confirmation

### Admin Endpoints
- `GET /api/admin/clients` - Get all clients
- `GET /api/admin/clients/:id` - Get client details
- `PUT /api/admin/clients/:id` - Update client
- `POST /api/admin/clients/:id/reset-password` - Reset client password
- `GET /api/admin/vendors` - Get all vendors
- `GET /api/admin/email-templates` - Get all email templates
- `GET /api/admin/email-templates/:id` - Get email template
- `PUT /api/admin/email-templates/:id` - Update email template

---

## Authentication & Authorization

### Row Level Security (RLS) Policies

#### `user_profiles`
- Users can read their own profile
- Users can update their own profile
- Admins can read/update all profiles

#### `vendor_profiles`
- Public read for approved vendors
- Vendor owners can read/update their own profile
- Admins can read/update all vendor profiles

#### `user_vendor_favorites`
- Users can read/create/delete their own favorites
- No public access

#### `reviews`
- Public read for approved reviews
- Users can create reviews (one per vendor)
- Users can read their own reviews (approved or pending)
- Vendors can read reviews for their profile
- Admins can read/update/delete all reviews

#### `conversations`
- Participants can read conversations they're part of
- Participants can create conversations

#### `messages`
- Participants can read messages in their conversations
- Participants can create messages

#### `categories`
- Public read access
- Admin write access

#### `vendor_products`
- Public read access for active products
- Vendor owners can create/update/delete their products
- Admins can manage all products

---

## Mobile-Specific Requirements

### Platform Features

#### iOS
- Support iOS 13+
- Use native navigation gestures
- Implement haptic feedback
- Request permissions properly:
  - Location (when searching)
  - Photos (when uploading images)
  - Notifications (for messages)
- Dark mode support

#### Android
- Support Android 8.0+ (API 26+)
- Material Design components
- Request permissions properly:
  - Location
  - Storage (photos)
  - Notifications
- Dark mode support

### Performance
- Lazy load images
- Infinite scroll with pagination
- Cache API responses where appropriate
- Optimize list rendering (FlatList with keyExtractor)
- Image compression before upload
- Debounce search input

### Offline Support (Future Enhancement)
- Cache vendor profiles
- Queue messages when offline
- Sync when back online
- Offline indicator

### Push Notifications (Future Enhancement)
- New message notification
- Review received notification
- Vendor approval notification
- Favorite vendor updates

---

## Third-Party Integrations

### Supabase
```
URL: Your Supabase project URL
Anon Key: Public anonymous key
Service Role Key: Admin key (server-side only)
```

### OpenAI
```
API Key: For AI features
Models: gpt-4o-mini (profile generation, content moderation)
```

### Mapbox
```
Access Token: For location search and map display
API: Geocoding, Places
```

### Resend (Email)
```
API Key: For sending emails
From Domain: Your verified sender domain
```

---

## Environment Variables

Create `.env` file with:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (for API routes only, not in mobile)
OPENAI_API_KEY=your-openai-key

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Resend (for emails, backend only)
RESEND_API_KEY=your-resend-key

# App Configuration
EXPO_PUBLIC_APP_NAME=Burpp
EXPO_PUBLIC_APP_VERSION=1.0.0
```

---

## File Structure

```
burpp-mobile/
├── src/
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client config
│   │   └── utils.ts                    # Utility functions
│   ├── types/
│   │   └── db.ts                       # Database types (copy from web)
│   ├── contexts/
│   │   └── AuthContext.tsx             # Auth state management
│   ├── navigation/
│   │   ├── AppNavigator.tsx            # Main navigation setup
│   │   ├── AuthStack.tsx               # Auth screens stack
│   │   └── MainTabs.tsx                # Bottom tab navigation
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   └── VendorRegistrationScreen.tsx
│   │   ├── home/
│   │   │   ├── HomeScreen.tsx
│   │   │   └── CategoryScreen.tsx
│   │   ├── search/
│   │   │   ├── SearchScreen.tsx
│   │   │   └── SearchResultsScreen.tsx
│   │   ├── vendor/
│   │   │   ├── VendorProfileScreen.tsx
│   │   │   └── VendorDashboardScreen.tsx
│   │   ├── favorites/
│   │   │   └── FavoritesScreen.tsx
│   │   ├── messages/
│   │   │   ├── ConversationsScreen.tsx
│   │   │   └── ConversationScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── EditProfileScreen.tsx
│   │   └── reviews/
│   │       └── LeaveReviewScreen.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── vendor/
│   │   │   ├── VendorCard.tsx
│   │   │   ├── VendorList.tsx
│   │   │   └── VendorHeader.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── FilterModal.tsx
│   │   ├── messaging/
│   │   │   ├── ConversationItem.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── MessageInput.tsx
│   │   └── reviews/
│   │       ├── ReviewItem.tsx
│   │       ├── RatingStars.tsx
│   │       └── ReviewForm.tsx
│   ├── hooks/
│   │   ├── useAuth.ts                  # Auth hook
│   │   ├── useVendors.ts               # Vendors data hook
│   │   ├── useFavorites.ts             # Favorites hook
│   │   └── useMessages.ts              # Messaging hook
│   └── constants/
│       ├── Colors.ts
│       ├── Sizes.ts
│       └── Config.ts
├── assets/
│   ├── images/
│   └── fonts/
├── App.tsx
├── app.json
├── package.json
└── tsconfig.json
```

---

## Key Business Logic

### Vendor Search Algorithm
```typescript
// Search vendors with multiple criteria
async function searchVendors({
  keyword?: string,
  category?: string,
  zipCode?: string,
  radius?: number,
  minPrice?: number,
  maxPrice?: number,
  sortBy?: 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'distance' | 'newest'
}) {
  // 1. Start with approved vendors only
  // 2. Filter by keyword (business_name, profile_title, about)
  // 3. Filter by category (service_categories contains category_id)
  // 4. Filter by location (calculate distance from zipCode using Mapbox)
  // 5. Filter by price range (hourly_rate between min and max)
  // 6. Sort results based on sortBy criteria
  // 7. Return paginated results
}
```

### Distance Calculation
```typescript
// Use Haversine formula or Mapbox Distance API
// Calculate distance between user's location and vendor's zip code
// Filter vendors within specified radius
```

### Favorite Management
```typescript
// Toggle favorite
async function toggleFavorite(userId: string, vendorId: string) {
  // Check if already favorited
  const existing = await checkFavorite(userId, vendorId)
  
  if (existing) {
    // Remove from favorites
    await removeFavorite(userId, vendorId)
  } else {
    // Add to favorites
    await addFavorite(userId, vendorId)
  }
}
```

### Review Submission Flow
```typescript
// 1. User submits review (rating, title, comment)
// 2. Check if user already reviewed this vendor
// 3. Send to AI moderation endpoint
// 4. AI checks for:
//    - Inappropriate content (OpenAI Moderation API)
//    - Spam detection (GPT-4 classification)
// 5. If passes moderation:
//    - Create review with approved: false
//    - Notify admin for manual review
// 6. If flagged:
//    - Return error to user
//    - Log flagged content
// 7. Admin can approve/reject manually
// 8. On approval:
//    - Set approved: true
//    - Update vendor's average_rating and review_count
//    - Show in public reviews
```

### Messaging Flow
```typescript
// 1. User clicks "Message Vendor" on vendor profile
// 2. Check if conversation exists between user and vendor
// 3. If not, create new conversation
// 4. Navigate to conversation screen
// 5. Load message history
// 6. Subscribe to real-time updates
// 7. User types and sends message
// 8. Message saved to database
// 9. Real-time update triggers in both users' apps
// 10. Unread indicator updates in conversations list
```

### Image Upload with Cropping
```typescript
// 1. User selects image from camera/gallery
// 2. Show image cropper modal
// 3. User adjusts crop area
// 4. Generate cropped blob
// 5. Compress image (target size: <1MB)
// 6. Upload to Supabase Storage
// 7. Get public URL
// 8. Update profile/product with image URL
```

### Vendor Registration Multi-Step
```typescript
// Step 1: Business Info
// - Business name (required)
// - Service categories (required, at least 1)

// Step 2: Profile Content
// - Profile title (required, can AI generate)
// - About section (required, can AI generate)

// Step 3: Service Details
// - Virtual services (yes/no)
// - In-person services (yes/no)
// - If in-person: zip code and radius (required)
// - Hourly rate (required, min $1)

// Step 4: Photos
// - Profile photo (optional, with crop)
// - Cover photo (optional, with crop)

// Step 5: Account Creation
// - First name (required)
// - Last name (required)
// - Email (required, unique)
// - Phone (required)
// - Password (required, min 6 chars)
// - Confirm password (required, must match)

// On submit:
// 1. Create auth user
// 2. Upload photos to storage
// 3. Create vendor profile (status: pending)
// 4. Send welcome email
// 5. Redirect to thank you page
// 6. Admin reviews and approves
// 7. Send approval email
```

---

## Design Guidelines

### Color Scheme
```typescript
const Colors = {
  primary: '#your-primary-color',      // Brand color
  secondary: '#your-secondary-color',  // Accent color
  background: '#FFFFFF',               // Light mode background
  backgroundDark: '#000000',           // Dark mode background
  text: '#000000',                     // Primary text
  textSecondary: '#666666',            // Secondary text
  border: '#E0E0E0',                   // Borders
  error: '#FF0000',                    // Error messages
  success: '#00FF00',                  // Success messages
  warning: '#FFA500',                  // Warnings
}
```

### Typography
```typescript
const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
}

const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

### Spacing
```typescript
const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}
```

---

## Testing Requirements

### Unit Tests
- Test utility functions
- Test business logic functions
- Test data transformations

### Integration Tests
- Test API calls
- Test database queries
- Test authentication flow

### E2E Tests (Optional)
- Test critical user flows:
  - Login/signup
  - Search and view vendor
  - Send message
  - Leave review
  - Vendor registration

---

## Deployment

### iOS
1. Configure app.json with iOS bundle identifier
2. Build with Expo Application Services (EAS):
   ```bash
   eas build --platform ios
   ```
3. Submit to App Store:
   ```bash
   eas submit --platform ios
   ```
4. App Store requirements:
   - Privacy policy URL
   - Terms of service URL
   - App description and screenshots
   - Age rating

### Android
1. Configure app.json with Android package name
2. Build with EAS:
   ```bash
   eas build --platform android
   ```
3. Submit to Google Play:
   ```bash
   eas submit --platform android
   ```
4. Play Store requirements:
   - Privacy policy URL
   - Terms of service URL
   - App description and screenshots
   - Content rating

---

## Migration Notes from Web to Mobile

### Shared Code
The following can be copied directly from the web app:

1. **TypeScript Types** (`src/types/db.ts`)
   - All database type definitions
   - User, Vendor, Category, Review types

2. **Utility Functions** (`src/lib/utils.ts`)
   - Common helper functions
   - Date formatting
   - String manipulation

3. **Business Logic**
   - Search algorithms
   - Filtering logic
   - Validation schemas (Zod)

4. **API Integration Patterns**
   - Supabase query patterns
   - Error handling
   - Response transformations

### Requires Adaptation

1. **Navigation**
   - Web: Next.js file-based routing
   - Mobile: React Navigation stack/tabs

2. **Styling**
   - Web: Tailwind CSS
   - Mobile: StyleSheet API or styled-components

3. **Forms**
   - Web: Next.js forms with server actions
   - Mobile: React Native form libraries (react-hook-form)

4. **Image Handling**
   - Web: next/image component
   - Mobile: expo-image-picker + Image component

5. **Authentication UI**
   - Web: Form components with Next.js routing
   - Mobile: Native-feeling auth screens with React Navigation

---

## Future Enhancements

### Phase 2 Features
- [ ] In-app booking/scheduling
- [ ] Payment integration (Stripe)
- [ ] Video calls (for virtual consultations)
- [ ] Push notifications
- [ ] Share vendor profiles
- [ ] Report inappropriate content
- [ ] Block users

### Phase 3 Features
- [ ] Vendor analytics dashboard
- [ ] Promoted listings (paid feature)
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Vendor portfolios/galleries
- [ ] Client projects/job postings
- [ ] Service packages (bundled pricing)

---

## Important Notes for Development

1. **Start Simple:** Build MVP features first (auth, browse, search, view profile, message)

2. **Reuse Web API Routes:** Consider keeping the Next.js backend as API server for mobile app, or migrate critical endpoints to Supabase Edge Functions

3. **Real-time First:** Use Supabase Realtime for messaging to avoid building custom WebSocket infrastructure

4. **Image Optimization:** Always compress images before upload to save storage and bandwidth

5. **Error Handling:** Implement comprehensive error handling and user feedback

6. **Loading States:** Show loading indicators for all async operations

7. **Offline Handling:** Handle network errors gracefully

8. **Security:** Never expose service role keys in mobile app

9. **Testing:** Test on both iOS and Android throughout development

10. **Performance:** Profile and optimize list rendering and image loading

---

## Support Resources

### Documentation
- React Native: https://reactnative.dev/docs/getting-started
- Expo: https://docs.expo.dev/
- Supabase: https://supabase.com/docs
- React Navigation: https://reactnavigation.org/docs/getting-started

### Community
- React Native Discord
- Expo Discord
- Supabase Discord
- Stack Overflow

---

## Contact & Questions

When starting development in a new chat, provide this requirements.md file and mention:

1. "I'm building the Burpp mobile app based on requirements.md"
2. What feature you're working on
3. Any specific challenges or questions

The AI will have all the context needed to help you build the app efficiently.

---

**Last Updated:** January 2025
**Version:** 1.0.0





