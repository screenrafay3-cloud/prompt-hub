# PromptHub — AI Master Prompt Library 🚀

A modern, high-converting AI master prompt library and engineering vault. Features a public showcase with instant copy capabilities, locked PRO tier workflows with WhatsApp unlock monetization, and a private, password-protected Supabase admin dashboard.

---

## ⚡ Quick Start

1. Open `index.html` in any web browser or serve locally with any static HTTP server:
   ```bash
   npx -y serve .
   ```
2. The website loads immediately in **Preview Mode** with 6 production-grade sample prompts (4 Free, 2 PRO) across varied categories so you can test all features right away.

---

## ⚙️ Configuration (`js/config.js`)

All configuration is centralized in `js/config.js`:

```javascript
export const CONFIG = {
  // 1. Your Supabase Project URL & Public Anon Key
  SUPABASE_URL: 'https://ejpjwadanxojtfxucihf.supabase.co', 
  SUPABASE_ANON_KEY: 'sb_publishable_iHibB14kqPqgU_QuKhlMxg_ZrOLLCTe',

  // 2. WhatsApp unlock contact link
  WHATSAPP_LINK: 'https://wa.me/923334761239',

  // 3. Site Name & Branding
  SITE_NAME: 'PromptHub',
  SITE_TAGLINE: 'Master AI Prompt Library & Engineering Vault',
};
```

---

## 🗄️ Supabase Setup Guide (5 Minutes)

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account or sign in.
2. Click **New Project** and name it `PromptHub`.

### Step 2: Run Database & Storage Schema
1. In your Supabase Dashboard, click on the **SQL Editor** tab on the left.
2. Click **New query**, open the `supabase_schema.sql` file from this project, and paste its entire contents.
3. Click **Run**.
4. This will automatically:
   - Create the `prompts` table with appropriate columns and indices.
   - Configure Row Level Security (RLS): Public read access, authenticated write access.
   - Create the public storage bucket `prompt-images` with RLS policies allowing logged-in admins to upload and manage images.
   - Seed the initial 3 master prompts.

### Step 3: Create Your Admin User
1. In the Supabase Dashboard, go to **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter your desired admin email (e.g. `admin@yourdomain.com`) and a secure password.
4. Set **Auto Confirm User?** to **ON**.
5. Click **Create User**.

### Step 4: Get Your Credentials
1. In your Supabase Dashboard, go to **Project Settings** > **API**.
2. Copy the **Project URL** and the **Project API keys: `anon` `public`**.
3. Paste them into `js/config.js`.

---

## 🛡️ Admin Panel (`/admin` or `admin.html`)

- **Security**: Contains `<meta name="robots" content="noindex, nofollow">` to prevent search engine indexing.
- **Authentication**: Uses Supabase email & password authentication.
- **Dashboard Metrics**: Real-time counter of total prompts, free prompts, PRO prompts, and unique categories.
- **Multi-File Image Uploads**: Upload multiple preview images directly to your Supabase `prompt-images` storage bucket with instant drag-and-drop and removal preview chips.
- **Instant Publishing**: Saving in the admin panel instantly reflects on the public site without needing any code deployments.
- **PRO Lock Toggle**: Easily mark any prompt as PRO with a single click to protect elite prompts and direct customers to WhatsApp.

---

## 💎 Features Checklist

- [x] **Aesthetic Dark Theme**: Tailored obsidian color palette (`#07090e`), neon radial glows, glassmorphic cards.
- [x] **Hero Section**: Master prompt headline, live stats, mobile & desktop search triggers.
- [x] **Smart Filter & Search**: Auto-extracted category filter chips, All/Free/PRO segmented tab controls, and keyboard search shortcut (`/`).
- [x] **Detail Viewer Modal**: Multi-image interactive gallery, syntax-highlighted code block, and one-click copy to clipboard with toast notification.
- [x] **PRO Monetization Flow**: Locked overlay on PRO cards with blurred preview, value proposition, and customizable WhatsApp direct-messaging link.
- [x] **Complete Supabase SQL Setup**: Schema, storage bucket, RLS security policies, and seed data.
