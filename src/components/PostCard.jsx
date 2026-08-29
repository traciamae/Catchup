import React from 'react';
import { Heart, Sparkles, Flower2, Lock } from 'lucide-react';

export default function PostCard({ post, onReact, isArchived = false, hoursLeft }) {
  return (
    <article className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 text-sm">{post.author}</span>
            {post.isPrivate && (
              <span className="flex items-center gap-1 text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>
          
          {!isArchived ? (
            <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-semibold">
              Expires in {hoursLeft}h
            </span>
          ) : (
            <span className="text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full font-medium">
              Archived
            </span>
          )}
        </div>

        <div className="bg-stone-100 p-2 rounded-lg mb-3">
          <img 
            src={post.imageUrl} 
            alt="Memory capture" 
            className={`w-full h-48 object-cover rounded ${isArchived ? 'grayscale-[25%]' : ''}`}
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500";
            }}
          />
        </div>

        <p className="text-stone-700 text-sm mb-4 leading-relaxed">{post.text}</p>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
        <button 
          onClick={() => onReact && onReact(post.id, 'heart')}
          disabled={isArchived}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <span>{post.reactions?.heart || 0}</span>
        </button>

        <button 
          onClick={() => onReact && onReact(post.id, 'sparkle')}
          disabled={isArchived}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{post.reactions?.sparkle || 0}</span>
        </button>

        <button 
          onClick={() => onReact && onReact(post.id, 'flower')}
          disabled={isArchived}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Flower2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{post.reactions?.flower || 0}</span>
        </button>
      </div>
    </article>
  );
}