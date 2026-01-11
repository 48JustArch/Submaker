# Google Authentication Setup Guide

To make the "Continue with Google" button work, you must configure Google Cloud correctly. You cannot use fake keys.

## Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a **New Project** (name it "Submaker" or similar).

## Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in:
   - **App Name**: Submaker
   - **User Support Email**: Your email
   - **Developer Contact Email**: Your email
4. Click **Save and Continue** (skip Scopes and Test Users for now/defaults are fine).
5. On the Summary page, click **Back to Dashboard**.

## Step 3: Create Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **OAuth client ID**.
3. Application Type: **Web application**.
4. Name: "Supabase Auth".
5. **Authorized JavaScript origins**:
   - Add: `https://eobykiueasdvvkpnctlz.supabase.co`
   - (Optional for local testing): `http://localhost:3000`
6. **Authorized redirect URIs**:
   - Add: `https://eobykiueasdvvkpnctlz.supabase.co/auth/v1/callback`
7. Click **Create**.

## Step 4: Copy Keys to Supabase
1. You will see "Your Client ID" and "Your Client Secret".
2. Go to your **Supabase Dashboard** > **Authentication** > **Providers** > **Google**.
3. Paste the **Client ID** and **Client Secret**.
4. Click **Save**.

## Step 5: Troubleshooting "Failed to fetch"
If you see "Failed to fetch" when trying to log in:
1. Go to **Supabase Settings** > **API**.
2. Copy the **Project URL**.
3. Copy the **anon / public** key (ensure you copy the *entire* key).
4. Open the file `.env.local` in your project folder.
5. Ensure it looks exactly like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://eobykiueasdvvkpnctlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_copied_key_here
```

6. Restart the server (`npm run dev`).
