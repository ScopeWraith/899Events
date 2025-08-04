# Last War: Survival - 899 Dashboard

This project is a community hub for the game "Last War: Survival," server 899. It provides features such as event tracking, social chat, player profiles, and more.

## File Structure

The project has been organized into a modular structure to improve maintainability and scalability.

-   **`index.html`**: The main HTML file that serves as the entry point for the application.
-   **`css/style.css`**: Contains all the custom CSS for the application.
-   **`js/`**: Contains all the JavaScript files.
    -   **`firebase-config.js`**: Initializes the Firebase app and exports the necessary services.
    -   **`app.js`**: The main application script that orchestrates the different modules.
    -   **`modules/`**: Contains the application's core logic, separated into modules.
        -   **`ui.js`**: Handles UI-related logic, such as DOM manipulation and modal control.
        -   **`auth.js`**: Manages user authentication and session state.
        -   **`data.js`**: Handles all data interactions with Firebase services.

## Firebase Security Rules

The Firebase security rules are included in the comments at the top of the original `899.html` file. These rules define the access control for the Firestore database, Storage, and Realtime Database, ensuring that users can only access and modify the data they are permitted to.

### Key Features of Security Rules:

-   **User Authentication**: Most rules require the user to be signed in.
-   **Ownership**: Users can only modify their own data (e.g., profile, friend list).
-   **Role-Based Access**: Differentiates between regular users, verified members, alliance leaders (R4/R5), and admins, granting different levels of permissions.
-   **Data Validation**: Ensures that the data being written to the database conforms to the expected format.

By following this structure, new features can be implemented more efficiently by creating or modifying the relevant modules without affecting the entire codebase. This also makes it easier for multiple developers to work on the project simultaneously.