# ToolStack Firebase setup

ToolStack keeps its formatter public. Authentication is requested only when a user saves JSON or opens the formatter's private Saved JSON page. JSON records live at `users/{uid}/json/{itemId}` in Cloud Firestore. Other tool types can use sibling collections such as `users/{uid}/css/{itemId}`.

## 1. Create the Firebase project

1. Open <https://console.firebase.google.com/> and select **Create a project**.
2. Choose a project name and project ID. The project ID cannot be changed later.
3. Google Analytics is optional for ToolStack.
4. On the project overview, select the **Web** icon and register an app named `ToolStack Web`.
5. Firebase shows a `firebaseConfig` object. Copy its values into the environment file described below. Do not replace the existing TypeScript configuration file with the generated sample.

## 2. Configure the local environment

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Restart `npm run dev` whenever this file changes. `.env.local` is excluded by the existing `*.local` Git ignore rule.

These web configuration values identify the Firebase application; authorization is enforced by Firebase Authentication and Firestore Security Rules. Never put unrelated secret API keys in a `VITE_` variable because Vite exposes those variables to browser code.

## 3. Enable Authentication

In Firebase Console, open **Build > Authentication** and select **Get started**.

### Email and password

1. Open **Sign-in method**.
2. Select **Email/Password**.
3. Enable **Email/Password** and save. Email-link sign-in is not required.

### Google

1. Open **Sign-in method**.
2. Select **Google** and enable it.
3. Choose the project support email and save.

### Authorized domains

Under **Authentication > Settings > Authorized domains**:

- Local development normally uses `localhost`.
- Add the exact production domain before deployment, such as `toolstack.example.com`.
- Do not add URL paths, protocols, or ports.

## 4. Create Firestore

1. Open **Build > Firestore Database**.
2. Select **Create database**.
3. Choose **Production mode**.
4. Select the region closest to most users. This location is difficult or impossible to change later, so choose deliberately.

No collection needs to be created manually. Firestore creates the `users/{uid}/json` path when the first JSON document is saved.

## 5. Deploy the security rules

The repository includes `firestore.rules`, `firestore.indexes.json`, and `firebase.json`.

Using the Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

Select the Firebase project created in step 1 when `use --add` asks. Alternatively, copy the contents of `firestore.rules` into **Firestore Database > Rules** in the Firebase Console and select **Publish**.

The rules ensure that:

- A user can read and write only documents beneath their own UID.
- Anonymous visitors cannot read or save snippets.
- Only JSON snippet documents with expected fields can be written.
- Titles are limited to 100 characters and content is limited to 900,000 characters.

Do not replace these rules with `allow read, write: if true`.

## 6. Run and test

```bash
npm run dev
```

Test this sequence:

1. Open the JSON formatter without signing in and format valid JSON.
2. Select **Save**. The app should open the login page without losing the JSON.
3. Create an account or use Google sign-in.
4. The app should return to the formatter and open the save dialog.
5. Name and save the JSON.
6. Open **Saved** and confirm that the record appears.
7. In Firebase Console, verify the document under `users/{uid}/json/{documentId}`.
8. Sign out and confirm that `/tools/json-formatter/saved-data` redirects to `/login` while the formatter remains public.

## 7. Production checklist

- Add the deployed domain to Authentication authorized domains.
- Keep the production Firestore rules deployed.
- Enable Firebase App Check for the web app after the normal flow is working.
- Configure Firebase budget and usage alerts.
- Use separate Firebase projects for development and production.
- If email verification becomes mandatory, add a verification-email flow before treating an email/password account as trusted.

## Application files

- `src/auth/AuthProvider.tsx`: observes the Firebase user session.
- `src/pages/AuthPage.tsx`: email/password and Google login/signup.
- `src/auth/RequireAuth.tsx`: protects private routes.
- `src/firebase/snippetRepository.ts`: saves, lists, and deletes Firestore snippets.
- `src/modules/developer-tools/json-formatter/pages/JsonFormatterPage.tsx`: public formatter and gated Save action.
- `src/pages/SavedSnippetsPage.tsx`: private cloud-snippet list.
