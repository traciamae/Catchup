import React, { useState } from 'react';

export default function SharedFeed({ posts = [], addPost, currentUser = '', onDeletePost }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    addPost(text, false, image);
    setText('');
    setImage(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Filter posts: non-private, non-deleted, active (<24h), and written by the current user
  const sharedPosts = posts.filter((p) => {
    if (p.isPrivate || p.isDeleted) return false;

    const postAuthorId = String(p.authorId || '');
    const postAuthorName = String(p.author || '');

    const isSelf =
      (currentUserId && postAuthorId === currentUserId) ||
      (currentUsername && postAuthorName === currentUsername) ||
      (currentUserId && postAuthorName === currentUserId);

    if (!isSelf) return false;

    const postAgeMs = Date.now() - new Date(p.createdAt || Date.now()).getTime();
    return postAgeMs <= 24 * 60 * 60 * 1000;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Create Post Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80">
        <h2 className="text-lg font-semibold text-stone-800 mb-3">My Shared Feed</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something on your feed..."
            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition resize-none text-stone-700 text-sm"
            rows={3}
          />

          {image && (
            <div className="relative inline-block border border-stone-100 rounded-lg overflow-hidden bg-stone-50">
              <img src={image} alt="Preview" className="max-h-60 w-auto object-contain block" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 bg-stone-900/70 hover:bg-stone-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer transition"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="cursor-pointer text-xs font-medium text-stone-500 hover:text-stone-700 transition">
              📷 Attach Photo
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer active:scale-95"
            >
              Share Post
            </button>
          </div>
        </form>
      </div>

      {/* Feed Posts */}
      <div className="space-y-4">
        {sharedPosts.length > 0 ? (
          sharedPosts.map((post) => {
            const authorIdentifier = post.author || post.authorId || 'Anonymous';
            const postAuthorId = String(post.authorId || '');
            const postAuthorName = String(post.author || '');

            const isAuthor =
              Boolean(currentUserId && postAuthorId && postAuthorId === currentUserId) ||
              Boolean(currentUsername && postAuthorName && postAuthorName === currentUsername) ||
              Boolean(currentUserId && postAuthorName && postAuthorName === currentUserId);

            return (
              <div key={post.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-stone-800 text-sm">
                      @{typeof authorIdentifier === 'object' ? authorIdentifier.name || authorIdentifier.username : authorIdentifier}
                    </span>
                    {post.createdAt && (
                      <span className="text-[11px] text-stone-400 font-normal">
                        {formatDate(post.createdAt)}
                      </span>
                    )}
                  </div>

                  {isAuthor && onDeletePost && (
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition font-medium cursor-pointer"
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
                      alt="Post preview" 
                      className="w-full h-auto object-contain block" 
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 text-center text-stone-400 text-sm">
            You haven't posted any public updates yet.
          </div>
        )}
      </div>
    </div>
  );
}