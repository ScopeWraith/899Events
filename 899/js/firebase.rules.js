rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
  
    // --- HELPER FUNCTIONS ---
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function getUserData(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data;
    }

    function isAdmin() {
      return isSignedIn() && getUserData(request.auth.uid).isAdmin == true;
    }
    
    function isVerified() {
      return isSignedIn() && getUserData(request.auth.uid).isVerified == true;
    }
    
    function isLeader() {
        let userRank = getUserData(request.auth.uid).allianceRank;
        return isAdmin() || (isVerified() && (userRank == 'R5' || userRank == 'R4'));
    }

    function isMemberOf(allianceId) {
        return isSignedIn() && getUserData(request.auth.uid).alliance == allianceId;
    }

    // --- COLLECTION RULES ---

    match /users/{userId} {
      allow read, list: if true;
      allow write: if isOwner(userId);
    }
    
    match /users/{userId}/notifications/{notificationId} {
        allow read, list, write, delete: if isOwner(userId);
    }

    match /posts/{postId} {
      allow list: if true; 
      allow read: if resource.data.visibility == 'public' ||
                   (isVerified() && resource.data.visibility == 'alliance' && isMemberOf(resource.data.alliance)) ||
                   (isLeader() && resource.data.visibility == 'leadership' && isMemberOf(resource.data.alliance));
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && (isOwner(resource.data.authorUid) || isAdmin());
    }

    match /world_chat/{messageId} {
      allow read, list, create: if isSignedIn();
      allow delete: if isSignedIn() && (isOwner(resource.data.authorUid) || isAdmin());
    }
    
    match /alliance_chats/{allianceId}/messages/{messageId} {
        allow read, list, create: if isVerified() && isMemberOf(allianceId);
        allow delete: if isLeader() && isMemberOf(allianceId);
    }

    match /leadership_chats/{allianceId}/messages/{messageId} {
       allow read, list, create: if isLeader() && isMemberOf(allianceId);
       allow delete: if isLeader() && isMemberOf(allianceId);
    }

    /**
     * --- FIX ---
     * The rule for the friends subcollection has been updated.
     * It now allows a signed-in user to write to another user's friends list,
     * but ONLY if the friend document ID they are writing matches their own UID.
     * This allows for sending/accepting/declining requests securely.
     */
    match /users/{userId}/friends/{friendId} {
      allow read, list: if isOwner(userId);
      allow write: if isSignedIn() && (isOwner(userId) || request.auth.uid == friendId);
      allow delete: if isSignedIn() && (isOwner(userId) || request.auth.uid == friendId);
    }
  }
}
