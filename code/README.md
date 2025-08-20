# 899 Events Hub

## Overview

The **899 Events Hub** is a dynamic, real-time web application designed to be the central community platform for players of Server \#899. It provides a comprehensive suite of tools for tracking in-game events, facilitating communication through public and private channels, and managing player and alliance information. The platform is built with a robust, role-based permission system that ensures data integrity and empowers community leaders.

-----

## Core Features

### 👤 Authentication & User Profiles

  * **Multi-Step Registration**: A guided, multi-step registration form captures essential player details, including account information, alliance affiliation, in-game power, and a profile avatar.
  * **Secure Login**: Standard email/password authentication with a "Remember Me" feature.
  * **Comprehensive Profiles**: Users can edit their profiles, which display their username, alliance, rank, and detailed power statistics (Total, Tank, Air, Missile).
  * **Profile Customization**: Players can personalize their profiles by selecting from a variety of cosmetic skins for their avatar and chat bubble borders. Options include rank-based, alliance-themed, and exclusive admin designs.

### 🌐 Social & Real-Time Communication

  * **Presence System**: The application tracks and displays user status in real-time (Online, Away, Offline) using Firebase Realtime Database.
  * **Public Chat Channels**:
      * **World Chat**: An open channel for all registered users.
      * **Alliance Chat**: A private channel accessible only to members of the same alliance.
      * **Leadership Chat**: An exclusive channel for verified R4 and R5 members of an alliance.
  * **Private Messaging**: A complete one-on-one private messaging system between any two registered users.
  * **Advanced Chat Features**:
      * Emoji reactions on messages.
      * Image attachments in private messages.
      * Role-based message deletion (admins, leaders, and message authors can delete).
      * Automatic hyperlinking of URLs in messages.
  * **Friends System**: Users can send, accept, and decline friend requests. An integrated friends list shows the online status of friends for easy communication.

### 📢 News, Events & Notifications

  * **Dynamic Post System**: Authorized users (Admins, R5s, R4s) can create two main types of posts: Announcements and Events.
  * **Custom Post Types**: A variety of subtypes exist for fine-grained categorization (e.g., Server Announcement, Alliance Event, Wanted Boss Event).
  * **Live Event Tracking**: Event posts feature live countdowns that automatically update, showing "Starts In" or "Ends In" timers. The visual style of event cards changes based on their status (Upcoming, Live, or Ended).
  * **Notification System**: A centralized feed and header dropdown notify users of important actions, such as friend requests and pending verification requests for alliance leaders.

### サーバー Server & Alliance Directory

  * **Alliance Profiles**: R5 leaders have the ability to register a public profile for their alliance, which includes a custom name, avatar, bio, recruitment info, and core member roles (Warlord, Recruiter, etc.).
  * **Player Directory**: A searchable and filterable directory of all players on the server. Users can filter by player name and alliance tag to easily find others.
  * **NAP Information**: A dedicated, styled page provides detailed information about the server's Non-Aggression Pact (NAP) rules and consequences.

-----

## 🛠️ Key Technologies

  * **Frontend**: HTML5, CSS3, JavaScript (ESM)
  * **Frameworks/Libraries**: TailwindCSS for styling.
  * **Backend & Database**: Firebase
      * **Authentication**: Manages user sign-up, login, and session persistence.
      * **Firestore**: The primary NoSQL database for storing all application data (users, posts, alliances, chats) with a robust security ruleset.
      * **Realtime Database**: Used specifically for the high-frequency updates required by the user presence (online/offline) system.
      * **Cloud Storage**: Handles hosting for all user-uploaded images, including avatars and post thumbnails.

-----

## 📂 Project Structure

The project is organized with a clear separation of concerns, making it modular and maintainable.

```
code/
├── css/
│   ├── style.css         # Main stylesheet, imports, and global styles
│   └── alliances.css     # Specific styles for alliance profile cards
├── js/
│   ├── ui/               # Modules dedicated to rendering and managing UI components
│   │   ├── alliances-ui.js
│   │   ├── auth-ui.js
│   │   ├── notifications-ui.js
│   │   ├── player-settings-ui.js
│   │   ├── players-ui.js
│   │   ├── post-ui.js
│   │   ├── skin-ui.js
│   │   ├── social-ui.js
│   │   └── ui-manager.js   # Core UI functions (modals, navigation, etc.)
│   ├── app.js            # Main application initializer
│   ├── constants.js      # Global constants (alliances, post types, ranks)
│   ├── event-listeners.js# Centralized attachment of all DOM event listeners
│   ├── firebase-config.js# Firebase SDK initialization
│   ├── firestore.js      # All Firestore interaction logic (listeners, writes)
│   ├── main.js           # Application entry point
│   ├── presence.js       # User online/offline status management
│   ├── state.js          # Centralized state management (getState, setState)
│   └── utils.js          # Utility functions (date formatting, permissions)
├── img/
│   └── logo.png          # Project logo
├── index.html            # Main HTML file for the single-page application
├── database.rules.json   # Security rules for Firebase Realtime Database
├── firebase.json         # Firebase project configuration
├── firestore.rules       # Security rules for Cloud Firestore
└── storage.rules         # Security rules for Cloud Storage
```

-----

## 🚀 Future Implementation

The current codebase includes UI elements and comments that point to several planned features that are not yet functional:

  * **Player Profile Likes**: A "Like Profile" button exists on player cards, but the logic to handle the like action and store the count needs to be implemented.
  * **Pin Private Conversations**: The UI includes a "Pin" button for private messages, indicating a desire for this feature.
  * **Private Message Notifications**: The UI anticipates a notification system for unread private messages, but the logic to count and display them is not yet active.
  * **Searchable Dropdowns**: The custom select components contain a search input field that is currently non-functional. JavaScript is needed to filter the dropdown options based on user input.