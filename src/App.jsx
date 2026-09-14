import React, { useState, useEffect, useCallback } from 'react'

import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'

import Home from './pages/Home'
import SharedFeed from './pages/SharedFeed'
import PrivateJournal from './pages/PrivateJournal'
import Archive from './pages/Archive'
import About from './pages/About'
import Profile from './pages/Profile'

import { db } from './firebase'

import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  increment,
  query,
  orderBy,
  arrayUnion,
  where,
  or,
  getDocs
} from 'firebase/firestore'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')

  const [currentUser, setCurrentUser] = useState(() => {
    const savedSession = localStorage.getItem('catchup_session')

    if (!savedSession) {
      return null
    }

    try {
      return JSON.parse(savedSession)
    } catch {
      return {
        id: savedSession,
        username: savedSession,
        name: savedSession
      }
    }
  })

  const [posts, setPosts] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [viewedUser, setViewedUser] = useState(null)
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])

  const [apiQuotes, setApiQuotes] = useState([])
  const [quoteSearch, setQuoteSearch] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('All')
  const [quoteError, setQuoteError] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(true)

  const [dataError, setDataError] = useState('')

  const getUserId = useCallback((user) => {
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
  }, [])

  const getUserName = useCallback(
    (user) => {
      if (!user) {
        return ''
      }

      if (typeof user === 'object') {
        return String(
          user.username ||
          user.name ||
          user.displayName ||
          getUserId(user)
        )
      }

      return String(user)
    },
    [getUserId]
  )

  const getUserAvatar = useCallback((user) => {
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
  }, [])

  const formatUserPayload = useCallback(
    (user) => {
      const id = getUserId(user)

      if (!id) {
        return {
          id: '',
          username: '',
          name: '',
          avatarUrl: ''
        }
      }

      if (typeof user === 'object' && user !== null) {
        return {
          id: String(id),
          username: String(user.username || id),
          name: String(
            user.name ||
            user.displayName ||
            user.username ||
            id
          ),
          avatarUrl: getUserAvatar(user)
        }
      }

      return {
        id: String(id),
        username: String(id),
        name: String(id),
        avatarUrl: ''
      }
    },
    [getUserId, getUserAvatar]
  )

  const currentUserId = getUserId(currentUser)

  // =========================================================
  // DAILY AFFIRMATION / FETCH API
  // =========================================================

  const fetchDailyQuote = useCallback(async () => {
    setQuoteLoading(true)
    setQuoteError('')

    try {
      const response = await fetch(
        'https://dummyjson.com/quotes?limit=0'
      )

      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status}`
        )
      }

      const data = await response.json()

      if (
        !data ||
        !Array.isArray(data.quotes) ||
        data.quotes.length === 0
      ) {
        throw new Error(
          'Invalid data received from the API.'
        )
      }

      setApiQuotes(data.quotes)
      setQuoteError('')
    } catch (error) {
      console.error(
        'Daily affirmation API error:',
        error
      )

      setApiQuotes([])

      setQuoteError(
        'Unable to retrieve the data. Please try again.'
      )
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDailyQuote()
  }, [fetchDailyQuote])

  // =========================================================
  // AFFIRMATION THEMES
  // =========================================================

  const affirmationThemes = {
    'Self-Love': [
      'love',
      'self',
      'yourself',
      'worth',
      'care',
      'beautiful'
    ],

    'Motivation': [
      'success',
      'achieve',
      'goal',
      'work',
      'action',
      'try',
      'effort'
    ],

    'Confidence': [
      'believe',
      'confidence',
      'courage',
      'strong',
      'capable',
      'fear'
    ],

    'Happiness': [
      'happy',
      'happiness',
      'joy',
      'smile',
      'laugh',
      'enjoy'
    ],

    'Growth': [
      'learn',
      'learning',
      'grow',
      'growth',
      'change',
      'experience'
    ],

    'Positivity': [
      'positive',
      'hope',
      'hopeful',
      'better',
      'good',
      'light'
    ]
  }

  const getQuoteTheme = (quote) => {
    const quoteText = String(
      quote.quote || ''
    ).toLowerCase()

    for (
      const [theme, keywords]
      of Object.entries(affirmationThemes)
    ) {
      const hasKeyword = keywords.some(
        (keyword) =>
          quoteText.includes(
            keyword.toLowerCase()
          )
      )

      if (hasKeyword) {
        return theme
      }
    }

    return 'Positivity'
  }

  const filteredApiQuotes = apiQuotes.filter(
    (item) => {
      const search =
        quoteSearch.trim().toLowerCase()

      const matchesAuthor =
        !search ||
        String(item.author || '')
          .toLowerCase()
          .includes(search)

      const matchesTheme =
        selectedTheme === 'All' ||
        getQuoteTheme(item) === selectedTheme

      return (
        matchesAuthor &&
        matchesTheme
      )
    }
  )

  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleTabChange = (tabId) => {
    if (tabId === 'profile') {
      setViewedUser(null)
    }

    setActiveTab(tabId)
  }

  // =========================================================
  // POSTS
  // =========================================================

  useEffect(() => {
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const livePosts = snapshot.docs.map(
          (postDoc) => ({
            id: postDoc.id,
            ...postDoc.data()
          })
        )

        setPosts(livePosts)
        setDataError('')
      },
      (error) => {
        console.error(
          'Posts listener error:',
          error
        )

        setDataError(
          'Unable to retrieve posts. Please try again.'
        )
      }
    )

    return () => unsubscribe()
  }, [])

  // =========================================================
  // USERS
  // =========================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersList = snapshot.docs.map(
          (userDoc) => ({
            id: userDoc.id,
            ...userDoc.data()
          })
        )

        setAllUsers(usersList)

        if (!currentUserId) {
          return
        }

        const matchedUser = usersList.find(
          (user) =>
            getUserId(user) === currentUserId
        )

        if (!matchedUser) {
          return
        }

        setCurrentUser((previousUser) => {
          if (!previousUser) {
            return matchedUser
          }

          const updatedSession = {
            ...previousUser,
            ...matchedUser,
            id: currentUserId
          }

          localStorage.setItem(
            'catchup_session',
            JSON.stringify(updatedSession)
          )

          return updatedSession
        })
      },
      (error) => {
        console.error(
          'Users listener error:',
          error
        )

        setDataError(
          'Unable to retrieve user data. Please try again.'
        )
      }
    )

    return () => unsubscribe()
  }, [currentUserId, getUserId])

  const activeViewedUser = viewedUser
    ? (
        allUsers.find(
          (user) =>
            getUserId(user) ===
            getUserId(viewedUser)
        ) || viewedUser
      )
    : null

  // =========================================================
  // FRIENDS
  // =========================================================

  useEffect(() => {
    if (!currentUserId) {
      setFriends([])
      return undefined
    }

    const userRef = doc(
      db,
      'users',
      currentUserId
    )

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setFriends([])
          return
        }

        const userData = snapshot.data()

        setFriends(
          Array.isArray(userData.friends)
            ? userData.friends
            : []
        )
      },
      (error) => {
        console.error(
          'Friends listener error:',
          error
        )

        setDataError(
          'Unable to retrieve your friends. Please try again.'
        )
      }
    )

    return () => unsubscribe()
  }, [currentUserId])

  // =========================================================
  // FRIEND REQUESTS
  // =========================================================

  useEffect(() => {
    if (!currentUserId) {
      setFriendRequests([])
      return undefined
    }

    const requestsQuery = query(
      collection(db, 'friendRequests'),
      or(
        where(
          'senderId',
          '==',
          currentUserId
        ),
        where(
          'receiverId',
          '==',
          currentUserId
        )
      )
    )

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requests = snapshot.docs.map(
          (requestDoc) => ({
            id: requestDoc.id,
            ...requestDoc.data()
          })
        )

        setFriendRequests(requests)
      },
      (error) => {
        console.error(
          'Friend requests listener error:',
          error
        )

        setDataError(
          'Unable to retrieve friend requests. Please try again.'
        )
      }
    )

    return () => unsubscribe()
  }, [currentUserId])

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const handleAuthSuccess = (userData) => {
    const userObject =
      typeof userData === 'string'
        ? {
            id: userData,
            username: userData,
            name: userData
          }
        : userData

    setCurrentUser(userObject)

    localStorage.setItem(
      'catchup_session',
      JSON.stringify(userObject)
    )

    setActiveTab('home')
    setViewedUser(null)
    setDataError('')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setViewedUser(null)
    setFriends([])
    setFriendRequests([])

    localStorage.removeItem(
      'catchup_session'
    )

    setActiveTab('home')
    setDataError('')
  }

  // =========================================================
  // PROFILE NAVIGATION
  // =========================================================

  const handleViewProfile = (userToView) => {
    if (!userToView) {
      setViewedUser(null)
      setActiveTab('profile')
      return
    }

    const targetId = getUserId(userToView)

    if (
      !targetId ||
      targetId === currentUserId
    ) {
      setViewedUser(null)
    } else {
      setViewedUser(userToView)
    }

    setActiveTab('profile')
  }

  // =========================================================
  // ADD POST
  // =========================================================

  const addPost = async (
    text,
    isPrivate = false,
    image = null
  ) => {
    const cleanText =
      typeof text === 'string'
        ? text.trim()
        : ''

    if (!cleanText && !image) {
      return
    }

    if (!currentUserId) {
      setDataError(
        'You must be logged in to create a post.'
      )
      return
    }

    const authorName =
      getUserName(currentUser)

    const authorAvatar =
      getUserAvatar(currentUser)

    try {
      await addDoc(
        collection(db, 'posts'),
        {
          text: cleanText,
          isPrivate: Boolean(isPrivate),

          image: image || null,

          author: authorName,
          authorId: currentUserId,
          authorAvatar,

          createdAt: Date.now(),

          isDeleted: false,
          isExpired: false,

          comments: [],

          reactions: {
            heart: 0
          }
        }
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error creating post:',
        error
      )

      setDataError(
        'Unable to create the post. Please try again.'
      )
    }
  }

  // =========================================================
  // COMMENTS
  // =========================================================

  const handleAddComment = async (
    postId,
    newComment
  ) => {
    if (!postId || !newComment) {
      return
    }

    try {
      const postRef = doc(
        db,
        'posts',
        postId
      )

      await updateDoc(
        postRef,
        {
          comments: arrayUnion(
            newComment
          )
        }
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error adding comment:',
        error
      )

      setDataError(
        'Unable to add the comment. Please try again.'
      )
    }
  }

  // =========================================================
  // REACTIONS
  // =========================================================

  const handleReaction = async (
    postId,
    type
  ) => {
    const allowedReactions = [
      'heart'
    ]

    if (
      !postId ||
      !allowedReactions.includes(type)
    ) {
      console.error(
        'Invalid reaction type:',
        type
      )
      return
    }

    try {
      const postRef = doc(
        db,
        'posts',
        postId
      )

      await updateDoc(
        postRef,
        {
          [`reactions.${type}`]:
            increment(1)
        }
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error adding reaction:',
        error
      )

      setDataError(
        'Unable to add the reaction. Please try again.'
      )
    }
  }

  // =========================================================
  // DELETE POST
  // =========================================================

  const handleDeletePost = async (
    postId
  ) => {
    if (!postId) {
      return
    }

    try {
      await updateDoc(
        doc(db, 'posts', postId),
        {
          isDeleted: true
        }
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error deleting post:',
        error
      )

      setDataError(
        'Unable to delete the post. Please try again.'
      )
    }
  }

  // =========================================================
  // PERMANENT DELETE
  // =========================================================

  const handlePermanentDelete = async (
    postId
  ) => {
    if (!postId) {
      return
    }

    try {
      await deleteDoc(
        doc(db, 'posts', postId)
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error permanently deleting post:',
        error
      )

      setDataError(
        'Unable to permanently delete the post. Please try again.'
      )
    }
  }

  // =========================================================
  // RESTORE POST
  // =========================================================

  const handleRestorePost = async (
    postId
  ) => {
    if (!postId) {
      return
    }

    try {
      await updateDoc(
        doc(db, 'posts', postId),
        {
          isDeleted: false,
          isExpired: false,
          createdAt: Date.now()
        }
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error restoring post:',
        error
      )

      setDataError(
        'Unable to restore the post. Please try again.'
      )
    }
  }

  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  const handleUpdateProfile = async (
    updatedData
  ) => {
    if (
      !currentUserId ||
      !updatedData
    ) {
      return
    }

    try {
      const userRef = doc(
        db,
        'users',
        currentUserId
      )

      const avatar =
        updatedData.avatarUrl ||
        updatedData.avatar ||
        updatedData.profilePicture ||
        updatedData.image ||
        getUserAvatar(currentUser)

      const updatedName =
        updatedData.name ||
        updatedData.displayName ||
        getUserName(currentUser)

      const updatedSession = {
        ...currentUser,
        ...updatedData,

        id: currentUserId,

        name: updatedName,
        displayName: updatedName,

        avatarUrl: avatar,
        avatar: avatar,
        profilePicture: avatar,
        image: avatar
      }

      const firestoreProfileData = {
        name: updatedName,
        displayName: updatedName,
        avatarUrl: avatar,
        avatar: avatar,
        profilePicture: avatar,
        image: avatar
      }

      if (
        updatedData.username !== undefined
      ) {
        firestoreProfileData.username =
          updatedData.username
      }

      if (
        updatedData.birthdate !== undefined
      ) {
        firestoreProfileData.birthdate =
          updatedData.birthdate
      }

      if (
        updatedData.bio !== undefined
      ) {
        firestoreProfileData.bio =
          updatedData.bio
      }

      await setDoc(
        userRef,
        firestoreProfileData,
        {
          merge: true
        }
      )

      setCurrentUser(updatedSession)

      localStorage.setItem(
        'catchup_session',
        JSON.stringify(updatedSession)
      )

      const userPostsQuery = query(
        collection(db, 'posts'),
        where(
          'authorId',
          '==',
          currentUserId
        )
      )

      const querySnapshot =
        await getDocs(userPostsQuery)

      const updatePromises =
        querySnapshot.docs.map(
          (postDoc) =>
            updateDoc(
              doc(
                db,
                'posts',
                postDoc.id
              ),
              {
                author: updatedName,
                authorAvatar: avatar
              }
            )
        )

      await Promise.all(
        updatePromises
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error updating profile:',
        error
      )

      setDataError(
        'Unable to update your profile. Please try again.'
      )
    }
  }

  // =========================================================
  // FRIEND REQUEST
  // =========================================================

  const handleRequestFriend = async (
    targetUser
  ) => {
    if (
      !currentUserId ||
      !targetUser
    ) {
      return
    }

    const targetId =
      getUserId(targetUser)

    if (
      !targetId ||
      targetId === currentUserId
    ) {
      return
    }

    const requestId =
      `${currentUserId}_${targetId}`

    try {
      await setDoc(
        doc(
          db,
          'friendRequests',
          requestId
        ),
        {
          senderId: currentUserId,
          receiverId: String(targetId),

          sender:
            formatUserPayload(
              currentUser
            ),

          receiver:
            formatUserPayload(
              targetUser
            ),

          status: 'pending',
          createdAt: Date.now()
        }
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error sending friend request:',
        error
      )

      setDataError(
        'Unable to send the friend request. Please try again.'
      )
    }
  }

  // =========================================================
  // ACCEPT FRIEND
  // =========================================================

  const handleAcceptFriend = async (
    senderUser
  ) => {
    if (
      !currentUserId ||
      !senderUser
    ) {
      return
    }

    const senderId =
      getUserId(senderUser)

    if (
      !senderId ||
      senderId === currentUserId
    ) {
      return
    }

    const currentUserPayload =
      formatUserPayload(
        currentUser
      )

    const senderUserPayload =
      formatUserPayload(
        senderUser
      )

    try {
      const currentUserRef = doc(
        db,
        'users',
        currentUserId
      )

      await setDoc(
        currentUserRef,
        {
          friends: arrayUnion(
            senderUserPayload
          )
        },
        {
          merge: true
        }
      )

      const senderUserRef = doc(
        db,
        'users',
        String(senderId)
      )

      await setDoc(
        senderUserRef,
        {
          friends: arrayUnion(
            currentUserPayload
          )
        },
        {
          merge: true
        }
      )

      const requestId =
        `${senderId}_${currentUserId}`

      await deleteDoc(
        doc(
          db,
          'friendRequests',
          requestId
        )
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error accepting friend request:',
        error
      )

      setDataError(
        'Unable to accept the friend request. Please try again.'
      )
    }
  }

  // =========================================================
  // DECLINE FRIEND
  // =========================================================

  const handleDeclineFriend = async (
    senderUser
  ) => {
    if (
      !currentUserId ||
      !senderUser
    ) {
      return
    }

    const senderId =
      getUserId(senderUser)

    if (!senderId) {
      return
    }

    const requestId =
      `${senderId}_${currentUserId}`

    try {
      await deleteDoc(
        doc(
          db,
          'friendRequests',
          requestId
        )
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error declining friend request:',
        error
      )

      setDataError(
        'Unable to decline the friend request. Please try again.'
      )
    }
  }

  // =========================================================
  // CANCEL FRIEND REQUEST
  // =========================================================

  const handleCancelRequest = async (
    targetUser
  ) => {
    if (
      !currentUserId ||
      !targetUser
    ) {
      return
    }

    const targetId =
      getUserId(targetUser)

    if (!targetId) {
      return
    }

    const requestId =
      `${currentUserId}_${targetId}`

    try {
      await deleteDoc(
        doc(
          db,
          'friendRequests',
          requestId
        )
      )

      setDataError('')
    } catch (error) {
      console.error(
        'Error canceling friend request:',
        error
      )

      setDataError(
        'Unable to cancel the friend request. Please try again.'
      )
    }
  }

  // =========================================================
  // REMOVE FRIEND
  // =========================================================

  const handleRemoveFriend = async (
    targetUserOrId
  ) => {
    if (
      !currentUserId ||
      !targetUserOrId
    ) {
      return
    }

    const targetId =
      getUserId(targetUserOrId)

    if (
      !targetId ||
      targetId === currentUserId
    ) {
      return
    }

    try {
      const currentUserRef = doc(
        db,
        'users',
        currentUserId
      )

      const currentUserSnap =
        await getDoc(
          currentUserRef
        )

      if (currentUserSnap.exists()) {
        const currentData =
          currentUserSnap.data()

        const currentFriends =
          Array.isArray(
            currentData.friends
          )
            ? currentData.friends
            : []

        const updatedFriends =
          currentFriends.filter(
            (friend) =>
              getUserId(friend) !==
              targetId
          )

        await updateDoc(
          currentUserRef,
          {
            friends: updatedFriends
          }
        )
      }

      const targetUserRef = doc(
        db,
        'users',
        targetId
      )

      const targetUserSnap =
        await getDoc(
          targetUserRef
        )

      if (targetUserSnap.exists()) {
        const targetData =
          targetUserSnap.data()

        const targetFriends =
          Array.isArray(
            targetData.friends
          )
            ? targetData.friends
            : []

        const updatedTargetFriends =
          targetFriends.filter(
            (friend) =>
              getUserId(friend) !==
              currentUserId
          )

        await updateDoc(
          targetUserRef,
          {
            friends:
              updatedTargetFriends
          }
        )
      }

      setDataError('')
    } catch (error) {
      console.error(
        'Error removing friend:',
        error
      )

      setDataError(
        'Unable to remove the friend. Please try again.'
      )
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-800 font-sans antialiased selection:bg-amber-200">

      {!currentUser && (
        <AuthModal
          onAuthSuccess={handleAuthSuccess}
          allUsers={allUsers}
        />
      )}

      {currentUser && (
        <div className="min-h-screen w-full flex flex-col">

          <Navbar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            currentUser={currentUser}
            onViewProfile={handleViewProfile}
            onLogout={handleLogout}
            friendRequests={friendRequests}
            onAcceptFriend={handleAcceptFriend}
            onDeclineFriend={handleDeclineFriend}
          />

          <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-12 flex-1">

            {/* Application Error */}
            {dataError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">

                <p className="min-w-0">
                  {dataError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setDataError('')
                  }
                  className="font-semibold hover:underline shrink-0"
                >
                  Dismiss
                </button>

              </div>
            )}

            {/* Daily Affirmation / AJAX API Data */}
            <div className="mb-6 p-4 sm:p-5 rounded-xl bg-amber-50/80 border border-amber-200/60 shadow-sm">

              <div className="text-center mb-4">

                <h2 className="text-lg sm:text-xl font-semibold text-amber-900">
                  Daily Affirmation
                </h2>

                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Find an affirmation by author or theme
                </p>

              </div>

              {/* Search and Theme Filter */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">

                <input
                  type="text"
                  value={quoteSearch}
                  onChange={(e) =>
                    setQuoteSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search by author name..."
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />

                <select
                  value={selectedTheme}
                  onChange={(e) =>
                    setSelectedTheme(
                      e.target.value
                    )
                  }
                  className="w-full sm:w-48 px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                >

                  <option value="All">
                    All Themes
                  </option>

                  {Object.keys(
                    affirmationThemes
                  ).map(
                    (theme) => (
                      <option
                        key={theme}
                        value={theme}
                      >
                        {theme}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* Loading */}
              {quoteLoading && (
                <div className="text-center py-6">

                  <p className="text-stone-400 text-sm animate-pulse">
                    Loading daily affirmations...
                  </p>

                </div>
              )}

              {/* Error */}
              {!quoteLoading &&
                quoteError && (
                  <div className="text-center py-4">

                    <p className="text-red-500 font-medium text-sm mb-2">
                      {quoteError}
                    </p>

                    <button
                      type="button"
                      onClick={
                        fetchDailyQuote
                      }
                      disabled={
                        quoteLoading
                      }
                      className="text-sm font-semibold text-amber-700 hover:text-amber-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Try Again
                    </button>

                  </div>
                )}

              {/* No Results */}
              {!quoteLoading &&
                !quoteError &&
                filteredApiQuotes.length ===
                  0 && (
                  <div className="text-center py-6">

                    <p className="text-stone-500 text-sm">
                      No affirmations found.
                    </p>

                    <p className="text-stone-400 text-xs mt-1">
                      Try another author name or theme.
                    </p>

                  </div>
                )}

              {/* API Results */}
              {!quoteLoading &&
                !quoteError &&
                filteredApiQuotes.length >
                  0 && (
                  <div className="space-y-3">

                    {filteredApiQuotes
                      .slice(0, 3)
                      .map(
                        (item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-amber-100 p-4 text-center"
                          >

                            <p className="text-stone-700 italic text-sm sm:text-base leading-relaxed">
                              "{item.quote}"
                            </p>

                            <p className="mt-2 font-semibold text-amber-900 text-sm">
                              {item.author}
                            </p>

                            <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                              {getQuoteTheme(
                                item
                              )}
                            </span>

                          </div>
                        )
                      )}

                  </div>
                )}

              {/* Refresh */}
              {!quoteLoading &&
                !quoteError &&
                apiQuotes.length > 0 && (
                  <div className="text-center mt-4">

                    <button
                      type="button"
                      onClick={
                        fetchDailyQuote
                      }
                      disabled={
                        quoteLoading
                      }
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Refresh Affirmations
                    </button>

                  </div>
                )}

            </div>

            <div className="w-full">

              {/* HOME */}
              {activeTab === 'home' && (
                <Home
                  posts={posts}
                  currentUser={currentUser}
                  allUsers={allUsers}
                  friends={friends}
                  friendRequests={
                    friendRequests
                  }
                  onReact={handleReaction}
                  addPost={addPost}
                  onAddComment={
                    handleAddComment
                  }
                  onDeletePost={
                    handleDeletePost
                  }
                  onRequestFriend={
                    handleRequestFriend
                  }
                  onAcceptFriend={
                    handleAcceptFriend
                  }
                  onDeclineFriend={
                    handleDeclineFriend
                  }
                  onCancelRequest={
                    handleCancelRequest
                  }
                  onRemoveFriend={
                    handleRemoveFriend
                  }
                  onViewProfile={
                    handleViewProfile
                  }
                />
              )}

              {/* SHARED FEED */}
              {activeTab === 'shared' && (
                <SharedFeed
                  posts={posts}
                  addPost={addPost}
                  currentUser={currentUser}
                  onReact={handleReaction}
                  onDeletePost={
                    handleDeletePost
                  }
                />
              )}

              {/* PRIVATE JOURNAL */}
              {activeTab === 'journal' && (
                <PrivateJournal
                  posts={posts}
                  addPost={addPost}
                  onReact={handleReaction}
                  currentUser={currentUser}
                  onDeletePost={
                    handleDeletePost
                  }
                />
              )}

              {/* ARCHIVE */}
              {activeTab === 'archive' && (
                <Archive
                  posts={posts}
                  currentUser={currentUser}
                  friends={friends}
                  onPermanentDelete={
                    handlePermanentDelete
                  }
                  onRestorePost={
                    handleRestorePost
                  }
                />
              )}

              {/* ABOUT */}
              {activeTab === 'about' && (
                <About />
              )}

              {/* PROFILE */}
              {activeTab === 'profile' && (
                <Profile
                  profileUser={
                    activeViewedUser ||
                    currentUser
                  }
                  currentUser={
                    currentUser
                  }
                  allUsers={allUsers}
                  onUpdateProfile={
                    handleUpdateProfile
                  }
                  friends={friends}
                  friendRequests={
                    friendRequests
                  }
                  profileUserFriends={
                    (
                      activeViewedUser ||
                      currentUser
                    )?.friends || []
                  }
                  onRequestFriend={
                    handleRequestFriend
                  }
                  onAcceptFriend={
                    handleAcceptFriend
                  }
                  onDeclineFriend={
                    handleDeclineFriend
                  }
                  onCancelRequest={
                    handleCancelRequest
                  }
                  onRemoveFriend={
                    handleRemoveFriend
                  }
                  onViewProfile={
                    handleViewProfile
                  }
                  onBackToFeed={() => {
                    setViewedUser(null)
                    setActiveTab(
                      'home'
                    )
                  }}
                />
              )}

            </div>

          </main>

        </div>
      )}

    </div>
  )
}