import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY",
  authDomain: "radarlinkms.firebaseapp.com",
  projectId: "radarlinkms",
  storageBucket: "radarlinkms.appspot.com",
  messagingSenderId: "COLE_SEU_MESSAGING_ID",
  appId: "COLE_SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
