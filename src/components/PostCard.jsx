import React from 'react'
import {
  Heart,
  Lock
} from 'lucide-react'

export default function PostCard({
  post,
  onReact,
  isArchived = false,
  hoursLeft,
  showReactions = true
}) {
  if (!post) {
    return null
  }

  const reactions = post.reactions || {}

  // Supports both the new image field and older posts
  // that may still use imageUrl.
  const image =
    post.image ||
    post.imageUrl ||
    ''

  const handleReaction = (type) => {
    if (
      isArchived ||
      !onReact ||
      !post.id
    ) {
      return
    }

    onReact(post.id, type)
  }

  const displayHours =
    typeof hoursLeft === 'number'
      ? Math.max(0, hoursLeft)
      : null

  return (
    <article className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">

      {/* Post Header */}
      <div className="flex justify-between items-center gap-3 mb-3">

        <div className="flex items-center gap-2 min-w-0">

          <span className="font-bold text-stone-800 text-sm truncate">
            {post.author || 'Anonymous'}
          </span>

          {post.isPrivate && (
            <span className="flex items-center gap-1 text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200 shrink-0">
              <Lock className="w-3 h-3" />
              Private
            </span>
          )}

        </div>

        {!isArchived ? (
          <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-semibold shrink-0">
            {displayHours !== null
              ? `Expires in ${displayHours}h`
              : 'Active'}
          </span>
        ) : (
          <span className="text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full font-medium shrink-0">
            Archived
          </span>
        )}

      </div>


      {/* Post Image */}
      {image && (
        <div className="bg-stone-100 p-2 rounded-lg mb-3 overflow-hidden">

          <img
            src={image}
            alt="Post"
            className={`w-full h-auto object-contain rounded ${
              isArchived
                ? 'grayscale-[25%]'
                : ''
            }`}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />

        </div>
      )}


      {/* Post Text */}
      {post.text && (
        <p className="text-stone-700 text-sm mb-4 leading-relaxed break-words whitespace-pre-wrap">
          {post.text}
        </p>
      )}


      {/* Heart Reaction */}
      {showReactions && (
        <div className="flex items-center gap-2 pt-3 border-t border-stone-100 mt-auto">

          <button
            type="button"
            onClick={() =>
              handleReaction('heart')
            }
            disabled={isArchived}
            aria-label="React with heart"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />

            <span>
              {reactions.heart || 0}
            </span>
          </button>

        </div>
      )}

    </article>
  )
}