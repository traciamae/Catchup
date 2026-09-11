import React, { useState } from 'react'
import PostCard from '../components/PostCard'

export default function Archive({
  posts = [],
  currentUser = null,
  friends = [],
  onPermanentDelete,
  onRestorePost,
  onViewProfile
}) {
  const [activeTab, setActiveTab] = useState('expired')

  // =========================================================
  // USER HELPERS
  // =========================================================

  const getUserId = (user) => {
    if (!user) {
      return ''
    }

    if (typeof user === 'object') {
      return String(
        user.id ||
        user.uid ||
        user._id ||
        user.username ||
        user.name ||
        ''
      )
    }

    return String(user)
  }

  const getUserName = (user) => {
    if (!user) {
      return ''
    }

    if (typeof user === 'object') {
      return String(
        user.username ||
        user.name ||
        user.displayName ||
        user.id ||
        ''
      )
    }

    return String(user)
  }


  const currentUserId =
    getUserId(currentUser).toLowerCase()

  const currentUsername =
    getUserName(currentUser).toLowerCase()


  // =========================================================
  // FRIEND IDENTIFIERS
  // =========================================================

  const friendIdentifiers = friends.flatMap(
    (friend) => {
      if (
        friend &&
        typeof friend === 'object'
      ) {
        return [
          friend.id,
          friend.uid,
          friend._id,
          friend.username,
          friend.name,
          friend.displayName
        ]
          .filter(Boolean)
          .map((value) =>
            String(value).toLowerCase()
          )
      }

      if (friend) {
        return [
          String(friend).toLowerCase()
        ]
      }

      return []
    }
  )


  // =========================================================
  // CHECK POST OWNER
  // =========================================================

  const isPostOwner = (post) => {
    if (!post) {
      return false
    }

    const authorId =
      String(post.authorId || '')
        .toLowerCase()

    const authorName =
      String(post.author || '')
        .toLowerCase()

    if (
      currentUserId &&
      authorId === currentUserId
    ) {
      return true
    }

    if (
      currentUsername &&
      authorName === currentUsername
    ) {
      return true
    }

    if (
      currentUserId &&
      authorName === currentUserId
    ) {
      return true
    }

    if (
      currentUsername &&
      authorId === currentUsername
    ) {
      return true
    }

    return false
  }


  // =========================================================
  // CHECK FRIEND POST
  // =========================================================

  const isFriendPost = (post) => {
    if (!post) {
      return false
    }

    const authorId =
      String(post.authorId || '')
        .toLowerCase()

    const authorName =
      String(post.author || '')
        .toLowerCase()

    return (
      friendIdentifiers.includes(authorId) ||
      friendIdentifiers.includes(authorName)
    )
  }


  // =========================================================
  // CHECK POST AGE
  // =========================================================

  const isOlderThan24Hours = (post) => {
    if (!post || !post.createdAt) {
      return false
    }

    const createdAt =
      new Date(post.createdAt).getTime()

    if (Number.isNaN(createdAt)) {
      return false
    }

    const twentyFourHours =
      24 * 60 * 60 * 1000

    return (
      Date.now() - createdAt >
      twentyFourHours
    )
  }


  // =========================================================
  // EXPIRED / MEMORY POSTS
  // =========================================================

  const expiredPosts = posts.filter((post) => {
    if (!post) {
      return false
    }

    // Deleted posts belong in Trash Bin.
    if (post.isDeleted) {
      return false
    }

    // Private journal posts do not belong
    // in the shared Memory Archive.
    if (post.isPrivate) {
      return false
    }

    const belongsToUser =
      isPostOwner(post)

    const belongsToFriend =
      isFriendPost(post)

    if (
      !belongsToUser &&
      !belongsToFriend
    ) {
      return false
    }

    return (
      post.isExpired ||
      isOlderThan24Hours(post)
    )
  })


  // =========================================================
  // DELETED POSTS
  // =========================================================

  const deletedPosts = posts.filter((post) => {
    if (!post || !post.isDeleted) {
      return false
    }

    return isPostOwner(post)
  })


  // =========================================================
  // DISPLAYED POSTS
  // =========================================================

  const displayedPosts =
    activeTab === 'expired'
      ? expiredPosts
      : deletedPosts


  // =========================================================
  // HOURS LEFT
  // =========================================================

  const getHoursLeft = (post) => {
    if (
      !post ||
      !post.createdAt ||
      post.isExpired
    ) {
      return 0
    }

    const createdAt =
      new Date(post.createdAt).getTime()

    if (Number.isNaN(createdAt)) {
      return 0
    }

    const expirationTime =
      createdAt +
      24 * 60 * 60 * 1000

    const remaining =
      expirationTime - Date.now()

    return Math.max(
      0,
      Math.ceil(
        remaining /
        (60 * 60 * 1000)
      )
    )
  }


  // =========================================================
  // PERMANENT DELETE
  // =========================================================

  const handlePermanentDelete = (postId) => {
    if (
      !postId ||
      !onPermanentDelete
    ) {
      return
    }

    const confirmed =
      window.confirm(
        'Are you sure you want to permanently delete this post? This action cannot be undone.'
      )

    if (confirmed) {
      onPermanentDelete(postId)
    }
  }


  // =========================================================
  // VIEW PROFILE
  // =========================================================

  const handleViewProfile = (post) => {
    if (
      !post ||
      !onViewProfile
    ) {
      return
    }

    // Pass an object instead of only a string.
    // This works better with the profile system.
    onViewProfile({
      id: post.authorId || '',
      username: post.author || '',
      name: post.author || '',
      avatarUrl: post.authorAvatar || ''
    })
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans py-4">

      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-stone-200/80 space-y-4">

        <div>
          <h2 className="text-xl font-bold text-stone-800">
            Memory Archive
          </h2>

          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Revisit past posts from you and your
            friends after they pass the 24-hour limit.
          </p>
        </div>


        {/* Tabs */}
        <div className="flex border-b border-stone-200 gap-5 sm:gap-6 text-sm font-medium overflow-x-auto">

          <button
            type="button"
            onClick={() =>
              setActiveTab('expired')
            }
            className={`pb-3 whitespace-nowrap transition ${
              activeTab === 'expired'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-600'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Memories (24h+)

            <span className="ml-2 text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
              {expiredPosts.length}
            </span>
          </button>


          <button
            type="button"
            onClick={() =>
              setActiveTab('deleted')
            }
            className={`pb-3 whitespace-nowrap transition ${
              activeTab === 'deleted'
                ? 'text-amber-600 font-semibold border-b-2 border-amber-600'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Trash Bin

            <span className="ml-2 text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
              {deletedPosts.length}
            </span>
          </button>

        </div>

      </div>


      {/* Posts */}
      <div className="space-y-5">

        {displayedPosts.length === 0 ? (

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200/80 text-center space-y-2">

            <p className="text-stone-500 text-sm font-medium">
              No posts found in this section.
            </p>

            <p className="text-stone-400 text-xs">
              {activeTab === 'expired'
                ? 'Posts older than 24 hours from you and your friends will appear here as memories.'
                : 'Posts you delete from your main stream will appear here in your trash bin.'}
            </p>

          </div>

        ) : (

          displayedPosts.map((post) => {
            const isOwner =
              isPostOwner(post)

            return (
              <div
                key={post.id}
                className="space-y-3"
              >

                {/* Archive Status */}
                <div className="flex items-center justify-between px-1">

                  <span
                    className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-semibold ${
                      activeTab === 'expired'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}
                  >
                    {activeTab === 'expired'
                      ? 'Memory'
                      : 'Deleted'}
                  </span>


                  {post.createdAt && (
                    <span className="text-[10px] text-stone-400">
                      {new Date(
                        post.createdAt
                      ).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }
                      )}
                    </span>
                  )}

                </div>


                {/* Reusable PostCard */}
                <PostCard
                  post={post}
                  isArchived={true}
                  hoursLeft={getHoursLeft(post)}
                  showReactions={true}
                />


                {/* Actions */}
                {isOwner && (
                  <div className="bg-white border border-stone-200/80 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">

                    {post.isDeleted &&
                      onRestorePost && (
                        <button
                          type="button"
                          onClick={() =>
                            onRestorePost(
                              post.id
                            )
                          }
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium px-3 py-2 rounded-lg hover:bg-amber-50 transition"
                        >
                          Restore to Feed
                        </button>
                      )}


                    {onPermanentDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePermanentDelete(
                            post.id
                          )
                        }
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition"
                      >
                        Delete Permanently
                      </button>
                    )}


                    {onViewProfile && (
                      <button
                        type="button"
                        onClick={() =>
                          handleViewProfile(
                            post
                          )
                        }
                        className="text-xs text-stone-500 hover:text-stone-700 font-medium px-3 py-2 rounded-lg hover:bg-stone-50 transition"
                      >
                        View Profile
                      </button>
                    )}

                  </div>
                )}

              </div>
            )
          })

        )}

      </div>

    </div>
  )
}