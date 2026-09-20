# API and realtime reference

## HTTP API

All routes below are prefixed with `/api`. Every route except signup, login and health probes
requires the authentication cookie.

### Health
| Method | Endpoint       | Description                              |
|--------|----------------|------------------------------------------|
| GET    | `/health`      | Liveness probe, no authentication needed |
| GET    | `/ready`       | Database readiness, 200 or 503 |

### Auth
| Method | Endpoint        | Description         |
|--------|-----------------|---------------------|
| POST   | `/auth/signup`  | Create an account   |
| POST   | `/auth/login`   | Log in              |
| POST   | `/auth/logout`  | Log out             |
| GET    | `/auth/me`      | Current session user |
| PUT    | `/auth/profile` | Update name / avatar |
| PUT    | `/auth/password`| Change password     |

### Friends
| Method | Endpoint                  | Description                   |
|--------|---------------------------|-------------------------------|
| GET    | `/friends/search?query=`  | Search by username or code    |
| POST   | `/friends/send/:id`       | Send a friend request         |
| POST   | `/friends/respond`        | Accept or reject a request    |
| GET    | `/friends/list`           | List friends                  |
| GET    | `/friends/requests`       | Incoming requests             |
| GET    | `/friends/sentRequests`   | Outgoing requests             |
| DELETE | `/friends/cancel/:id`     | Cancel a sent request         |
| DELETE | `/friends/remove/:id`     | Remove a friend               |

### Messages
| Method | Endpoint             | Description                  |
|--------|----------------------|------------------------------|
| GET    | `/messages/:id`      | Conversation with a user     |
| POST   | `/messages/send/:id` | Send a message               |
| PUT    | `/messages/edit/:id` | Edit your own message        |
| DELETE | `/messages/:id`      | Delete your own message      |
| POST   | `/messages/react/:id`| Add or remove a reaction     |
| GET    | `/messages/unread/counts` | Unread count per sender |
| DELETE | `/messages/clear/:id`| Clear conversation history   |

### Conversations
| Method | Endpoint                       | Description                |
|--------|--------------------------------|----------------------------|
| GET    | `/conversations`               | List conversations         |
| GET    | `/conversations/status/:status`| Filter by status           |
| PUT    | `/conversations/accept/:id`    | Accept a message request   |

## Socket Events

| Event               | Direction        | Purpose                        |
|---------------------|------------------|--------------------------------|
| `conversationAccepted` | server → client | Message request accepted |
| `getOnlineUsers`    | server → client  | Current online user IDs        |
| `newMessage`        | server → client  | Incoming message               |
| `messageEdited`     | server → client  | A message was edited           |
| `messageDeleted`    | server → client  | A message was deleted          |
| `messageReaction`   | server → client  | A reaction changed             |
| `messagesRead`      | server → client  | Recipient read your messages   |
| `userTyping`        | server → client  | Peer is typing                 |
| `userStoppedTyping` | server → client  | Peer stopped typing            |
| `newFriendRequest`  | server → client  | Incoming friend request        |
| `friendRequestResponse` | server → client | Your request was accepted   |
| `friendRequestRejected` | server → client | Your request was rejected   |
| `typing`            | client → server  | User started typing            |
| `stopTyping`        | client → server  | User stopped typing            |
| `chatOpened`        | client → server  | Mark messages as read          |


## Pagination and sessions

`GET /api/messages/:id` returns the latest 50 messages in chronological order.
Request older history with `?before=<oldest-message-id>&limit=50` (maximum 50).
`X-Has-More: true` indicates another page. Search in the UI covers loaded messages.

`GET /api/ready` returns 200 while MongoDB is connected, otherwise 503.

Login/signup and password changes issue an HttpOnly session cookie. Logout revokes
that session; password changes invalidate all previous sessions. Socket.IO uses
the same cookie; a query-string user ID is ignored.

Messages are limited to 2,000 characters; JSON request bodies to 16 KiB. New
passwords require at least 8 characters and at most 72 UTF-8 bytes. Public profile
images must use HTTPS; an empty URL uses initials.

Authenticated clients can emit `typing` and `stopTyping` with `{ receiverId }`,
and `chatOpened` with `{ otherUserId }`. IDs must identify an existing conversation.
Socket events are limited per connection. Reconnect clients should refresh stored
state through the API because disconnected clients do not receive old events.
