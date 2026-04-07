import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCiJqzKAOkLaHo_K0RBQptKXZrTVpyq7Lo",
  authDomain: "study-spot-473e2.firebaseapp.com",
  projectId: "study-spot-473e2",
  storageBucket: "study-spot-473e2.firebasestorage.app",
  messagingSenderId: "932882657949",
  appId: "1:932882657949:web:b54b6d1b97818fa6579a74",
  measurementId: "G-C3HZVEYRZP"
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(
    "Firebase config is missing these env vars:",
    missingKeys,
    "\nLoaded config:",
    firebaseConfig
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
