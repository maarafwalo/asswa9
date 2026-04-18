# Joud Lite

A slimmed-down POS app cloned from `joud-app`. Contains only:

- **POS** — sales / cart / checkout (`/pos`)
- **Stock** — stock intake & editing (`/stock`)
- **Editing** — product editing (`/editing`)
- **Reports** — sales reports (`/reports`)
- **Expenses** — spends & gains (`/expenses`)

Auth (Login, Unauthorized, Install) is kept. Everything else (catalog, customers,
debt, suppliers, partners, surveillance, admin, store-accounts) was stripped.

---

## 1. Local setup

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

## 2. Create a NEW Supabase project

1. Go to https://supabase.com/dashboard and create a **new** project.
2. Copy the **Project URL** and **anon public key** into `.env`.
3. Open the SQL editor and run the contents of `sql/schema.sql`.
   - This creates `profiles`, `products`, `sales`, `sale_items`, `expenses`, `shifts`, `stores`, `settings`, and all RLS policies.
   - *Skip `sql/partner_schema.sql`* — partner features are not in this clone.
4. In **Authentication → Users**, create at least one admin user.
5. In the SQL editor, set their role:
   ```sql
   insert into profiles (id, full_name, role)
   values ('<uuid-from-auth-users>', 'Admin', 'admin')
   on conflict (id) do update set role = excluded.role;
   ```

## 3. Create a NEW GitHub repository

```bash
cd C:\Users\marou\Desktop\joud-lite
git init
git add .
git commit -m "Initial commit — joud-lite clone (POS + Stock + Editing + Reports + Expenses)"

# Option A — with gh CLI (authenticated):
gh repo create joud-lite --private --source=. --push

# Option B — manually on github.com, then:
git remote add origin https://github.com/<you>/joud-lite.git
git branch -M main
git push -u origin main
```

## 4. Deploy to Vercel (new project)

1. Go to https://vercel.com/new and import the new GitHub repo.
2. Framework preset: **Vite**.
3. Add environment variables:
   - `VITE_SUPABASE_URL` → your new Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your new Supabase anon key
4. Deploy. Each push to `main` auto-deploys.

## What was removed vs `joud-app`

- Pages: `catalog/`, `customers/`, `debt/`, `suppliers/`, `admin/`, `surveillance/`, `store-accounts/`, `partner/`
- Stores: `cameraStore`, `permissionsStore`, `partnerOrderStore`, `storeAccountsStore`
- Nav entries and routes for the above
- Partner schema SQL (kept in `sql/` only as reference if you ever need it)

Roles `vendor`, `delivery`, `trusted_partner` are no longer used by any route.
