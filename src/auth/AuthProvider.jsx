import { useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth'
import { AuthContext } from './AuthContext.js'
import { auth } from '../firebase.js'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const value = useMemo(() => {
    const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
    const signOutUser = () => signOut(auth)

    return {
      currentUser,
      authLoading,
      isAuthenticated: Boolean(currentUser),
      isGuestMode: !authLoading && !currentUser,
      signInWithGoogle,
      signOutUser
    }
  }, [authLoading, currentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
