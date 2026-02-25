// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAuz271Hp4mVj0p12dq7KpW7ikMdhUGhzQ",
    authDomain: "otanai-web.firebaseapp.com",
    projectId: "otanai-web",
    storageBucket: "otanai-web.firebasestorage.app",
    messagingSenderId: "9868694227",
    appId: "1:9868694227:web:d6f5ec56a42c982a6fba26",
    measurementId: "G-GYFJXZ855P"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
