import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    signInWithRedirect,
    getRedirectResult,
    sendPasswordResetEmail,
    sendEmailVerification
} from "firebase/auth";

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
        // Fallback to redirect if popup is blocked or fails due to COOP
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.message.includes('COOP')) {
            await signInWithRedirect(auth, googleProvider);
        }
        throw error;
    }
};

export const registerWithEmail = async (email, password, displayName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (displayName) {
            await updateProfile(user, { displayName });
        }
        // Send verification email
        try {
            await sendEmailVerification(user);
            console.log("Verification email sent to:", email);
        } catch (e) {
            console.error("Failed to send verification email:", e);
        }
        return user;
    } catch (error) {
        throw error;
    }
};

export const loginWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

export const sendPasswordReset = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

export { onAuthStateChanged, signOut, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, sendEmailVerification };
