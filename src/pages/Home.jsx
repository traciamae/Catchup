import React, { useState } from 'react'
import PostCard from '../components/PostCard'

export default function Home({
  posts = [],
  currentUser = null,
  allUsers = [],
  friends = [],
  friendRequests = [],
  onReact,
  addPost,
  onDeletePost,
  onRequestFriend,
  onAcceptFriend,
  onDeclineFriend,
  onCancelRequest,
  onRemoveFriend,
  onViewProfile,
  onAddComment
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [openCommentPostId, setOpenCommentPostId] = useState(null)
  const [commentInputs, setCommentInputs] = useState({})

  // =========================================================
  // SAFE DATA
  // =========================================================

  const safePosts = Array.isArray(posts)
    ? posts
    : []

  const safeAllUsers = Array.isArray(allUsers)
    ? allUsers
    : []

  const safeFriends = Array.isArray(friends)
    ? friends
    : []

  const safeFriendRequests = Array.isArray(friendRequests)
    ? friendRequests
    : []


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


  const getUsername = (user) => {
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


  const getAvatar = (user) => {
    if (!user || typeof user !== 'object') {
      return ''
    }

    return (
      user.avatarUrl ||
      user.avatar ||
      user.profilePicture ||
      user.image ||
      ''
    )
  }


  const getIdentifiers = (user) => {
    if (!user) {
      return []
    }

    if (typeof user === 'object') {
      return [
        user.id,
        user.uid,
        user._id,
        user.username,
        user.name,
        user.displayName
      ]
        .filter(Boolean)
        .map((value) =>
          String(value).toLowerCase()
        )
    }

    return [
      String(user).toLowerCase()
    ]
  }


  const isSameUser = (userA, userB) => {
    const identifiersA =
      getIdentifiers(userA)

    const identifiersB =
      getIdentifiers(userB)

    return identifiersA.some(
      (identifier) =>
        identifiersB.includes(identifier)
    )
  }


  const currentUserId =
    getUserId(currentUser).toLowerCase()


  // =========================================================
  // DATE HELPERS
  // =========================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return ''
    }

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    return date.toLocaleString(
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
  }


  const getHoursLeft = (post) => {
    if (!post?.createdAt) {
      return 24
    }

    const createdTime =
      new Date(post.createdAt).getTime()

    if (Number.isNaN(createdTime)) {
      return 24
    }

    const expirationTime =
      createdTime +
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
  // POST HELPERS
  // =========================================================

  const findAuthor = (post) => {
    if (!post) {
      return null
    }

    const authorId =
      String(post.authorId || '')
        .toLowerCase()

    const authorName =
      String(post.author || '')
        .toLowerCase()

    return (
      safeAllUsers.find((user) => {
        const identifiers =
          getIdentifiers(user)

        return (
          (
            authorId &&
            identifiers.includes(authorId)
          ) ||
          (
            authorName &&
            identifiers.includes(authorName)
          )
        )
      }) || null
    )
  }


  const getAuthor = (post) => {
    return findAuthor(post)
  }


  const getAuthorName = (post) => {
    const author = getAuthor(post)

    if (author) {
      return getUsername(author)
    }

    return (
      post?.author ||
      post?.authorId ||
      'Anonymous'
    )
  }


  const getAuthorAvatar = (post) => {
    if (post?.authorAvatar) {
      return post.authorAvatar
    }

    const author = getAuthor(post)

    return getAvatar(author)
  }


  const isMyPost = (post) => {
    if (!post || !currentUserId) {
      return false
    }

    const postAuthorId =
      String(post.authorId || '')
        .toLowerCase()

    return (
      postAuthorId === currentUserId
    )
  }


  const isFriendPost = (post) => {
    if (!post) {
      return false
    }

    const author =
      getAuthor(post)

    if (author) {
      return safeFriends.some(
        (friend) =>
          isSameUser(friend, author)
      )
    }

    const authorId =
      String(post.authorId || '')
        .toLowerCase()

    const authorName =
      String(post.author || '')
        .toLowerCase()

    return safeFriends.some(
      (friend) => {
        const identifiers =
          getIdentifiers(friend)

        return (
          identifiers.includes(
            authorId
          ) ||
          identifiers.includes(
            authorName
          )
        )
      }
    )
  }


  // =========================================================
  // VISIBLE POSTS
  // =========================================================

  const visiblePosts =
    safePosts.filter((post) => {
      if (
        post.isDeleted ||
        post.isPrivate
      ) {
        return false
      }

      if (
        !isMyPost(post) &&
        !isFriendPost(post)
      ) {
        return false
      }

      if (post.isExpired) {
        return false
      }

      if (!post.createdAt) {
        return true
      }

      const createdTime =
        new Date(
          post.createdAt
        ).getTime()

      if (Number.isNaN(createdTime)) {
        return true
      }

      const age =
        Date.now() - createdTime

      return (
        age <=
        24 * 60 * 60 * 1000
      )
    })


  // =========================================================
  // SEARCH USERS
  // =========================================================

  const cleanedSearch =
    searchQuery
      .trim()
      .toLowerCase()

  const searchResults =
    cleanedSearch
      ? safeAllUsers.filter((user) => {
          if (
            isSameUser(
              user,
              currentUser
            )
          ) {
            return false
          }

          const identifiers =
            getIdentifiers(user)

          return identifiers.some(
            (identifier) =>
              identifier.includes(
                cleanedSearch
              )
          )
        })
      : []


  // =========================================================
  // FRIEND REQUEST HELPERS
  // =========================================================

  const incomingRequests =
    safeFriendRequests.filter(
      (request) => {
        if (
          request.status &&
          request.status !== 'pending'
        ) {
          return false
        }

        return (
          String(
            request.receiverId || ''
          ).toLowerCase() ===
          currentUserId
        )
      }
    )


  const isFriend = (user) => {
    return safeFriends.some(
      (friend) =>
        isSameUser(
          friend,
          user
        )
    )
  }


  const hasSentRequest = (user) => {
    return safeFriendRequests.some(
      (request) => {
        if (
          request.status &&
          request.status !== 'pending'
        ) {
          return false
        }

        return (
          String(
            request.senderId || ''
          ).toLowerCase() ===
            currentUserId &&
          String(
            request.receiverId || ''
          ).toLowerCase() ===
            getUserId(user).toLowerCase()
        )
      }
    )
  }


  const hasReceivedRequest = (user) => {
    return safeFriendRequests.some(
      (request) => {
        if (
          request.status &&
          request.status !== 'pending'
        ) {
          return false
        }

        return (
          String(
            request.senderId || ''
          ).toLowerCase() ===
            getUserId(user).toLowerCase() &&
          String(
            request.receiverId || ''
          ).toLowerCase() ===
            currentUserId
        )
      }
    )
  }


  // =========================================================
  // COMMENTS
  // =========================================================

  const handleCommentChange = (
    postId,
    value
  ) => {
    setCommentInputs(
      (previous) => ({
        ...previous,
        [postId]: value
      })
    )
  }


  const handleCommentSubmit = (
    postId,
    event
  ) => {
    event.preventDefault()

    const text =
      (
        commentInputs[postId] ||
        ''
      ).trim()

    if (!text) {
      return
    }

    const newComment = {
      id: `${postId}-${Date.now()}`,
      author:
        getUsername(currentUser) ||
        'Anonymous',
      text,
      createdAt: Date.now()
    }

    if (onAddComment) {
      onAddComment(
        postId,
        newComment
      )
    }

    setCommentInputs(
      (previous) => ({
        ...previous,
        [postId]: ''
      })
    )
  }


  // =========================================================
  // PROFILE
  // =========================================================

  const handleProfileClick = (post) => {
    if (!onViewProfile) {
      return
    }

    const author = getAuthor(post)

    if (author) {
      onViewProfile(author)
      return
    }

    if (post.authorId) {
      const matchingUser =
        safeAllUsers.find(
          (user) =>
            getUserId(user) ===
            String(post.authorId)
        )

      if (matchingUser) {
        onViewProfile(matchingUser)
      }
    }
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* =====================================================
          MAIN FEED
          ===================================================== */}

      <div className="lg:col-span-2 space-y-5">

        {visiblePosts.length > 0 ? (

          visiblePosts.map((post) => {
            const author =
              getAuthor(post)

            const authorName =
              getAuthorName(post)

            const authorAvatar =
              getAuthorAvatar(post)

            const comments =
              Array.isArray(
                post.comments
              )
                ? post.comments
                : []

            const commentsOpen =
              openCommentPostId ===
              post.id

            const myPost =
              isMyPost(post)

            return (
              <div
                key={
                  post.id ||
                  post._id
                }
                className="space-y-0"
              >

                {/* Author Header */}
                <div className="bg-white px-4 sm:px-5 pt-4 rounded-t-2xl border border-b-0 border-stone-200/80">

                  <div className="flex items-center justify-between gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        handleProfileClick(
                          post
                        )
                      }
                      className="flex items-center gap-3 min-w-0 text-left group"
                    >

                      {authorAvatar ? (
                        <img
                          src={authorAvatar}
                          alt={`${authorName}'s avatar`}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              'none'
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {authorName
                            .charAt(0)
                            .toUpperCase() || 'U'}
                        </div>
                      )}

                      <div className="min-w-0">

                        <p className="font-semibold text-stone-800 group-hover:text-amber-600 transition text-sm truncate">
                          @{authorName}
                        </p>

                        {post.createdAt && (
                          <p className="text-[11px] text-stone-400">
                            {formatDate(
                              post.createdAt
                            )}
                          </p>
                        )}

                      </div>

                    </button>


                    {myPost &&
                      onDeletePost && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeletePost(
                              post.id
                            )
                          }
                          className="text-xs text-stone-400 hover:text-red-500 transition shrink-0"
                        >
                          Delete
                        </button>
                      )}

                  </div>

                </div>


                {/* Post Card */}
                <div className="[&>article]:rounded-t-none [&>article]:border-t-0">

                  <PostCard
                    post={post}
                    onReact={onReact}
                    isArchived={false}
                    hoursLeft={
                      getHoursLeft(post)
                    }
                  />

                </div>


                {/* Comments */}
                <div className="bg-white px-4 sm:px-5 pb-4 rounded-b-2xl border border-t-0 border-stone-200/80">

                  <div className="flex justify-end pt-2 border-t border-stone-100">

                    <button
                      type="button"
                      onClick={() =>
                        setOpenCommentPostId(
                          commentsOpen
                            ? null
                            : post.id
                        )
                      }
                      className="text-xs text-stone-500 hover:text-stone-800 font-medium transition"
                    >
                      💬 Comments (
                      {comments.length}
                      )
                    </button>

                  </div>


                  {commentsOpen && (
                    <div className="pt-3 space-y-3">

                      {/* Comment Form */}
                      <form
                        onSubmit={(event) =>
                          handleCommentSubmit(
                            post.id,
                            event
                          )
                        }
                        className="flex gap-2"
                      >

                        <input
                          type="text"
                          value={
                            commentInputs[
                              post.id
                            ] || ''
                          }
                          onChange={(event) =>
                            handleCommentChange(
                              post.id,
                              event.target.value
                            )
                          }
                          placeholder="Write a comment..."
                          className="flex-1 min-w-0 px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />

                        <button
                          type="submit"
                          className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition shrink-0"
                        >
                          Post
                        </button>

                      </form>


                      {/* Comment List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">

                        {comments.length > 0 ? (

                          comments.map(
                            (
                              comment,
                              index
                            ) => (
                              <div
                                key={
                                  comment.id ||
                                  `comment-${index}`
                                }
                                className="bg-stone-50 p-2.5 rounded-xl text-xs"
                              >

                                <div className="flex items-center justify-between gap-2">

                                  <span className="font-semibold text-stone-800 truncate">
                                    @
                                    {comment.author ||
                                      'Anonymous'}
                                  </span>

                                  {comment.createdAt && (
                                    <span className="text-[10px] text-stone-400 shrink-0">
                                      {formatDate(
                                        comment.createdAt
                                      )}
                                    </span>
                                  )}

                                </div>

                                <p className="text-stone-600 mt-1 break-words whitespace-pre-wrap">
                                  {comment.text}
                                </p>

                              </div>
                            )
                          )

                        ) : (

                          <p className="text-stone-400 text-xs text-center py-1">
                            No comments yet.
                          </p>

                        )}

                      </div>

                    </div>
                  )}

                </div>

              </div>
            )
          })

        ) : (

          <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center">

            <p className="text-stone-500 text-sm font-medium">
              No posts from friends yet.
            </p>

            <p className="text-stone-400 text-xs mt-1">
              Add friends using the search
              panel to see their posts.
            </p>

          </div>

        )}

      </div>


      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <div className="space-y-6">

        {/* Friend Requests */}
        {incomingRequests.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-3">

            <h3 className="font-semibold text-stone-800 text-sm flex items-center justify-between">

              <span>
                Friend Requests
              </span>

              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {incomingRequests.length}
              </span>

            </h3>


            <div className="space-y-2 max-h-60 overflow-y-auto">

              {incomingRequests.map(
                (request) => {
                  const sender =
                    safeAllUsers.find(
                      (user) =>
                        getUserId(user) ===
                        String(
                          request.senderId
                        )
                    ) ||
                    request.sender ||
                    request.senderId

                  const senderName =
                    getUsername(sender) ||
                    'Anonymous'

                  return (
                    <div
                      key={
                        request.id ||
                        getUserId(sender)
                      }
                      className="flex items-center justify-between gap-2 p-2 bg-stone-50 rounded-xl border border-stone-100"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          onViewProfile &&
                          onViewProfile(
                            sender
                          )
                        }
                        className="text-xs text-stone-800 font-semibold hover:text-amber-600 truncate min-w-0 text-left"
                      >
                        @{senderName}
                      </button>


                      <div className="flex gap-1 shrink-0">

                        <button
                          type="button"
                          onClick={() =>
                            onAcceptFriend &&
                            onAcceptFriend(
                              sender
                            )
                          }
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg font-medium transition"
                        >
                          Accept
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDeclineFriend &&
                            onDeclineFriend(
                              sender
                            )
                          }
                          className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-600 px-2 py-1 rounded-lg font-medium transition"
                        >
                          Decline
                        </button>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          </div>
        )}


        {/* Find Friends */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">

          <h3 className="font-semibold text-stone-800">
            Find Friends
          </h3>

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search by name or username..."
            className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />


          {cleanedSearch && (
            <div className="space-y-2 max-h-60 overflow-y-auto">

              {searchResults.length > 0 ? (

                searchResults.map(
                  (user) => {
                    const username =
                      getUsername(user) ||
                      'Anonymous'

                    const alreadyFriend =
                      isFriend(user)

                    const sentRequest =
                      hasSentRequest(
                        user
                      )

                    const receivedRequest =
                      hasReceivedRequest(
                        user
                      )

                    return (
                      <div
                        key={
                          getUserId(user) ||
                          username
                        }
                        className="flex items-center justify-between gap-2 p-2 hover:bg-stone-50 rounded-lg"
                      >

                        <button
                          type="button"
                          onClick={() =>
                            onViewProfile &&
                            onViewProfile(
                              user
                            )
                          }
                          className="text-sm text-stone-700 font-medium hover:text-amber-600 truncate min-w-0 text-left"
                        >
                          @{username}
                        </button>


                        {alreadyFriend ? (

                          <button
                            type="button"
                            onClick={() =>
                              onRemoveFriend &&
                              onRemoveFriend(
                                user
                              )
                            }
                            className="text-xs text-stone-400 hover:text-red-600 px-2 py-1 shrink-0"
                          >
                            Remove
                          </button>

                        ) : sentRequest ? (

                          <button
                            type="button"
                            onClick={() =>
                              onCancelRequest &&
                              onCancelRequest(
                                user
                              )
                            }
                            className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 italic shrink-0"
                          >
                            Pending
                          </button>

                        ) : receivedRequest ? (

                          <button
                            type="button"
                            onClick={() =>
                              onAcceptFriend &&
                              onAcceptFriend(
                                user
                              )
                            }
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg font-medium shrink-0"
                          >
                            Accept
                          </button>

                        ) : (

                          <button
                            type="button"
                            onClick={() =>
                              onRequestFriend &&
                              onRequestFriend(
                                user
                              )
                            }
                            className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 px-2 py-1 rounded-lg font-medium shrink-0"
                          >
                            + Add
                          </button>

                        )}

                      </div>
                    )
                  }
                )

              ) : (

                <p className="text-xs text-stone-400 py-2 text-center">
                  No users found
                </p>

              )}

            </div>
          )}

        </div>


        {/* My Friends */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-3">

          <h3 className="font-semibold text-stone-800 text-sm flex items-center justify-between">

            <span>
              My Friends
            </span>

            <span className="text-xs text-stone-400 font-normal">
              ({safeFriends.length})
            </span>

          </h3>


          <div className="space-y-2 max-h-60 overflow-y-auto">

            {safeFriends.length > 0 ? (

              safeFriends.map(
                (friend) => {
                  const friendUser =
                    safeAllUsers.find(
                      (user) =>
                        isSameUser(
                          user,
                          friend
                        )
                    ) || friend

                  const friendName =
                    getUsername(
                      friendUser
                    ) ||
                    'Anonymous'

                  return (
                    <div
                      key={
                        getUserId(
                          friendUser
                        ) ||
                        friendName
                      }
                      className="flex items-center justify-between gap-2 p-2 hover:bg-stone-50 rounded-lg"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          onViewProfile &&
                          onViewProfile(
                            friendUser
                          )
                        }
                        className="text-sm text-stone-700 font-medium hover:text-amber-600 truncate min-w-0 text-left"
                      >
                        @{friendName}
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          onRemoveFriend &&
                          onRemoveFriend(
                            friendUser
                          )
                        }
                        className="text-xs text-stone-400 hover:text-red-600 px-2 py-1 shrink-0"
                      >
                        Remove
                      </button>

                    </div>
                  )
                }
              )

            ) : (

              <p className="text-xs text-stone-400 py-2 text-center">
                No friends added yet.
              </p>

            )}

          </div>

        </div>

      </div>

    </div>
  )
}