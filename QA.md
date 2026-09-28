# Verification and launch status

## Completed here

- 13 Node tests passed using `node --test functions/test/*.test.js`.
- JavaScript syntax checks passed for the backend and the extracted frontend module.
- The engine suite covers five-category selection, option shuffling, membership, two-player minimum, host authorization, private answers, duplicate submission handling, deadline boundaries, stale rounds and game identifiers, unattended progression, five-round scoring, rematch reset, rejoin behavior, names, room capacity, expiry, host recovery, and absent empty maps returned by Realtime Database.
- The callable API harness exercises two authenticated identities creating/joining a room, starting a game, submitting answers, revealing scores, and enforcing authorization and rate limits.

The callable harness uses an in-memory database adapter. It does not prove Firebase transaction contention handling, deployed database rules, authentication integration, network reconnection, or cross-device operation.

## Blocked in this environment

- npm returned HTTP 403 for Firebase dependency downloads. No dependency installation or Firebase emulator run was possible.
- No browser executable was present, and the Chromium download also returned HTTP 403. Desktop/mobile browser rendering and interactive browser testing remain unverified.
- No Firebase project or hosting deployment credentials were supplied. No public deployment or live two-device test was performed.

This is a complete implementation package prepared for deployment, not a certified or already deployed customer release. Complete the following checks before inviting customers.

## Acceptance run

1. Deploy to your Firebase project. Verify the site opens over HTTPS on desktop and a phone, with no horizontal overflow and no browser-console errors.
2. On device A, create a room as Alex. On device B, join as Sam. Both should see two players and the same room code. A duplicate name should be rejected.
3. Verify one player alone cannot start. Verify the non-host cannot start, including by calling the API directly.
4. Start from the host. Both devices should show the same category, question, options, round, and approximately synchronized countdown.
5. Submit one correct and one incorrect answer. Scores must remain unchanged until the deadline; each player’s first answer must lock immediately.
6. Attempt a second different answer, an invalid option index, a stale game identifier, and an answer received after the deadline. Each must be rejected without altering the first answer or score.
7. At the deadline, confirm correct-answer feedback, +100/0 points, and matching scoreboards. Eight seconds later, confirm the next category starts automatically.
8. Refresh a player’s page mid-round. The same identity should recover its room and submitted status. Disconnect and reconnect one device; the countdown must not restart.
9. Close the host browser. The remaining player should continue through the match and be able to become host after 45 seconds. A lone connected player cannot start a rematch until another player reconnects.
10. Complete all five rounds, verify joint ranks for tied scores, and start a rematch with fresh scores and a new game identifier.
11. In the Firebase Rules Playground or emulator, verify an unauthenticated reader and authenticated nonmember cannot read a room; a member can read only its public subtree; no client can read private answers or write any game state.
12. Verify a thirteenth player is rejected, a new player cannot join a running game, and an expired room cannot be read or joined.
13. Test keyboard-only operation, visible focus, phone touch targets, readable feedback, and screen-reader labels. Test current Chrome, Safari, and Firefox.
14. Before wider distribution, expand the ten-question bank, verify expected load and billing, and enable appropriate Firebase App Check protections.
