import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDb1P4fQWyCeT1ue0ZCuqBAmTcPvCT6twU",
    authDomain: "storagepods-adfd8.firebaseapp.com",
    projectId: "storagepods-adfd8",
    storageBucket: "storagepods-adfd8.firebasestorage.app",
    messagingSenderId: "360847001960",
    appId: "1:360847001960:web:cb31e6f10f06fc0625eedd",
    measurementId: "G-758EPLJ3C3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        throw error;
    }
};
