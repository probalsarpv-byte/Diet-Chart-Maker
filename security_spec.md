# Firestore Security Specification (`security_spec.md`)

## 1. Collection Inventory
- `/platform_hub/{docId}`: Stores synchronized platform state (`global_state`) across authenticated users and admins.
- `/users/{userId}`: Stores authenticated user profile, role (`user`, `doctor`, `vendor`, `admin`), region (`US`, `GB`, `IN`, `AU`, `ES`, `BD`), and GDPR/HIPAA/DPDP privacy consent flags.

## 2. Access Control Matrix
- **`/platform_hub/{docId}`**:
  - `read`: Authenticated users only (`isAuthenticated() && isValidId(docId)`).
  - `create`: Authenticated users only with strict schema validation (`isValidPlatformHubState(incoming())`).
  - `update`: Authenticated users with strict schema validation, restricted `affectedKeys().hasOnly(...)`, and privilege guard so `approvedPremiumEmails` can only be modified by an Admin (`isAdmin()`).
  - `delete`: Admin only (`isAdmin()`).
- **`/users/{userId}`**:
  - `read`: Document owner (`isOwner(userId)`) or Admin (`isAdmin()`) only (strict PII isolation).
  - `create`: Document owner (`isOwner(userId)`) or Admin (`isAdmin()`), with `incoming().uid == request.auth.uid`, and non-admins restricted to `role == 'user'` and `isSubscribed == false`.
  - `update`: Document owner (`isOwner(userId)`) or Admin (`isAdmin()`), beginning with `isValidUser(incoming())`. Non-admin owners can only modify `['name', 'updatedAt', 'region', 'privacyConsent']` and cannot escalate `role` or `isSubscribed` or alter `uid`/`email`.
  - `delete`: Document owner (`isOwner(userId)`) for GDPR/DPDP Right to Erasure, or Admin (`isAdmin()`).

## 3. Data Validation & Bounds
- `updatedAt`: `string`, `size() >= 10 && size() <= 64`
- `updatedByEmail`: `string`, `size() >= 3 && size() <= 254`
- `payloadJson`: `string`, `size() >= 2 && size() <= 950000`
- `approvedPremiumEmails`: `list`, `size() <= 500`
- `uid`: `string`, `size() >= 1 && size() <= 128`
- `email`: `string`, `isValidEmail(email)` (`size() >= 3 && size() <= 254`)
- `name`: `string`, `size() >= 1 && size() <= 120`
- `role`: `string`, `in ['user', 'doctor', 'vendor', 'admin']`
- `region`: optional `string`, `in ['US', 'GB', 'IN', 'AU', 'ES', 'BD']`

## 4. Immutability
- `uid` and `email` on `/users/{userId}` are immutable for non-admin users (`incoming().uid == existing().uid && incoming().email == existing().email`).

## 5. Relationship & Integrity
- Path parameter `{userId}` must match `request.auth.uid` on owner writes and `incoming().uid == userId`.
- All path wildcards (`{docId}`, `{userId}`) are validated with `isValidId()`.

## 6. Query Alignment
- Direct document reads/writes on `platform_hub/global_state` and `users/{uid}` align with `allow get` / `allow read`.

## 7. Catch-All & Helper Plan
- Top-level `match /{document=**} { allow read, write: if false; }` placed as the very first match block.
- Reusable helpers: `isAuthenticated()`, `isOwner(userId)`, `incoming()`, `existing()`, `isValidId(id)`, `isValidEmail(email)`, `isAdmin()`, `isValidPlatformHubState(data)`, `isValidUser(data)`.

## 8. Error Handling Plan
- All Firestore operations in `firebase.ts` and `services/platformHubService.ts` wrap reads/writes in `try...catch` and invoke `handleFirestoreError(err, OperationType, path)`.
