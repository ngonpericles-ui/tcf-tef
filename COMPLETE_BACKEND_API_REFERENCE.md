# Complete Backend API Reference

## Base URL
```
http://localhost:3001/api
```

## Authentication
- **Header**: `Authorization: Bearer {access_token}`
- **Token Storage**: localStorage as `access_token` and `refresh_token`
- **Token Refresh**: Automatic via interceptor on 401 responses

---

## 1. Content Management Endpoints

### Get All Courses
- **Method**: `GET /content-management/courses`
- **Auth**: Optional
- **Query Parameters**: None
- **Response**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "level": "A1|A2|B1|B2|C1|C2",
        "category": "GRAMMAR|LISTENING|READING|VOCABULARY|WRITING|ORAL|TCF_TEF",
        "subscriptionTier": "FREE|ESSENTIAL|PREMIUM|PRO",
        "contentType": "VIDEO|NOTE",
        "fileUrl": "string (optional)",
        "thumbnailUrl": "string (optional)",
        "duration": number,
        "tags": ["string"],
        "isPublished": boolean,
        "createdBy": { "id": "string", "firstName": "string", "lastName": "string", "email": "string" },
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601",
        "lessons_data": [
          {
            "id": "string",
            "title": "string",
            "content": "string (PDF URL or text)",
            "videoUrl": "string (optional)",
            "duration": number,
            "order": number,
            "resources": ["string"]
          }
        ]
      }
    ],
    "total": number,
    "pages": number
  },
  "message": "string"
}
```

### Get All Tests
- **Method**: `GET /content-management/tests`
- **Auth**: Optional
- **Response**: Same structure as courses but with test-specific fields

### Get Test by ID
- **Method**: `GET /tests/{testId}`
- **Auth**: Optional
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "duration": number,
    "questions": [
      {
        "id": "string",
        "text": "string",
        "type": "multiple_choice|short_answer|essay",
        "options": ["string"] (for multiple_choice),
        "correctAnswer": "string"
      }
    ],
    "fileUrl": "string (optional)"
  }
}
```

---

## 2. Posts Endpoints

### Get All Posts
- **Method**: `GET /posts`
- **Auth**: Optional
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
  - `sortBy`: "createdAt"|"likes"|"comments" (default: "createdAt")
  - `sortOrder`: "asc"|"desc" (default: "desc")
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "excerpt": "string (optional)",
      "media": "string (optional)",
      "visibility": "PUBLIC|PRIVATE",
      "status": "PUBLISHED|DRAFT",
      "authorId": "string",
      "author": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "ADMIN|SENIOR_MANAGER|JUNIOR_MANAGER|USER"
      },
      "category": "string (optional)",
      "tags": ["string"],
      "level": "A1|A2|B1|B2|C1|C2 (optional)",
      "targetTier": "FREE|ESSENTIAL|PREMIUM|PRO",
      "viewCount": number,
      "_count": {
        "likes": number,
        "comments": number,
        "shares": number
      },
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

### Create Post
- **Method**: `POST /posts`
- **Auth**: Required (Manager/Admin only)
- **Request Body**:
```json
{
  "title": "string",
  "content": "string",
  "excerpt": "string (optional)",
  "media": "string (optional)",
  "status": "PUBLISHED|DRAFT",
  "visibility": "PUBLIC|PRIVATE",
  "category": "string (optional)",
  "tags": ["string"],
  "level": "A1|A2|B1|B2|C1|C2 (optional)",
  "targetTier": "FREE|ESSENTIAL|PREMIUM|PRO"
}
```

### Like Post
- **Method**: `POST /posts/{postId}/like`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "liked": boolean,
    "likeCount": number
  }
}
```

### Get Post Comments
- **Method**: `GET /posts/{postId}/comments`
- **Auth**: Optional
- **Query Parameters**: `page`, `limit`
- **Response**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "string",
        "content": "string",
        "authorId": "string",
        "author": { "id": "string", "firstName": "string", "lastName": "string" },
        "createdAt": "ISO8601"
      }
    ],
    "pagination": { "page": number, "limit": number, "total": number }
  }
}
```

### Create Comment
- **Method**: `POST /posts/{postId}/comments`
- **Auth**: Required
- **Request Body**:
```json
{
  "content": "string"
}
```

---

## 3. Favorites Endpoints

### Get User Favorites
- **Method**: `GET /favorites`
- **Auth**: Required
- **Query Parameters**: `contentType` (optional: COURSE|TEST|POST|LIVE_SESSION)
- **Response**:
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "string",
        "userId": "string",
        "contentId": "string",
        "contentType": "COURSE|TEST|POST|LIVE_SESSION",
        "folder": "string (optional)",
        "tags": ["string"],
        "createdAt": "ISO8601"
      }
    ]
  }
}
```

### Check if Favorited
- **Method**: `GET /favorites/check`
- **Auth**: Required
- **Query Parameters**: `contentId`, `contentType`
- **Response**:
```json
{
  "success": true,
  "data": {
    "isFavorited": boolean
  }
}
```

### Add to Favorites
- **Method**: `POST /favorites`
- **Auth**: Required
- **Request Body**:
```json
{
  "contentId": "string",
  "contentType": "COURSE|TEST|POST|LIVE_SESSION"
}
```

### Remove from Favorites
- **Method**: `DELETE /favorites/{favoriteId}`
- **Auth**: Required

---

## 4. Courses Enrollment

### Enroll in Course
- **Method**: `POST /courses/{courseId}/enroll`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "enrollment": {
      "id": "string",
      "userId": "string",
      "courseId": "string",
      "enrolledAt": "ISO8601"
    }
  }
}
```
- **Status Codes**:
  - 200: Successfully enrolled
  - 409: Already enrolled
  - 403: Insufficient subscription tier

---

## 5. Tests Endpoints


---

## 6. Manager Content Endpoints

### Get Manager Content
- **Method**: `GET /manager/content`
- **Auth**: Required (Manager/Admin only)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "contentType": "NOTE|VIDEO|TEST|SIMULATION",
      "level": "A1|A2|B1|B2|C1|C2",
      "category": "GRAMMAR|LISTENING|READING|VOCABULARY|WRITING|ORAL|TCF_TEF",
      "subscriptionTier": "FREE|ESSENTIAL|PREMIUM|PRO",
      "fileUrl": "string (optional)",
      "thumbnailUrl": "string (optional)",
      "duration": number,
      "tags": ["string"],
      "isPublished": boolean,
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

---

## 7. Live Sessions Endpoints

### Get Created Live Sessions
- **Method**: `GET /live-sessions/created`
- **Auth**: Required (Manager/Admin only)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "startTime": "ISO8601",
      "endTime": "ISO8601 (optional)",
      "status": "SCHEDULED|LIVE|COMPLETED|CANCELLED",
      "createdBy": { "id": "string", "firstName": "string", "lastName": "string" },
      "participants": number,
      "createdAt": "ISO8601"
    }
  ]
}
```

---

## 8. Messages Endpoints

### Get Unread Message Count
- **Method**: `GET /messages/unread-count`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "unreadCount": number
  }
}
```

### Get Messages
- **Method**: `GET /messages`
- **Auth**: Required
- **Query Parameters**: `page`, `limit`, `conversationId` (optional)
- **Response**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "string",
        "content": "string",
        "senderId": "string",
        "sender": { "id": "string", "firstName": "string", "lastName": "string" },
        "conversationId": "string",
        "isRead": boolean,
        "createdAt": "ISO8601"
      }
    ],
    "pagination": { "page": number, "limit": number, "total": number }
  }
}
```

### Send Message
- **Method**: `POST /messages`
- **Auth**: Required
- **Request Body**:
```json
{
  "conversationId": "string",
  "content": "string"
}
```

---

## 9. User Endpoints

### Get User Profile
- **Method**: `GET /users/profile`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "ADMIN|SENIOR_MANAGER|JUNIOR_MANAGER|USER",
    "subscriptionTier": "FREE|ESSENTIAL|PREMIUM|PRO",
    "profileImage": "string (optional)",
    "createdAt": "ISO8601"
  }
}
```

### Update User Profile
- **Method**: `PUT /users/profile`
- **Auth**: Required
- **Request Body**:
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "profileImage": "string (optional)"
}
```

---

## 10. Authentication Endpoints

### Login
- **Method**: `POST /auth/login`
- **Auth**: Not required
- **Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "ADMIN|SENIOR_MANAGER|JUNIOR_MANAGER|USER"
    }
  }
}
```

### Register
- **Method**: `POST /auth/register`
- **Auth**: Not required
- **Request Body**:
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```

### Refresh Token
- **Method**: `POST /auth/refresh`
- **Auth**: Not required
- **Request Body**:
```json
{
  "refresh_token": "string"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "string"
  }
}
```

---

## 11. Health Check

### Health Status
- **Method**: `GET /health`
- **Auth**: Not required
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "ISO8601"
}
```

---

## Data Models Summary

### User Roles
- `ADMIN` - Full platform access
- `SENIOR_MANAGER` - Can create content and manage users
- `JUNIOR_MANAGER` - Can create content
- `USER` - Student access only

### Subscription Tiers
- `FREE` - Basic access
- `ESSENTIAL` - Extended access
- `PREMIUM` - Premium features
- `PRO` - All features

### Course Categories
- `GRAMMAR` - Grammar lessons
- `LISTENING` - Listening comprehension
- `READING` - Reading comprehension
- `VOCABULARY` - Vocabulary building
- `WRITING` - Writing practice
- `ORAL` - Oral expression
- `TCF_TEF` - Official exam preparation

### Course Levels
- `A1` - Beginner
- `A2` - Elementary
- `B1` - Intermediate
- `B2` - Upper intermediate
- `C1` - Advanced
- `C2` - Mastery

### Content Types
- `VIDEO` - Video content
- `NOTE` - Text/PDF content
- `TEST` - Test/quiz
- `SIMULATION` - Full exam simulation
- `CORRIGER_TCF` - TCF correction
- `COURSE` - Full course
- `POST` - Community post
- `LIVE_SESSION` - Live class

### Post Visibility
- `PUBLIC` - Visible to all users
- `PRIVATE` - Visible to specific users only

### Post Status
- `PUBLISHED` - Live and visible
- `DRAFT` - Not yet published

---

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute per IP
- **File upload**: 5 requests per minute per user

---

## Pagination

- **Default limit**: 20 items
- **Maximum limit**: 100 items
- **Default page**: 1

---

## Sorting

Supported sort fields:
- `createdAt` - Creation date
- `updatedAt` - Last update date
- `title` - Title (alphabetical)
- `likes` - Number of likes
- `comments` - Number of comments
- `views` - Number of views

Sort order: `asc` (ascending) or `desc` (descending)

---

## File Upload

### Supported File Types
- **Images**: jpg, jpeg, png, gif, webp (max 5MB)
- **Documents**: pdf, doc, docx, txt (max 10MB)
- **Videos**: mp4, webm, ogg (max 100MB)

### Upload Endpoint
- **Method**: `POST /upload`
- **Auth**: Required
- **Content-Type**: multipart/form-data
- **Response**:
```json
{
  "success": true,
  "data": {
    "fileUrl": "string",
    "fileName": "string",
    "fileSize": number,
    "mimeType": "string"
  }
}
```

---

## Webhook Events

The platform supports webhooks for:
- User registration
- Course enrollment
- Test completion
- Post creation
- Comment added

Configure webhooks in admin settings.

---

## API Versioning

Current API version: **v1**

All endpoints are prefixed with `/api/v1` (or just `/api` for backward compatibility).

---

## Support

For API support, contact: support@aura-learning.com

Last Updated: October 20, 2025


### Start Test
- **Method**: `POST /tests/{testId}/start`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "string",
      "userId": "string",
      "testId": "string",
      "startedAt": "ISO8601"
    }
  }
}
```

### Submit Test
- **Method**: `POST /tests/submit`
- **Auth**: Required
- **Request Body**:
```json
{
  "testId": "string",
  "answers": [
    {
      "questionId": "string",
      "answer": "string"
    }
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "score": number,
    "totalQuestions": number,
    "percentage": number,
    "feedback": "string (optional)"
  }
}
```

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Common Status Codes
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict (e.g., already enrolled)
- 500: Server Error

---

## Notes

1. **Subscription Tiers**: Backend returns uppercase (FREE, ESSENTIAL, PREMIUM, PRO), frontend converts to lowercase
2. **Pagination**: Default limit is 20, max is 100
3. **Timestamps**: All dates are ISO8601 format
4. **Token Refresh**: Automatic on 401 responses via apiClient interceptor
5. **Content Types**: VIDEO, NOTE, TEST, CORRIGER_TCF, SIMULATION, COURSE, POST, LIVE_SESSION

