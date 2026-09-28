# Terrace Five

A five-round football quiz for 2–12 players on separate devices. The interface is one HTML file with embedded CSS and application JavaScript. Firebase SDK modules load from Google’s CDN only when online play is requested. Solo practice requires no backend.

## Quick preview

Open `public/index.html` in a modern browser and choose **Try a solo practice game**. Practice is explicitly single-player, uses separate sample questions, and does not simulate remote multiplayer.

For a local HTTP preview:

```bash
python3 -m http.server 8080 --directory public
```

Open http://localhost:8080.

## Publish the multiplayer game

Prerequisites: Node.js 22, a Google account, and a Firebase project with billing enabled for Cloud Functions / Cloud Scheduler. Deployment can create billable resources; review your project’s billing settings and set budget alerts.

1. In https://console.firebase.google.com/, create or select a project.
2. Register a **Web app** in Project Settings.
3. Enable **Authentication → Sign-in method → Anonymous**.
4. Create a **Realtime Database** in the United States region. Start in locked mode; the supplied rules replace it on deployment. This application does not use Firestore.
5. Copy the web app’s `firebaseConfig` object into `FIREBASE_CONFIG` near the beginning of the module script in `public/index.html`, replacing `null`. Include the `databaseURL` displayed by Realtime Database. Web Firebase configuration is public; never place service-account credentials in the HTML. Firebase Hosting can also supply this configuration automatically through `/__/firebase/init.json`, so explicit configuration is optional if that endpoint includes `databaseURL`.
6. Run these commands from the extracted `terrace-five` directory:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
npm --prefix functions install
npm --prefix functions test
firebase deploy --only database,functions,hosting
```

The CLI prints your public Hosting URL, normally `https://YOUR_PROJECT_ID.web.app`. Open it, create a room, and send the invitation link or six-character code to another device. There is no existing hosted URL included with this download.

The Firebase CLI may ask you to enable necessary Google Cloud APIs and configure artifact retention. The functions deploy to `us-central1` and use Node.js 22. Use a dedicated Firebase project if other applications already use its database rules or default functions codebase.

The environment used to create this package blocked npm downloads, so a dependency lockfile could not be generated. `npm install` resolves the declared compatible versions; retain the generated `functions/package-lock.json` in your repository and use `npm ci` for subsequent deployments.

## Rules players see

- Host creates a room. Up to 12 players enter a name and join using the code.
- At least two recently connected players are required to start.
- Five randomly ordered categories: top scorers, club history, stadiums, managers, champions.
- Each category supplies one randomly selected question; options are shuffled.
- 20 seconds per question. One answer per player; the first accepted answer is final.
- A correct answer earns 100 points. No speed bonus or negative points.
- After the deadline, correct answers, individual feedback, and scores appear for eight seconds.
- Equal scores share a rank, including joint winners.
- Only existing players can reconnect after a game starts. Refreshing restores the room in the same browser session.
- A game continues without its host. Another player can claim hosting after the host has not checked in for 45 seconds.
- The host can start a rematch after the final result. Rematches may reuse questions from the starter bank.
- Rooms expire two hours after creation. Closed browser tabs may remain labeled online for up to 45 seconds.

## What is included

```text
public/index.html          Entire player interface and solo practice
functions/index.js         Authenticated callable API and scheduled cleanup
functions/engine.js        Server-authoritative game state machine
functions/bank.js          10 original questions with factual source URLs
functions/test/            13 dependency-free server and API-harness tests
functions/package.json     Backend dependencies and Node runtime
firebase.json              Hosting, functions, database, emulator configuration
database.rules.json        Member-only public reads; no client writes
QA.md                      Verification results and prelaunch acceptance steps
LICENSE                    MIT license for the original application code
```

## Architecture and trust boundaries

The browser signs in anonymously, calls `game`, and subscribes to `rooms/{code}/public`. All mutations go through the authenticated callable function. Database rules prevent direct writes and prevent reads of `rooms/{code}/private`. Reading the room collection is denied.

A transaction over the complete room atomically updates both private answers and the public state. Correct answers and the future deck remain private until their reveal phase. The server validates membership, host authority, game identifier, round, option index, duplicate submissions, and the server-side deadline. A retried identical answer is idempotent.

The client displays the countdown using Firebase’s clock-offset value; the server’s clock decides eligibility. Active browsers sync at phase deadlines and approximately every 15 seconds for presence. A one-minute scheduled sweep advances unattended rooms using their original absolute deadlines and deletes expired rooms. A disconnected player who returns late may miss question/reveal screens, but cannot extend the timer or submit to an expired round. Cold starts or network delays can briefly delay the visible next screen; they do not extend answer deadlines.

The backend limits each anonymous identity to 60 requests per minute and one new room per minute. Those limits are not strong public abuse protection because anonymous identities can be recreated. For a broad public launch, configure Firebase App Check for the web app and enforce it on the callable endpoint after validating legitimate traffic; also measure expected concurrent-room load. The housekeeping sweep currently visits all active rooms once per minute and is intended for a modest initial release, not a high-volume tournament platform.

Display names are rendered as text. Players can see fellow room members’ names, scores, presence, and revealed answers. No email addresses are requested. Anonymous authentication records are separate from the room’s two-hour retention; use your Firebase authentication retention controls if needed.

## Content

The competitive starter bank has two questions per category, ten total. It is intentionally small and will repeat across games. Add more reviewed questions in `functions/bank.js` before frequent customer use. Keep date-sensitive achievements explicitly tied to a year. Each question needs a unique ID, one category, four distinct options, one correct index (0–3), explanation, and a reliable source URL. The server randomly chooses one per category and randomizes the options.

Fact references reviewed September 28, 2026:

- FIFA, Germany’s World Cup goalscorers: https://www.fifa.com/en/tournaments/mens/worldcup/articles/top-germany-goalscorers-history
- UEFA, Real Madrid club history: https://www.uefa.com/uefachampionsleague/news/0254-0d7cc63cf9b9-48509cbeb754-1000--club-facts-real-madrid/
- UEFA, 2024 Champions League winners: https://www.uefa.com/uefachampionsleague/news/028d-1ad799ae4525-365c9c4d1986-1000--meet-the-2024-winners/
- UEFA, Ferguson and the 2008 final: https://www.uefa.com/uefachampionsleague/news/01cf-0e6f71aacef6-834e3e001fd3-1000--fate-favours-triumphant-sir-alex/
- FIFA, World Cup champions: https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1982-2026-italy-argentina-germany-brazil-france-spain

Implementation references:

- Web setup: https://firebase.google.com/docs/web/setup
- Callable functions: https://firebase.google.com/docs/functions/callable
- Functions runtime: https://firebase.google.com/docs/functions/manage-functions
- Realtime Database rules: https://firebase.google.com/docs/database/security/

## Local Firebase integration checks

After installing dependencies and the Firebase CLI:

```bash
firebase emulators:start --only auth,database,functions,hosting
```

Use your web configuration and open http://localhost:5000/?emulator=1. The explicit query parameter connects Authentication, Realtime Database, and Functions to local emulators, and is honored only on localhost or 127.0.0.1. The Database emulator requires a compatible Java runtime; follow the CLI’s current prerequisite instructions.

Use two separate browser profiles (or a normal window and a private window). Two tabs in one profile share an anonymous Firebase identity and represent the same player. Run the acceptance steps in `QA.md`, then repeat on two separate devices against the deployed HTTPS URL.

## Publish the source code

The source is provided under the included MIT license. Create a repository in your own GitHub account and upload this directory. No repository has been created or published on your behalf. Add `functions/node_modules/`, `.firebase/`, debug logs, and all credentials to `.gitignore`; the included `.gitignore` covers these patterns.
