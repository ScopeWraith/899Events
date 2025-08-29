THOR Tracker
📜 Overview
THOR Tracker is a web application designed to facilitate a fair and transparent selection of a "Train Conductor" from a pool of alliance members. The selection process is based on a weighted random system that takes into account member ranks and awarded medals, ensuring an equitable rotation while rewarding active and high-ranking members.

The application is built as a Progressive Web App (PWA) for a seamless user experience on both desktop and mobile devices. It features a futuristic, sci-fi-themed interface with a clean and intuitive layout.

✨ Features
Weighted Random Conductor Selection: The core feature of the application is its ability to randomly select a conductor based on a "Luck" score. This score is calculated based on a member's rank and any active medals they possess, making the selection process fair and transparent.

Cooldown System: To ensure that all members get a chance to be the conductor, a cooldown system is implemented. After a member serves as a conductor, they are placed on a cooldown period, during which they are not eligible for selection.

Rank and Medal Bonuses: Higher-ranking members and those who have been awarded special medals receive bonuses to their "Luck" score and a reduction in their cooldown period. This system rewards dedication and achievement within the alliance.

Admin Management Panel: Logged-in administrators have access to a comprehensive management panel where they can:

Add, edit, or remove members.

Award and manage custom medals.

Manually designate a conductor.

View and manage the selection history.

Discord Integration: The application can be configured to send notifications to a Discord channel via a webhook. This feature allows for real-time updates on new player additions, rank changes, and medal awards.

Progressive Web App (PWA): THOR Tracker is a PWA, which means it can be "installed" on a user's device for a native-app-like experience. It's designed to be fully responsive and functional on both desktop and mobile platforms.

🛠️ How It Works
The application's logic is primarily handled client-side, with data being stored and synced with a Firebase Firestore database. Here's a breakdown of the key components and their functionalities:

conductor.html
This is the main HTML file for the application. It defines the structure of the user interface, including:

The main layout with a desktop sidebar and mobile navigation bar.

The conductor display panel where the selected conductor's name is shown.

Modals for various actions such as login, settings, adding/editing members, and awarding medals.

The "How it works!" section, which provides detailed information about the application's rules and functionalities.

service-worker.js
This file enables the PWA functionality of the application. It handles the caching of static assets, which allows the application to be used offline and improves its loading performance. The key functionalities include:

Installation and Caching: During the 'install' event, the service worker caches all the static assets defined in the STATIC_ASSETS array.

Activation and Cache Management: The 'activate' event is used to clean up old caches, ensuring that the user always has the latest version of the application.

Fetch Interception: The service worker intercepts fetch requests and serves the cached conductor.html file when the user is offline, ensuring that the application is always accessible.

manifest.json
This file provides the necessary metadata for the application to be treated as a PWA. It includes information such as:

The application's name and short name.

The start URL and display mode.

The theme and background colors.

Icons for different screen sizes.

Inline JavaScript in conductor.html
The core logic of the application is contained within a <script type="module"> tag in the conductor.html file. This script handles:

Firebase Integration: It initializes the Firebase app and sets up listeners for real-time data synchronization with the Firestore database.

Data Management: It manages the local state of the application, including the list of alliance members, selection history, and application settings.

UI Rendering: It dynamically renders the lists of members, history, and medals based on the data retrieved from Firestore.

Event Handling: It handles all user interactions, such as button clicks and form submissions, and updates the application's state accordingly.

Core Logic: It contains the logic for the weighted random selection of the conductor, cooldown calculations, and bonus applications.