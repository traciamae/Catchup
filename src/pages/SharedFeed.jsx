import React, { useState } from 'react';

export default function SharedFeed({ posts = [], addPost, currentUser = '', onDeletePost }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);

  const currentUsername = typeof currentUser === 'object' 
    ? currentUser?.username || currentUser?.name || currentUser?.id 
    : currentUser;

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

  // Filter non-private, non-deleted, active (< 24h) posts
  const sharedPosts = posts.filter((p) => {
    if (p.isPrivate || p.isDeleted) return false;
    const postAgeMs = Date.now() - new Date(p.createdAt || Date.now()).getTime();
    return postAgeMs <= 24 * 60 * 60 * 1000;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80">
        <h2 className="text-lg font-semibold text-stone-800 mb-3">Community Feed</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something with everyone..."
            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition resize-none text-stone-700 text-sm"
            rows={3}
          />

          {image && (
            <div className="relative inline-block">
              <img src={image} alt="Preview" className="max-h-40 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute top-1 right-1 bg-stone-900/70 text-white rounded-full p-1 text-xs cursor-pointer"
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

      <div className="space-y-4">
        {sharedPosts.map((post) => {
          const authorIdentifier = post.author || post.authorId || '';
          const isAuthor = String(authorIdentifier) === String(currentUsername);

          return (
            <div key={post.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800 text-sm">@{authorIdentifier || 'Anonymous'}</span>

                {isAuthor && onDeletePost && (
                  <button
                    onClick={() => onDeletePost(post.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">{post.text}</p>

              {post.image && (
                <img src={post.image} alt="Post preview" className="w-full max-h-96 object-cover rounded-xl" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}