# Data Models & Schemas

This document outlines the data structure for the main collections in the 899 Events Hub Firestore database. It serves as a single source of truth for understanding the shape and purpose of the application's data.

---

## `users/{userId}`

Stores the public profile and application-specific data for a single user. The `userId` is the UID provided by Firebase Authentication.

| Field | Type | Description |
| :--- | :--- | :--- |
| `username` | `String` | The user's unique in-game name. |
| `email` | `String` | The user's login email, used for authentication. |
| `alliance` | `String` | The tag of the user's current alliance (e.g., "THOR"). |
| `allianceRank`| `String` | The user's rank within their alliance (e.g., "R5", "R4", "R1"). |
| `allianceRole`| `String` | *Optional.* A special, non-rank role within the alliance (e.g., "Warlord"). |
| `power` | `Number` | The user's total in-game power. |
| `tankPower` | `Number` | *Optional.* The user's tank-specific power. |
| `airPower` | `Number` | *Optional.* The user's air-specific power. |
| `missilePower`| `Number` | *Optional.* The user's missile-specific power. |
| `avatarUrl` | `String` | *Optional.* The full URL to the user's profile picture hosted in Cloud Storage. |
| `isVerified` | `Boolean` | `true` if an alliance leader has verified the user's profile information. Defaults to `false`. |
| `isAdmin` | `Boolean` | `true` if the user has administrative privileges across the entire application. |
| `avatarBorderSkin`| `String` | The key for the selected avatar border skin (e.g., "rank", "alliance", "admin"). |
| `chatBubbleBorderSkin`| `String` | The key for the selected chat bubble border skin. |
| `registrationTimestampUTC`| `String` | An ISO 8601 string representing the UTC date and time of user registration. |
| `likes` | `Number` | The total number of likes a user's profile has received. *Note: This feature is planned.* |

---

## `posts/{postId}`

A central collection for all community-facing content, including both events and announcements. The `mainType` field distinguishes between the two.

| Field | Type | Description |
| :--- | :--- | :--- |
| `mainType` | `String` | The primary category of the post. Either **"event"** or **"announcement"**. |
| `subType` | `String` | The specific type of post (e.g., "server", "alliance", "seasonal", "vs"). |
| `title` | `String` | The title of the post displayed on the card and in the modal. |
| `details` | `String` | The main content/body of the post, which can include line breaks. |
| `authorUid` | `String` | The `userId` of the user who created the post. |
| `visibility` | `String` | Determines who can see the post. Either **"public"** or **"alliance"**. |
| `alliance` | `String` | *Required if visibility is "alliance".* The alliance tag the post is visible to. |
| `thumbnailUrl`| `String` | *Optional.* The full URL to the post's thumbnail image in Cloud Storage. |
| `createdAt` | `Timestamp`| The Firestore server timestamp of when the post was created. |
| **--- Event-Only Fields ---** | | |
| `startTime` | `Timestamp`| The calculated start date and time of the event. |
| `endTime` | `Timestamp`| The calculated end date and time of the event. |
| `isRecurring` | `Boolean` | If `true`, the event will repeat weekly based on its start/end days. |
| `repeatWeeks` | `Number` | *Optional.* The interval in weeks at which a recurring event repeats. |
| **--- Announcement-Only Fields ---** | | |
| `expirationDays`| `Number` | The number of days after `createdAt` that the announcement should be visible. |
| **--- Reaction Fields ---** | | |
| `likes` | `Number` | The total count of 'like' reactions on the post. |
| `hearts` | `Number` | The total count of 'heart' reactions on the post. |
| `likedBy` | `Array<String>` | An array of `userId`s who have 'liked' the post. |
| `heartedBy` | `Array<String>` | An array of `userId`s who have 'hearted' the post. |

---

## `alliances/{allianceTag}`

Stores the public-facing profile information for a registered alliance. The document ID is the alliance's tag.

| Field | Type | Description |
| :--- | :--- | :--- |
| `tag` | `String` | The alliance's in-game tag (e.g., "THOR"). Matches the document ID. |
| `name` | `String` | The full, formal name of the alliance. |
| `details` | `String` | A short biography or description of the alliance. |
| `avatarUrl` | `String` | *Optional.* The full URL to the alliance's official avatar in Cloud Storage. |
| `r5Name` | `String` | The `username` of the alliance's R5 leader. |
| `warlord` | `String` | *Optional.* The `username` of the designated Warlord. |
| `recruiter` | `String` | *Optional.* The `username` of the designated Recruiter. |
| `muse` | `String` | *Optional.* The `username` of the designated Muse. |
| `butler` | `String` | *Optional.* The `username` of the designated Butler. |
| `recruitmentInfo`| `String` | *Optional.* Information regarding the alliance's recruitment requirements. |
| `primaryColor`| `String` | A hex color code for the alliance's primary theme color. |
| `secondaryColor`| `String` | A hex color code for the alliance's secondary/accent theme color. |

---

## `notifications/{notificationId}`

Stores individual notifications sent to users for actionable items like friend requests.

| Field | Type | Description |
| :--- | :--- | :--- |
| `recipientUid`| `String` | The `userId` of the user who will receive the notification. |
| `senderUid` | `String` | The `userId` of the user who initiated the action (e.g., sent the friend request). |
| `senderUsername`| `String` | The `username` of the sender, stored for easy display. |
| `type` | `String` | The category of the notification (e.g., "friend_request", "verification_request"). |
| `message` | `String` | The display text for the notification. |
| `isRead` | `Boolean` | `true` if the user has read or actioned the notification. |
| `timestamp` | `Timestamp`| The Firestore server timestamp of when the notification was created. |

---

## Chat Collections

### `world_chat/{messageId}`
### `leadership_chat/{messageId}`
### `alliance_chats/{allianceTag}/messages/{messageId}`

All public chat messages share the same structure.

| Field | Type | Description |
| :--- | :--- | :--- |
| `authorUid` | `String` | The `userId` of the message author. |
| `authorUsername`| `String` | The `username` of the author, stored for easy display. |
| `text` | `String` | The text content of the message. |
| `timestamp` | `Timestamp`| The Firestore server timestamp of when the message was sent. |
| `reactions` | `Map` | A map where keys are emojis and values are a map of `{userId: username}`. |

### `private_chats/{chatId}`

This document acts as a container and metadata store for a private conversation. The `chatId` is a concatenated and sorted string of the two participant `userId`s (e.g., `uid1_uid2`).

| Field | Type | Description |
| :--- | :--- | :--- |
| `participants`| `Array<String>` | An array containing the two `userId`s involved in the chat. |
| `lastMessage` | `Map` | A copy of the most recent message object sent in the chat, used for previews. |

### `private_chats/{chatId}/messages/{messageId}`

Stores an individual message within a private conversation.

| Field | Type | Description |
| :--- | :--- | :--- |
| `authorUid` | `String` | The `userId` of the message author. |
| `authorUsername`| `String` | The `username` of the author. |
| `text` | `String` | *Optional.* The text content of the message. |
| `imageUrl` | `String` | *Optional.* The full URL to an attached image in Cloud Storage. |
| `isRead` | `Boolean` | `true` if the recipient has seen the message. Defaults to `false`. |
| `timestamp` | `Timestamp`| The Firestore server timestamp of when the message was sent. |
| `reactions` | `Map` | A map where keys are emojis and values are a map of `{userId: username}`. |

---

## `sessions/{userId}`

Stores the real-time presence status of a user. This collection is updated by both the Realtime Database presence system and client-side activity listeners.

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | `String` | The user's current presence state: **"online"**, **"offline"**, or **"away"**. |
| `lastSeen` | `Timestamp`| The Firestore server timestamp of the last status update. |