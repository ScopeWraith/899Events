rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read all public user profiles.
    // Users can only write to their own profile.
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Anyone can read public posts.
    // Logged-in users can create posts.
    // Only the author or an admin can update/delete a post.
    match /posts/{postId} {
      allow read: if resource.data.visibility == 'public' ||
                   (request.auth != null && resource.data.visibility == 'alliance' && request.auth.token.alliance == resource.data.alliance) ||
                   (request.auth != null && resource.data.visibility == 'leadership' && request.auth.token.alliance == resource.data.alliance && (request.auth.token.allianceRank == 'R4' || request.auth.token.allianceRank == 'R5'));
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && (resource.data.authorUid == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }

    // World chat is readable by all, writable by logged-in users.
    match /world_chat/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Alliance chat is only accessible to members of that alliance.
    match /alliance_chats/{allianceId}/messages/{messageId} {
      allow read, create: if request.auth != null && request.auth.token.alliance == allianceId;
      allow delete: if request.auth != null && request.auth.token.alliance == allianceId && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.allianceRank == 'R4' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.allianceRank == 'R5');
    }

    // Leadership chat is only accessible to verified R4/R5 members.
    match /leadership_chat/{messageId} {
      allow read, create: if request.auth != null && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.allianceRank == 'R4' || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.allianceRank == 'R5');
      allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Friend data can only be accessed/modified by the user themselves.
    match /users/{userId}/friends/{friendId} {
      allow read, write, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
