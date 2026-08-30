import React, { useState } from 'react';

export default function Home({
  posts = [],
  currentUser = '',
  allUsers = [],
  friends = [],
  friendRequests = [],
  onReact,
  onDeletePost,
  onRequestFriend,
  onAcceptFriend,
  onDeclineFriend,
  onCancelRequest,
  onRemoveFriend,
  onViewProfile,
  onAddComment
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [localComments, setLocalComments] = useState({});

  const extractId = (user) => {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.id || user.uid || user._id || user.username || user.name || '');
    }
    return String(user);
  };

  // Prefers 'name' (updated display name) over original 'username'
  const extractUsername = (user) => {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.name || user.displayName || user.username || user.id || '');
    }
    return String(user);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const currentUserId = extractId(currentUser);
  const currentUsername = extractUsername(currentUser);
  const cleanedQuery = searchQuery.trim().toLowerCase();
  const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];
  const safeFriends = Array.isArray(friends) ? friends : [];

  const incomingRequests = (friendRequests || []).filter((req) => {
    const receiverId = extractId(req.receiver);
    const receiverName = extractUsername(req.receiver);
    return (
      (receiverId && receiverId === currentUserId) ||
      (receiverName && receiverName === currentUsername)
    );
  });

  const friendIdentifiersSet = new Set([
    ...safeFriends.map((f) => extractId(f)),
    ...safeFriends.map((f) => extractUsername(f))
  ]);

  const getAuthorAvatar = (post) => {
    if (post.authorAvatar) return post.authorAvatar;
    const authorIdentifier = String(post.authorId || post.author || '');
    const matchedUser = safeAllUsers.find(
      (u) =>
        extractId(u) === authorIdentifier ||
        extractUsername(u) === authorIdentifier ||
        (typeof u === 'object' && String(u.username || '') === authorIdentifier)
    );
    return matchedUser?.avatarUrl || matchedUser?.avatar || matchedUser?.profilePicture || matchedUser?.image || '';
  };

  const visiblePosts = posts.filter((p) => {
    if (p.isDeleted || p.isPrivate) return false;

    const postAuthorId = String(p.authorId || '');
    const postAuthorName = String(p.author || '');

    const isSelf =
      (currentUserId && postAuthorId === currentUserId) ||
      (currentUsername && postAuthorName === currentUsername) ||
      (currentUserId && postAuthorName === currentUserId);

    const isFriend =
      (postAuthorId && friendIdentifiersSet.has(postAuthorId)) ||
      (postAuthorName && friendIdentifiersSet.has(postAuthorName));

    if (!isSelf && !isFriend) return false;

    const parsedDate = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
    const postAgeMs = Date.now() - (isNaN(parsedDate) ? Date.now() : parsedDate);
    const isOlderThan24h = postAgeMs > 24 * 60 * 60 * 1000;

    return !p.isExpired && !isOlderThan24h;
  });

  // Matches both display name and username in search query
  const searchResults = cleanedQuery
    ? safeAllUsers.filter((u) => {
      const userId = extractId(u);
      const userName = extractUsername(u);

      if (userId === currentUserId || userName === currentUsername) return false;

      const nameMatch = (typeof u === 'object' ? u.name || '' : '').toLowerCase().includes(cleanedQuery);
      const usernameMatch = (typeof u === 'object' ? u.username || '' : '').toLowerCase().includes(cleanedQuery);
      const idMatch = userId.toLowerCase().includes(cleanedQuery);

      return nameMatch || usernameMatch || idMatch;
    })
    : [];

  const handleCommentChange = (postId, text) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handleCommentSubmit = (postId, e) => {
    e.preventDefault();
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    const newComment = {
      id: `${postId}-${Date.now()}`,
      author: currentUsername || 'Anonymous',
      text,
      createdAt: new Date().toISOString()
    };

    if (onAddComment) {
      onAddComment(postId, newComment);
    } else {
      setLocalComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
    }

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Posts Section */}
      <div className="lg:col-span-2 space-y-4">
        {visiblePosts.length > 0 ? (
          visiblePosts.map((post) => {
            const authorIdentifier = post.author || post.authorId || '';
            const authorAvatar = getAuthorAvatar(post);
            const postComments = post.comments || localComments[post.id] || [];
            const isCommentOpen = openCommentPostId === post.id;

            const postAuthorId = String(post.authorId || '');
            const postAuthorName = String(post.author || '');

            const matchedAuthor = safeAllUsers.find(
              (u) =>
                extractId(u) === postAuthorId ||
                extractUsername(u) === postAuthorName ||
                (typeof u === 'object' && String(u.username || '') === postAuthorName)
            );
            const authorDisplayName = matchedAuthor ? extractUsername(matchedAuthor) : (post.author || 'Anonymous');

            const isMyPost =
              Boolean(currentUserId && postAuthorId && postAuthorId === currentUserId) ||
              Boolean(currentUsername && postAuthorName && postAuthorName === currentUsername) ||
              Boolean(currentUserId && postAuthorName && postAuthorName === currentUserId);

            const heartCount = typeof post.reactions === 'number'
              ? post.reactions
              : (post.reactions?.heart || 0);

            return (
              <div key={post.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {authorAvatar ? (
                      <img src={authorAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                        {String(authorDisplayName).charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <button
                        onClick={() => {
                          if (!onViewProfile) return;
                          onViewProfile(matchedAuthor || authorIdentifier);
                        }}
                        className="font-semibold text-stone-800 hover:text-amber-600 transition text-sm cursor-pointer text-left leading-tight"
                      >
                        @{authorDisplayName}
                      </button>
                      {post.createdAt && (
                        <span className="text-[11px] text-stone-400 font-normal">
                          {formatDate(post.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {isMyPost && onDeletePost && (
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="text-xs text-stone-400 hover:text-red-500 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {post.text && (
                  <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">{post.text}</p>
                )}

                {post.image && (
                  <div className="w-full overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
                    <img
                      src={post.image}
                      alt="Post media"
                      className="w-full h-auto object-contain block"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
                  <button
                    onClick={() => onReact && onReact(post.id, 'heart')}
                    className="hover:text-red-500 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>❤️</span>
                    <span className="font-medium">{heartCount}</span>
                  </button>

                  <button
                    onClick={() => setOpenCommentPostId(isCommentOpen ? null : post.id)}
                    className="hover:text-stone-800 transition font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <span>💬</span>
                    <span>Comments ({postComments.length})</span>
                  </button>
                </div>

                {isCommentOpen && (
                  <div className="pt-3 border-t border-stone-100 space-y-3">
                    <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition cursor-pointer"
                      >
                        Post
                      </button>
                    </form>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {postComments.length > 0 ? (
                        postComments.map((c, idx) => (
                          <div key={c.id || `comment-${idx}`} className="bg-stone-50 p-2 rounded-xl text-xs space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-stone-800">@{c.author}</span>
                              {c.createdAt && (
                                <span className="text-[10px] text-stone-400">{formatDate(c.createdAt)}</span>
                              )}
                            </div>
                            <p className="text-stone-600">{c.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-400 text-xs text-center py-1">No comments yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 text-center text-stone-400 text-sm">
            No posts from friends yet. Add friends using the search panel to see their posts!
          </div>
        )}
      </div>

      {/* Sidebar Controls */}
      <div className="space-y-6">

        {/* Friend Requests Section */}
        {incomingRequests.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-3">
            <h3 className="font-semibold text-stone-800 text-sm flex items-center justify-between">
              <span>Friend Requests</span>
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {incomingRequests.length}
              </span>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {incomingRequests.map((req) => {
                const senderObj = safeAllUsers.find(
                  (u) => extractId(u) === extractId(req.sender) || extractUsername(u) === extractUsername(req.sender)
                ) || req.sender;
                const senderName = extractUsername(senderObj);

                return (
                  <div key={req.id || extractId(senderObj)} className="flex items-center justify-between p-2 bg-stone-50 rounded-xl border border-stone-100">
                    <button
                      onClick={() => onViewProfile && onViewProfile(senderObj)}
                      className="text-xs text-stone-800 font-semibold hover:text-amber-600 cursor-pointer truncate max-w-[110px]"
                    >
                      @{senderName}
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAcceptFriend && onAcceptFriend(senderObj)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onDeclineFriend && onDeclineFriend(senderObj)}
                        className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-600 px-2 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Find Friends Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-4">
          <h3 className="font-semibold text-stone-800">Find Friends</h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />

          {cleanedQuery && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((user) => {
                  const matchedUser = safeAllUsers.find((u) => extractId(u) === extractId(user) || extractUsername(u) === extractUsername(user)) || user;
                  const targetName = extractUsername(matchedUser);
                  const targetId = extractId(matchedUser);

                  const isFriend = safeFriends.some((f) => extractId(f) === targetId || extractUsername(f) === targetName);

                  const hasSentRequest = (friendRequests || []).some((req) => {
                    const senderId = extractId(req.sender);
                    const receiverId = extractId(req.receiver);
                    const receiverName = extractUsername(req.receiver);
                    return senderId === currentUserId && (receiverId === targetId || receiverName === targetName);
                  });

                  const hasReceivedRequest = (friendRequests || []).some((req) => {
                    const senderId = extractId(req.sender);
                    const senderName = extractUsername(req.sender);
                    const receiverId = extractId(req.receiver);
                    return (senderId === targetId || senderName === targetName) && receiverId === currentUserId;
                  });

                  return (
                    <div key={targetId || targetName} className="flex items-center justify-between p-2 hover:bg-stone-50 rounded-lg">
                      <button
                        onClick={() => onViewProfile && onViewProfile(matchedUser)}
                        className="text-sm text-stone-700 font-medium hover:text-amber-600 cursor-pointer"
                      >
                        @{targetName}
                      </button>
                      {isFriend ? (
                        <button
                          onClick={() => onRemoveFriend && onRemoveFriend(matchedUser)}
                          className="text-xs text-stone-400 hover:text-red-600 px-2 py-1 cursor-pointer transition"
                        >
                          Remove
                        </button>
                      ) : hasSentRequest ? (
                        <button
                          onClick={() => onCancelRequest && onCancelRequest(matchedUser)}
                          className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 cursor-pointer italic transition"
                        >
                          Pending
                        </button>
                      ) : hasReceivedRequest ? (
                        <button
                          onClick={() => onAcceptFriend && onAcceptFriend(matchedUser)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg font-medium cursor-pointer transition"
                        >
                          Accept
                        </button>
                      ) : (
                        <button
                          onClick={() => onRequestFriend && onRequestFriend(matchedUser)}
                          className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 px-2 py-1 rounded-lg font-medium cursor-pointer transition"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-stone-400 py-2 text-center">No users found</p>
              )}
            </div>
          )}
        </div>

        {/* My Friends Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-3">
          <h3 className="font-semibold text-stone-800 text-sm flex items-center justify-between">
            <span>My Friends</span>
            <span className="text-xs text-stone-400 font-normal">({safeFriends.length})</span>
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {safeFriends.length > 0 ? (
              safeFriends.map((friend) => {
                const friendObj = safeAllUsers.find(
                  (u) =>
                    extractId(u) === extractId(friend) ||
                    extractUsername(u) === extractUsername(friend) ||
                    (typeof u === 'object' && String(u.username || '') === String(friend))
                ) || friend;

                const friendName = extractUsername(friendObj);
                const friendId = extractId(friendObj);

                return (
                  <div key={friendId || friendName} className="flex items-center justify-between p-2 hover:bg-stone-50 rounded-lg">
                    <button
                      onClick={() => onViewProfile && onViewProfile(friendObj)}
                      className="text-sm text-stone-700 font-medium hover:text-amber-600 cursor-pointer"
                    >
                      @{friendName}
                    </button>
                    <button
                      onClick={() => onRemoveFriend && onRemoveFriend(friendObj)}
                      className="text-xs text-stone-400 hover:text-red-600 px-2 py-1 cursor-pointer transition"
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-stone-400 py-2 text-center">No friends added yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}