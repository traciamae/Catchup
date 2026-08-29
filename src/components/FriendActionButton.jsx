import React from 'react';
import { UserPlus, UserCheck, UserClock, UserX } from 'lucide-react';

export default function FriendActionButton({
  targetUser,
  currentUser,
  friends = [],
  friendRequests = [],
  onRequestFriend,
  onAcceptFriend,
  onDeclineFriend,
  onCancelRequest,
  onRemoveFriend
}) {
  const currentId = String(currentUser?.id || currentUser?.uid || currentUser?.username || '');
  const targetId = String(targetUser?.id || targetUser?.uid || targetUser?.username || '');

  // Don't render for current user
  if (!targetId || currentId === targetId) return null;

  const isFriend = friends.some((f) => String(f.id || f.uid || f.username) === targetId);

  const outgoingRequest = friendRequests.find(
    (r) => String(r.senderId) === currentId && String(r.receiverId) === targetId && r.status === 'pending'
  );

  const incomingRequest = friendRequests.find(
    (r) => String(r.senderId) === targetId && String(r.receiverId) === currentId && r.status === 'pending'
  );

  if (isFriend) {
    return (
      <button
        onClick={() => onRemoveFriend(targetId)}
        className="px-3 py-1.5 bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-600 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 group border border-stone-200"
      >
        <UserCheck className="w-3.5 h-3.5 group-hover:hidden" />
        <UserX className="w-3.5 h-3.5 hidden group-hover:block" />
        <span className="group-hover:hidden">Friends</span>
        <span className="hidden group-hover:inline">Unfriend</span>
      </button>
    );
  }

  if (outgoingRequest) {
    return (
      <button
        onClick={() => onCancelRequest(targetUser)}
        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 border border-amber-200"
      >
        <UserClock className="w-3.5 h-3.5" />
        <span>Requested</span>
      </button>
    );
  }

  if (incomingRequest) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onAcceptFriend(targetUser)}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1 shadow-sm"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Accept</span>
        </button>
        <button
          onClick={() => onDeclineFriend(targetUser)}
          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-xl transition-all"
        >
          <UserX className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onRequestFriend(targetUser)}
      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
    >
      <UserPlus className="w-3.5 h-3.5" />
      <span>Add Friend</span>
    </button>
  );
}