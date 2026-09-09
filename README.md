# Smart Health Hub (48)

Build a full-stack modern web dashboard for a smartwatch IoT system.

🔗 SUPABASE BACKEND

Use Supabase as the database.

Supabase URL:

Paste_your_Supabase_URL_Here

Supabase Anon Key:

Paste_your_Published_Key_here.

Table name: watch_events

Table structure:

event_type (text: "vitals", "steps", "game_score")

heart_rate (integer)

spo2 (integer)

steps (integer)

score (integer)

created_at (timestamp)

📊 DASHBOARD UI

Create a clean, modern dark-themed dashboard.

Layout:

Left side:

Metric cards

Charts

Health alerts

Smart insights box

Right side:

AI chatbot panel

📦 METRIC CARDS (LATEST VALUES)

Display 4 cards:

❤️ Heart Rate

🫁 SpO2

🚶 Steps

🎮 Game Score

Also display:

Last Updated Time

📡 DATA FETCHING

Fetch latest data from Supabase:

For vitals:

filter event_type = "vitals"

For steps:

filter event_type = "steps"

For score:

filter event_type = "game_score"

Sort by:

created_at DESC LIMIT 1

Requirements:

Auto-refresh every 5 seconds

Handle null/missing values safely

📈 CHARTS

Use Recharts (or similar):

Heart Rate → Line chart

SpO2 → Line chart

Steps → Bar or Line chart

Fetch last 20–50 records for charts.

⚠️ HEALTH ALERTS PANEL

Create rule-based alerts:

If heart_rate > 100 → "High heart rate" (Critical)

If heart_rate < 50 → "Low heart rate" (Warning)

If spo2 < 95 → "Low oxygen level" (Critical)

If steps < 500 → "Low activity today" (Warning)

UI:

Red = Critical

Yellow = Warning

Green = Normal

Display alerts as colored cards.

🧠 SMART INSIGHTS BOX

Add a small compact card for quick insights.

Behavior:

Generate a short summary (1–2 lines):

Examples:

"Your vitals look normal 👍"

"Low activity today — consider walking 🚶"

"Heart rate is slightly high — take rest ❤️"

"Oxygen level is low — monitor closely 🫁"

Rules:

Combine multiple conditions if needed

Keep it short and human-friendly

Use emojis

UI:

Place below metric cards

Slight glow or highlight

Smooth fade-in animation

🤖 AI CHATBOT (LOVABLE AI ONLY)

Create a chatbot panel on the right.

Features:

Chat history

Input box

Scrollable UI

IMPORTANT:

Use Lovable AI built-in assistant ONLY

DO NOT use:

Gemini API

OpenAI API

Any external API

CHAT LOGIC:

On user message:

Fetch latest:

heart_rate

spo2

steps

score

Provide context:

User health data:

Heart Rate: {heart_rate}

SpO2: {spo2}

Steps: {steps}

Game Score: {score}

User question: {user_input}

Instruction:

Give short, helpful health insights

Avoid medical diagnosis

Keep responses simple and conversational

Display response in chat UI.

🎨 UI/UX DESIGN

Tailwind CSS

Dark theme

Glassmorphism style

Rounded cards

Smooth animations

Responsive for:

Desktop

Mobile

⚙️ FEATURES

Auto-refresh toggle (ON/OFF)

Manual refresh button

Loading states (spinners/skeletons)

Error handling (Supabase failure)

🔒 SECURITY

Assume Supabase RLS is enabled

Use anon key for read-only access

Do not expose sensitive data

🎯 FINAL GOAL

Build a real smartwatch-style dashboard with:

Live vitals

Charts

Alerts

Smart insights box

AI chatbot (Lovable AI)

Clean modern UI

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/49aceff1-7fb1-43f9-86f4-b892a98527ff).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
