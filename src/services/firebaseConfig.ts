// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAuth, getAuth } from "firebase/auth";
// Note: getReactNativePersistence might not be available in older Firebase versions
// We'll use getAuth instead for now
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAE_cEZ0LCTwR-bUYw7uUXXDMYvgBmCVzQ",
  authDomain: "ecosteps-aeb56.firebaseapp.com",
  projectId: "ecosteps-aeb56",
  storageBucket: "ecosteps-aeb56.firebasestorage.app",
  messagingSenderId: "89280229835",
  appId: "1:89280229835:web:4ca8a9398613291f84064e",
  measurementId: "G-6NEB53X632"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// Note: Firebase web SDK automatically handles persistence in React Native environments
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const firestore = getFirestore(app);

// Initialize Analytics
let analytics: any = null;
isSupported().then(yes => {
  if (yes) {
    analytics = getAnalytics(app);
  }
});

export { analytics };
export default app; 