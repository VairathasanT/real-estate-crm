# EstateFlow CRM 

A full-stack Real Estate CRM where a sales team can manage leads, properties, and bookings.


---

## 📋 What You Need Before Starting

Install these three things first. If you already have them, skip to the next section.

### 1. Node.js 

Download from: https://nodejs.org

Check it installed correctly:

```bash
node --version
npm --version
```


### 2. PostgreSQL

Download from: https://www.postgresql.org/download/

During installation, **remember the password you set** — you'll need it in Step 3 below.

The default port is `5432` — you don't need to change this.

### 3. Git

Download from: https://git-scm.com/downloads

Check it installed correctly:

```bash
git --version
```

---

## 🚀 Setup — Follow These Steps In Order

### Step 1: Clone the project

Open a terminal (Command Prompt, PowerShell, or Terminal) and run:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd real-estate-crm
```

> Replace `<YOUR_GITHUB_REPOSITORY_URL>` with your actual repo link before running this.

---

### Step 2: Create the database

Open **pgAdmin** (comes with PostgreSQL) or use the command line, and create a new database called:

```
real_estate_crm
```

If you're using the command line instead of pgAdmin:

```bash
psql -U postgres
```

Then, inside the psql prompt, type:

```sql
CREATE DATABASE real_estate_crm;
```

Type `\q` and press Enter to exit.

---

### Step 3: Set up the backend

```bash
cd backend
npm install
```

Wait for it to finish — this installs all backend dependencies.

---

### Step 4: Create the backend `.env` file

Inside the `backend` folder, create a new file named exactly:

```
.env
```

Paste this into it:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/real_estate_crm"
JWT_SECRET="estateflow_crm_secret_2026"
PORT=5000
```

> ⚠️ Replace `YOUR_PASSWORD` with the PostgreSQL password you set in the prerequisites step.


---

### Step 5: Create the database tables

Still inside the `backend` folder, run:

```bash
npx prisma migrate dev
```

This creates all the tables your app needs. It may ask you to name the migration — you can just type `init` and press Enter.

---

### Step 6: Add demo login accounts

```bash
node prisma/seed.js
```

This creates two test accounts (Admin and Sales Employee) so you can log in right away. You'll find the login details in the [Demo Credentials](#-demo-login-credentials) section below.

---

### Step 7: Start the backend server

```bash
npm run dev
```

Leave this terminal window open and running.

You should see a message saying the server started on port 5000.

**Test it worked:** open your browser and go to:

```
http://localhost:5000
```

You should see:

```json
{ "message": "EstateFlow CRM API is running" }
```

✅ If you see that, your backend is working. Keep this terminal open and move to the next step.

---

### Step 8: Set up the frontend

Open a **new** terminal window (keep the backend one running in the background).

From the project's root folder:

```bash
cd frontend
npm install
```

---

### Step 9: Start the frontend

```bash
npm run dev
```

You'll see a local URL in the terminal, usually:

```
http://localhost:5173
```

Open that link in your browser.

---

## ✅ You're Done!

You now have two terminals running at the same time:

| Terminal | What's running | URL |
|---|---|---|
| Terminal 1 | Backend | http://localhost:5000 |
| Terminal 2 | Frontend | http://localhost:5173 |

**Both must stay open** while you use the app. Closing either one will break the app.

---

## 🔑 Demo Login Credentials

Use these to log in once the app is running:

**Admin account** (full access):
```
Email:    admin@estateflow.com
Password: Admin@123
```

**Sales Employee account** (limited access):
```
Email:    sales@estateflow.com
Password: Sales@123
```


## 📁 Project Structure (for reference)

```
real-estate-crm/
│
├── backend/          → Node.js + Express + PostgreSQL API
│   ├── prisma/        → Database schema & seed data
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   └── .env            → Your database password goes here
│
├── frontend/          → React + Vite user interface
│   └── src/
│       ├── pages/
│       ├── components/
│       └── services/
│
└── README.md
```

---

## ✨ What This App Does

- **Leads**: Create, search, and track potential customers through stages (New → Contacted → Site Visit → Interested → Negotiation → Booked → Lost)
- **Properties**: Manage Projects → Buildings → Units, each with price, type, and availability
- **Bookings**: Connect a lead to an available unit, with built-in protection so two people can't book the same unit at the same time
- **Dashboard**: See leads, follow-ups, and booking stats at a glance
- **Roles**: Admin (full access) and Sales Employee (limited to their own leads and bookings)

---

## 🧪 Quick Test Checklist

Once logged in as Admin, try this to confirm everything works:

1. Go to **Leads** → click **+ Add Lead** → fill it in → save. It should appear in the list.
2. Go to **Properties** → confirm you can see existing projects/buildings/units.
3. Go to **Bookings** → click **+ Create Booking** → pick your new lead and an available unit → save.
4. Go back to **Properties** → the unit you booked should now show as "Booked", not "Available".
5. Go to **Bookings** → click **Cancel** on that booking → the unit should become "Available" again.

---

## Screenshots

The following screenshots demonstrate the main workflows and role-based views of EstateFlow CRM.

### Login

![EstateFlow CRM Login](docs/screenshots/01-Login.png)

### Sales Dashboard

![EstateFlow CRM Dashboard](docs/screenshots/02-Dashboard-1.png)

![EstateFlow CRM Dashboard Pipeline](docs/screenshots/03-Dashboard-2.png)

### Lead Management

![EstateFlow CRM Leads](docs/screenshots/04-Leads.png)

### Property Management

![EstateFlow CRM Properties](docs/screenshots/05-Properties-1.png)

![EstateFlow CRM Property Details](docs/screenshots/06-Properties-2.png)

![EstateFlow CRM Units](docs/screenshots/07-Properties-3.png)

### Booking Management

![EstateFlow CRM Bookings](docs/screenshots/08-Bookings.png)

### Admin Dashboard

![EstateFlow CRM Admin Dashboard](docs/screenshots/Admin-Dashboard.png)

### Admin Property Management

![EstateFlow CRM Admin Properties](docs/screenshots/Admin-Properties.png)

### Admin Booking Management

![EstateFlow CRM Admin Bookings](docs/screenshots/Admin-Bookings.png)

### Employee Management

![EstateFlow CRM Employees](docs/screenshots/Employees-1.png)

![EstateFlow CRM Employee Details](docs/screenshots/Employees-2.png)

## 📄 License

Built as a technical assignment / demo project, for evaluation and demonstration purposes.
