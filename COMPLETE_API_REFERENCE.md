# AURA Learning Platform - Complete API Reference

## Quick Reference Table

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/register` | POST | ❌ | Register new user |
| `/auth/login` | POST | ❌ | User login |
| `/auth/refresh` | POST | ❌ | Refresh access token |
| `/courses` | GET | ✅ | Get all courses |
| `/courses/{id}/enroll` | POST | ✅ | Enroll in course |
| `/courses/{id}/enrolled` | GET | ✅ | Get enrolled courses |
| `/tests` | GET | ✅ | Get all tests |
| `/tests/{id}` | GET | ✅ | Get test details |
| `/tests/{id}/start` | POST | ✅ | Start test attempt |
| `/tests/submit` | POST | ✅ | Submit test answers |
| `/posts` | GET | ✅ | Get all posts |
| `/posts` | POST | ✅ | Create post |
| `/posts/{id}/like` | POST | ✅ | Like/unlike post |
| `/posts/{id}/comments` | GET | ✅ | Get post comments |
| `/posts/{id}/comments` | POST | ✅ | Add comment |
| `/favorites` | GET | ✅ | Get user favorites |
| `/favorites` | POST | ✅ | Add to favorites |
| `/favorites/{id}` | DELETE | ✅ | Remove from favorites |
| `/favorites/check` | GET | ✅ | Check if favorited |
| `/content-management/courses` | GET | ✅ | Get courses (student view) |
| `/content-management/management` | GET | ✅ | Get content (admin view) |
| `/messages/unread-count` | GET | ✅ | Get unread message count |
| `/users/profile` | GET | ✅ | Get user profile |

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Authentication
- **Header**: `Authorization: Bearer <access_token>`
- **Tokens**: Stored in localStorage as `access_token` and `refresh_token`
- **Expiry**: Access token expires, use refresh token to get new one

## Content Types
- `COURSE` - Course materials
- `TEST` - Test assessments
- `POST` - Community posts
- `LIVE_SESSION` - Live sessions
- `VIDEO` - Video content
- `AUDIO` - Audio content
- `DOCUMENT` - Document files

## Subscription Tiers
- `FREE` - Free tier (level 0)
- `ESSENTIAL` - Essential tier (level 1)
- `PREMIUM` - Premium tier (level 2)
- `PRO` - Pro tier (level 3)

## Course Levels
- `A1`, `A2` - Beginner
- `B1`, `B2` - Intermediate
- `C1`, `C2` - Advanced

## Course Categories
- `GRAMMAR` - Grammar lessons
- `LISTENING` - Listening comprehension
- `READING` - Reading comprehension
- `VOCABULARY` - Vocabulary building
- `WRITING` - Writing skills
- `ORAL` - Oral expression
- `TCF_TEF` - TCF/TEF exam prep

## User Roles
- `USER` / `STUDENT` - Regular student
- `JUNIOR_MANAGER` - Can create courses/posts
- `SENIOR_MANAGER` - Can manage other managers
- `ADMIN` - Full system access

## Common Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search query
- `filter` - Filter criteria
- `sort` - Sort field
- `order` - Sort order (asc/desc)

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `409` - Conflict (e.g., already enrolled)
- `500` - Server error

## Key Endpoints Details

### Courses
- **Enroll**: `POST /courses/{courseId}/enroll` - Auto-enroll student
- **Get Enrolled**: `GET /courses/{courseId}/enrolled` - Get enrolled students
- **Get All**: `GET /content-management/courses` - Get all courses with filters

### Tests
- **Start**: `POST /tests/{testId}/start` - Create test attempt
- **Submit**: `POST /tests/submit` - Submit answers
- **Get**: `GET /tests/{testId}` - Get test questions

### Posts
- **Like**: `POST /posts/{postId}/like` - Toggle like (returns `{ liked: boolean }`)
- **Comments**: `GET /posts/{postId}/comments` - Get comments
- **Add Comment**: `POST /posts/{postId}/comments` - Add new comment

### Favorites
- **Add**: `POST /favorites` - Add to favorites
- **Remove**: `DELETE /favorites/{favoriteId}` - Remove from favorites
- **Check**: `GET /favorites/check?contentId=X&contentType=Y` - Check if favorited
- **Get All**: `GET /favorites` - Get user's favorites with pagination

## Important Notes
1. API client returns `response.data` directly (not wrapped)
2. Check `response.success` to verify success
3. Always include `Authorization` header for protected endpoints
4. Subscription tier hierarchy: FREE < ESSENTIAL < PREMIUM < PRO
5. Unique constraint on favorites: `(userId, contentId, contentType)`

## For More Details
See `BACKEND_API_DOCUMENTATION.md` for complete endpoint specifications.

