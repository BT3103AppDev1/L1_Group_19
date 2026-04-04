# StudySpot

StudySpot is a Vue + Firebase web app that helps NUS students find suitable study spaces on campus using real-time, crowdsourced updates. Users can browse locations on an interactive Leaflet map, view recent noise and crowd conditions, and submit their own observations to help others decide where to study.

## Features

- Interactive campus map with study location markers
- Real-time submission updates from Firebase Firestore
- Noise rating and crowd level submissions for each location
- Location drawer showing average rating, latest comment, submission count, and recent updates
- Filters for noise level and location type
- Search and sorting for faster discovery
- Basic moderation flow for flagging inaccurate noise comments

## Tech Stack

- Vue 3 with Composition API
- Vite
- Firebase Firestore
- Leaflet and OpenStreetMap

## Project Structure

- `src/components`: UI components such as the map, drawer, filters, form, and submission list
- `src/composables`: shared reactive logic, including Firestore subscriptions
- `src/data`: static campus location metadata
- `src/utils`: helper functions for ratings, sorting, and time formatting

## Run Locally

1. Install dependencies with `npm install`
2. Create a `.env.local` file with your Firebase configuration
3. Start the development server with
 `npm run dev`

## Notes

- Submission data is stored in the `submissions` collection in Firestore
- The app listens for live updates with `onSnapshot`
- Firestore security rules are defined in `firestore.rules`
