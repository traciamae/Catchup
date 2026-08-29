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
  updateDoc, 
  setDoc,
  deleteDoc,
  increment, 
  query, 
  orderBy,
  arrayUnion,
  arrayRemove 
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

  // Controlled tab navigation that clears cached profile views
  const handleTabChange = (tabId) => {
    if (tabId === 'profile') {
      setViewedUser(null);
    }
    setActiveTab(tabId);
  };

  const getUserAvatar = (userObj) => {
    if (typeof userObj !== 'object' || !userObj) return '';
    return userObj.avatarUrl || userObj.avatar || userObj.profilePicture || userObj.image || '';
  };

  // 1. Live Feed Listener for Posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const livePosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(livePosts);
    });

    return () => unsubscribe();
  }, []);

  // 2. Live Listener for All Registered Users & Synced Current User
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersList);

      if (currentUser) {
        const currentId = typeof currentUser === 'object' ? currentUser.id : currentUser;
        const matchedUser = usersList.find((u) => u.id === currentId || u.username === currentId);
        if (matchedUser) {
          setCurrentUser(matchedUser);
          localStorage.setItem('catchup_session', JSON.stringify(matchedUser));
        }
      }
    });

    return () => unsubscribeUsers();
  }, []);

  // 3. Live Listener for Current User's Friends Subscribed directly from Firestore
  useEffect(() => {
    if (!currentUser) {
      setFriends([]);
      return;
    }

    const currentId = typeof currentUser === 'object' ? currentUser.id : currentUser;
    const userRef = doc(db, 'users', currentId);

    const unsubscribeFriends = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setFriends(userData.friends || []);
      } else {
        setFriends([]);
      }
    });

    return () => unsubscribeFriends();
  }, [currentUser]);

  const handleAuthSuccess = (userData) => {
    const userObj = typeof userData === 'string' ? { id: userData, username: userData, name: userData } : userData;
    setCurrentUser(userObj);
    localStorage.setItem('catchup_session', JSON.stringify(userObj));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewedUser(null);
    setFriends([]); // Clear in-memory friends state on logout
    localStorage.removeItem('catchup_session');
  };

  const handleViewProfile = (userToView) => {
    const currentId = typeof currentUser === 'object' ? currentUser?.id : currentUser;
    const targetId = typeof userToView === 'object' ? userToView?.id : userToView;

    if (!userToView || String(targetId) === String(currentId)) {
      setViewedUser(null);
    } else {
      setViewedUser(userToView);
    }
    setActiveTab('profile');
  };

  const addPost = async (text, isPrivate, image = null) => {
    if (!text.trim() && !image) return;
    
    const authorName = typeof currentUser === 'object' ? currentUser.name || currentUser.username : currentUser;
    const authorId = typeof currentUser === 'object' ? currentUser.id : currentUser;
    const authorAvatar = getUserAvatar(currentUser);

    await addDoc(collection(db, 'posts'), {
      text,
      isPrivate,
      image,
      author: authorName,
      authorId: authorId,
      authorAvatar: authorAvatar,
      createdAt: Date.now(),
      isDeleted: false,
      reactions: { heart: 0, laugh: 0, support: 0 }
    });
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
    if (!currentUser) return;
    const currentId = typeof currentUser === 'object' ? currentUser.id : currentUser;
    
    try {
      const userRef = doc(db, 'users', currentId);
      const avatar = updatedData.avatarUrl || updatedData.avatar || updatedData.profilePicture || updatedData.image || '';

      const mergedData = {
        ...currentUser,
        ...updatedData,
        id: currentId,
        avatarUrl: avatar,
        avatar: avatar,
        profilePicture: avatar,
        image: avatar
      };

      await setDoc(userRef, mergedData, { merge: true });
      setCurrentUser(mergedData);
      localStorage.setItem('catchup_session', JSON.stringify(mergedData));
    } catch (error) {
      console.error('Error updating user profile in Firestore:', error);
    }
  };

  // Persistent Firestore Add Friend
  const handleAddFriend = async (friendUser) => {
    if (!currentUser) return;
    const currentId = typeof currentUser === 'object' ? currentUser.id : currentUser;
    const userRef = doc(db, 'users', currentId);

    try {
      await setDoc(userRef, { friends: arrayUnion(friendUser) }, { merge: true });
    } catch (error) {
      console.error('Error adding friend to Firestore:', error);
    }
  };

  // Persistent Firestore Remove Friend
  const handleRemoveFriend = async (friendId) => {
    if (!currentUser) return;
    const currentId = typeof currentUser === 'object' ? currentUser.id : currentUser;
    const userRef = doc(db, 'users', currentId);

    const friendToRemove = friends.find(
      (f) => String(typeof f === 'object' ? f.id || f.username : f) === String(friendId)
    );

    if (friendToRemove) {
      try {
        await updateDoc(userRef, { friends: arrayRemove(friendToRemove) });
      } catch (error) {
        console.error('Error removing friend from Firestore:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans pb-16 antialiased selection:bg-amber-200">
      {!currentUser && <AuthModal onAuthSuccess={handleAuthSuccess} />}

      {currentUser && (
        <div className="w-full flex flex-col min-h-screen">
          <Navbar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            currentUser={currentUser}
            onViewProfile={handleViewProfile}
            onLogout={handleLogout}
          />

          <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex-1 space-y-4 sm:space-y-6">
            <div className="w-full">
              {activeTab === 'home' && (
                <Home
                  posts={posts}
                  currentUser={currentUser}
                  allUsers={allUsers}
                  friends={friends}
                  onReact={handleReaction}
                  addPost={addPost}
                  onDeletePost={handleDeletePost}
                  onAddFriend={handleAddFriend}
                  onRemoveFriend={handleRemoveFriend}
                  onViewProfile={handleViewProfile}
                />
              )}

              {activeTab === 'shared' && (
                <SharedFeed
                  posts={posts}
                  addPost={addPost}
                  currentUser={currentUser}
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
                  onPermanentDelete={handlePermanentDelete}
                  onRestorePost={handleRestorePost}
                  onViewProfile={handleViewProfile}
                />
              )}

              {activeTab === 'about' && <About />}

              {activeTab === 'profile' && (
                <Profile
                  profileUser={viewedUser || currentUser}
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateProfile}
                  friends={friends}
                  profileUserFriends={viewedUser?.friends || []}
                  onAddFriend={handleAddFriend}
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