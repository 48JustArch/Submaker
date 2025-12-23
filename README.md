# Submaker SaaS Platform

High-performance audio engineering platform for Subliminal, Morphic, and Supraliminal scalar audio.

## Tech Stack
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Auth**: Supabase Auth (Google OAuth)
- **Deployment**: Vercel

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Deployment to Vercel

The easiest way to deploy is to connect your GitHub repository to Vercel.

1.  Go to [Vercel Dashboard](https://vercel.com/new).
2.  Import the **Submaker** repository.
3.  **Important**: Add the following Environment Variables before clicking Deploy:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4.  Click **Deploy**.
