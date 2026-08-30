import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function AuthModal({ onAuthSuccess, allUsers = [] }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Please provide both a username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // Check if original username document already exists
        const userRef = doc(db, 'users', cleanUser);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setError('Username already taken. Please choose another or Log In.');
          setLoading(false);
          return;
        }

        const newUserPayload = {
          id: cleanUser,
          username: cleanUser,
          name: cleanUser,
          password: cleanPass,
          createdAt: Date.now()
        };

        await setDoc(userRef, newUserPayload);
        onAuthSuccess(newUserPayload);
      } else {
        // 1. Try finding local match in passed allUsers first
        let targetUser = allUsers.find((u) => {
          if (typeof u === 'object' && u !== null) {
            const rawId = String(u.id || '').toLowerCase();
            const rawUsername = String(u.username || '').toLowerCase();
            const displayName = String(u.name || u.displayName || '').toLowerCase();
            return rawId === cleanUser || rawUsername === cleanUser || displayName === cleanUser;
          }
          return String(u).toLowerCase() === cleanUser;
        });

        // 2. Fallback to direct Firestore Query if not in local cache
        if (!targetUser) {
          const directDocSnap = await getDoc(doc(db, 'users', cleanUser));
          if (directDocSnap.exists()) {
            targetUser = { id: directDocSnap.id, ...directDocSnap.data() };
          } else {
            const usersQuery = query(
              collection(db, 'users'),
              where('name', '==', username.trim())
            );
            const querySnap = await getDocs(usersQuery);
            if (!querySnap.empty) {
              const matchedDoc = querySnap.docs[0];
              targetUser = { id: matchedDoc.id, ...matchedDoc.data() };
            }
          }
        }

        if (!targetUser) {
          setError('Account not found. Please click Create an Account.');
          setLoading(false);
          return;
        }

        if (targetUser.password && targetUser.password !== cleanPass) {
          setError('Incorrect password. Please try again.');
          setLoading(false);
          return;
        }

        onAuthSuccess(targetUser);
      }
    } catch (err) {
      setError('Database error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-stone-900">
            {isRegistering ? 'Create Your Account' : 'Welcome to CatchUp'}
          </h2>
          <p className="text-sm text-stone-500">
            {isRegistering
              ? 'Choose your own username and password to get started.'
              : 'Sign in with your registered credentials.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or display name"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-700 hover:text-amber-900 px-2 py-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition"
          >
            {loading ? 'Processing...' : isRegistering ? 'Register Account' : 'Log In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100 text-xs">
          {isRegistering ? (
            <p className="text-stone-600">
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                }}
                className="font-bold text-amber-700 hover:underline"
              >
                Log In
              </button>
            </p>
          ) : (
            <p className="text-stone-600">
              Don't have an account yet?{' '}
              <button
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                }}
                className="font-bold text-amber-700 hover:underline"
              >
                Create an Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}