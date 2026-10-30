# Firestore Security Specification (`security_spec.md`)

## 1. Collection Inventory & Data Invariants
- `/platform_hub/{docId}`: Stores synchronized platform state (`global_state`) across authenticated users and admins.
- `/users/{userId}`: Stores authenticated user profile, role (`user`, `doctor`, `vendor`, `admin`), region (`US`, `GB`, `IN`, `AU`, `ES`, `BD`), and GDPR/HIPAA/DPDP privacy consent flags.
- `/clinical_assessments/{assessmentId}`: Stores patient clinical phase transition logs (Phases 1 to 4). Must belong to `request.auth.uid` (`userId == request.auth.uid`) and is immutable by non-admins once recorded.

## 2. The "Dirty Dozen" Payloads (Adversarial Red Team Scenarios)
1. **Unauthenticated Read on `/users/USR-1`**: `{ auth: null }` -> `PERMISSION_DENIED`.
2. **PII Leak (Cross-User Read on `/users/USR-2` by `USR-1`)**: `{ auth: { uid: 'USR-1' } }` -> `PERMISSION_DENIED`.
3. **Self-Assigned Admin Escalation on `/users/USR-1` Create**: `{ uid: 'USR-1', email: 'attacker@gmail.com', name: 'Attacker', role: 'admin' }` -> `PERMISSION_DENIED`.
4. **Role Escalation on `/users/USR-1` Update**: `{ uid: 'USR-1', email: 'attacker@gmail.com', name: 'Attacker', role: 'admin' }` -> `PERMISSION_DENIED`.
5. **Unverified Admin Email Spoof on `/platform_hub/global_state` Delete**: `{ auth: { uid: 'SPOOF', token: { email: 'ramkrisna97@gmail.com', email_verified: false } } }` -> `PERMISSION_DENIED`.
6. **Unauthorized Premium Email Injection on `/platform_hub/global_state` Update by Non-Admin**: Modifying `approvedPremiumEmails` without `isAdmin()` -> `PERMISSION_DENIED`.
7. **Shadow Field Injection on `/users/USR-1`**: Adding `{ isVerifiedAdmin: true }` not in `hasOnly()` -> `PERMISSION_DENIED`.
8. **Denial-of-Wallet Oversized Payload on `/platform_hub/global_state`**: `payloadJson` > 950,000 chars -> `PERMISSION_DENIED`.
9. **ID Poisoning on Path Variable**: `{userId}` containing spaces/slashes or > 128 chars -> `PERMISSION_DENIED`.
10. **Cross-User Clinical Assessment Spoof on `/clinical_assessments/ASSESS-1` Create**: `incoming().userId != request.auth.uid` -> `PERMISSION_DENIED`.
11. **Cross-User Clinical Assessment Read on `/clinical_assessments/ASSESS-1`**: Reading another patient's clinical assessment without `isAdmin()` -> `PERMISSION_DENIED`.
12. **Out-of-Bounds Phase Transition Values on `/clinical_assessments/ASSESS-1`**: `currentPhase: 99` or `improvementScore: 500` -> `PERMISSION_DENIED`.

## 3. Access Control Matrix
- **`/platform_hub/{docId}`**:
  - `read`: Authenticated users only (`isAuthenticated() && isValidId(docId)`).
  - `create`: Authenticated users with verified email and strict schema validation (`isValidPlatformHubState(incoming())`).
  - `update`: Authenticated users with verified email, strict schema validation, restricted `affectedKeys().hasOnly(...)`, and privilege guard so `approvedPremiumEmails` can only be modified by an Admin (`isAdmin()`).
  - `delete`: Admin only (`isAdmin()`).
- **`/users/{userId}`**:
  - `read`: Document owner (`isOwner(userId)`) or Admin (`isAdmin()`) only (strict PII isolation).
  - `create`: Document owner (`isOwner(userId)`) with verified email or Admin (`isAdmin()`), with `incoming().uid == userId`, and non-admins restricted to `role == 'user'` and `isSubscribed == false`.
  - `update`: Document owner (`isOwner(userId)`) or Admin (`isAdmin()`), beginning with `isValidUser(incoming())`. Non-admin owners can only modify `['name', 'updatedAt', 'region', 'privacyConsent']` and cannot escalate `role` or `isSubscribed` or alter `uid`/`email`.
  - `delete`: Document owner (`isOwner(userId)`) for GDPR/DPDP Right to Erasure, or Admin (`isAdmin()`).
- **`/clinical_assessments/{assessmentId}`**:
  - `get`: Assessment owner (`resource.data.userId == request.auth.uid`) or Admin (`isAdmin()`).
  - `list`: Assessment owner (`resource.data.userId == request.auth.uid`) or Admin (`isAdmin()`).
  - `create`: Authenticated verified user where `incoming().userId == request.auth.uid && incoming().id == assessmentId && isValidClinicalAssessment(incoming())`.
  - `update`: Admin only (`isValidClinicalAssessment(incoming()) && isAdmin() && incoming().diff(existing()).affectedKeys().hasOnly(['improved', 'improvementScore', 'answersJson'])`).
  - `delete`: Assessment owner (`resource.data.userId == request.auth.uid`) or Admin (`isAdmin()`).
