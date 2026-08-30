import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';

export default function LoginModal({ onLogin, allUsers = [] }) {
  const [username, setUsername] = useState('');

  const extractId = (user) => {
    if (!user) return '';
    if (typeof user === 'object') return String(user.id || user.uid || user._id || user.username || user.name || '');
    return String(user);
  };

  const extractUsername = (user) => {
    if (!user) return '';
    if (typeof user === 'object') return String(user.username || user.name || user.displayName || user.id || '');
    return String(user);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputVal = username.trim();
    if (!inputVal) return;

    // Search allUsers for a match by updated display name, name, or username
    const matchedUser = (allUsers || []).find((u) => {
      if (typeof u === 'object') {
        const uName = (u.name || '').toLowerCase();
        const uUsername = (u.username || '').toLowerCase();
        const uDisplayName = (u.displayName || '').toLowerCase();
        const searchVal = inputVal.toLowerCase();

        return uName === searchVal || uUsername === searchVal || uDisplayName === searchVal;
      }
      return String(u).toLowerCase() === inputVal.toLowerCase();
    });

    // Pass back the matched updated user object, or the typed string if new
    onLogin(matchedUser || inputVal);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 sm:p-8">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 text-amber-600 rounded-full mb-2">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800">Welcome to CatchUp</h2>
          <p className="text-xs text-stone-500">
            Enter a username to start your session. Your personal journal will only be saved to this device under your name.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="e.g., Tracia"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition shadow-sm cursor-pointer"
          >
            Enter CatchUp
          </button>
        </form>
      </div>
    </div>
  );
}