# GPT Voice Assistant

This app listens for the wake phrase "G.P.T", sends the remaining spoken text to the backend, and reads the AI reply aloud.

## Setup
- Install dependencies: `npm install`
- Install backend dependencies: `cd server && npm install`
- Start backend: `export OPENAI_API_KEY="your-key" && npm start`
- Update `www/assets/app.js` with your backend URL.

## Android build
- Run `npx cap add android`
- Run `npx cap sync android`
- Then open `android/` in Android Studio or run `./gradlew assembleDebug`

This repository includes a GitHub Actions workflow that builds a debug APK artifact automatically.

Build triggered on 2026-10-18 by Copilot. Trigger commit: bump README to start CI.
