import React, { useEffect, useState } from 'react';

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
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    birthdate: '',
    bio: '',
    avatarUrl: '',
  });

  /*
    Safely get a user ID.
  */
  const extractId = (user) => {
    if (!user) return '';

    if (typeof user === 'object') {
      return String(
        user.id ||
          user.uid ||
          user._id ||
          user.username ||
          user.name ||
          ''
      );
    }

    return String(user);
  };

  /*
    Safely get a username or display name.
  */
  const extractUsername = (user) => {
    if (!user) return '';

    if (typeof user === 'object') {
      return String(
        user.username ||
          user.name ||
          user.displayName ||
          user.id ||
          ''
      );
    }

    return String(user);
  };

  /*
    Get every possible identifier for a user.
    This helps support both old and new Firestore data.
  */
  const getIdentifiers = (user) => {
    if (!user) return [];

    if (typeof user === 'object') {
      return [
        user.id,
        user.uid,
        user._id,
        user.username,
        user.name,
        user.displayName,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
    }

    return [String(user).toLowerCase()];
  };

  const isSameUser = (userA, userB) => {
    const identifiersA = getIdentifiers(userA);
    const identifiersB = getIdentifiers(userB);

    return identifiersA.some((identifier) =>
      identifiersB.includes(identifier)
    );
  };

  const getAvatarUrl = (user) => {
    if (!user || typeof user !== 'object') {
      return '';
    }

    return (
      user.avatarUrl ||
      user.avatar ||
      user.profilePicture ||
      user.image ||
      ''
    );
  };

  const isSelf =
    !profileUser ||
    isSameUser(profileUser, currentUser);

  const displayUser = isSelf
    ? currentUser || profileUser
    : profileUser || currentUser;

  const currentUserId = extractId(currentUser);
  const currentUsername = extractUsername(currentUser);

  const targetUserId = extractId(displayUser);
  const targetUsername = extractUsername(displayUser);

  const completeDisplayUser =
    (allUsers || []).find((user) =>
      isSameUser(user, displayUser)
    ) || displayUser;

  useEffect(() => {
    if (!displayUser) {
      return;
    }

    setFormData({
      name:
        typeof displayUser === 'object'
          ? displayUser.name ||
            displayUser.displayName ||
            displayUser.username ||
            ''
          : String(displayUser),
      birthdate:
        typeof displayUser === 'object'
          ? displayUser.birthdate || ''
          : '',
      bio:
        typeof displayUser === 'object'
          ? displayUser.bio || ''
          : '',
      avatarUrl: getAvatarUrl(displayUser),
    });

    setIsEditing(false);
  }, [displayUser]);

  const isFriend = (friends || []).some((friend) =>
    isSameUser(friend, displayUser)
  );

  const hasSentRequest = (friendRequests || []).some(
    (request) => {
      if (
        request.status &&
        request.status !== 'pending'
      ) {
        return false;
      }

      const sender =
        request.sender ||
        request.senderId ||
        '';

      const receiver =
        request.receiver ||
        request.receiverId ||
        '';

      return (
        isSameUser(sender, currentUser) &&
        isSameUser(receiver, displayUser)
      );
    }
  );

  const hasReceivedRequest = (
    friendRequests || []
  ).some((request) => {
    if (
      request.status &&
      request.status !== 'pending'
    ) {
      return false;
    }

    const sender =
      request.sender ||
      request.senderId ||
      '';

    const receiver =
      request.receiver ||
      request.receiverId ||
      '';

    return (
      isSameUser(sender, displayUser) &&
      isSameUser(receiver, currentUser)
    );
  });

  const incomingRequests = (
    friendRequests || []
  ).filter((request) => {
    if (
      request.status &&
      request.status !== 'pending'
    ) {
      return false;
    }

    const receiver =
      request.receiver ||
      request.receiverId ||
      '';

    return isSameUser(receiver, currentUser);
  });

  const sourceFriends = isSelf
    ? friends || []
    : profileUserFriends || [];

  const activeFriendsList = sourceFriends.filter(
    (friend) => !isSameUser(friend, currentUser)
  );

  const handleFileChange = (event) => {
    const file =
      event.target.files &&
      event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((previous) => ({
        ...previous,
        avatarUrl: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();

    const cleanName = formData.name.trim();
    const cleanBio = formData.bio.trim();

    if (!cleanName) {
      return;
    }

    if (onUpdateProfile) {
      onUpdateProfile({
        name: cleanName,
        birthdate: formData.birthdate,
        bio: cleanBio,
        avatar: formData.avatarUrl,
        avatarUrl: formData.avatarUrl,
        profilePicture: formData.avatarUrl,
        image: formData.avatarUrl,
      });
    }

    setIsEditing(false);
  };

  const handleRemove = (target) => {
    if (onRemoveFriend) {
      onRemoveFriend(target);
    }
  };

  const displayName =
    typeof completeDisplayUser === 'object'
      ? completeDisplayUser?.name ||
        completeDisplayUser?.displayName ||
        completeDisplayUser?.username ||
        'User Profile'
      : String(
          completeDisplayUser || 'User Profile'
        );

  const displayUsername =
    typeof completeDisplayUser === 'object'
      ? completeDisplayUser?.username ||
        completeDisplayUser?.name ||
        completeDisplayUser?.displayName ||
        targetUserId ||
        'user'
      : String(
          completeDisplayUser || 'user'
        );

  const userInitial =
    displayName.charAt(0).toUpperCase() || 'U';

  const activeAvatar =
    getAvatarUrl(completeDisplayUser) ||
    (isSelf ? formData.avatarUrl : '');

  const formatBirthdate = (dateString) => {
    if (!dateString) {
      return 'Birthdate not set';
    }

    const parsedDate = new Date(dateString);

    if (isNaN(parsedDate.getTime())) {
      return 'Birthdate not set';
    }

    return parsedDate.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans pt-2 pb-20 px-2 sm:px-0">

      {/* Back Button */}
      {onBackToFeed && (
        <button
          type="button"
          onClick={onBackToFeed}
          className="group inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <span className="w-6 h-6 rounded-full bg-stone-200/60 group-hover:bg-stone-200 flex items-center justify-center text-stone-600 transition">
            ←
          </span>

          <span>Back to Home</span>
        </button>
      )}

      {/* Main Profile */}
      <div className="relative bg-white rounded-3xl border border-stone-200/70 shadow-sm overflow-hidden">

        {/* Cover */}
        <div className="h-32 sm:h-36 bg-gradient-to-r from-amber-100 via-stone-100 to-amber-50 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-200/40 rounded-full blur-2xl" />

          <div className="absolute left-1/3 -bottom-10 w-32 h-32 bg-orange-100/50 rounded-full blur-xl" />
        </div>

        <div className="px-6 sm:px-8 pb-6 relative">

          {/* Profile Picture and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-14 mb-5 gap-4">

            <div className="relative inline-block">
              {activeAvatar ? (
                <img
                  src={activeAvatar}
                  alt={`${displayName}'s profile`}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-xl ring-4 ring-white bg-stone-100"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      'none';
                  }}
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white font-bold flex items-center justify-center text-4xl shadow-xl ring-4 ring-white">
                  {userInitial}
                </div>
              )}

              <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 ring-2 ring-white rounded-full" />
            </div>

            {/* Profile Actions */}
            <div className="flex items-center gap-3">

              {isSelf ? (
                <button
                  type="button"
                  onClick={() =>
                    setIsEditing(!isEditing)
                  }
                  className="px-5 py-2 text-xs font-semibold rounded-full border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 transition shadow-sm cursor-pointer active:scale-95"
                >
                  {isEditing
                    ? 'Cancel Editing'
                    : 'Edit Profile'}
                </button>
              ) : isFriend ? (
                <div className="flex items-center gap-2">

                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                    <span>✓</span>
                    <span>In Your Circle</span>
                  </span>

                  {onRemoveFriend && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(displayUser)
                      }
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full transition cursor-pointer"
                    >
                      Unfriend
                    </button>
                  )}
                </div>
              ) : hasSentRequest ? (
                <button
                  type="button"
                  onClick={() =>
                    onCancelRequest &&
                    onCancelRequest(displayUser)
                  }
                  className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium text-xs rounded-full transition cursor-pointer"
                >
                  Request Sent
                </button>
              ) : hasReceivedRequest ? (
                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      onAcceptFriend &&
                      onAcceptFriend(displayUser)
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-full transition shadow-sm cursor-pointer"
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onDeclineFriend &&
                      onDeclineFriend(displayUser)
                    }
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-xs rounded-full transition cursor-pointer"
                  >
                    Decline
                  </button>

                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onRequestFriend &&
                    onRequestFriend(displayUser)
                  }
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs rounded-full transition shadow-sm hover:shadow-md cursor-pointer active:scale-95"
                >
                  + Add to Circle
                </button>
              )}

            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-3">

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                {displayName}
              </h1>

              <p className="text-xs text-stone-400 font-medium tracking-wide mt-0.5">
                @{displayUsername}
              </p>
            </div>

            {/* Profile Details */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600">

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-600 rounded-full border border-stone-200 font-medium">
                <span>🎂</span>

                <span>
                  {typeof completeDisplayUser ===
                  'object'
                    ? formatBirthdate(
                        completeDisplayUser.birthdate
                      )
                    : 'Birthdate not set'}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 font-medium">
                <span>✨</span>

                <span>
                  {activeFriendsList.length}{' '}
                  Connections
                </span>
              </span>

            </div>

            {/* About */}
            {!isEditing && (
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 block mb-1.5">
                  About
                </span>

                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  {typeof completeDisplayUser ===
                    'object' &&
                  completeDisplayUser?.bio ? (
                    `“${completeDisplayUser.bio}”`
                  ) : isSelf ? (
                    'No bio added yet. Click "Edit Profile" to write a quick introduction.'
                  ) : (
                    'This user has not written a bio yet.'
                  )}
                </p>
              </div>
            )}

          </div>

          {/* Edit Profile Form */}
          {isSelf && isEditing && (
            <form
              onSubmit={handleSave}
              className="space-y-4 pt-6 mt-6 border-t border-stone-100"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Update Profile Info
              </h3>

              {/* Profile Picture */}
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

                <p className="text-[10px] text-stone-400 mt-1">
                  Maximum file size: 5 MB
                </p>
              </div>

              {/* Name and Birthdate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Display Name
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        name: event.target.value,
                      })
                    }
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
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        birthdate:
                          event.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-stone-800 transition"
                  />
                </div>

              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Bio
                </label>

                <textarea
                  value={formData.bio}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      bio: event.target.value,
                    })
                  }
                  placeholder="Share a thought, motto, or short introduction..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white resize-none h-24 text-stone-800 transition"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setIsEditing(false)
                  }
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
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

      {/* Circle */}
      <div className="bg-white rounded-3xl border border-stone-200/70 shadow-sm p-6 space-y-4">

        <div className="flex items-center justify-between border-b border-stone-100 pb-3">

          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">
            {isSelf
              ? 'My Circle'
              : `${displayName}'s Circle`}
          </h2>

          <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-full">
            {activeFriendsList.length}{' '}
            members
          </span>

        </div>

        {/* Incoming Friend Requests */}
        {isSelf &&
          incomingRequests.length > 0 && (
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 space-y-2 mb-4">

              <span className="text-[10px] font-bold uppercase text-amber-800">
                Received Requests
              </span>

              {incomingRequests.map(
                (request, index) => {
                  const rawSender =
                    request.sender ||
                    request.senderId ||
                    '';

                  const senderObj =
                    (allUsers || []).find(
                      (user) =>
                        isSameUser(
                          user,
                          rawSender
                        )
                    ) || rawSender;

                  const senderName =
                    extractUsername(
                      senderObj
                    ) || 'User';

                  return (
                    <div
                      key={
                        request.id ||
                        extractId(
                          senderObj
                        ) ||
                        `request-${index}`
                      }
                      className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl text-xs"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onViewProfile &&
                          onViewProfile(
                            senderObj
                          )
                        }
                        className="font-medium text-stone-700 hover:text-amber-600 truncate cursor-pointer"
                      >
                        @{senderName}
                      </button>

                      <div className="flex gap-1 shrink-0">

                        <button
                          type="button"
                          onClick={() =>
                            onAcceptFriend &&
                            onAcceptFriend(
                              senderObj
                            )
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                        >
                          Accept
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDeclineFriend &&
                            onDeclineFriend(
                              senderObj
                            )
                          }
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[10px] cursor-pointer"
                        >
                          Decline
                        </button>

                      </div>
                    </div>
                  );
                }
              )}

            </div>
          )}

        {/* Friends List */}
        {activeFriendsList.length === 0 ? (
          <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">

            <p className="text-xs text-stone-400 italic">
              {isSelf
                ? "You haven't added anyone to your circle yet."
                : `${displayName} has no public connections yet.`}
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {activeFriendsList.map(
              (friend, index) => {
                const friendObj =
                  (allUsers || []).find(
                    (user) =>
                      isSameUser(
                        user,
                        friend
                      )
                  ) || friend;

                const friendId =
                  extractId(friendObj);

                const friendUsername =
                  extractUsername(
                    friendObj
                  );

                const friendName =
                  typeof friendObj === 'object'
                    ? friendObj.name ||
                      friendObj.displayName ||
                      friendObj.username ||
                      'User'
                    : String(
                        friendObj || 'User'
                      );

                const friendInitial =
                  friendName
                    .charAt(0)
                    .toUpperCase() || 'U';

                const friendAvatar =
                  getAvatarUrl(friendObj);

                const isMyFriend =
                  (friends || []).some(
                    (myFriend) =>
                      isSameUser(
                        myFriend,
                        friendObj
                      )
                  );

                const isMe =
                  isSameUser(
                    friendObj,
                    currentUser
                  );

                return (
                  <div
                    key={
                      friendId ||
                      `friend-${index}`
                    }
                    className="flex items-center justify-between gap-2 p-3.5 bg-stone-50 hover:bg-stone-100 rounded-2xl border border-stone-200 transition group"
                  >

                    {/* Friend Information */}
                    <button
                      type="button"
                      onClick={() =>
                        onViewProfile &&
                        onViewProfile(
                          friendObj
                        )
                      }
                      className="flex items-center gap-3 cursor-pointer min-w-0 text-left"
                    >
                      {friendAvatar ? (
                        <img
                          src={friendAvatar}
                          alt={`${friendName}'s avatar`}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              'none';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                          {friendInitial}
                        </div>
                      )}

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-stone-800 block truncate group-hover:text-amber-600 transition">
                          {friendName}
                        </span>

                        {friendUsername &&
                          friendUsername.toLowerCase() !==
                            friendName.toLowerCase() && (
                            <span className="text-[10px] text-stone-400 block truncate">
                              @{friendUsername}
                            </span>
                          )}
                      </div>
                    </button>

                    {/* Friend Action */}
                    <div className="shrink-0">

                      {isMe ? (
                        <span className="text-[10px] text-stone-400 font-medium italic px-2">
                          You
                        </span>
                      ) : isSelf &&
                        isMyFriend ? (
                        onRemoveFriend && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRemove(
                                friendObj
                              )
                            }
                            className="text-[10px] text-stone-400 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onRequestFriend &&
                            onRequestFriend(
                              friendObj
                            )
                          }
                          className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1 rounded-full transition cursor-pointer active:scale-95"
                        >
                          + Add
                        </button>
                      )}

                    </div>
                  </div>
                );
              }
            )}

          </div>
        )}

      </div>
    </div>
  );
}