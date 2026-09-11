import React, { useState } from 'react'
import PostCard from '../components/PostCard'

export default function SharedFeed({
  posts = [],
  addPost,
  currentUser = '',
  onReact
}) {
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)

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

  const getHoursLeft = (post) => {
    if (!post.createdAt) {
      return 24
    }

    const createdTime = new Date(post.createdAt).getTime()

    if (isNaN(createdTime)) {
      return 24
    }

    const expirationTime =
      createdTime + 24 * 60 * 60 * 1000

    const remaining = expirationTime - Date.now()

    return Math.max(
      0,
      Math.ceil(
        remaining / (60 * 60 * 1000)
      )
    )
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
        false,
        image
      )

      setText('')
      setImage(null)

      // Clear the file input
      const fileInput =
        document.getElementById('shared-feed-image')

      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      console.error(
        'Error creating shared post:',
        error
      )

      alert(
        'Unable to create the post. Please try again.'
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
      alert('Please choose a valid image file.')
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

  const removeImage = () => {
    setImage(null)

    const fileInput =
      document.getElementById('shared-feed-image')

    if (fileInput) {
      fileInput.value = ''
    }
  }

  const sharedPosts = (
    Array.isArray(posts)
      ? posts
      : []
  ).filter((post) => {
    // Only public, active posts
    if (
      post.isPrivate ||
      post.isDeleted ||
      post.isExpired
    ) {
      return false
    }

    const postAuthorId = String(
      post.authorId || ''
    ).toLowerCase()

    const postAuthorName = String(
      post.author || ''
    ).toLowerCase()

    const isSelf =
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
      )

    if (!isSelf) {
      return false
    }

    const createdTime = post.createdAt
      ? new Date(post.createdAt).getTime()
      : Date.now()

    if (isNaN(createdTime)) {
      return false
    }

    const postAge =
      Date.now() - createdTime

    return (
      postAge <=
      24 * 60 * 60 * 1000
    )
  })

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">

      {/* Create Post */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">

        <h2 className="mb-3 text-lg font-semibold text-stone-800">
          My Shared Feed
        </h2>

        <p className="mb-4 text-xs text-stone-400">
          Share an update with your friends.
          Posts are automatically archived after
          24 hours.
        </p>

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
            placeholder="Share something on your feed..."
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* Image Preview */}
          {image && (
            <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-stone-100 bg-stone-50">

              <img
                src={image}
                alt="Selected image preview"
                className="block max-h-60 max-w-full w-auto object-contain"
              />

              <button
                type="button"
                onClick={removeImage}
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

            <label className="cursor-pointer text-xs font-medium text-stone-500 transition hover:text-stone-700">
              📷 Attach Photo

              <input
                id="shared-feed-image"
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
                ? 'Sharing...'
                : 'Share Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Shared Posts */}
      <div className="space-y-4">

        {sharedPosts.length > 0 ? (
          sharedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReact={onReact}
              isArchived={false}
              hoursLeft={getHoursLeft(post)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center">

            <p className="text-sm font-medium text-stone-500">
              You haven't posted any public updates yet.
            </p>

            <p className="mt-1 text-xs text-stone-400">
              Create a post above to share something
              with your friends.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}