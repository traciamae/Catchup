import React from 'react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onViewProfile, onLogout }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'shared', label: 'Feed', icon: '🌐' },
    { id: 'journal', label: 'Journal', icon: '🔒' },
    { id: 'archive', label: 'Archive', icon: '📅' },
    { id: 'about', label: 'About', icon: '✨' }
  ];

  // Helper function matching the logic in Profile.js
  const getAvatarUrl = (userObj) => {
    if (typeof userObj !== 'object' || !userObj) return '';
    return userObj.avatarUrl || userObj.avatar || userObj.profilePicture || userObj.image || '';
  };

  const userName = typeof currentUser === 'object'
    ? currentUser?.name || currentUser?.username || currentUser?.id
    : currentUser;

  const userAvatar = getAvatarUrl(currentUser);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white font-black text-sm shadow-sm">
            C
          </div>
          <span className="font-extrabold text-lg text-stone-900 tracking-tight">CatchUp</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-1 bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === item.id
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Badge & Logout */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onViewProfile ? onViewProfile(currentUser) : setActiveTab('profile')}
            title="View Profile"
            className="flex items-center space-x-2 bg-stone-100/80 hover:bg-amber-50 hover:border-amber-300 px-3 py-1.5 rounded-full border border-stone-200/60 transition cursor-pointer group"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName || 'User'}
                className="w-6 h-6 rounded-full object-cover shadow-xs"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] uppercase shadow-xs">
                {userName ? userName.charAt(0) : 'U'}
              </div>
            )}
            <span className="text-xs font-bold text-stone-800 max-w-[90px] truncate group-hover:text-amber-700">
              {userName || 'User'}
            </span>
          </button>

          <button
            onClick={onLogout}
            title="Log out"
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-50 bg-stone-900/90 backdrop-blur-lg rounded-2xl p-1.5 flex justify-around border border-stone-800 shadow-2xl">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${activeTab === item.id
                ? 'bg-amber-500/20 text-amber-400 font-bold'
                : 'text-stone-400 hover:text-white'
              }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-[9px] mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}