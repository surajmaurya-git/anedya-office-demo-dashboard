# Anedya Dashboard Canvas

A modern, production-ready IoT dashboard built with React, Vite, Tailwind CSS, Supabase, and Anedya.

This dashboard gives you real-time data visualization, historical trend analysis, remote device control, and multi-user access management right out of the box.

![Screenshot](screenshot.png) _(Note: Replace with your actual screenshot later)_

## ✨ Features

- **Dynamic Dashboard Builder:** Drag-and-drop to customize gauge charts, line graphs, and control switches.
- **Real-time Synchronization:** Get instant sensor updates powered by Anedya.
- **Secure Access Control:** Admin vs User roles, Row Level Security (RLS) ensures users only see what they're assigned to.
- **Zero-Config Deployment:** Automatic database migration and API deployment using GitHub Actions.

---

## 🚀 One-Click Deployment (Recommended)

You can deploy the entire stack—Frontend, Database, and Edge Functions—in a few minutes without touching the command line.

### Step 1: Prepare Your Supabase Project

1. Create a free account and project on [Supabase](https://supabase.com).
2. Note your **Project URL** and **anon key** (Settings → API).
3. Note your **Project Reference ID** (the random string in your URL like `https://[xyz123].supabase.co`).
4. Generate and note an **Access Token** Account Settings → Access Tokens[Link](https://supabase.com/dashboard/account/tokens).

### Step 2: Prepare Your Anedya Project

1. Create a project on [Anedya](https://anedya.io).
2. Generate an **API Key**.

### Step 3: Fork and Automate ⚙️

We use GitHub Actions to automatically build your database and deploy the edge APIs.

1. **Fork this repository** to your own GitHub account.
2. Go to your fork's **Settings → Secrets and variables → Actions**.
3. Add these three **New repository secrets**:
   - `SUPABASE_ACCESS_TOKEN` (From Step 1)
   - `SUPABASE_PROJECT_ID` (From Step 1)
   - `SUPABASE_DB_PASSWORD` (Your database password)
4. Go to the **Actions** tab in GitHub at the top of your repository.
5. On the left side, under "Workflows", click on **"🚀 Deploy to Supabase"**.
6. On the right side, click the gray **"Run workflow ▾"** dropdown, and then click the green **"Run workflow"** button.

> ✅ _This will instantly create all database tables, policies, and API endpoints for your frontend to use._

### Step 4: Deploy the Frontend

Click the button below to deploy your frontend to Vercel for free.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsurajmaurya-git%2Fanedya-react-iot-dashboard&env=VITE_SUPABASE_PROJECT_URL,VITE_SUPABASE_ANON_KEY,VITE_ANEDYA_API_KEY&envDescription=Find%20Supabase%20keys%20in%20Project%20Settings%20%E2%86%92%20API.%20Find%20Anedya%20key%20in%20your%20Anedya%20project.&envLink=https%3A%2F%2Fgithub.com%2Fsurajmaurya-git%2Fanedya-react-iot-dashboard%23environment-variables&project-name=anedya-iot-dashboard&repository-name=anedya-iot-dashboard)

During deployment, Vercel will ask for:

- `VITE_SUPABASE_PROJECT_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ANEDYA_API_KEY`

### Step 5: Run the Setup Wizard

1. Visit your new Vercel URL.
2. The login page will automatically detect that no admin exists and prompt you to run the **Initial System Setup**.
3. Create your admin account. The setup page will then permanently disable itself for security.
4. **Done!** You can now log in, invite users, and bind Anedya edge devices.

---

## 💻 Local Development

If you'd prefer to run the code locally:

```bash
# 1. Clone the repo
git clone https://github.com/surajmaurya-git/anedya-react-iot-dashboard.git
cd anedya-react-iot-dashboard

# 2. Install dependencies
npm install

# 3. Add your environment variables
cp .env.example .env
# Edit .env with your keys

# 4. Run the development server
npm run dev
```

### 🔐 Pre-commit Secret Scan

This repo uses Husky to run `npm run scan:secrets` before every commit.

- It scans staged files for common credential patterns (private keys, access tokens, API key/password assignments, and URLs with embedded credentials).
- Commits are blocked when a match is found.
- Keep real credentials in `.env` (already git-ignored) and only commit placeholder values to tracked files.

### Manual Database Setup (CLI)

If you don't want to use GitHub Actions, you can push the automated database setup manually using the Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
supabase db push
supabase functions deploy create-user --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt
supabase functions deploy setup-admin --no-verify-jwt
```

## 🛠 Tech Stack

- **React 18** with **Vite**
- **Tailwind CSS** + **shadcn/ui** for styling
- **Supabase** (Postgres DB, Auth, Edge Functions, RLS Policies)
- **Anedya** (IoT Telemetry, Value Store synchronization)
- **React Router** for secure routing
- **Lucide React** for icons
