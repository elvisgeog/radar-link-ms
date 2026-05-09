import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfFTb62MUoQu5DDWwaXB1ai0lQTkewqiM",
  authDomain: "radarlinkms.firebaseapp.com",
  projectId: "radarlinkms",
  storageBucket: "radarlinkms.firebasestorage.app",
  messagingSenderId: "821191582592",
  appId: "1:821191582592:web:128019dd1387506ac69765",
  measurementId: "G-HZZHWZVGH9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);