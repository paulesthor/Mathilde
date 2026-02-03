# Website Template

This folder contains a complete, functional website template with:
- **Authentication** (Login, Signup)
- **Admin Dashboard** (User management, Stats)
- **CMS Features** (Editable text content)
- **Database Schema** (Supabase)

## Setup Instructions

### 1. Supabase Setup
1.  Create a new project on [Supabase.com](https://supabase.com).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Run the scripts found in the `supabase/` folder in this order:
    -   `schema.sql` (Creates tables and security policies)
    -   `migration-customer-profiles.sql` (Adds extra user fields and role management)
    -   `triggers.sql` (if available, sets up user creation logic)

### 2. Configuration
1.  Open `js/config.js`.
2.  Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your project's credentials (found in Supabase Settings > API).

### 3. Usage
-   **Run Locally**: You need a local server.
    -   Python: `python -m http.server 8000`
    -   Node: `npx serve`
-   **Admin Access**:
    -   Sign up a user.
    -   In Supabase Table Editor (`profiles` table), manually change your user's `role` from `customer` to `admin`.
    -   Refresh the site. You can now edit text by double-clicking and access the Dashboard.

## Customization
-   **Styles**: Edit `css/style.css` variables to change colors and fonts.
-   **Content**: Edit `index.html` structure as needed.
