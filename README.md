# Arsheon Loan Center

Private internal administration website for Arsheon Group. Admins sign in, review every loan request,
accept or reject with a two-step confirmation, move requests through the lifecycle, and keep internal notes.
Companion project: `arsheon-loan-requestor`.

Stack: React 18 + Vite + Firebase (Realtime Database + Email/Password Auth).

## 1. Installation
Requires Node.js 18+ and the same Firebase project used by `arsheon-loan-requestor`.

## 2. npm install
```bash
npm install
```

## 3. Environment setup
Copy `.env.example` to `.env` locally and insert your own Firebase configuration.
```bash
cp .env.example .env
```
Never commit `.env` (it is in `.gitignore`) and never put real values in this README.

## 4. Firebase configuration
1. Use the same Realtime Database as the Requestor and put the same web app config in `.env`.
2. Authentication → Sign-in method → enable **Email/Password**. Create each admin user in the console
   (Authentication → Users → Add user). Turn off self-registration where your Firebase plan allows it.
3. Publish `database.rules.json` (Realtime Database → Rules). It is identical to the Requestor's file; publish it once.
4. **Authorize admins:** copy the user's UID from Authentication → Users and, in the Realtime Database console,
   add `admins/<UID>` with the boolean value `true`. Only these users can read requests or change status.
   Being signed in is not enough; the rules check this list.

All Firebase initialization lives in `src/config/firebase.js`.

## 5. Running locally
```bash
npm run dev      # http://localhost:5174
```

## 6. Building
```bash
npm run build    # output in dist/
npm run preview
```

## 7. Deployment
Deploy to a host you control (Firebase Hosting, Netlify, Vercel). Set the `VITE_FIREBASE_*` variables in
the host settings. Consider restricting access further (for example an IP allow-list or Cloudflare Access).
Routing uses hash URLs, so no rewrite rules are needed. The page sends `noindex`.

## 8. GitHub push
```bash
git init && git add . && git status   # confirm .env is NOT listed
git commit -m "Arsheon Loan Center"
git remote add origin <your-repo-url> && git push -u origin main
```
Run `npm run scan` before pushing.

## 9. Security
- No hardcoded users or passwords. Authentication is Firebase Email/Password; authorization is `admins/<uid>` in the database, enforced by the rules, not by hiding buttons.
- Requestors (anonymous sessions) cannot read `loanRequests`, `internal`, `auditLogs` or `admins`.
- Internal notes live under `internal/loanRequests/<id>` and are never mirrored to the public record.
- The lifecycle (SUBMITTED → UNDER_REVIEW → ACCEPTED → CONTACT_REQUIRED → AGREEMENT → FUNDED → ACTIVE → COMPLETED, or UNDER_REVIEW → REJECTED) is validated by the rules, so invalid transitions are rejected even if the client is modified.
- **ACCEPT flow:** confirm dialog, then a random code (`AR-####`) that expires after 2 minutes, with at most 5 wrong attempts. The rules refuse `ACCEPTED` unless an unexpired verified challenge exists for that admin and request.
  The code check itself runs in the admin's browser (there is no server), so it guards against mistakes by trusted admins, not against a malicious admin. For stricter guarantees move verification into a Cloud Function.
- Login and verification throttles are client-side; use Firebase App Check and Firebase's own sign-in protections for hard limits.
- Every status change and note edit writes an entry in `auditLogs`.
- Never add service account keys or Firebase Admin credentials to this project.

## 10. Troubleshooting
- **"Access denied"** — the user has no `admins/<uid>: true` entry.
- **"Not permitted" when changing status** — the request changed in the meantime (refresh), or rules are not published.
- **Empty dashboard** — nothing submitted yet, or `.env` points to a different Firebase project than the Requestor.
- **"Firebase is not configured"** — `.env` missing or incomplete; restart the dev server.
