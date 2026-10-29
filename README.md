# SMART HACKATHON TEAM FINDER
## Skill-Based Matching and Collaboration Platform for Walchand College of Engineering, Sangli
### Mini-Project II • Department of Computer Science & Engineering • Academic Year 2026

---

## 1. Project Overview

The **Smart Hackathon Team Finder** is a web platform designed specifically for students at **Walchand College of Engineering, Sangli (WCE Sangli)** to discover suitable hackathon teammates, balance project team compositions, delegate tasks, conduct peer evaluations, and measure project-specific collaboration reliability.

### Key Capabilities
- **Strict Walchand Email Verification:** Restricts registration exclusively to `name.surname@walchandsangli.ac.in` domain patterns.
- **Zero Administrator Approval:** Registration provides instant account activation and immediate dashboard access.
- **Secure Cloudinary ID Storage:** Student ID card photos are stored in Cloudinary folder `smart-hackathon-team-finder/id-cards` with restricted delivery (never exposed publicly).
- **Deterministic Smart Matching:** Calculates candidate match scores using the deterministic formula:
  $$\text{Match Score} = 0.40S + 0.20E + 0.20D + 0.20A$$
- **Team-Balance Analysis:** Computes Role Coverage (%) and Skill Coverage (%) across active team members to surface missing competencies.
- **Task & Sprint Management:** Team leaders assign tasks with deadlines, overdue alerts, and completion tracking.
- **Dual Evaluation System:** Team leader rubric evaluations and confidential peer reviews (strict prohibition of self-evaluation).
- **Transparent Reliability Score:** Project-specific collaboration metric computed as:
  $$\text{Reliability Score} = 0.50T + 0.30D + 0.20P$$
- **Scope Compliance:** Strict exclusion of resume uploads, administrator approval queues, and project-review forms.

---

## 2. Technology Stack

- **Frontend:** React 19, JSX, Vite, Tailwind CSS v4, Lucide React.
- **Backend:** Node.js, Express.js (REST APIs under `/api`), JavaScript (ES Modules).
- **Database:** MongoDB Atlas with Mongoose schemas (includes in-memory fallback store for local development).
- **Authentication:** bcrypt password hashing, JSON Web Tokens (JWT) with Authorization Bearer header.
- **Image Storage:** Cloudinary Node.js SDK for student ID card photos with authenticated asset mode.
- **Testing:** Automated test suite (`server/tests/runTests.js`) covering all 20 required verification points.

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env`:

```env
PORT=3000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/wce_team_finder?retryWrites=true&w=majority"
JWT_SECRET="wce-sangli-hackathon-team-finder-jwt-secret-2026-key"

# Cloudinary Credentials for Student ID Card Storage
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

CLIENT_ORIGIN="http://localhost:3000"
APP_URL="http://localhost:3000"
```

### MongoDB Atlas Setup Guide
1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster (e.g. M0 sandbox).
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere) or your current development IP.
5. In your cluster view, click **Connect** -> **Drivers (Node.js)** and copy the connection string into `MONGODB_URI`.

### Cloudinary Setup Guide
1. Sign up for a free account at [Cloudinary](https://cloudinary.com).
2. From the Cloudinary Dashboard, copy:
   - **Cloud Name** -> `CLOUDINARY_CLOUD_NAME`
   - **API Key** -> `CLOUDINARY_API_KEY`
   - **API Secret** -> `CLOUDINARY_API_SECRET`
3. Student ID card photos will automatically upload to the dedicated asset folder `smart-hackathon-team-finder/id-cards`.
4. If credentials are not yet entered, the server automatically uses secure vault mode so development and registration testing proceed seamlessly without interruption.

---

## 4. Deterministic Algorithmic Formulas

### A. Smart Candidate Matching Engine
$$\text{Match Score} = 0.40S + 0.20E + 0.20D + 0.20A$$

- **$S$ (Skill Match Score, 0–100):** Compares required skills against candidate skills with proficiency weights (Beginner: 0.6, Intermediate: 0.8, Advanced: 0.95, Expert: 1.0) and mandatory skill weighting (1.5x).
- **$E$ (Experience Match Score, 0–100):** Compares candidate experience tier with project preferred tier (Exact/higher = 100, 1 tier below = 75, 2 tiers below = 50, 3 tiers below = 25).
- **$D$ (Domain & Interest Match Score, 0–100):** Evaluates overlap between student interest tags and project domain keywords.
- **$A$ (Availability Match Score, 0–100):** Evaluates candidate availability against project sprint expectations.

### B. Team-Balance Analysis
$$\text{Role Coverage (\%)} = \left(\frac{\text{Required Roles Covered}}{\text{Total Required Roles}}\right) \times 100$$
$$\text{Skill Coverage (\%)} = \left(\frac{\text{Required Skills Covered}}{\text{Total Required Skills}}\right) \times 100$$

### C. Reliability Score Calculation
$$\text{Reliability Score} = 0.50T + 0.30D + 0.20P$$

- **$T$ (Task Completion Percentage, 0–100):** $\left(\frac{\text{Completed Tasks}}{\text{Total Assigned Tasks}}\right) \times 100$
- **$D$ (On-Time Completion Percentage, 0–100):** $\left(\frac{\text{Completed Tasks Finished On Time}}{\text{Total Completed Tasks}}\right) \times 100$
- **$P$ (Normalized Peer Evaluation Score, 0–100):**
  $$P = \left(\frac{\text{Average Peer Rating} - 1}{4}\right) \times 100$$
- **Safeguards Active:**
  - Zero assigned tasks $\rightarrow$ marked as "Insufficient Data" (no score fabrication).
  - Ongoing project $\rightarrow$ marked as "Provisional".
  - Component contribution breakdown displayed with full transparency.

---

## 5. Setup Guide for Ubuntu Linux

Follow these step-by-step instructions in your Ubuntu terminal:

### Step 1: Install Node.js (v18 or v20) & Git
```bash
# Update package list
sudo apt update

# Install curl and git if not already installed
sudo apt install -y curl git

# Install Node.js LTS (v20) via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions (Node should be >= 18, npm >= 9)
node -v
npm -v
```

### Step 2: Download or Clone the Project
```bash
# Navigate to your workspace folder
cd ~/Projects   # or cd ~

# If cloned from Git:
# git clone <your-repo-url> wce-team-finder
# cd wce-team-finder

# If you downloaded the zip, extract it and navigate inside:
cd /path/to/extracted/folder
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Configure Environment Variables
Create a file named `.env` in the project root directory:
```bash
nano .env
```
Paste your configuration into `.env`:
```env
PORT=3000
MONGODB_URI="mongodb+srv://hackteam:Hackteam%40123@cluster0.9dvxfih.mongodb.net/wce_team_finder?retryWrites=true&w=majority"
JWT_SECRET="wce-sangli-hackathon-team-finder-jwt-secret-2026-key"

# Cloudinary Credentials for Student ID Card Storage
CLOUDINARY_CLOUD_NAME="dubw6eyod"
CLOUDINARY_API_KEY="586131975419977"
CLOUDINARY_API_SECRET="rfakcHjMgHxPUCp7M4uazImIcf4"

CLIENT_ORIGIN="http://localhost:3000"
APP_URL="http://localhost:3000"
```
*(Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit nano).*

### Step 5: Run the Automated Test Suite
Verify that all 20 test cases pass:
```bash
npm test
```

### Step 6: Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
**`http://localhost:3000`**

---

## 6. Testing & Demonstration Workflow

1. **Student Registration:**
   - Click **Register** on the top right.
   - Enter your name, Walchand email (`name.surname@walchandsangli.ac.in`), select your Department (e.g. *Artificial Intelligence & Machine Learning (AIML)*, *Computer Science & Engineering*, *Robotics and Automation*), Academic Year, and technical skills.
   - Attach a student ID card photo (automatically saved to Cloudinary).
   - Your account is activated instantly with zero administrator approval.

2. **Creating a Project (Team Leader):**
   - Click **Create Project** to define a hackathon idea, domain, problem statement, required skills, and team roles.
   - As project leader, the **Team Leader Dashboard** opens automatically showing candidate matching and team balance (Role & Skill Coverage %).

3. **Collaboration & Tasks:**
   - Create sprint tasks, assign them to teammates, set deadlines, and track on-time completion.
   - Submit confidential peer reviews and leader rubric evaluations.

---

## 7. Free ($0 / Zero Money) Publishing Guide

You can publish this full-stack application online for free with **zero credit card required** using one of the methods below:

### Method 1: Instant Live URL (Ready Right Now)
Your application is already hosted and accessible online:
- **Live URL:** `https://ais-pre-yqpyeh44x7bbnd7bd6sa6z-710691310087.asia-northeast1.run.app`
You can copy this link and share it directly with teachers, evaluators, and students immediately.

---

### Method 2: Deploy to Render.com (Recommended Free Full-Stack Host)
Render provides free hosting for Node.js + Express + React full-stack apps with free HTTPS/SSL and a custom `.onrender.com` domain.

#### Step 1: Push your project to GitHub (Free)
In your VS Code terminal in Ubuntu:
```bash
git init
git add .
git commit -m "Deploy Smart Hackathon Team Finder"
```
1. Go to [GitHub.com](https://github.com) and create a **New Repository** (e.g. `smart-hackathon-team-finder`), set it to **Public**.
2. Run the commands shown by GitHub to push your code:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/smart-hackathon-team-finder.git
git push -u origin main
```

#### Step 2: Create a Free Web Service on Render
1. Go to [Render.com](https://render.com) and click **Sign Up** (choose **Continue with GitHub**).
2. On your Render dashboard, click **New +** -> **Web Service**.
3. Select your GitHub repository (`smart-hackathon-team-finder`) and click **Connect**.
4. Fill in these settings:
   - **Name:** `smart-hackathon-team-finder`
   - **Region:** Singapore or Oregon
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` ($0/month)
5. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `wce-sangli-hackathon-team-finder-jwt-secret-2026-key`
   - `MONGODB_URI` = *(your MongoDB Atlas connection string)*
   - `CLOUDINARY_CLOUD_NAME` = *(your Cloudinary cloud name)*
   - `CLOUDINARY_API_KEY` = *(your Cloudinary API key)*
   - `CLOUDINARY_API_SECRET` = *(your Cloudinary API secret)*
6. Click **Deploy Web Service**.
7. In ~2-3 minutes, your site will be live at `https://smart-hackathon-team-finder.onrender.com`!

---

### Method 3: Alternative Free Hosts
- **Koyeb (Free Eco Tier):** Supports Docker / Node.js builds with free automated global CDN.
- **Glitch / Railway (Free starter hours):** Instant Node.js execution.
- **Vercel / Netlify:** Great for frontend static builds (connect backend API URL via `VITE_API_URL`).
