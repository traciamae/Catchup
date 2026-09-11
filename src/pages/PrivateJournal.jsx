import React, { useState, useRef } from 'react'
import PostCard from '../components/PostCard'

export default function PrivateJournal({
  posts = [],
  addPost,
  currentUser = '',
  onReact,
  onDeletePost
}) {
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef(null)

  const getUserId = (user) => {
    if (!user) return ''

    if (typeof user === 'object') {
      return String(
        user.id ||
        user.uid ||
        user._id ||
        user.username ||
        user.name ||
        ''
      ).toLowerCase()
    }

    return String(user).toLowerCase()
  }

  const getUsername = (user) => {
    if (!user) return ''

    if (typeof user === 'object') {
      return String(
        user.name ||
        user.displayName ||
        user.username ||
        user.id ||
        ''
      ).toLowerCase()
    }

    return String(user).toLowerCase()
  }

  const currentUserId = getUserId(currentUser)
  const currentUsername = getUsername(currentUser)

  const clearImage = () => {
    setImage(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) return

    if (!text.trim() && !image) {
      return
    }

    if (!addPost) {
      console.error('addPost function is not available.')
      return
    }

    setLoading(true)

    try {
      await addPost(
        text.trim(),
        true,
        image
      )

      setText('')
      clearImage()
    } catch (error) {
      console.error(
        'Error creating journal entry:',
        error
      )

      alert(
        'Unable to save the journal entry. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.')
      event.target.value = ''
      return
    }

    // Maximum image size: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert(
        'Please choose an image smaller than 5 MB.'
      )

      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onloadend = () => {
      setImage(reader.result)
    }

    reader.onerror = () => {
      alert(
        'Unable to read the selected image.'
      )

      event.target.value = ''
    }

    reader.readAsDataURL(file)
  }

  const isPostAuthor = (post) => {
    if (!post) {
      return false
    }

    if (!currentUserId && !currentUsername) {
      return false
    }

    const postAuthorId = String(
      post.authorId || ''
    ).toLowerCase()

    const postAuthorName = String(
      post.author || ''
    ).toLowerCase()

    return (
      (
        currentUserId &&
        postAuthorId === currentUserId
      ) ||
      (
        currentUsername &&
        postAuthorName === currentUsername
      ) ||
      (
        currentUserId &&
        postAuthorName === currentUserId
      ) ||
      (
        currentUsername &&
        postAuthorId === currentUsername
      )
    )
  }

  // Show only private entries belonging to the current user
  const journalEntries = (
    Array.isArray(posts)
      ? posts
      : []
  )
    .filter((post) => {
      if (
        post.isDeleted ||
        !post.isPrivate
      ) {
        return false
      }

      return isPostAuthor(post)
    })
    .sort((a, b) => {
      const dateA = new Date(
        a.createdAt || 0
      ).getTime()

      const dateB = new Date(
        b.createdAt || 0
      ).getTime()

      return dateB - dateA
    })

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">

      {/* Create Journal Entry */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">

        <div className="mb-3">
          <h2 className="text-lg font-semibold text-stone-800">
            Private Journal
          </h2>

          <p className="mt-1 text-xs text-stone-400">
            Write personal notes that are only visible
            in your private journal.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Text */}
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value)
            }}
            placeholder="Write a private note to yourself..."
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* Image Preview */}
          {image && (
            <div className="relative w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-50">

              <img
                src={image}
                alt="Journal image preview"
                className="block max-h-80 w-full object-contain"
              />

              <button
                type="button"
                onClick={clearImage}
                disabled={loading}
                aria-label="Remove selected image"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/70 text-xs text-white transition hover:bg-stone-900 disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col items-start justify-between gap-3 pt-2 sm:flex-row sm:items-center">

            <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-stone-500 transition hover:text-stone-700">
              <span>📷</span>
              Attach Photo

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={
                loading ||
                (!text.trim() && !image)
              }
              className="w-full rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 sm:w-auto"
            >
              {loading
                ? 'Saving...'
                : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">

        {journalEntries.length === 0 ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm">

            <p className="text-sm font-medium text-stone-500">
              No private notes yet.
            </p>

            <p className="mt-1 text-xs text-stone-400">
              Write your first entry above!
            </p>
          </div>
        ) : (
          journalEntries.map((post) => (
            <div
              key={post.id}
              className="space-y-2"
            >

              {/* Journal Date */}
              <div className="px-1 text-xs text-stone-400">
                {post.createdAt
                  ? new Date(
                      post.createdAt
                    ).toLocaleString(
                      undefined,
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }
                    )
                  : 'Personal Note'}
              </div>

              {/* Reusable PostCard */}
              <PostCard
                post={post}
                onReact={onReact}
                isArchived={false}
              />

              {/* Delete */}
              {isPostAuthor(post) &&
                onDeletePost && (
                  <div className="flex justify-end px-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDeletePost(post.id)
                      }}
                      className="rounded px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                    >
                      Delete Entry
                    </button>
                  </div>
                )}
            </div>
          ))
        )}

      </div>
    </div>
  )
}