import React, { useState } from 'react';
import { Image, Lock, Globe, Plus } from 'lucide-react';

export default function CreatePostForm({ addPost, defaultPrivate = false }) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [isPrivate, setIsPrivate] = useState(defaultPrivate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newPost = {
      id: `post_${Date.now()}`,
      author: author.trim() || 'Anonymous',
      text: text.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=500',
      isPrivate: isPrivate,
      createdAt: Date.now(),
      reactions: { heart: 0, sparkle: 0, flower: 0 }
    };

    addPost(newPost);
    setText('');
    setImageUrl('');
    setAuthor('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-sm mb-6">
      <h3 className="text-base font-bold text-stone-800 mb-3">Snap a New Memory</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          placeholder="Your name / alias"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="p-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="relative">
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-2 pl-8 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Image className="w-4 h-4 text-stone-400 absolute left-2.5 top-3" />
        </div>
      </div>

      <textarea
        placeholder="What's happening right now?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows="2"
        required
        className="w-full p-2.5 text-sm border border-stone-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer w-full sm:w-auto">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
          />
          <span className="flex items-center gap-1">
            {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {isPrivate ? "Keep in Private Journal" : "Post to Shared Roll"}
          </span>
        </label>

        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Post</span>
        </button>
      </div>
    </form>
  );
}