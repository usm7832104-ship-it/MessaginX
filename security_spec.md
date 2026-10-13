# Security Specification for PulseChat

## Data Invariants
1. Users may only update their own profile `/users/{userId}` where `request.auth.uid == userId`.
2. Chats require participants list to contain the authenticated user to read or write.
3. Messages can only be created with `senderId == request.auth.uid` and by chat participants.
4. Messages allow participants to append to `readBy` and update `reactions`.
5. Status stories can only be created or deleted by their author `userId == request.auth.uid`.

## Dirty Dozen Attack Payloads
1. Spoof sender: Message created with senderId of another user -> DENIED.
2. Read foreign chat: User reading chat where UID is not in participantIds -> DENIED.
3. Malicious profile edit: User A trying to overwrite user B's profile -> DENIED.
4. Non-member message post: User posting into chat they are not participant in -> DENIED.
5. Status deletion: User deleting another member's status -> DENIED.
6. Oversized ID attack: Path ID longer than 128 chars -> DENIED.
7. Unauthenticated write: Unauthenticated user writing to users, chats, or statuses -> DENIED.
8. Message sender alteration: Updating message senderId -> DENIED.
9. Malicious story author impersonation -> DENIED.
10. Junk document ID injection in path -> DENIED.
11. Arbitrary collection write outside defined schemas -> DENIED by default catch-all.
12. Foreign user deletion -> DENIED.
