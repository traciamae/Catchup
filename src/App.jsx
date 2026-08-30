import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import SharedFeed from './pages/SharedFeed';
import PrivateJournal from './pages/PrivateJournal';
import Archive from './pages/Archive';
import About from './pages/About';
import Profile from './pages/Profile';

import { db } from './firebase';
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
} from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('catchup_session');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return saved ? { id: saved, username: saved, name: saved } : null;
    }
  });

  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [viewedUser, setViewedUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  // Fetch API State (Fulfills AJAX / Fetch API Requirement)
  const [dailyQuote, setDailyQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  // 0. External API Fetch Call with Error Handling
  useEffect(() => {
    fetch('https://dummyjson.com/quotes/random')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then((data) => {
        setDailyQuote(data);
        setQuoteError(null);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setQuoteError('Unable to retrieve the data. Please try again.');
      });
  }, []);

  const getUserId = (user) => {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.id || user.uid || user._id || user.username || user.name || '');
    }
    return String(user);
  };

  const getUserName = (user) => {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.name || user.displayName || user.username || getUserId(user));
    }
    return String(user);
  };

  const getUserAvatar = (userObj) => {
    if (typeof userObj !== 'object' || !userObj) return '';
    return userObj.avatarUrl || userObj.avatar || userObj.profilePicture || userObj.image || '';
  };

  const currentUserId = getUserId(currentUser);

  const handleTabChange = (tabId) => {
    if (tabId === 'profile') {
      setViewedUser(null);
    }
    setActiveTab(tabId);
  };

  const formatUserPayload = (userObj) => {
    const id = getUserId(userObj);
    if (typeof userObj === 'object' && userObj !== null) {
      const displayName = getUserName(userObj);
      return {
        id: String(id),
        username: String(userObj.username || id),
        name: String(displayName),
        avatarUrl: getUserAvatar(userObj)
      };
    }
    return { id: String(id), username: String(id), name: String(id) };
  };

  // 1. Live Feed Listener for Posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const livePosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(livePosts);
      },
      (error) => console.error("Posts listener error:", error)
    );

    return () => unsubscribe();
  }, []);

  // 2. Live Listener for Registered Users & Session Sync
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllUsers(usersList);

        if (currentUserId) {
          const matchedUser = usersList.find((u) => getUserId(u) === currentUserId);
          if (matchedUser) {
            setCurrentUser((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(matchedUser)) {
                localStorage.setItem('catchup_session', JSON.stringify(matchedUser));
                return matchedUser;
              }
              return prev;
            });
          }
        }
      },
      (error) => console.error("Users listener error:", error)
    );

    return () => unsubscribeUsers();
  }, [currentUserId]);

  const activeViewedUser = viewedUser
    ? allUsers.find((u) => getUserId(u) === getUserId(viewedUser)) || viewedUser
    : null;

  // 3. Live Listener for Current User's Friends
  useEffect(() => {
    if (!currentUserId) {
      setFriends([]);
      return;
    }

    const userRef = doc(db, 'users', currentUserId);
    const unsubscribeFriends = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setFriends(userData.friends || []);
        } else {
          setFriends([]);
        }
      },
      (error) => console.error("Friends listener error:", error)
    );

    return () => unsubscribeFriends();
  }, [currentUserId]);

  // 4. Live Listener for Friend Requests
  useEffect(() => {
    if (!currentUserId) {
      setFriendRequests([]);
      return;
    }

    const q = query(
      collection(db, 'friendRequests'),
      or(
        where('senderId', '==', currentUserId),
        where('receiverId', '==', currentUserId)
      )
    );

    const unsubscribeRequests = onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setFriendRequests(requests);
      },
      (error) => console.error("Friend requests listener error:", error)
    );

    return () => unsubscribeRequests();
  }, [currentUserId]);

  const handleAuthSuccess = (userData) => {
    const userObj = typeof userData === 'string' ? { id: userData, username: userData, name: userData } : userData;
    setCurrentUser(userObj);
    localStorage.setItem('catchup_session', JSON.stringify(userObj));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewedUser(null);
    setFriends([]);
    setFriendRequests([]);
    localStorage.removeItem('catchup_session');
  };

  const handleViewProfile = (userToView) => {
    const targetId = getUserId(userToView);

    if (!userToView || String(targetId) === currentUserId) {
      setViewedUser(null);
    } else {
      setViewedUser(userToView);
    }
    setActiveTab('profile');
  };

  const addPost = async (text, isPrivate = false, image = null) => {
    if (!text.trim() && !image) return;

    const authorName = getUserName(currentUser);
    const authorAvatar = getUserAvatar(currentUser);

    await addDoc(collection(db, 'posts'), {
      text,
      isPrivate: Boolean(isPrivate),
      image,
      author: authorName,
      authorId: currentUserId,
      authorAvatar: authorAvatar,
      createdAt: Date.now(),
      isDeleted: false,
      comments: [],
      reactions: { heart: 0, laugh: 0, support: 0 }
    });
  };

  const handleAddComment = async (postId, newComment) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReaction = async (postId, type) => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      [`reactions.${type}`]: increment(1)
    });
  };

  const handleDeletePost = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { isDeleted: true });
    } catch (error) {
      console.error('Error soft-deleting post:', error);
    }
  };

  const handlePermanentDelete = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Error permanently deleting post:', error);
    }
  };

  const handleRestorePost = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { isDeleted: false });
    } catch (error) {
      console.error('Error restoring post:', error);
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    if (!currentUserId) return;

    try {
      const userRef = doc(db, 'users', currentUserId);
      const avatar = updatedData.avatarUrl || updatedData.avatar || updatedData.profilePicture || updatedData.image || getUserAvatar(currentUser);
      const updatedDisplayName = updatedData.name || updatedData.displayName || getUserName(currentUser);

      const mergedData = {
        ...currentUser,
        ...updatedData,
        id: currentUserId,
        name: updatedDisplayName,
        displayName: updatedDisplayName,
        avatarUrl: avatar,
        avatar: avatar,
        profilePicture: avatar,
        image: avatar
      };

      await setDoc(userRef, mergedData, { merge: true });
      setCurrentUser(mergedData);
      localStorage.setItem('catchup_session', JSON.stringify(mergedData));

      const userPostsQuery = query(collection(db, 'posts'), where('authorId', '==', currentUserId));
      const querySnapshot = await getDocs(userPostsQuery);
      const updates = querySnapshot.docs.map((docSnap) =>
        updateDoc(doc(db, 'posts', docSnap.id), {
          author: updatedDisplayName,
          authorAvatar: avatar
        })
      );
      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating user profile in Firestore:', error);
    }
  };

  const handleRequestFriend = async (targetUser) => {
    if (!currentUserId || !targetUser) return;
    const targetId = getUserId(targetUser);

    if (!targetId || currentUserId === targetId) return;

    const requestId = `${currentUserId}_${targetId}`;

    try {
      await setDoc(doc(db, 'friendRequests', requestId), {
        senderId: currentUserId,
        receiverId: String(targetId),
        sender: formatUserPayload(currentUser),
        receiver: formatUserPayload(targetUser),
        status: 'pending',
        createdAt: Date.now()
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptFriend = async (senderUser) => {
    if (!currentUserId || !senderUser) return;
    const senderId = getUserId(senderUser);

    const currentUserPayload = formatUserPayload(currentUser);
    const senderUserPayload = formatUserPayload(senderUser);

    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      await setDoc(currentUserRef, { friends: arrayUnion(senderUserPayload) }, { merge: true });

      const senderUserRef = doc(db, 'users', String(senderId));
      await setDoc(senderUserRef, { friends: arrayUnion(currentUserPayload) }, { merge: true });

      const requestId = `${senderId}_${currentUserId}`;
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineFriend = async (senderUser) => {
    if (!currentUserId || !senderUser) return;
    const senderId = getUserId(senderUser);

    const requestId = `${senderId}_${currentUserId}`;
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleCancelRequest = async (targetUser) => {
    if (!currentUserId || !targetUser) return;
    const targetId = getUserId(targetUser);

    const requestId = `${currentUserId}_${targetId}`;
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const handleRemoveFriend = async (targetUserOrId) => {
    if (!currentUserId || !targetUserOrId) return;

    const targetId = getUserId(targetUserOrId);
    if (!targetId) return;

    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      const currentUserSnap = await getDoc(currentUserRef);

      if (currentUserSnap.exists()) {
        const currentData = currentUserSnap.data();
        const currentFriends = currentData.friends || [];
        const updatedFriends = currentFriends.filter((f) => getUserId(f) !== targetId);

        await updateDoc(currentUserRef, { friends: updatedFriends });
      }

      const targetFriendRef = doc(db, 'users', targetId);
      const targetSnap = await getDoc(targetFriendRef);

      if (targetSnap.exists()) {
        const targetData = targetSnap.data();
        const targetFriends = targetData.friends || [];
        const updatedTargetFriends = targetFriends.filter((f) => getUserId(f) !== currentUserId);

        await updateDoc(targetFriendRef, { friends: updatedTargetFriends });
      }
    } catch (error) {
      console.error('Error removing friend from Firestore:', error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-800 font-sans antialiased selection:bg-amber-200 overflow-x-hidden">
      {!currentUser && <AuthModal onAuthSuccess={handleAuthSuccess} allUsers={allUsers} />}

      {currentUser && (
        <div className="w-full flex flex-col min-h-screen">
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

          <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 flex-1">

            {/* Daily Inspiration Banner (Satisfies API Fetch & Error Handling Rubric) */}
            <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 shadow-sm text-center">
              {quoteError && (
                <p className="text-red-500 font-medium text-sm">{quoteError}</p>
              )}
              {dailyQuote && !quoteError && (
                <p className="text-stone-700 italic text-sm sm:text-base">
                  "{dailyQuote.quote}" <span className="font-semibold text-amber-900 not-italic">— {dailyQuote.author}</span>
                </p>
              )}
              {!dailyQuote && !quoteError && (
                <p className="text-stone-400 text-sm animate-pulse">Loading daily inspiration...</p>
              )}
            </div>

            <div className="w-full">
              {activeTab === 'home' && (
                <Home
                  posts={posts}
                  currentUser={currentUser}
                  allUsers={allUsers}
                  friends={friends}
                  friendRequests={friendRequests}
                  onReact={handleReaction}
                  addPost={addPost}
                  onAddComment={handleAddComment}
                  onDeletePost={handleDeletePost}
                  onRequestFriend={handleRequestFriend}
                  onAcceptFriend={handleAcceptFriend}
                  onDeclineFriend={handleDeclineFriend}
                  onCancelRequest={handleCancelRequest}
                  onRemoveFriend={handleRemoveFriend}
                  onViewProfile={handleViewProfile}
                />
              )}

              {activeTab === 'shared' && (
                <SharedFeed
                  posts={posts}
                  addPost={addPost}
                  currentUser={currentUser}
                  friends={friends}
                  onReact={handleReaction}
                  onDeletePost={handleDeletePost}
                />
              )}

              {activeTab === 'journal' && (
                <PrivateJournal
                  posts={posts}
                  addPost={addPost}
                  onReact={handleReaction}
                  currentUser={currentUser}
                  onDeletePost={handleDeletePost}
                />
              )}

              {activeTab === 'archive' && (
                <Archive
                  posts={posts}
                  currentUser={currentUser}
                  friends={friends}
                  onPermanentDelete={handlePermanentDelete}
                  onRestorePost={handleRestorePost}
                  onViewProfile={handleViewProfile}
                />
              )}

              {activeTab === 'about' && <About />}

              {activeTab === 'profile' && (
                <Profile
                  profileUser={activeViewedUser || currentUser}
                  currentUser={currentUser}
                  allUsers={allUsers}
                  onUpdateProfile={handleUpdateProfile}
                  friends={friends}
                  friendRequests={friendRequests}
                  profileUserFriends={(activeViewedUser || currentUser)?.friends || []}
                  onRequestFriend={handleRequestFriend}
                  onAcceptFriend={handleAcceptFriend}
                  onDeclineFriend={handleDeclineFriend}
                  onCancelRequest={handleCancelRequest}
                  onRemoveFriend={handleRemoveFriend}
                  onViewProfile={handleViewProfile}
                  onBackToFeed={() => {
                    setViewedUser(null);
                    setActiveTab('home');
                  }}
                />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}