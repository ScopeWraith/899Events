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
    
    function canManageUser(targetUserId) {
      let managerData = getUserData(request.auth.uid);
      let targetData = getUserData(targetUserId);
      return isSignedIn() && (
        managerData.isAdmin == true ||
        (
          managerData.alliance == targetData.alliance &&
          (
            (managerData.allianceRank == 'R5' && ['R4', 'R3', 'R2', 'R1'].includes(targetData.allianceRank)) ||
            (managerData.allianceRank == 'R4' && ['R3', 'R2', 'R1'].includes(targetData.allianceRank))
          )
        )
      );
    }

    // --- USER DATA, FRIENDS & NOTIFICATIONS ---
    match /users/{userId} {
      allow read: if true;
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || canManageUser(userId);
      allow delete: if isOwner(userId);
    }
    
    match /users/{userId}/friends/{friendId} {
        allow read: if isOwner(userId);
        allow write: if isSignedIn() && (isOwner(userId) || request.auth.uid == friendId);
    }

    match /users/{userId}/notifications/{notificationId} {
        allow read, write, list, delete: if isOwner(userId);
    }

    // --- POSTS (ANNOUNCEMENTS & EVENTS) ---
    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn(); // Simplified for client-side checks
      allow update, delete: if isSignedIn() && (isOwner(resource.data.authorUid) || isAdmin());
    }
    
    // --- CHAT CHANNELS ---
    match /world_chat/{messageId} {
        allow read, list, create: if isSignedIn();
        allow delete: if isSignedIn() && (isOwner(resource.data.authorUid) || isAdmin());
    }
    
    match /leaders_chat/{messageId} {
        allow read, list, create: if isLeader();
        allow delete: if isAdmin();
    }
    
    match /alliance_chats/{allianceId}/messages/{messageId} {
        allow read, list, create: if isVerified() && isMemberOf(allianceId);
        allow delete: if isLeader() && isMemberOf(allianceId);
    }

    match /leadership_chats/{allianceId}/messages/{messageId} {
       allow read, list, create: if isLeader() && isMemberOf(allianceId);
       allow delete: if isLeader() && isMemberOf(allianceId);
    }
  }
}
