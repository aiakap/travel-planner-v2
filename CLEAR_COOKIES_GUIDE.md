# How to Clear Browser Cookies (Visual Guide)

## Why You Need This

After updating the authentication system, old session cookies are incompatible. You **must** clear them to log in successfully.

## Easiest Method: Incognito/Private Window

### Chrome / Edge / Brave
1. Press `Cmd+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows/Linux)
2. Go to `http://localhost:3000/login`
3. Try logging in

### Firefox
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Go to `http://localhost:3000/login`
3. Try logging in

### Safari
1. File → New Private Window
2. Go to `http://localhost:3000/login`
3. Try logging in

---

## Manual Method: Clear Cookies in DevTools

### Chrome / Edge / Brave

**Step 1**: Open DevTools
- Press `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)

**Step 2**: Go to Application Tab
- Click "Application" at the top of DevTools
- If you don't see it, click the `>>` button to show more tabs

**Step 3**: Find Cookies
- In the left sidebar, expand "Storage"
- Expand "Cookies"
- Click on `http://localhost:3000`

**Step 4**: Clear All Cookies
- Right-click anywhere in the cookies list
- Click "Clear" or "Delete All"
- OR click each cookie and press Delete

**Step 5**: Refresh
- Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux)
- Or click the refresh button

### Firefox

**Step 1**: Open DevTools
- Press `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)

**Step 2**: Go to Storage Tab
- Click "Storage" at the top of DevTools

**Step 3**: Find Cookies
- In the left sidebar, expand "Cookies"
- Click on `http://localhost:3000`

**Step 4**: Clear All Cookies
- Right-click in the cookies list
- Click "Delete All"
- OR select each cookie and press Delete

**Step 5**: Refresh
- Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux)

### Safari

**Step 1**: Open Web Inspector
- Press `Cmd+Option+I`
- Or right-click page → "Inspect Element"

**Step 2**: Go to Storage Tab
- Click "Storage" at the top

**Step 3**: Find Cookies
- In the left sidebar, click "Cookies"
- Click on `localhost`

**Step 4**: Clear Cookies
- Select each cookie
- Press Delete key
- OR use Safari → Settings → Privacy → Manage Website Data

**Step 5**: Refresh
- Press `Cmd+R`

---

## Alternative: Clear All Site Data

### Chrome / Edge / Brave

1. Open DevTools (`F12`)
2. Go to "Application" tab
3. In left sidebar, click "Storage"
4. Click "Clear site data" button
5. Confirm
6. Refresh page

### Firefox

1. Open DevTools (`F12`)
2. Go to "Storage" tab
3. Right-click on `http://localhost:3000`
4. Click "Delete All"
5. Refresh page

---

## What Cookies to Look For

You're looking for cookies named:
- `next-auth.session-token`
- `__Secure-next-auth.session-token`
- `next-auth.csrf-token`
- `__Secure-next-auth.csrf-token`
- `next-auth.callback-url`

**Delete ALL of them**.

---

## Verification

After clearing cookies:

1. ✅ Refresh the page
2. ✅ You should see the login page
3. ✅ No errors in console
4. ✅ Clicking "Continue with GitHub" should work

---

## Still Not Working?

### Try This:

1. **Close ALL browser tabs** for localhost:3000
2. **Quit the browser completely**
3. **Reopen browser**
4. **Open incognito/private window**
5. **Go to** `http://localhost:3000/login`
6. **Try logging in**

### Nuclear Option:

Clear **all** browser data for localhost:

**Chrome/Edge/Brave**:
1. Settings → Privacy and Security
2. Clear browsing data
3. Time range: "All time"
4. Check: "Cookies and other site data"
5. Click "Clear data"

**Firefox**:
1. Settings → Privacy & Security
2. Cookies and Site Data → Clear Data
3. Check both boxes
4. Click "Clear"

**Safari**:
1. Safari → Settings → Privacy
2. Manage Website Data
3. Search "localhost"
4. Remove
5. Done

---

## Quick Reference

| Browser | Shortcut | Tab | Action |
|---------|----------|-----|--------|
| Chrome | F12 | Application → Storage → Cookies | Right-click → Clear |
| Firefox | F12 | Storage → Cookies | Right-click → Delete All |
| Safari | Cmd+Option+I | Storage → Cookies | Select → Delete |

---

## After Clearing Cookies

1. Go to `http://localhost:3000/login`
2. Click "Continue with GitHub"
3. Complete OAuth flow
4. Should redirect to `/trips`
5. ✅ Success!

---

**Remember**: Every time you update the auth system, you may need to clear cookies again. Using incognito/private windows during development can help avoid this issue.
