import React, { useState } from 'react'
import { db } from '../firebase'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'

export default function AuthModal({ onAuthSuccess, allUsers = [] }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Hash password using SHA-256
  const hashPassword = async (value) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(value)

    const hashBuffer = await window.crypto.subtle.digest(
      'SHA-256',
      data
    )

    const hashArray = Array.from(new Uint8Array(hashBuffer))

    return hashArray
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  // Find an existing user
  const findUser = async (cleanUser) => {
    // 1. Check users already loaded by App.jsx
    const localUser = allUsers.find((user) => {
      if (!user || typeof user !== 'object') {
        return String(user).toLowerCase() === cleanUser
      }

      const userId = String(user.id || '').toLowerCase()
      const usernameValue = String(user.username || '').toLowerCase()
      const nameValue = String(
        user.name || user.displayName || ''
      ).toLowerCase()

      return (
        userId === cleanUser ||
        usernameValue === cleanUser ||
        nameValue === cleanUser
      )
    })

    if (localUser) {
      return localUser
    }

    // 2. Check the user document directly
    const userRef = doc(db, 'users', cleanUser)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data()
      }
    }

    // 3. Check by username
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', cleanUser)
    )

    const usernameSnap = await getDocs(usernameQuery)

    if (!usernameSnap.empty) {
      const matchedDoc = usernameSnap.docs[0]

      return {
        id: matchedDoc.id,
        ...matchedDoc.data()
      }
    }

    // 4. Check by display/name
    const nameQuery = query(
      collection(db, 'users'),
      where('name', '==', username.trim())
    )

    const nameSnap = await getDocs(nameQuery)

    if (!nameSnap.empty) {
      const matchedDoc = nameSnap.docs[0]

      return {
        id: matchedDoc.id,
        ...matchedDoc.data()
      }
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    const cleanUser = username.trim().toLowerCase()
    const cleanPass = password

    // Validation
    if (!cleanUser || !cleanPass) {
      setError('Please provide both a username and password.')
      return
    }

    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters long.')
      return
    }

    if (cleanPass.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setError('')
    setLoading(true)

    try {
      // =========================
      // REGISTER
      // =========================
      if (isRegistering) {
        const userRef = doc(db, 'users', cleanUser)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          setError(
            'Username already taken. Please choose another or Log In.'
          )
          return
        }

        const passwordHash = await hashPassword(cleanPass)

        const newUser = {
          id: cleanUser,
          username: cleanUser,
          name: cleanUser,
          passwordHash,
          createdAt: Date.now(),
          avatar: '',
          bio: '',
          friends: []
        }

        await setDoc(userRef, newUser)

        onAuthSuccess(newUser)

        setUsername('')
        setPassword('')
        return
      }

      // =========================
      // LOGIN
      // =========================
      const targetUser = await findUser(cleanUser)

      if (!targetUser) {
        setError(
          'Account not found. Please click Create an Account.'
        )
        return
      }

      const passwordHash = await hashPassword(cleanPass)

      // New account using passwordHash
      if (targetUser.passwordHash) {
        if (targetUser.passwordHash !== passwordHash) {
          setError('Incorrect password. Please try again.')
          return
        }
      }

      // Support older accounts that used plaintext passwords
      else if (targetUser.password) {
        if (targetUser.password !== cleanPass) {
          setError('Incorrect password. Please try again.')
          return
        }

        const userId = String(
          targetUser.id ||
          targetUser.username ||
          cleanUser
        )

        const userRef = doc(db, 'users', userId)

        await updateDoc(userRef, {
          passwordHash,
          password: null
        })

        targetUser.passwordHash = passwordHash
        delete targetUser.password
      }

      // No valid credentials
      else {
        setError(
          'This account does not have valid login credentials.'
        )
        return
      }

      onAuthSuccess(targetUser)

      setUsername('')
      setPassword('')
    } catch (err) {
      console.error('Authentication error:', err)

      setError(
        'Unable to complete the request. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsRegistering((previous) => !previous)
    setUsername('')
    setPassword('')
    setError('')
    setShowPassword(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">

        {/* Header */}
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-bold text-stone-900">
            {isRegistering
              ? 'Create Your Account'
              : 'Welcome to CatchUp'}
          </h2>

          <p className="text-sm text-stone-500">
            {isRegistering
              ? 'Choose your own username and password to get started.'
              : 'Sign in with your registered credentials.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-xs font-semibold uppercase text-stone-600"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold uppercase text-stone-600"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter your password"
                autoComplete={
                  isRegistering
                    ? 'new-password'
                    : 'current-password'
                }
                disabled={loading}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-16 outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-stone-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-amber-700 hover:text-amber-900 disabled:opacity-50"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {isRegistering && (
              <p className="mt-1 text-[11px] text-stone-400">
                Password must be at least 6 characters.
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 py-2.5 font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Processing...'
              : isRegistering
                ? 'Register Account'
                : 'Log In'}
          </button>
        </form>

        {/* Switch Login/Register */}
        <div className="border-t border-stone-100 pt-2 text-center text-xs">
          {isRegistering ? (
            <p className="text-stone-600">
              Already have an account?{' '}

              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="font-bold text-amber-700 hover:underline disabled:opacity-50"
              >
                Log In
              </button>
            </p>
          ) : (
            <p className="text-stone-600">
              Don't have an account yet?{' '}

              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="font-bold text-amber-700 hover:underline disabled:opacity-50"
              >
                Create an Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}