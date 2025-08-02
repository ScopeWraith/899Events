rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
  
    // --- HELPER FUNCTIONS ---
    // These functions make the rules below easier to read and maintain.
    
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

    // Users can read all profiles, but only write to their own.
    match /users/{userId} {
      allow read, list: if true;
      allow write: if isOwner(userId);
    }

    // Rules for posts (events and announcements)
    match /posts/{postId} {
      allow list: if true; 
      allow read: if resource.data.visibility == 'public' ||
                   (isVerified() && resource.data.visibility == 'alliance' && isMemberOf(resource.data.alliance)) ||
                   (isLeader() && resource.data.visibility == 'leadership' && isMemberOf(resource.data.alliance));
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && (isOwner(resource.data.authorUid) || isAdmin());
    }

    // World chat is readable by logged-in users.
    match /world_chat/{messageId} {
      allow read, list, create: if isSignedIn();
      allow delete: if isSignedIn() && (isOwner(resource.data.authorUid) || isAdmin());
    }

    // --- FIX: Corrected Alliance and Leadership Chat Rules ---
    // These rules now correctly check the user's document in the database
    // instead of checking for special login tokens.
    
    match /alliance_chats/{allianceId}/messages/{messageId} {
        allow read, list, create: if isVerified() && isMemberOf(allianceId);
        allow delete: if isLeader() && isMemberOf(allianceId);
    }

    match /leadership_chats/{allianceId}/messages/{messageId} {
       allow read, list, create: if isLeader() && isMemberOf(allianceId);
       allow delete: if isLeader() && isMemberOf(allianceId);
    }

    // Users can only manage their own friends list.
    match /users/{userId}/friends/{friendId} {
      allow read, list, write, delete: if isOwner(userId);
    }
  }
}
