import React, { useState, useRef } from 'react';

export default function PrivateJournal({
  posts = [],
  addPost,
  currentUser = '',
  onReact,
  onDeletePost,
}) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

  // Safely extract explicit document ID / user ID
  const extractUserId = (user) => {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.id || user.uid || user._id || user.username || user.name || '');
    }
    return String(user);
  };

  // Safely extract username or name string for secondary checks
  const extractUsername = (user) => {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.username || user.name || user.displayName || user.id || '');
    }
    return String(user);
  };

  const currentUserId = extractUserId(currentUser);
  const currentUsername = extractUsername(currentUser);

  // Format ISO strings or timestamps into local Date & Time
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Personal Note';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Personal Note';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    if (addPost) {
      addPost(text, true, image);
    }
    setText('');
    clearImage();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Centralized ownership match with case-insensitive validation
  const isPostAuthor = (p) => {
    if (!p) return false;
    if (!currentUserId && !currentUsername) return false;

    const postAuthorId = String(
      p.authorId || (typeof p.authorObj === 'object' && p.authorObj ? p.authorObj.id || p.authorObj.uid : '') || ''
    ).toLowerCase();

    const postAuthorName = String(
      p.author || (typeof p.authorObj === 'object' && p.authorObj ? p.authorObj.name || p.authorObj.username : '') || ''
    ).toLowerCase();

    const cId = currentUserId.toLowerCase();
    const cName = currentUsername.toLowerCase();

    const isMatchById = Boolean(cId && postAuthorId && cId === postAuthorId);
    const isMatchByName = Boolean(cName && postAuthorName && cName === postAuthorName);
    const isMatchCross1 = Boolean(cId && postAuthorName && cId === postAuthorName);
    const isMatchCross2 = Boolean(cName && postAuthorId && cName === postAuthorId);

    return isMatchById || isMatchByName || isMatchCross1 || isMatchCross2;
  };

  // Filter posts that are private, not soft-deleted, and owned by the current user
  const journalEntries = posts.filter((p) => {
    if (p.isDeleted || !p.isPrivate) return false;
    return isPostAuthor(p);
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Create Journal Entry Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80">
        <h2 className="text-lg font-semibold text-stone-800 mb-3">Private Journal</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a private note to yourself..."
            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition resize-none text-stone-700 text-sm"
            rows={3}
          />

          {image && (
            <div className="relative inline-block w-full overflow-hidden rounded-lg border border-stone-200">
              <img
                src={image}
                alt="Preview"
                className="w-full h-auto object-contain block"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-stone-900/70 hover:bg-stone-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer transition"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="cursor-pointer text-xs font-medium text-stone-500 hover:text-stone-700 transition flex items-center gap-1">
              <span>📷</span> Attach Photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <button
              type="submit"
              disabled={!text.trim() && !image}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition cursor-pointer active:scale-95"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4">
        {journalEntries.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl shadow-sm border border-stone-200/80">
            <p className="text-sm text-stone-400">
              No private notes yet. Write your first entry above!
            </p>
          </div>
        ) : (
          journalEntries.map((post) => {
            const isAuthor = isPostAuthor(post);

            return (
              <div
                key={post.id || post._id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-medium">
                    {formatDate(post.createdAt)}
                  </span>

                  {isAuthor && onDeletePost && (
                    <button
                      onClick={() => onDeletePost(post.id || post._id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition font-medium cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {post.text && (
                  <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">
                    {post.text}
                  </p>
                )}

                {post.image && (
                  <div className="w-full overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
                    <img
                      src={post.image}
                      alt="Journal attachment"
                      className="w-full h-auto object-contain block"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}