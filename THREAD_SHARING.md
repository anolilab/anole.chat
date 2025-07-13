# Thread Sharing Functionality

This document describes the thread sharing functionality that has been added to the chat application.

## Overview

The thread sharing system allows users to:
- Share threads with specific users via email invites
- Make threads publicly accessible via direct links
- Manage access permissions (read, write, admin)
- Set expiration times for invites
- View and manage who has access to their threads

## Database Schema

### New Tables

1. **threadAccess** - Tracks user access to threads
   - `threadId`: The thread being accessed
   - `userId`: The user with access
   - `permission`: Access level (read, write, admin)
   - `grantedBy`: Who granted the access
   - `grantedAt`: When access was granted
   - `expiresAt`: Optional expiration timestamp

2. **threadInvites** - Manages pending invites
   - `threadId`: The thread being invited to
   - `invitedEmail`: Email of the invited user
   - `invitedBy`: Who sent the invite
   - `permission`: Permission level for the invite
   - `inviteToken`: Unique token for the invite link
   - `expiresAt`: When the invite expires
   - `status`: Current status (pending, accepted, expired, revoked)

3. **threadVisibility** - Controls public access
   - `threadId`: The thread
   - `isPublic`: Whether the thread is publicly accessible
   - `publicAccessToken`: Token for public access
   - `createdBy`: Who created the visibility setting

## API Functions

### Access Control
- `checkThreadAccess` - Internal function to verify user access
- `getThreadAccess` - Get access information for a thread

### Invite Management
- `createThreadInvite` - Create a new invite
- `getThreadInvites` - List pending invites for a thread
- `revokeThreadInvite` - Revoke a pending invite
- `acceptThreadInvite` - Accept an invite

### User Management
- `removeThreadAccess` - Remove a user's access to a thread

### Public Access
- `toggleThreadVisibility` - Make a thread public or private
- `getPublicThread` - Get public thread information

## Usage Examples

### Creating an Invite
```typescript
const result = await createThreadInvite({
    threadId: "thread_123",
    invitedEmail: "user@example.com",
    permission: "read",
    expirationType: "7_days"
});

// The invite link will be: /invite/{result.inviteToken}
```

### Making a Thread Public
```typescript
const result = await toggleThreadVisibility({
    threadId: "thread_123",
    isPublic: true
});

// The public link will be: /thread/{result.publicAccessToken}
```

### Accepting an Invite
```typescript
const result = await acceptThreadInvite({
    inviteToken: "invite_token_here"
});

// User will be redirected to: /chat/{result.threadId}
```

## Permission Levels

- **read**: Can view thread messages
- **write**: Can view and send messages
- **admin**: Can view, send messages, and manage access

## Expiration Options

- **1_day**: Invite expires in 24 hours
- **7_days**: Invite expires in 7 days
- **custom**: Custom expiration time in hours

## UI Components

### ThreadShareDialog
A comprehensive dialog for managing thread sharing with three tabs:
1. **Access** - View and manage users with access
2. **Invites** - Create and manage pending invites
3. **Public** - Toggle public access and copy public links

### ThreadShareButton
A simple button component that opens the sharing dialog.

## Integration

The share button is integrated into the chat header and appears next to the thread title. It's only visible for existing threads (not for "new" threads).

## Security Considerations

1. **Access Control**: All thread operations now check user permissions
2. **Token Security**: Invite and public access tokens are cryptographically secure
3. **Expiration**: Invites automatically expire to prevent long-term access
4. **Owner Protection**: Thread owners cannot be removed from their own threads

## Routes

- `/invite/{inviteToken}` - Accept thread invites
- `/thread/{publicToken}` - Access public threads

## Error Handling

The system includes comprehensive error handling for:
- Invalid invite tokens
- Expired invites
- Insufficient permissions
- Non-existent threads
- Duplicate invites

## Future Enhancements

Potential improvements could include:
- Email notifications for invites
- Bulk invite management
- Advanced permission granularity
- Audit logging for access changes
- Integration with external authentication systems