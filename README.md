# FlagIt — Expo (React Native) + Gemini + AWS

FlagIt is a mobile app that makes **reporting public hazards** fast, accurate, and community-driven. Users attach a photo, add a short description, and **Google Gemini** helps verify whether it's a real public hazard, improves the wording, and suggests a category.
The app uses **AWS** for storage and backend: DynamoDB (reports, votes, comments) and S3 (images). The goal of the app is to help people share hazards in their surroundings and notify peopel and municipalities quickly. 

---

## Tech Stack

- **Expo (React Native)** — cross-platform mobile app
- **Google Gemini API** — vision + text classification and summarization
- **AWS DynamoDB** — NoSQL database for storing hazard reports and user interactions
- **AWS S3** — object storage for hazard images 

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
Create a `.env` file in the project root with the following configuration:

```bash
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# AWS DynamoDB Configuration
AWS_REGION=us-east-1 # Location based on your account
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
DYNAMODB_TABLE_NAME=Hazard_flags
S3_BUCKET_NAME=your_s3_bucket_name
```

**Important:** Replace the placeholder values with your actual credentials:
- Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Get your AWS credentials from the [AWS IAM Console](https://console.aws.amazon.com/iam/)
- Ensure your AWS IAM user has permissions for DynamoDB and S3

### 3) Run the app
```bash
npx expo start -c --tunnel
# press i for iOS simulator, a for Android, or scan QR with Expo Go
```

---

## Demo

https://github.com/user-attachments/assets/92e9486d-b31b-4ccd-83e3-1bea18baa11e




