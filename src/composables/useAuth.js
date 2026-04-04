import { ref } from "vue";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const user = ref(null);
const authError = ref(null);
const isAuthLoading = ref(true);

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser;
  isAuthLoading.value = false;
  authError.value = null;
});

async function login(email, password) {
  authError.value = null;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    authError.value = err;
    throw err;
  }
}

async function signup(email, password) {
  authError.value = null;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    authError.value = err;
    throw err;
  }
}

async function logout() {
  authError.value = null;

  try {
    await signOut(auth);
  } catch (err) {
    authError.value = err;
    throw err;
  }
}

export function useAuth() {
  return {
    user,
    authError,
    isAuthLoading,
    login,
    signup,
    logout,
  };
}
