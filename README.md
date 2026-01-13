# 🏆 Kudos Social - Employee Recognition Platform

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%2014%20|%20Supabase%20|%20Tailwind-blue)

> **A realtime internal social network for celebrating achievements and building company culture.**

---

## 🚀 Live Demo

Experience the application directly here:

### 👉 [https://kudos-social.vercel.app](https://kudos-social.vercel.app/)

---

## 📖 Introduction

**Kudos Social** is a web application designed to foster a positive work environment. It allows team members to send appreciation ("Kudos") to colleagues, visualize contributions through a realtime feed, and gamify engagement with a dynamic leaderboard.

This project showcases my ability to build **complex, realtime, and responsive** full-stack applications using modern web technologies.

---

## ✨ Key Features

### 🚀 Core Functionality

- **Realtime News Feed:** Posts and comments update instantly across all connected clients using **Supabase Realtime** (WebSockets).
- **Social Interactions:** Users can post Kudos with tags, attach images, react (❤️, 👍, 🎉), and comment on posts.
- **Leaderboard System:** Sophisticated ranking system tracking top "Givers" and "Receivers" filtered by Week/Month/All-time.
- **Profile Statistics:** Visualizing user engagement, received kudos, and activity streaks.

### 🎨 UI/UX Design

- **Fully Responsive:** Optimized layout for Desktop (3-column), Tablet (2-column), and Mobile (Bottom Navigation & Drawers).
- **Modern Interface:** Clean design using **Shadcn/ui** and **Tailwind CSS**.
- **Dark/Light Mode:** Seamless theme switching with persistent state.
- **Interactive Animations:** Smooth transitions using **Framer Motion**.

### 🔐 Authentication & Security

- **Robust Auth:** Secure Email/Password login and Sign-up flows powered by Supabase Auth.
- **Password Strength Meter:** Realtime visual feedback on password complexity during registration.
- **Protected Routes:** Middleware to ensure secure access to private pages.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** JavaScript (ES6+)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Shadcn/ui](https://ui.shadcn.com/), Lucide React
- **State Management:** React Context API, SWR (Stale-While-Revalidate)
- **Utilities:** `date-fns` (Time formatting), `canvas-confetti` (Visual effects)

---

## 🚀 Getting Started

Follow these steps to run the project locally:

### 1. Clone and Install

```bash
git clone [https://github.com/ducvuong29/kudos_social.git](https://github.com/ducvuong29/kudos_social.git)
cd kudos_social

npm install
# or
yarn install
```

### 2. Environment Variables

Create a .env.local file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the App

```bash
npm run dev
```
