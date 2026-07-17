import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { firebaseApp } from './config'

export const auth = getAuth(firebaseApp)
const googleProvider = new GoogleAuthProvider()

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmail(displayName: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  return credential
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export function logOut() {
  return signOut(auth)
}
