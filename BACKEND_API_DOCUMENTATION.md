# AURA Learning Platform - Backend API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints (`/api/auth`)

### Register User
- **Method**: `POST /auth/register`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password@123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response**: `{ success: true, data: { user, tokens: { accessToken, refreshToken } } }`

### Login
- **Method**: `POST /auth/login`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password@123"
  }
  ```
- **Response**: `{ success: true, data: { user, tokens: { accessToken, refreshToken } } }`

### Refresh Token
- **Method**: `POST /auth/refresh`
- **Auth**: None
- **Request Body**: `{ refreshToken: "..." }`
- **Response**: `{ success: true, data: { accessToken, refreshToken } }`

### Verify Token
- **Method**: `GET /auth/verify`
- **Auth**: Required
- **Response**: `{ success: true, data: { valid: true, user } }`

### Get Profile
- **Method**: `GET /auth/profile`
- **Auth**: Required
- **Response**: `{ success: true, data: { user } }`

---

## 2. Courses Endpoints (`/api/content-management/courses`)

### Get All Courses
- **Method**: `GET /content-management/courses`
- **Auth**: Optional
- **Query Parameters**:
  - `category`: GRAMMAR, LISTENING, READING, VOCABULARY, WRITING, ORAL, TCF_TEF
  - `level`: A1, A2, B1, B2, C1, C2
  - `subscriptionTier`: FREE, ESSENTIAL, PREMIUM, PRO
  - `search`: Search term
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "content": [
        {
          "id": "...",
          "title": "...",
          "description": "...",
          "level": "A1",
          "category": "GRAMMAR",
          "subscriptionTier": "FREE",
          "duration": 30,
          "tags": [],
          "isPublished": true,
          "createdBy": { "id": "...", "firstName": "...", "lastName": "...", "role": "ADMIN" },
          "lessons_data": [
            {
              "id": "...",
              "title": "...",
              "content": "...",
              "videoUrl": "...",
              "duration": 10,
              "order": 1
            }
          ]
        }
      ],
      "total": 13,
      "pages": 1
    }
  }
  ```

---

## 3. Tests Endpoints (`/api/tests`)

### Get All Tests
- **Method**: `GET /tests`
- **Auth**: Optional
- **Query Parameters**:
  - `category`: GRAMMAR, LISTENING, etc.
  - `level`: A1, A2, B1, B2, C1, C2
  - `tier`: FREE, ESSENTIAL, PREMIUM, PRO
  - `page`: Page number
  - `limit`: Items per page
- **Response**: `{ success: true, data: [...], pagination: { page, limit, total, totalPages } }`

### Get Tests (Content Management)
- **Method**: `GET /content-management/tests`
- **Auth**: Optional
- **Query Parameters**: Same as above
- **Response**: Same structure as courses endpoint

### Start Test
- **Method**: `POST /tests/:testId/start`
- **Auth**: Required
- **Response**: `{ success: true, data: { attemptId, testId, startedAt } }`

### Submit Test
- **Method**: `POST /tests/submit`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "attemptId": "...",
    "answers": [
      { "questionId": "...", "answer": "..." }
    ]
  }
  ```
- **Response**: `{ success: true, data: { score, totalQuestions, percentage } }`

---

## 4. Posts Endpoints (`/api/posts`)

### Get All Posts
- **Method**: `GET /posts`
- **Auth**: Optional
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `sortBy`: createdAt, likes, comments
  - `sortOrder`: asc, desc
- **Response**: `{ success: true, data: [...], pagination: {...} }`

### Create Post
- **Method**: `POST /posts`
- **Auth**: Required (Manager/Admin only)
- **Request Body**:
  ```json
  {
    "title": "...",
    "content": "...",
    "excerpt": "...",
    "status": "PUBLISHED",
    "visibility": "PUBLIC"
  }
  ```
- **Response**: `{ success: true, data: { post } }`

### Like Post
- **Method**: `POST /posts/:postId/like`
- **Auth**: Required
- **Response**: `{ success: true, data: { liked: true/false } }`

### Add Comment
- **Method**: `POST /posts/:postId/comments`
- **Auth**: Required
- **Request Body**: `{ content: "..." }`
- **Response**: `{ success: true, data: { comment } }`

### Get Post Comments
- **Method**: `GET /posts/:postId/comments`
- **Auth**: Optional
- **Response**: `{ success: true, data: [...] }`

---

## 5. Messages Endpoints (`/api/messages`)

### Get Unread Count
- **Method**: `GET /messages/unread-count`
- **Auth**: Required
- **Response**: `{ success: true, data: { count: 5 } }`

### Get Messages
- **Method**: `GET /messages`
- **Auth**: Required
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `type`: received, sent
- **Response**: `{ success: true, data: [...], pagination: {...} }`

### Send Message
- **Method**: `POST /messages`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "receiverId": "...",
    "content": "..."
  }
  ```
- **Response**: `{ success: true, data: { message } }`

---

## 6. Users Endpoints (`/api/users`)

### Get Profile
- **Method**: `GET /users/profile`
- **Auth**: Required
- **Response**: `{ success: true, data: { user } }`

### Update Profile
- **Method**: `PUT /users/profile`
- **Auth**: Required
- **Request Body**: `{ firstName, lastName, profileImage, ... }`
- **Response**: `{ success: true, data: { user } }`

---

## 7. Home/Dashboard Endpoints (`/api/home`)

### Get Dashboard Data
- **Method**: `GET /home/dashboard`
- **Auth**: Required
- **Response**: `{ success: true, data: { stats, recentCourses, upcomingSessions } }`

### Get AI Messages
- **Method**: `GET /home/ai-messages`
- **Auth**: Required
- **Response**: `{ success: true, data: { greeting, motivation, weather } }`

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## User Roles
- `USER` / `STUDENT`: Regular student
- `JUNIOR_MANAGER`: Can create courses and posts
- `SENIOR_MANAGER`: Can manage other managers
- `ADMIN`: Full system access

---

## Subscription Tiers
- `FREE`: Free tier
- `ESSENTIAL`: Essential subscription
- `PREMIUM`: Premium subscription
- `PRO`: Pro subscription

---

## Course Levels
- `A1`, `A2`: Beginner
- `B1`, `B2`: Intermediate
- `C1`, `C2`: Advanced

---

## Course Categories
- `GRAMMAR`: Grammar
- `LISTENING`: Listening comprehension
- `READING`: Reading comprehension
- `VOCABULARY`: Vocabulary
- `WRITING`: Writing
- `ORAL`: Oral expression
- `TCF_TEF`: TCF/TEF exam preparation

---

## 11. Favorites Endpoints (`/api/favorites`)

### Get User Favorites
- **Method**: `GET /favorites`
- **Auth**: Required
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `contentType` (optional): Filter by type (COURSE, TEST, POST, LIVE_SESSION, etc.)
  - `folder` (optional): Filter by folder
  - `search` (optional): Search in notes and tags
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "favorites": [
        {
          "id": "fav_123",
          "contentId": "course_456",
          "contentType": "COURSE",
          "folder": "My Courses",
          "tags": ["grammar", "beginner"],
          "notes": "Great course!",
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 45,
        "totalPages": 3
      }
    }
  }
  ```

### Add to Favorites
- **Method**: `POST /favorites`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "contentId": "course_456",
    "contentType": "COURSE",
    "folder": "My Courses",
    "tags": ["grammar", "beginner"],
    "notes": "Great course!"
  }
  ```
- **Response**: `{ success: true, data: { favorite: {...} }, message: "Item added to favorites successfully" }`

### Check if Item is Favorited
- **Method**: `GET /favorites/check`
- **Auth**: Required
- **Query Parameters**:
  - `contentId` (required): Content ID
  - `contentType` (required): Content type (COURSE, TEST, POST, etc.)
- **Response**:
  ```json
  {
    "success": true,
    "data": { "isFavorited": true }
  }
  ```

### Remove from Favorites
- **Method**: `DELETE /favorites/{favoriteId}`
- **Auth**: Required
- **Response**: `{ success: true, message: "Item removed from favorites successfully" }`

### Get Favorite Statistics
- **Method**: `GET /favorites/stats`
- **Auth**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalFavorites": 45,
      "byType": {
        "COURSE": 20,
        "TEST": 15,
        "POST": 10
      }
    }
  }
  ```

### Get Favorite Folders
- **Method**: `GET /favorites/folders`
- **Auth**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "folders": [
        {
          "id": "folder_123",
          "name": "My Courses",
          "description": "Courses I'm taking",
          "color": "#2ECC71",
          "itemCount": 12
        }
      ]
    }
  }
  ```

### Create Favorite Folder
- **Method**: `POST /favorites/folders`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "name": "My Courses",
    "description": "Courses I'm taking",
    "color": "#2ECC71"
  }
  ```
- **Response**: `{ success: true, data: { folder: {...} } }`

### Update Favorite
- **Method**: `PUT /favorites/{favoriteId}`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "folder": "New Folder",
    "tags": ["updated", "tag"],
    "notes": "Updated notes"
  }
  ```
- **Response**: `{ success: true, data: { favorite: {...} } }`

### Update Favorite Folder
- **Method**: `PUT /favorites/folders/{folderId}`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "color": "#007BFF"
  }
  ```
- **Response**: `{ success: true, data: { folder: {...} } }`

### Delete Favorite Folder
- **Method**: `DELETE /favorites/folders/{folderId}`
- **Auth**: Required
- **Response**: `{ success: true, message: "Favorite folder deleted successfully" }`

