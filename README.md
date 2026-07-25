**CareerGo AI**

CareerGo AI is a web app that helps fresh graduates figure out which jobs they're actually qualified for, generate a tailored cover letter for any listing in seconds, and keep track of every application in one place — all powered by AI.


**Live Deployed Application**

🔗Live Site URL: https://career-go-whnb.vercel.app/


**The Problem & Solution**

Fresh graduates entering the job market face **three recurring problems:**

**1.** They don't know how well their skills and education actually match a given job posting, and often either avoid applying (assuming they're unqualified) or waste time applying to roles they have no real fit for.

**2.** Writing a genuine, tailored cover letter for every application takes time most students don't have, especially when applying to dozens of roles.

**3.** Applications pile up across different companies and stages, and it becomes hard to remember what was applied to, and where things stand.

**CareerGo AI solves** this for fresh graduates and students actively job-hunting by turning a one-time profile into instant, AI-generated fit scores and cover letters for any job, plus a simple tracker to stay organized — all in the browser, with no signup friction if the user doesn't want one.

**Features of CareerGo Web App**

**Account system:** Sign up, log in, or continue as a guest (all stored locally, no backend database required)

**Profile builder:**  Enter name, education, skills, and a short bio once; reused across every job

**Job board:** Browse sample job listings or add your own by pasting in a job description

**AI Fit Score:** Instantly see a 0–100 fit score for any job, with matched strengths, skill gaps, and a personalized tip.

**AI Cover Letter Generator:** Generate a tailored, ready-to-edit cover letter draft for any job in one click.

**Application Tracker:** Save jobs and track their status (Saved / Applied / Interview / Rejected).

**Responsive design:** Works on both desktop and mobile browsers.

**Offline-friendly fallback:** If the AI service is temporarily unavailable, the app gracefully falls back to a locally computed fit estimate so the experience never breaks.


**The AI Feature/AI Integration**

CareerGo AI's core intelligence is powered by the Groq API, called through a serverless backend function (/api/ai.js) so the API key is never exposed to the browser.

There are two AI modes:

**1. Fit Score**

Given the user's saved profile and a job's description, the AI returns a structured JSON response: a 0–100 score, matched strengths, skill gaps, and one actionable tip.

System **prompt** used:

     You are a career advisor helping a fresh graduate evaluate how well they fit a job posting.
    Given the candidate's profile and a job description, respond ONLY in valid JSON with this shape and nothing else:
    
    
{
  "score": <integer 0-100>,
  
  "strengths": ["...", "..."],
  
  "gaps": ["...", "..."],
  
  "tip": "..."
  
}


Be honest and specific — reference actual skills from the profile and requirements from the job description. Do not be generically encouraging; give a realistic assessment appropriate for someone with little to no work experience.

**2. Cover Letter Generator**
Given the same profile and job description, the AI writes a genuine, non-generic cover letter draft.

System **prompt** used:

   You are an expert career writing assistant helping a fresh graduate write a cover letter for a specific job.
Given the candidate's profile and a job description, write a concise, genuine, non-generic cover letter (150-250 words) that:

**->** Opens with why they're interested in this specific role/company

**->** Connects 2-3 of their actual skills/experiences to the job's requirements

**->** Acknowledges they are early-career without apologizing for it

**->** Closes with a confident call to action

**->** Return plain text only, no markdown formatting, no placeholders like [Company Name] — use the real details provided.

**Model used:** llama-3.3-70b-versatile via Groq's chat completions endpoint.

**Tools, Services & Technologies Used**

**Frontend:** HTML5, CSS3, vanilla JavaScript

**Backend:** Vercel Serverless Functions (Node.js) for secure AI API calls

**AI Provider:** Groq API (llama-3.3-70b-versatile model)

**Storage:** Browser localStorage (profiles, accounts, job listings, tracker data — no external database)

**Hosting/Deployment:** Vercel

**Development environment:** Visual Studio Code, Vercel CLI (vercel dev) for local testing

**Version control:**  Git & GitHub


**ScreenShots**

**Home page/Dashboard**

<img src="https://raw.githubusercontent.com/laibanawaz248/CareerGo/main/Screenshots%20of%20website/Screenshot%202026-07-24%20204632.png" width="800"/>

**SignUp Screen**

<img src="https://raw.githubusercontent.com/laibanawaz248/CareerGo/main/Screenshots%20of%20website/Screenshot%202026-07-24%20205038.png" width="800"/>

**Login Screen**

<img src="https://raw.githubusercontent.com/laibanawaz248/CareerGo/main/Screenshots%20of%20website/Screenshot%202026-07-24%20205112.png" width="800"/>

**Build Profile**

<img src="https://raw.githubusercontent.com/laibanawaz248/CareerGo/main/Screenshots%20of%20website/Screenshot%202026-07-24%20205158.png" width="800"/>

 **Explore jobs**

<img src="https://raw.githubusercontent.com/laibanawaz248/CareerGo/main/Screenshots%20of%20website/Screenshot%202026-07-24%20205231.png" width="800"/>

  **Job Details Screen**

<img src="https://raw.githubusercontent.com/laibanawaz248/CareerGo/main/Screenshots%20of%20website/Screenshot%202026-07-24%20205302.png" width="800"/>

  **Fit Score & Cover Letter Screen**

<img src="https://raw.githubusercontent.com/laibanawaz248/CareerGo/main/Screenshots%20of%20website/Screenshot%202026-07-24%20205349.png" width="800"/>

 **Application Tracker**

<img src="https://raw.githubusercontent.com/laibanawaz248/CareerGo/main/Screenshots%20of%20website/Screenshot%202026-07-24%20205435.png" width="800"/>


**How to Run This Project Locally**

**Step 1: Clone the Repository**

git clone https://github.com/laibanawaz248/CareerGo.git cd CareerGo

**Step 2: Get a Groq API Key**

Go to the Groq Console.

Log in and open the API Keys section.

Click Create API Key.

Copy the generated API key.

Create a **.env file** in the project root and add:

**GROQ_API_KEY**=your_actual_groq_api_key_here

**Step 3: Run Locally (Optional)**

To test the serverless function locally, use the Vercel CLI:

Open a **terminal**inside the project directory:

npm install -g vercel
vercel dev

This starts a local server where both the static frontend and the /api/ai serverless function work exactly as they will in production.

**Step 4: Pushing to GitHub**

Open your terminal and run:

 **Command in VS terminal**
 
git add .

git commit -m "first commit"

git config --global user.name "Laiba Nawaz"

git config --global user.email "example@gmail.com"

git pull origin main --allow-unrelated-histories

git add .

git commit -m "connect local and github"

Create a**new repository on** https://github.com/ then run:

git remote add origin https://github.com/YOUR_GITHUB_USERNAME/careergo.git
git branch -M main
git push -u origin main

**Step 5: Deploy to Vercel**

Log in to Vercel (
https://vercel.com )

Click **Add New > Project** and import your careergo-ai GitHub repository.

In the project settings configuration block:

Expand the **Environment Variables**section.

Add an environment variable named GROQ_API_KEY and paste your Groq API key as the value.

Click **Deploy**.

Vercel will build and serve your static app files alongside the serverless function with zero additional build configuration.









