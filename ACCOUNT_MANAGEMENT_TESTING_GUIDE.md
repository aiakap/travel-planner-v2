# Account Management Testing Guide

## Prerequisites

Before testing, ensure:
1. All OAuth provider credentials are set in `.env` file (see `ENV_SETUP.md`)
2. Database migration has been applied
3. Prisma client has been generated
4. Development server is running

## Test Scenarios

### Scenario 1: New User Signup

**Objective**: Verify new user can sign up with any provider and account is marked as primary

**Steps**:
1. Navigate to `/login`
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Verify redirected to `/trips`

**Expected Results**:
- [ ] New user created in database
- [ ] Account record created with `isPrimaryLogin: true`
- [ ] Account has `canLogin: true`
- [ ] Account has `syncStatus: "active"`
- [ ] `lastLoginAt` is set to current timestamp
- [ ] User is authenticated and can access protected routes

**Database Verification**:
```sql
SELECT u.id, u.email, a.provider, a.isPrimaryLogin, a.canLogin, a.syncStatus
FROM "User" u
JOIN "Account" a ON u.id = a."userId"
WHERE u.email = 'test@gmail.com';
```

---

### Scenario 2: Add Second Account (While Logged In)

**Objective**: Verify user can link additional providers to existing account

**Steps**:
1. Log in with Google
2. Navigate to `/settings/accounts`
3. Click "Connect Spotify" in "Add More Accounts" section
4. Complete Spotify OAuth flow
5. Verify redirected back to `/settings/accounts`

**Expected Results**:
- [ ] Second account created linked to same user
- [ ] Spotify account has `isPrimaryLogin: false`
- [ ] Both accounts shown in "Connected Accounts" list
- [ ] Account count shows "2"
- [ ] Spotify removed from "Add More Accounts" section
- [ ] Both Google and Spotify can be used for login

**Database Verification**:
```sql
SELECT provider, isPrimaryLogin, canLogin, syncStatus
FROM "Account"
WHERE "userId" = 'user_id_here'
ORDER BY "isPrimaryLogin" DESC;
```

---

### Scenario 3: Email-Based Automatic Account Linking

**Objective**: Verify accounts with matching emails are automatically linked

**Steps**:
1. Sign up with Google (email: john@example.com)
2. Log out
3. Click "Continue with Facebook"
4. Use Facebook account with same email (john@example.com)
5. Complete OAuth flow

**Expected Results**:
- [ ] No duplicate user created
- [ ] Facebook account linked to existing user
- [ ] User authenticated as original user
- [ ] Both accounts visible in settings
- [ ] User data (trips, profile) preserved

**Database Verification**:
```sql
SELECT COUNT(*) as user_count
FROM "User"
WHERE email = 'john@example.com';
-- Should return 1

SELECT provider
FROM "Account"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'john@example.com');
-- Should return both 'google' and 'facebook'
```

---

### Scenario 4: Disconnect Validation (Block Last Account)

**Objective**: Verify system prevents disconnecting the only remaining account

**Steps**:
1. Log in with user who has only one account (Google)
2. Navigate to `/settings/accounts`
3. Click "Disconnect" button on Google account

**Expected Results**:
- [ ] Disconnect button is disabled
- [ ] Tooltip or visual indicator shows why it's disabled
- [ ] Clicking disconnect shows error message
- [ ] Error message: "Cannot disconnect your only login method. Please add another account first."
- [ ] Account remains connected

**UI Verification**:
- Disconnect button should have `disabled={accounts.length <= 1}` attribute
- Visual feedback (grayed out button)

---

### Scenario 5: Successful Disconnect (Non-Primary Account)

**Objective**: Verify user can disconnect non-primary account when multiple exist

**Steps**:
1. Log in with user who has Google (primary) and Spotify
2. Navigate to `/settings/accounts`
3. Click "Disconnect" on Spotify account
4. Confirm in dialog

**Expected Results**:
- [ ] Confirmation dialog appears
- [ ] After confirming, Spotify account marked as disconnected
- [ ] Spotify account has `canLogin: false`
- [ ] Spotify account has `syncStatus: "disconnected"`
- [ ] Spotify no longer appears in connected accounts list
- [ ] Spotify appears in "Add More Accounts" section
- [ ] Can still log in with Google

**Database Verification**:
```sql
SELECT provider, canLogin, syncStatus
FROM "Account"
WHERE "userId" = 'user_id_here' AND provider = 'spotify';
-- Should show canLogin: false, syncStatus: 'disconnected'
```

---

### Scenario 6: Set Primary Account

**Objective**: Verify user can change which account is marked as primary

**Steps**:
1. Log in with user who has Google (primary) and Spotify
2. Navigate to `/settings/accounts`
3. Click "Set as Primary" on Spotify account

**Expected Results**:
- [ ] Primary badge moves from Google to Spotify
- [ ] Only one account has `isPrimaryLogin: true`
- [ ] Google account has `isPrimaryLogin: false`
- [ ] Spotify account has `isPrimaryLogin: true`
- [ ] Both accounts still have `canLogin: true`

**Database Verification**:
```sql
SELECT provider, isPrimaryLogin
FROM "Account"
WHERE "userId" = 'user_id_here'
ORDER BY "isPrimaryLogin" DESC;
-- First row should be Spotify with isPrimaryLogin: true
-- Other rows should have isPrimaryLogin: false
```

---

### Scenario 7: Login with Different Linked Accounts

**Objective**: Verify user can log in with any linked account and access same profile

**Steps**:
1. User has Google and Spotify linked
2. Log out
3. Navigate to `/login`
4. Click "Continue with Google"
5. Complete OAuth
6. Verify logged in and can see trips
7. Log out
8. Navigate to `/login`
9. Click "Continue with Spotify"
10. Complete OAuth

**Expected Results**:
- [ ] Both logins authenticate as same user
- [ ] Same user ID in session
- [ ] Same trips visible
- [ ] Same profile data
- [ ] `lastLoginAt` updated for respective account
- [ ] No duplicate sessions created

**Session Verification**:
```typescript
// After Google login
const session1 = await auth();
console.log(session1.user.id); // e.g., "user_abc123"

// After Spotify login
const session2 = await auth();
console.log(session2.user.id); // Should be "user_abc123" (same)
```

---

### Scenario 8: Provider Account Already Linked to Different User

**Objective**: Verify system prevents duplicate account linking and authenticates as correct user

**Steps**:
1. User A signs up with Google account (email: shared@example.com)
2. Log out
3. User B tries to sign up with same Google account
4. Complete OAuth flow

**Expected Results**:
- [ ] No new user created
- [ ] User B is authenticated as User A
- [ ] Google account remains linked to User A
- [ ] User B sees User A's trips and data
- [ ] No error shown (seamless authentication)

**Database Verification**:
```sql
SELECT COUNT(*) as account_count
FROM "Account"
WHERE provider = 'google' AND "providerAccountId" = 'google_user_id_here';
-- Should return 1 (not duplicated)

SELECT "userId"
FROM "Account"
WHERE provider = 'google' AND "providerAccountId" = 'google_user_id_here';
-- Should always return same userId
```

---

## Additional Test Cases

### Edge Case 1: Token Refresh on Login

**Steps**:
1. Log in with Google
2. Wait for token to expire (or manually expire in DB)
3. Log in again with Google

**Expected**:
- [ ] New access token stored
- [ ] Refresh token updated if provided
- [ ] `expires_at` updated
- [ ] `lastLoginAt` updated

---

### Edge Case 2: Provider Without Email (Apple Hide My Email)

**Steps**:
1. Sign up with Apple
2. Choose "Hide My Email"
3. Complete OAuth

**Expected**:
- [ ] Account created with relay email
- [ ] User can still log in
- [ ] No errors due to missing email

---

### Edge Case 3: Simultaneous Logins (Race Condition)

**Steps**:
1. Open two browser tabs
2. In tab 1, start Google OAuth
3. In tab 2, start Facebook OAuth (same email)
4. Complete both flows simultaneously

**Expected**:
- [ ] No duplicate users created
- [ ] Both accounts linked to same user
- [ ] Database constraint prevents duplicates
- [ ] No errors thrown

---

## Automated Test Script

Create a test script to verify core functionality:

```typescript
// scripts/test-account-management.ts
import { prisma } from "@/lib/prisma";

async function testAccountManagement() {
  console.log("Testing Account Management System...\n");
  
  // Test 1: Check schema
  const accountFields = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'Account'
    AND column_name IN ('isPrimaryLogin', 'canLogin', 'lastLoginAt', 'syncStatus');
  `;
  console.log("✓ Schema fields:", accountFields);
  
  // Test 2: Check indexes
  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'Account'
    AND indexname LIKE '%canLogin%';
  `;
  console.log("✓ Indexes:", indexes);
  
  // Test 3: Verify no duplicate provider accounts
  const duplicates = await prisma.$queryRaw`
    SELECT provider, "providerAccountId", COUNT(*) as count
    FROM "Account"
    GROUP BY provider, "providerAccountId"
    HAVING COUNT(*) > 1;
  `;
  console.log("✓ Duplicate check:", duplicates.length === 0 ? "No duplicates" : "DUPLICATES FOUND!");
  
  // Test 4: Verify all users have at least one active account
  const usersWithoutAccounts = await prisma.$queryRaw`
    SELECT u.id, u.email
    FROM "User" u
    LEFT JOIN "Account" a ON u.id = a."userId" AND a."canLogin" = true AND a."syncStatus" = 'active'
    WHERE a.id IS NULL;
  `;
  console.log("✓ Users without active accounts:", usersWithoutAccounts);
  
  console.log("\nAll tests completed!");
}

testAccountManagement().catch(console.error);
```

---

## Manual Testing Checklist

### UI/UX Tests
- [ ] Login page displays all 7 providers
- [ ] Google has "Recommended" badge
- [ ] Provider icons display correctly
- [ ] Clicking provider initiates OAuth flow
- [ ] Error messages display correctly
- [ ] Settings page shows connected accounts
- [ ] Account cards show correct badges (Primary, Active)
- [ ] Disconnect button disabled for last account
- [ ] "Add More Accounts" section shows available providers
- [ ] Loading states work during async operations

### Functional Tests
- [ ] Can sign up with any provider
- [ ] Can link multiple accounts
- [ ] Can log in with any linked account
- [ ] Cannot disconnect last account
- [ ] Can disconnect non-primary accounts
- [ ] Can set any account as primary
- [ ] Email-based linking works
- [ ] No duplicate users created
- [ ] Tokens are stored securely
- [ ] Last login timestamp updates

### Security Tests
- [ ] Cannot access settings page without authentication
- [ ] Cannot disconnect another user's accounts
- [ ] Cannot set primary for another user's accounts
- [ ] CSRF protection works (NextAuth handles this)
- [ ] Tokens not exposed in API responses
- [ ] Database queries use proper WHERE clauses

### Performance Tests
- [ ] Settings page loads quickly
- [ ] Account queries are efficient (use indexes)
- [ ] No N+1 queries
- [ ] Parallel data fetching works

---

## Debugging Tips

### Check Current User's Accounts
```typescript
const session = await auth();
const accounts = await prisma.account.findMany({
  where: { userId: session.user.id }
});
console.log(accounts);
```

### Verify Account Linking Logic
```typescript
// In auth.ts signIn callback, add logging:
console.log("Sign in attempt:", {
  provider: account.provider,
  providerAccountId: account.providerAccountId,
  userEmail: user.email,
  existingAccount: !!existingAccount
});
```

### Check Session Data
```typescript
const session = await auth();
console.log("Session:", JSON.stringify(session, null, 2));
```

### Monitor OAuth Errors
Check browser console and server logs for:
- OAuth callback errors
- Token refresh failures
- Database constraint violations
- NextAuth errors

---

## Common Issues & Solutions

### Issue: "Cannot disconnect your only login method"
**Cause**: User has only one account
**Solution**: Add another account first, then disconnect

### Issue: OAuth callback error
**Cause**: Incorrect redirect URI in provider settings
**Solution**: Ensure redirect URI matches exactly: `http://localhost:3000/api/auth/callback/{provider}`

### Issue: Duplicate users created
**Cause**: Email-based linking not working
**Solution**: Check that email is returned by provider and matching logic in signIn callback

### Issue: Cannot log in with linked account
**Cause**: Account marked as `canLogin: false`
**Solution**: Check account status in database, ensure not disconnected

### Issue: Primary badge not updating
**Cause**: Cache not revalidated
**Solution**: Check `revalidatePath` is called in `setPrimaryAccount`

---

## Success Criteria

All tests pass when:
- ✅ Users can connect multiple social accounts
- ✅ Users can login with any connected account
- ✅ System prevents disconnecting last account
- ✅ Email-based account linking works automatically
- ✅ Primary account can be set and displayed
- ✅ All OAuth providers work correctly
- ✅ Settings UI is intuitive and responsive
- ✅ No duplicate users created
- ✅ Existing GitHub users can add more accounts
- ✅ All edge cases handled gracefully

---

## Next Steps After Testing

1. **Monitor OAuth Errors**: Set up error tracking for OAuth failures
2. **Analytics**: Track which providers are most popular
3. **User Feedback**: Gather feedback on account management UX
4. **Provider Approvals**: Submit apps for verification (Google, Facebook, etc.)
5. **Data Extraction**: Implement social data extractors (Phase 2 of main plan)
6. **Interest Analysis**: Build AI-powered interest analyzer (Phase 3 of main plan)
