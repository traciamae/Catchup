import React, { useState } from 'react';

export default function Archive({
  posts = [],
  currentUser = '',
  onPermanentDelete,
  onRestorePost,
  onViewProfile
}) {
  const [activeTab, setActiveTab] = useState('expired'); // 'expired' | 'deleted'

  // Extract author username safely whether currentUser is a string or object
  const currentUsername = typeof currentUser === 'object'
    ? currentUser?.username || currentUser?.name || currentUser?.id
    : currentUser;

  // Filter posts belonging strictly to the logged-in user
  const userPosts = posts.filter((p) => {
    const authorIdentifier = p.author || p.authorId || '';
    return String(authorIdentifier) === String(currentUsername);
  });

  // Tab 1: Posts older than 24 hours that are NOT soft-deleted
  const expiredPosts = userPosts.filter((p) => {
    if (p.isDeleted) return false;
    const postAgeMs = Date.now() - new Date(p.createdAt || Date.now()).getTime();
    return p.isExpired || postAgeMs > 24 * 60 * 60 * 1000;
  });

  // Tab 2: Soft-deleted posts regardless of age
  const deletedPosts = userPosts.filter((p) => p.isDeleted);

  const displayedPosts = activeTab === 'expired' ? expiredPosts : deletedPosts;

  const handlePermanentDeleteClick = (postId) => {
    if (window.confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) {
      onPermanentDelete(postId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Archive Header & Navigation Tabs */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/80 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Post Archive</h2>
          <p className="text-xs text-stone-500 mt-1">
            Manage your posts that have passed the 24-hour limit or were removed from your live feed.
          </p>
        </div>

        <div className="flex border-b border-stone-200 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('expired')}
            className={`pb-3 transition relative cursor-pointer ${
              activeTab === 'expired'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-600'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Expired (24h+)
            <span className="ml-2 text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
              {expiredPosts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('deleted')}
            className={`pb-3 transition relative cursor-pointer ${
              activeTab === 'deleted'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-600'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Deleted Posts
            <span className="ml-2 text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
              {deletedPosts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Post Stream Container */}
      <div className="space-y-4">
        {displayedPosts.length > 0 ? (
          displayedPosts.map((post) => {
            const authorIdentifier = post.author || post.authorId || '';
            const formattedDate = post.createdAt
              ? new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Unknown date';

            return (
              <div
                key={post.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-3"
              >
                {/* Header Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                        {String(authorIdentifier).charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => onViewProfile && onViewProfile(authorIdentifier)}
                        className="font-semibold text-stone-800 hover:text-amber-600 transition text-sm cursor-pointer block text-left"
                      >
                        @{authorIdentifier || 'Anonymous'}
                      </button>
                      <span className="text-[10px] text-stone-400">{formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {activeTab === 'expired' && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                        Expired
                      </span>
                    )}
                    {activeTab === 'deleted' && (
                      <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">
                  {post.text}
                </p>

                {post.image && (
                  <img
                    src={post.image}
                    alt="Post media"
                    className="w-full max-h-96 object-cover rounded-xl"
                  />
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-100">
                  {/* Restore option for soft-deleted items */}
                  {post.isDeleted && onRestorePost && (
                    <button
                      onClick={() => onRestorePost(post.id)}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 transition cursor-pointer"
                    >
                      Restore to Feed
                    </button>
                  )}

                  {/* Permanent deletion handler */}
                  {onPermanentDelete && (
                    <button
                      onClick={() => handlePermanentDeleteClick(post.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      Delete Permanently
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200/80 text-center space-y-2">
            <p className="text-stone-500 text-sm font-medium">No posts found in this section.</p>
            <p className="text-stone-400 text-xs">
              {activeTab === 'expired'
                ? 'Posts older than 24 hours will automatically show up here.'
                : 'Posts you delete from your main stream will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}