import React from 'react';
import { UserCheck, UserX, Clock } from 'lucide-react';

export default function FriendRequestsDropdown({
  friendRequests = [],
  currentUserId,
  onAcceptFriend,
  onDeclineFriend,
  onClose
}) {
  // Filter for incoming requests meant for the current logged-in user
  const incomingRequests = friendRequests.filter(
    (req) => String(req.receiverId) === String(currentUserId) && req.status === 'pending'
  );

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <h3 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Friend Requests
        </h3>
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
          {incomingRequests.length}
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
        {incomingRequests.length === 0 ? (
          <div className="p-6 text-center text-stone-400 text-sm">
            No pending friend requests.
          </div>
        ) : (
          incomingRequests.map((req) => (
            <div key={req.id} className="p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {req.sender?.avatarUrl ? (
                  <img
                    src={req.sender.avatarUrl}
                    alt={req.sender.name || req.sender.username}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm border border-amber-200">
                    {(req.sender?.name || req.sender?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-semibold text-stone-800 truncate">
                    {req.sender?.name || req.sender?.username}
                  </p>
                  <p className="text-xs text-stone-400 truncate">
                    @{req.sender?.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onAcceptFriend(req.sender);
                    if (incomingRequests.length === 1 && onClose) onClose();
                  }}
                  className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-sm"
                  title="Accept Request"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onDeclineFriend(req.sender);
                    if (incomingRequests.length === 1 && onClose) onClose();
                  }}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
                  title="Decline Request"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}