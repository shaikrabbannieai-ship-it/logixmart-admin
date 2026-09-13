import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCORCBIcLAqxlaMs3Wsx1vDBsLAfGPzaYI",
  authDomain: "ecommerceplatform-27500.firebaseapp.com",
  projectId: "ecommerceplatform-27500",
  storageBucket: "ecommerceplatform-27500.firebasestorage.app",
  messagingSenderId: "572520355087",
  appId: "1:572520355087:web:be5b04f9ad277c50921a7a",
  measurementId: "G-RZBFQBE4KB"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;