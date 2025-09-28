# FlagIt — Expo (React Native) + Gemini + Firebase/Google Cloud

FlagIt is a mobile app that makes **reporting public hazards** fast, accurate, and community-driven. Users attach a photo, add a short description, and **Google Gemini** helps verify whether it’s a real public hazard, improves the wording, and suggests a category. 
The app uses **Firebase**/**Google Cloud** for storage and backend: Firestore (reports, votes, comments), Cloud Storage (images), and (optionally) Cloud Functions (secure AI calls & workflows).

---

## Tech Stack

- **Expo (React Native)** — cross-platform mobile app  
- **Google Gemini API** — vision + text classification and summarization  
- **Firebase** — Firestore (data), Cloud Storage (images), Cloud Functions (backend)  
- **Google Cloud** — project/billing + Generative Language API 

---

## Features

- **AI-Powered Hazard Detection** — automatically classifies photos, validates if it’s a public hazard, and proposes a clean summary.
- **Instant Reporting** — capture or select a photo, add a brief description, and submit in seconds.
- **Verification & Filtering** — AI helps reduce false/duplicate reports; app only posts when `valid_hazard === true`.
- **Community Engagement** — users can upvote/downvote if a hazard still exists and add helpful comments.
- **Real-Time Map View** — see nearby hazards, open details in a modal, and navigate safely.

---

## Getting Started

### 1) Install dependencies
```bash
npm install
# or
yarn install
```

### 2) Environment
Create a .env in the project root:
```bash
# Gemini
GEMINI_API_KEY=your_gemini_key_here

# Firebase (example keys — replace with your values)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=000000000000
FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxxxxxx
```

### 3) Run the app
```bash
npx expo start -c --tunnel
# press i for iOS simulator, a for Android, or scan QR with Expo Go
```

---

## Demo

https://github.com/user-attachments/assets/92e9486d-b31b-4ccd-83e3-1bea18baa11e




