import React, { useState, useEffect } from 'react';

export default function Profile({
  profileUser,
  currentUser,
  allUsers = [],
  onUpdateProfile,
  friends = [],
  friendRequests = [],
  profileUserFriends = [],
  onRequestFriend,
  onAcceptFriend,
  onDeclineFriend,
  onCancelRequest,
  onRemoveFriend,
  onBackToFeed,
  onViewProfile,
}) {
  const extractId = (user) => {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.id || user.uid || user._id || user.username || user.name || '');
    }
    return String(user);
  };

  const extractUsername = (user) => {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.username || user.name || user.displayName || user.id || '');
    }
    return String(user);
  };

  const currentUserId = extractId(currentUser);
  const currentUsername = extractUsername(currentUser);
  const targetUserId = profileUser ? extractId(profileUser) : currentUserId;
  const targetUsername = profileUser ? extractUsername(profileUser) : currentUsername;

  // Case-insensitive comparison check to determine if viewing own profile
  const isSelf =
    !profileUser ||
    (Boolean(currentUserId) && currentUserId.toLowerCase() === targetUserId.toLowerCase()) ||
    (Boolean(currentUsername) && currentUsername.toLowerCase() === targetUsername.toLowerCase()) ||
    (Boolean(currentUserId) && currentUserId.toLowerCase() === targetUsername.toLowerCase()) ||
    (Boolean(currentUsername) && currentUsername.toLowerCase() === targetUserId.toLowerCase());

  const getAvatarUrl = (userObj) => {
    if (typeof userObj !== 'object' || !userObj) return '';
    return userObj.avatarUrl || userObj.avatar || userObj.profilePicture || userObj.image || '';
  };

  const displayUser = isSelf ? currentUser || profileUser : profileUser || currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthdate: '',
    bio: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (displayUser) {
      setFormData({
        name: typeof displayUser === 'object' ? displayUser.name || displayUser.username || '' : String(displayUser),
        birthdate: typeof displayUser === 'object' ? displayUser.birthdate || '' : '',
        bio: typeof displayUser === 'object' ? displayUser.bio || '' : '',
        avatarUrl: getAvatarUrl(displayUser),
      });
      setIsEditing(false);
    }
  }, [displayUser]);

  const isFriend = (friends || []).some((f) => {
    const fId = extractId(f).toLowerCase();
    const fName = extractUsername(f).toLowerCase();
    const tId = targetUserId.toLowerCase();
    const tName = targetUsername.toLowerCase();
    return (tId && (fId === tId || fName === tId)) || (tName && (fId === tName || fName === tName));
  });

  const hasSentRequest = (friendRequests || []).some((req) => {
    const senderId = extractId(req.sender).toLowerCase();
    const senderName = extractUsername(req.sender).toLowerCase();
    const receiverId = extractId(req.receiver).toLowerCase();
    const receiverName = extractUsername(req.receiver).toLowerCase();

    const cId = currentUserId.toLowerCase();
    const cName = currentUsername.toLowerCase();
    const tId = targetUserId.toLowerCase();
    const tName = targetUsername.toLowerCase();

    const isFromMe = (cId && (senderId === cId || senderName === cId)) || (cName && (senderId === cName || senderName === cName));
    const isToTarget = (tId && (receiverId === tId || receiverName === tId)) || (tName && (receiverId === tName || receiverName === tName));

    return isFromMe && isToTarget;
  });

  const hasReceivedRequest = (friendRequests || []).some((req) => {
    const senderId = extractId(req.sender).toLowerCase();
    const senderName = extractUsername(req.sender).toLowerCase();
    const receiverId = extractId(req.receiver).toLowerCase();
    const receiverName = extractUsername(req.receiver).toLowerCase();

    const cId = currentUserId.toLowerCase();
    const cName = currentUsername.toLowerCase();
    const tId = targetUserId.toLowerCase();
    const tName = targetUsername.toLowerCase();

    const isFromTarget = (tId && (senderId === tId || senderName === tId)) || (tName && (senderId === tName || senderName === tName));
    const isToMe = (cId && (receiverId === cId || receiverName === cId)) || (cName && (receiverId === cName || receiverName === cName));

    return isFromTarget && isToMe;
  });

  // Incoming requests addressed specifically to currentUser
  const incomingRequests = (friendRequests || []).filter((req) => {
    const receiverId = extractId(req.receiver).toLowerCase();
    const receiverName = extractUsername(req.receiver).toLowerCase();
    const cId = currentUserId.toLowerCase();
    const cName = currentUsername.toLowerCase();

    return (cId && (receiverId === cId || receiverName === cId)) || (cName && (receiverId === cName || receiverName === cName));
  });

  const activeFriendsList = (isSelf ? friends || [] : profileUserFriends || []).filter((friend) => {
    const fId = extractId(friend).toLowerCase();
    const fName = extractUsername(friend).toLowerCase();
    const cId = currentUserId.toLowerCase();
    const cName = currentUsername.toLowerCase();

    const isMe = (cId && (fId === cId || fName === cId)) || (cName && (fId === cName || fName === cName));
    return !isMe;
  });

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        name: formData.name,
        birthdate: formData.birthdate,
        bio: formData.bio,
        avatar: formData.avatarUrl,
        avatarUrl: formData.avatarUrl,
        profilePicture: formData.avatarUrl,
        image: formData.avatarUrl,
      });
    }
    setIsEditing(false);
  };

  const handleRemove = (target) => {
    if (!onRemoveFriend) return;
    onRemoveFriend(target);
  };

  const displayName =
    typeof displayUser === 'object'
      ? displayUser?.name || displayUser?.username || 'User Profile'
      : String(displayUser || 'User Profile');

  const userInitial = displayName.charAt(0).toUpperCase() || 'U';
  const activeAvatar = getAvatarUrl(displayUser) || (isSelf ? formData.avatarUrl : '');

  const formatBirthdate = (dateStr) => {
    if (!dateStr) return 'Birthdate not set';
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime())
      ? 'Birthdate not set'
      : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans pt-2 pb-20 px-2 sm:px-0">
      {onBackToFeed && (
        <button
          onClick={onBackToFeed}
          className="group inline-flex items-center space-x-2 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <span className="w-6 h-6 rounded-full bg-stone-200/60 group-hover:bg-stone-200 flex items-center justify-center text-stone-600 transition">
            ←
          </span>
          <span>Back to Home</span>
        </button>
      )}

      {/* Main Profile Header */}
      <div className="relative bg-white rounded-3xl border border-stone-200/70 shadow-sm overflow-hidden">
        <div className="h-32 sm:h-36 bg-gradient-to-r from-amber-100 via-stone-100 to-amber-50 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-200/40 rounded-full blur-2xl"></div>
          <div className="absolute left-1/3 -bottom-10 w-32 h-32 bg-orange-100/50 rounded-full blur-xl"></div>
        </div>

        <div className="px-6 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-14 mb-5 gap-4">
            <div className="relative inline-block">
              {activeAvatar ? (
                <img
                  src={activeAvatar}
                  alt={displayName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-xl ring-4 ring-white bg-stone-100"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white font-serif font-bold flex items-center justify-center text-4xl shadow-xl ring-4 ring-white">
                  {userInitial}
                </div>
              )}
              <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 ring-2 ring-white rounded-full"></span>
            </div>

            <div className="flex items-center space-x-3">
              {isSelf ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-5 py-2 text-xs font-semibold rounded-full border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 transition shadow-xs cursor-pointer active:scale-95"
                >
                  {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </button>
              ) : isFriend ? (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 rounded-full backdrop-blur-xs">
                    <span>✓</span>
                    <span>In Your Circle</span>
                  </span>
                  {onRemoveFriend && (
                    <button
                      onClick={() => handleRemove(displayUser)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full transition cursor-pointer"
                    >
                      Unfriend
                    </button>
                  )}
                </div>
              ) : hasSentRequest ? (
                <button
                  onClick={() => onCancelRequest && onCancelRequest(displayUser)}
                  className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium text-xs rounded-full transition cursor-pointer"
                >
                  Request Sent (Cancel)
                </button>
              ) : hasReceivedRequest ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onAcceptFriend && onAcceptFriend(displayUser)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-full transition shadow-md cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDeclineFriend && onDeclineFriend(displayUser)}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-xs rounded-full transition cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onRequestFriend && onRequestFriend(displayUser)}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs rounded-full transition shadow-md hover:shadow-lg cursor-pointer active:scale-95"
                >
                  + Add to Circle
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                {displayName}
              </h1>
              <p className="text-xs text-stone-400 font-medium tracking-wide mt-0.5">
                @{displayName.toLowerCase().replace(/\s+/g, '')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-stone-100/80 text-stone-600 rounded-full border border-stone-200/60 font-medium">
                <span>🎂</span>
                <span>
                  {typeof displayUser === 'object' ? formatBirthdate(displayUser.birthdate) : 'Birthdate not set'}
                </span>
              </span>

              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200/60 font-medium">
                <span>✨</span>
                <span>{activeFriendsList.length} Connections</span>
              </span>
            </div>

            {!isEditing && (
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/50 backdrop-blur-xs">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700/80 block mb-1.5">
                  About
                </span>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  {typeof displayUser === 'object' && displayUser?.bio
                    ? `“${displayUser.bio}”`
                    : isSelf
                      ? 'No bio added yet. Click "Edit Profile" to write a quick introduction.'
                      : 'This user hasn’t written a bio yet.'}
                </p>
              </div>
            )}
          </div>

          {isSelf && isEditing && (
            <form onSubmit={handleSave} className="space-y-4 pt-6 mt-6 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Update Profile Info
              </h3>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-stone-800 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-stone-800 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a thought, motto, or short introduction..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white resize-none h-24 text-stone-800 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition shadow-sm cursor-pointer active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Circle & Friends Section */}
      <div className="bg-white rounded-3xl border border-stone-200/70 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">
            {isSelf ? 'My Circle' : `${displayName}'s Circle`}
          </h2>
          <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-full">
            {activeFriendsList.length} members
          </span>
        </div>

        {/* Requests List Embedded in Circle View */}
        {isSelf && incomingRequests.length > 0 && (
          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 space-y-2 mb-4">
            <span className="text-[10px] font-bold uppercase text-amber-800">Received Requests</span>
            {incomingRequests.map((req, idx) => {
              const rawSender = req.sender || req;
              const senderObj =
                (allUsers || []).find((u) => {
                  const uId = extractId(u).toLowerCase();
                  const uName = extractUsername(u).toLowerCase();
                  const rId = extractId(rawSender).toLowerCase();
                  const rName = extractUsername(rawSender).toLowerCase();
                  return (rId && (uId === rId || uName === rId)) || (rName && (uId === rName || uName === rName));
                }) || rawSender;

              const senderName = typeof senderObj === 'object' ? senderObj.name || senderObj.username || 'User' : String(senderObj);

              return (
                <div key={extractId(senderObj) || idx} className="flex items-center justify-between bg-white p-2 rounded-xl text-xs">
                  <span className="font-medium text-stone-700">@{senderName}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onAcceptFriend && onAcceptFriend(senderObj)}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDeclineFriend && onDeclineFriend(senderObj)}
                      className="px-2 py-1 bg-stone-100 text-stone-600 rounded-lg text-[10px] cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Members List */}
        {activeFriendsList.length === 0 ? (
          <div className="text-center py-8 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
            <p className="text-xs text-stone-400 italic">
              {isSelf
                ? "You haven't added anyone to your circle yet."
                : `${displayName} has no public connections yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeFriendsList.map((friend, idx) => {
              const friendObj =
                (allUsers || []).find((u) => {
                  const uId = extractId(u).toLowerCase();
                  const uName = extractUsername(u).toLowerCase();
                  const fId = extractId(friend).toLowerCase();
                  const fName = extractUsername(friend).toLowerCase();
                  return (fId && (uId === fId || uName === fId)) || (fName && (uId === fName || uName === fName));
                }) || friend;

              const friendId = extractId(friendObj);
              const friendUsername = extractUsername(friendObj);

              const isMyFriend = (friends || []).some((f) => {
                const myFId = extractId(f).toLowerCase();
                const myFName = extractUsername(f).toLowerCase();
                const targetFId = friendId.toLowerCase();
                const targetFName = friendUsername.toLowerCase();
                return (targetFId && (myFId === targetFId || myFName === targetFId)) || (targetFName && (myFId === targetFName || myFName === targetFName));
              });

              const isMe =
                (currentUserId && (friendId.toLowerCase() === currentUserId.toLowerCase() || friendUsername.toLowerCase() === currentUserId.toLowerCase())) ||
                (currentUsername && (friendId.toLowerCase() === currentUsername.toLowerCase() || friendUsername.toLowerCase() === currentUsername.toLowerCase()));

              const friendName = typeof friendObj === 'object' ? friendObj.name || friendObj.username || 'User' : String(friendObj);
              const friendInitial = friendName.charAt(0).toUpperCase();
              const friendAvatar = getAvatarUrl(friendObj);

              return (
                <div
                  key={friendId || `friend-${idx}`}
                  className="flex items-center justify-between p-3.5 bg-stone-50/70 hover:bg-stone-50 rounded-2xl border border-stone-200/60 transition group"
                >
                  <div
                    onClick={() => onViewProfile && onViewProfile(friendObj)}
                    className="flex items-center space-x-3 cursor-pointer min-w-0"
                  >
                    {friendAvatar ? (
                      <img
                        src={friendAvatar}
                        alt={friendName}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                        {friendInitial}
                      </div>
                    )}
                    <div className="truncate">
                      <span className="text-xs font-bold text-stone-800 block truncate group-hover:text-amber-600 transition">
                        {friendName}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isMe ? (
                      <span className="text-[10px] text-stone-400 font-medium italic px-2">You</span>
                    ) : isMyFriend ? (
                      onRemoveFriend && (
                        <button
                          onClick={() => handleRemove(friendObj)}
                          className="text-[10px] text-stone-400 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => onRequestFriend && onRequestFriend(friendObj)}
                        className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1 rounded-full transition cursor-pointer active:scale-95"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}