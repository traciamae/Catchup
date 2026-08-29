import React, { useState } from 'react';

export default function Home({
  posts = [],
  currentUser = '',
  allUsers = [],
  friends = [],
  onReact,
  onDeletePost,
  onAddFriend,
  onRemoveFriend,
  onViewProfile,
  onAddComment
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState({});

  const extractId = (user) => {
    if (!user) return '';
    if (typeof user === 'object') return String(user.id || user.username || user.name || '');
    return String(user);
  };

  const currentUsername = extractId(currentUser);
  const cleanedQuery = searchQuery.trim().toLowerCase();
  const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];
  const safeFriends = Array.isArray(friends) ? friends : [];

  const getAuthorAvatar = (post) => {
    if (post.authorAvatar) return post.authorAvatar;
    const matchedUser = safeAllUsers.find(
      (u) => extractId(u) === String(post.authorId || post.author)
    );
    if (matchedUser) {
      return matchedUser.avatarUrl || matchedUser.avatar || matchedUser.profilePicture || matchedUser.image || '';
    }
    return '';
  };

  const visiblePosts = posts.filter((p) => {
    if (p.isDeleted || p.isPrivate) return false;
    const postAgeMs = Date.now() - new Date(p.createdAt || Date.now()).getTime();
    const isOlderThan24h = postAgeMs > 24 * 60 * 60 * 1000;
    return !p.isExpired && !isOlderThan24h;
  });

  const searchResults = cleanedQuery
    ? safeAllUsers.filter((u) => {
        const userId = extractId(u);
        if (userId === currentUsername) return false;

        const displayName = (typeof u === 'object' ? u.name || u.username || u.displayName || u.email || '' : String(u)).toLowerCase();
        return displayName.includes(cleanedQuery);
      })
    : [];

  const handleCommentSubmit = (postId, e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      author: currentUsername,
      text: commentText.trim(),
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
    setCommentText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {visiblePosts.map((post) => {
          const authorIdentifier = post.author || post.authorId || '';
          const authorAvatar = getAuthorAvatar(post);
          const postComments = post.comments || localComments[post.id] || [];
          const isCommentOpen = openCommentPostId === post.id;
          
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
                      {String(authorIdentifier).charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!onViewProfile) return;
                      // Pass full user object if found in allUsers, otherwise string identifier
                      const matchedUser = safeAllUsers.find((u) => extractId(u) === String(authorIdentifier));
                      onViewProfile(matchedUser || authorIdentifier);
                    }}
                    className="font-semibold text-stone-800 hover:text-amber-600 transition text-sm cursor-pointer"
                  >
                    @{typeof authorIdentifier === 'object' ? authorIdentifier.name || authorIdentifier.username : authorIdentifier || 'Anonymous'}
                  </button>
                </div>
              </div>

              <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">{post.text}</p>

              {post.image && (
                <img src={post.image} alt="Post media" className="w-full max-h-96 object-cover rounded-xl" />
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
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
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
                      postComments.map((c) => (
                        <div key={c.id || Math.random()} className="bg-stone-50 p-2 rounded-xl text-xs space-y-0.5">
                          <span className="font-semibold text-stone-800">@{c.author}</span>
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
        })}
      </div>

      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-4">
          <h3 className="font-semibold text-stone-800">Find Friends</h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />

          {cleanedQuery && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((user) => {
                  const targetName = typeof user === 'object' ? user.username || user.name : user;
                  const targetId = extractId(user);
                  const isFriend = safeFriends.some((f) => extractId(f) === targetId);

                  return (
                    <div key={targetId} className="flex items-center justify-between p-2 hover:bg-stone-50 rounded-lg">
                      <button
                        onClick={() => onViewProfile && onViewProfile(user)}
                        className="text-sm text-stone-700 font-medium hover:text-amber-600 cursor-pointer"
                      >
                        @{targetName}
                      </button>
                      {isFriend ? (
                        <button
                          onClick={() => onRemoveFriend && onRemoveFriend(targetId)}
                          className="text-xs text-stone-400 hover:text-red-600 px-2 py-1 cursor-pointer"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => onAddFriend && onAddFriend(user)}
                          className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 px-2 py-1 rounded-lg font-medium cursor-pointer"
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
      </div>
    </div>
  );
}