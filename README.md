# HyperScripter

AI-powered TikTok script generator built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Clerk

1. Create a free app at [clerk.com](https://clerk.com)
2. Copy `.env.example` to `.env.local` and add your keys
3. Enable **Email + Password** and **Google** under User & Authentication → Email, Phone, Username
4. (Optional) Customize session token to include `publicMetadata` for middleware role checks:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

### 3. Set user roles (publicMetadata)

In the Clerk Dashboard → Users → select a user → **Public metadata**:

```json
{
  "role": "user",
  "plan": "free"
}
```

For admin access:

```json
{
  "role": "admin",
  "plan": "pro"
}
```

Supported roles: `user`, `admin`  
Supported plans: `free`, `pro`, `team` (ready for Stripe billing)

Future metadata fields: `stripeCustomerId`, `stripeSubscriptionId`, `teamId`

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Authentication

| Route | Methods | Redirect |
|-------|---------|----------|
| `/login` | Google, Email + Password | `/dashboard` |
| `/signup` | Google, Email + Password | `/dashboard` |
| `/admin/login` | Email + Password only | `/admin` |

## Route protection

- `/dashboard/*` — authenticated users
- `/admin/*` — users with `publicMetadata.role = "admin"`

## Features

- AI TikTok Script Generator (Hook, Script, CTA, Caption, Hashtags)
- Plan-based feature gating (Free, Pro, Team)
- Dark mode first design with glassmorphism
- Clerk authentication with role metadata

## Tech Stack

- Next.js 15 (App Router)
- Clerk authentication
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Recharts

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
