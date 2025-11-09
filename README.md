# StreamVault Backend API 💾

**StreamVault Backend** is the robust and modular API layer powering the StreamVault video streaming and social media platform. It is built on the **MERN stack (Express/Node.js, MongoDB)** and designed for **exceptional scalability and security**.

This API handles the core logic for user authentication, content management, real-time messaging, and channel analytics, providing a foundation for a modern web application.

---

## ✨ Features

The backend provides a comprehensive set of features to support both content consumption and creation.

### 📡 Real-Time Communication
* **Socket.IO Server:** Integrated server-side logic for real-time, bi-directional messaging, handling connection and disconnection events.
* **Message Requests:** Implements a controlled chat initiation flow via `MessageRequest` model, allowing users to approve or deny message invitations before starting a conversation.
* **Conversation Management:** CRUD operations for managing private chat `Conversation` and `Message` history.

### 🎬 Content & Media Pipeline
* **Cloudinary Integration:** Uses Cloudinary for persistent cloud storage of all media assets, including videos, avatars, and thumbnails.
* **Secure Uploads:** Handles file uploads via **Multer** middleware for temporary storage before transferring to Cloudinary.
* **Video Monetization/Control:** Supports updating a video's `isPublished` status, giving creators control over visibility.
* **Content Discovery:** Implements a comprehensive search functionality covering both **videos and channels**.

### 🔐 User & Social Features
* **JWT Security:** Uses refresh tokens and access tokens, securely managed via `httpOnly` cookies.
* **User History:** Tracks user `watchHistory` and allows removal of specific videos from history.
* **Content Engagement:** Endpoints for toggling `Like` status across videos, comments, and tweets.
* **Subscriptions:** Logic to handle subscribing/unsubscribing to channels and retrieving subscriber/subscription lists.

---

## 📂 Data Models Overview

The application's data structure is built on 10 interconnected Mongoose Schemas.

| Model | File | Purpose | Key Relationships |
| :--- | :--- | :--- | :--- |
| **User** | `user.models.js` | Core entity for user identity and channel data. | One-to-many (1:N) with Video, Playlist, Subscription |
| **Video** | `video.models.js` | Stores metadata for all uploaded videos. | References `User` (owner), `Like`, and `Comment`. |
| **Playlist** | `playlist.models.js` | Defines custom collections of videos. | References `User` (owner) and an array of `Video`. |
| **Tweet** | `tweet.models.js` | Stores micro-blogging posts. | References `User` (owner) and receives `Like`s. |
| **Comment** | `comment.models.js` | Stores user feedback on videos. | References `User` (owner) and `Video`. |
| **Like** | `likes.models.js` | Polymorphic model to track likes across 3 different entities. | References `User` and optionally `Video`, `Comment`, or `Tweet`. |
| **Subscription** | `subscription.models.js` | Tracks follower-channel relationships. | References `User` (subscriber) and `User` (channel). |
| **Conversation** | `Conversation.model.js` | Manages chat rooms between participants. | Array of `User` references (`participants`). |
| **Message** | `Message.model.js` | Stores individual chat messages. | References `Conversation` and `User` (sender). |
| **MessageRequest** | `MessageRequest.model.js` | Manages pending chat invitations. | References `User` (sender and receiver). |

---

## 🔒 Middlewares

Security and file handling are managed by dedicated middleware layers.

| Middleware | File | Purpose |
| :--- | :--- | :--- |
| **`verifyJWT`** | `auth.middleware.js` | **Primary security gate.** Extracts and verifies the Access Token from cookies to authenticate the user for protected routes. |
| **`upload`** | `multer.middleware.js` | Configures **Multer** to process file uploads (video files, images) and stores them temporarily on the local disk (`/public/temp`) before Cloudinary upload. |

---

## 🗺️ API Endpoints

All public and protected endpoints are grouped under the `/api/v1` route prefix.

### 1. User, Auth, & Channels (`/users`, `/channels`)
| Endpoint | Method | Description | Access |
| :--- | :--- | :--- | :--- |
| `/users/register` | `POST` | Create new user with avatar/cover file uploads. | Public |
| `/users/login` | `POST` | Authenticate user and issue tokens via cookies. | Public |
| `/users/logout` | `POST` | Clears cookies and logs out current user. | Protected |
| `/users/current-user` | `GET` | Get details of the currently authenticated user. | Protected |
| `/users/watchHistory` | `GET` | Retrieve the authenticated user's watch history. | Protected |
| `/channels/:channelId` | `GET` | Get public channel profile and statistics. | Public |

### 2. Videos & Discovery (`/videos`, `/search`)
| Endpoint | Method | Description | Access |
| :--- | :--- | :--- | :--- |
| `/videos` | `POST` | Upload a new video file and its metadata. | Protected |
| `/videos` | `GET` | List videos with filtering, sorting, and pagination options. | Public |
| `/videos/:videoId` | `GET` | Get details of a single video. | Public |
| `/videos/:videoId/views` | `PATCH` | Increment the view count for a video. | Public |
| `/search` | `GET` | Global search for videos and channels based on a query. | Public |

### 3. Real-Time Chat & Messages (`/messages`)
| Endpoint | Method | Description | Access |
| :--- | :--- | :--- | :--- |
| `/messages/requests` | `GET` | Retrieve all pending message requests for the user. | Protected |
| `/messages/requests/:requestId` | `PATCH` | Accept or decline a message request. Initiates chat creation upon acceptance. | Protected |
| `/messages/conversations` | `GET` | Retrieve the list of all active conversations. | Protected |
| `/messages/conversations/:convId/messages` | `GET` | Fetch the full message history for a conversation. | Protected |

### 4. Social & Library (`/likes`, `/subscriptions`, `/playlists`)
| Endpoint | Method | Description | Access |
| :--- | :--- | :--- | :--- |
| `/likes/video/:videoId/toggle` | `POST` | Toggles the like status on a video. | Protected |
| `/subscriptions/toggle/:channelId` | `POST` | Toggles the subscription status for a channel. | Protected |
| `/playlists` | `POST` | Create a new video playlist. | Protected |
| `/playlists/:playlistId/videos/:videoId` | `POST` | Add a video to a playlist. | Protected |
| `/comments/:videoId` | `POST` | Add a new comment to a video. | Protected |

---

## 🚀 Project Setup

### 1. Prerequisites

* Node.js (LTS recommended)
* MongoDB Instance (Local or Atlas)
* Cloudinary Account

### 2. Environment Variables

Create a **`.env`** file in the root directory and populate it with your configuration details.

```env
# Server Configuration
PORT=8000
# IMPORTANT: Use the exact URL of your StreamVault frontend build
CORS_ORIGIN=http://localhost:5173 # Use secure origin in production

# Database
MONGO_URI="mongodb://localhost:27017/StreamVaultDB"

# JWT Secrets
ACCESS_TOKEN_SECRET="YOUR_HIGHLY_SECRET_ACCESS_TOKEN_STRING"
ACCESS_TOKEN_EXPIRY="1d"
REFRESH_TOKEN_SECRET="YOUR_HIGHLY_SECRET_REFRESH_TOKEN_STRING"
REFRESH_TOKEN_EXPIRY="10d"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="YOUR_CLOUD_NAME"
CLOUDINARY_API_KEY="YOUR_API_KEY"
CLOUDINARY_API_SECRET="YOUR_API_SECRET"\
```

### 3. Installation & Run
* Install dependencies:
  npm install
* Run the server:
  npm run dev

The API will be listening on http://localhost:8000 (or your configured port).
