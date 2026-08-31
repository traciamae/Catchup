import React from 'react';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onViewProfile,
  onLogout
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'shared', label: 'Feed', icon: '🌐' },
    { id: 'journal', label: 'Journal', icon: '🔒' },
    { id: 'archive', label: 'Archive', icon: '📅' },
    { id: 'about', label: 'About', icon: '✨' }
  ];

  const getAvatarUrl = (userObj) => {
    if (typeof userObj !== 'object' || !userObj) return '';
    return userObj.avatarUrl || userObj.avatar || userObj.profilePicture || userObj.image || '';
  };

  const userName = typeof currentUser === 'object'
    ? currentUser?.name || currentUser?.username || currentUser?.id
    : currentUser;

  const userAvatar = getAvatarUrl(currentUser);

  return (
    <>
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo (Left Side) */}
          <div 
            className="flex items-center space-x-2 cursor-pointer shrink-0" 
            onClick={() => setActiveTab('home')}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
              C
            </div>
            <span className="font-extrabold text-lg text-stone-900 tracking-tight">CatchUp</span>
          </div>

          {/* Center Navigation Menu (Desktop Only) */}
          <nav className="hidden md:flex items-center space-x-1 bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Action Items (User Profile Badge + Clean Logout Button) */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* User Profile Pill */}
            <button
              onClick={() => (onViewProfile ? onViewProfile(currentUser) : setActiveTab('profile'))}
              title="View Profile"
              className="flex items-center space-x-2 bg-stone-100/80 hover:bg-amber-50 hover:border-amber-300 px-3 py-1.5 rounded-full border border-stone-200/60 transition cursor-pointer group"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName || 'User'}
                  className="w-6 h-6 rounded-full object-cover shadow-xs shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] uppercase shadow-xs shrink-0">
                  {userName ? userName.charAt(0) : 'U'}
                </div>
              )}
              <span className="text-xs font-bold text-stone-800 max-w-[100px] truncate group-hover:text-amber-700">
                {userName || 'User'}
              </span>
            </button>

            {/* Logout Icon Button */}
            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* 2. MOBILE FLOATING BOTTOM BAR */}
      <div 
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1 pointer-events-none"
      >
        <div className="max-w-md mx-auto bg-stone-900/95 backdrop-blur-lg rounded-2xl p-1.5 flex justify-around border border-stone-800 shadow-2xl pointer-events-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'bg-amber-500/20 text-amber-400 font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-[9px] mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}