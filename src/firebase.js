import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrAphGX0xLgR5m3mSWtJFnz5T690vcwcA",
  authDomain: "catchup-app-41948.firebaseapp.com",
  projectId: "catchup-app-41948",
  storageBucket: "catchup-app-41948.firebasestorage.app",
  messagingSenderId: "799358860463",
  appId: "1:799358860463:web:8edbe208c0cd160c23e85a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);