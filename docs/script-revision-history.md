# Recoverable script revisions: local repair

Implemented in isolated `codex/script-revision-history`, based on verified remote `main` 8055b4f2c3f19f2d507cde5c2791a90ddcd3a1b3. Canonical checkout was clean at start and left unchanged. The app-managed worktree tool could not operate from the non-Git task host; a normal Git worktree was created at `/Users/jackd/.codex/worktrees/script-revision-history`. The scoped repair is now committed and pushed for review; production remains unchanged. See the current release status below.

## Controlled release preflight

Jack authorized scoped commits/pushes/PRs/merges, normal application releases, narrow production rules and one non-public demonstration. Release order remains ScriptAI backend/assets, rules, then Content Flo caller. No production release has occurred yet.

Verified Vercel Git bindings: `Jackd0127-dev/SCRIPTMANAGER` main → project `prj_Sk7aZXtCLoE8sw4HmtWGx7hJUHVm` (`scriptmanager`) → `scriptai.space`; `Jackd0127-dev/nova-content-os` main → `prj_3XsmMLzaP0BbyfXjhnEWm97zPkS6` (`nova-content-os`) → `content.novasagency.com`, team `team_JmMdBNIUJa3y4BK9iGFI8DJr`. Feature pushes create previews; merging main triggers production. Previous READY deployments: ScriptAI `dpl_8kszqYSoSxTRRXNdkYEbu41dD7kP` at 8055b4f; Flow `dpl_FBf27c7wo8xQmjYHiXaVHTehMWNU` at 49cc139. These are rollback evidence, not permission to reactivate unprotected old writers.

The actual deployed ScriptAI rules source still exactly matches the captured 61872f7a ruleset. Flow production config confirms Firestore project `nova-content-os-production`. Firebase API readback confirms both that project and `social-media-script` have a Native `(default)` database in `eur3`; both applications call the default-database SDK constructor. ScriptAI browser config names `social-media-script`. Its backend FIREBASE_PROJECT_ID is sensitive/masked in Vercel, but the target gate is now resolved by the authenticated runtime proof below; revealing that variable is unnecessary. Preview lacks the ScriptAI backend credentials/automation setting and Flow production authentication configuration; no normally authenticated preview/staging workflow is established. Do not add credentials, allow origins or weaken login for preview testing.

A separate scoped read-only review found two release defects, fixed before commit: same-identity browser reconnect metadata refresh was rejected, and an overlapping explicit save could acknowledge an older in-flight body. New failing regressions were followed by both fixes and re-review. Identity fields remain protected; explicit saves wait until later edits persist. Final ScriptAI suite: 55 passed / 2 opt-in skips; both emulator suites separately passed. Real Flow-to-ScriptAI HTTP/emulator integration passed again. Existing Flow full suite/build/type/lint evidence remains valid for its unchanged source.

### Release checkpoint: 27 September 2026

- ScriptAI PR https://github.com/Jackd0127-dev/SCRIPTMANAGER/pull/13, pushed head `7e925ec53f5a9676c8350d47ca7fb325798b7e50`. Preview `dpl_CVvEJW2ELQr4hqiiyZTzd6ddqQiL` passed.
- Content Flo PR https://github.com/Jackd0127-dev/nova-content-os/pull/36, pushed head `2947dbddb2f275650ba2d7c407c5bbcecc3d8eb8`. Preview `dpl_FuiMsjEXZhSNGPeVAx2rZeuFymA5` passed.
- Neither PR is merged. No production deployment or rules release was performed. No live demonstration IDs exist. Both previews are build evidence, not authenticated end-to-end proof.
- Flow GitHub Quality runs `36346393027` and `36346352625` could not start because GitHub reports failed account payments or a spending-limit restriction. Local verification passed; this infrastructure failure is not a passing check. No billing change or protection bypass was attempted.
- The earlier masked-project-ID hold is resolved by authenticated runtime proof below. The safe old-deployment cutover condition still applies; no script was changed.
- Fresh continuation check: both PRs remain open at the recorded heads; both Vercel checks pass. GitHub reports Flow main `protected:false` and `gh pr checks 36 --required` reports no required checks. The billing-blocked Quality runs remain failed, not waived or passed.
- Vercel deployment inspection still shows the prior ScriptAI production deployment READY. Its API metadata does not expose per-function duration. The current [official maximum-duration announcement](https://vercel.com/changelog/vercel-functions-can-now-run-up-to-30-minutes) establishes a conservative 1,800-second upper bound for Node functions, including the extended beta. A 30-minute drain after the last request accepted by the old deployment can therefore cover in-flight calls; this does not establish that old deployment URLs can accept no new writes. Confirm routing/old-deployment access before starting that clock. No cutover clock has begun.
- Resume the already-authorized release at these gates; do not repeat the creative setup or generate another demonstration before deployment. Current checkpoint documentation may be newer than the pushed code heads.

### Authenticated backend target proof and credential expiry

The existing ScriptAI normal Firebase session successfully loaded Settings → Integrations on production `scriptai.space`; the token list rendered rather than an authorization error. No token was generated, copied or revoked. This deployed endpoint (`GET /api/automation/v1/tokens`, source at production SHA `8055b4f`) first calls `scriptAiAdminAuth().verifyIdToken(idToken, true)`. Firebase Admin rejects a token whose audience differs from its configured project ID. The browser configuration issues the session from `social-media-script`; both Admin Auth and Firestore use the same `adminApp()` instance and Firestore uses `(default)`. This is runtime evidence of the backend target, independent of the unreadable Vercel variable. No secret or session token was extracted.

The only displayed token, “Content Tracker creator planning”, expired 31 August 2026 at 23:59:59 UTC. The supported Flow context read still reports connected with lastHealthCheckAt `2026-08-02T12:39:50.457Z`; that is stale health evidence, not a successful present-day integration request. Jack approved replacing the expired credential with the same owner/scopes ("whatever is best"). Both apps are authenticated and the existing Flow Advanced → Creator automation → ScriptAI connection control is accessible. The browser-tool credential-change policy requires a user handoff for generating/entering/submitting the replacement; approval is retained and must not be requested again. Jack completed the replacement. Supported Flow context readback confirms connected health at `2026-09-27T21:19:17.634Z` with unchanged scripts:read, scripts:write and content-links:write scopes. No credential was exposed to this thread. Do not expand scopes or use a direct database write to repair it. No production release has occurred.

### Production cutover and first live finding

ScriptAI PR 13 merged as `8da816848cf33e6b3aa4c38c0de8e493e6d7cb57`; production `dpl_4bLWVtktcpKUTxZjC3xqkUSrQncA` is READY and serves matching browser assets on scriptai.space. Vercel project readback exposed defaultResourceConfig.functionDefaultTimeout=300; no override exists in the old source. The observed-ready hold ran from 21:22:30 UTC through 21:27:51 UTC. Old deployment URLs redirect to Vercel protection; normal callers use the custom domain.

Rules were rechecked unchanged immediately before the narrow release. Released ruleset `projects/social-media-script/rulesets/62723383-d9db-41b4-83d1-d1ca781ffe17`, cloud.firestore release updated `2026-09-27T21:28:04.477762Z`, read back byte-for-byte equal to the candidate. Content Flo PR 36 then merged as `f60d79ffd07da62e01f2260ed886af36234385a8`; production `dpl_Cp2MsCxhGFXDhr7N6hEBx8DUeY7X` is READY on content.novasagency.com. No bulk migration or other Firebase resource deployment occurred.

One harmless NON-PUBLIC SYSTEM TEST was created through the actual Flow service/MCP route; both reciprocal links passed, and the real View script browser action opened its exact ScriptAI ID. Initial v1 was retained. History then returned 401 despite normal Firebase sign-in, so further script writes stopped. Read-only diagnosis confirmed the generation authorizer's accounts:lookup uses a browser-referrer-restricted key, with no production FIREBASE_WEB_API_KEY override. Its error is "Your ScriptAI session is not valid." Normal Admin-backed token listing succeeds. No key restrictions were changed.

The narrow forward fix supplies Admin verifyIdToken(token,true) plus getUser to the existing request/account guards for history/save/restore only. Generation's default path, staff flow, origins, ownership and concurrency remain unchanged. Two focused regressions ran red, then the full suite passed 57 tests / 2 opt-in skips; syntax checks and a separate read-only security review passed. Immutable transaction/rules code is unchanged. Keep restrictive rules and all retained history in place during this forward fix; do not restore an unprotected backend. Live recovery is not yet accepted.

## Behaviour

Current scripts stay in the existing owner workspace. Immutable full structured snapshots live under `users/{owner}/scriptRevisions/{hash(scriptId)}-{version}`. The current-script write and snapshots share one existing Firestore transaction. Revisions include blocks, script metadata and link evidence, not only flattened speech. Legacy records acquire a truthful current baseline on their first changed save; an existing counter is retained. No earlier overwritten content is invented.

Manual save and autosave use `/api/script-history`, with the existing Firebase/staff request authorizer. The browser serializes in-flight saves, keeps edits made during a request, preserves dirty drafts and open edit forms against remote snapshots and reuses an operation ID after a lost response. Server-owned `scriptWriteVersion` rejects stale workspace submissions. Owner-scoped immutable retry receipts avoid duplicate writes; a retry after an intervening write conflicts instead of returning stale success.

The legacy staff workspace endpoint retains its existing session/origin checks and update-time precondition inside the shared transaction. Codex/integration updates retain token scopes and managed/manual conflict safeguards, now requiring the fetched expected record version for changed updates. Creation and identical-content retries remain supported. Current-version snapshots are immutable; failed writes leave the previous current body and history unchanged.

History is available from the existing script view's History button. Select a revision to inspect its structured body, then Restore as new revision. Restore requires the expected current script version. It restores name, blocks, notes, speech/hook/payoff/CTA and duration fields. It keeps the current script ID, project, Content Flo relationship, automation identity, status, dates and platforms. Existing per-block done/completed/filmed state is retained by block ID; newly reintroduced blocks are incomplete. History is never rewound. Even an earlier version with identical content produces a new revision. Unrelated scripts/workspace fields remain unchanged.

## Integration/security close-out, 27 September 2026

At the original local close-out, implementation was complete in two uncommitted task worktrees. The current committed/preview status is recorded above; nothing has been released or migrated in production. No protected content, creative proposal, job setting, account permission or IAM was changed.

- ScriptAI: `/Users/jackd/.codex/worktrees/script-revision-history`, `codex/script-revision-history`, base `8055b4f2c3f19f2d507cde5c2791a90ddcd3a1b3`. The previous repair was preserved.
- Content Flo: `/Users/jackd/.codex/worktrees/flow-script-revisions`, `codex/flow-script-revisions`, base `49cc139dc814b9e2cc98c6594e60b7ed3362070c`, freshly verified remote main. Canonical and other worktrees were left untouched. The host app worktree tool again returned “Not a git repository”; ordinary Git worktree creation was used.

### Actual Content Flo caller

`connectAndVerifyScript` now forwards `item.expectedScriptRecordVersion` to the existing supported HTTP client's `expectedRecordVersion`. Both strict v1/v2 JSON/MCP schemas and the runtime schema expose it. The value is captured with the script body being edited, persisted beside the proposed structured body, included in request identity, and reused by reconciliation. It is deliberately NOT filled from a freshly fetched connection/version during saving. Explicit reviewed replacement still supplies its independently reviewed precondition.

Creation and unchanged idempotent retries work without a revision. A changed old-client request without the original base fails closed. A stale/manual conflict returns a per-item blocker, retains the proposed body in the private Content Flo planning record, and leaves ScriptAI's newer body and the existing connection unchanged. A new run after review must use the revision of the body actually reviewed. Fetching a number and attaching it to an older proposal is not recovery.

The ordinary Content Flo overview/script-text fields are Content Flo planning fields, not a second ScriptAI master. The real `ContentScriptActions` View script link and `/scripts/[scriptId]` redirect open the linked ScriptAI editor. The server planning integration is the actual browserless script-update caller. Neither path was replaced with a synthetic reciprocal-link fixture.

### Write-path coverage

| Route | Protection / evidence |
| --- | --- |
| ScriptAI current manual save and autosave | Shared history endpoint, held workspace revision, immutable transaction, serialized requests; dirty/open editor survives remote snapshots and rejected save |
| Staff workspace POST | Existing staff authorization and update-time check plus shared revision transaction; now also rejects changing an existing script's integration identity and refuses a newer readback revision after an intervening write |
| Automation upsert, including Content Flo | Existing token owner/scopes plus managed/manual protections and expected script version; shared transaction |
| Older/direct Firestore clients | Local rules reject script/counter mutations and workspace deletion, including queued offline writes; they cannot create/edit/delete history or receipts |
| Owner history reads | Allowed for the exact Firebase UID; server history/restore still uses existing account/staff authorizer |
| Valid non-script client changes | Explicit existing field allowlist; cannot add arbitrary privilege fields; current scripts/counters stay unchanged |
| Empty signup | Existing empty-script/project initialization remains allowed; cannot seed forged script data/history |
| Whole-workspace import UI | Existing separate feature; persistence is protected. Not used for recovery |
| Anonymous local demo | LocalStorage only, not account revision persistence |

The repository's privileged writer inventory found no other script-content writes: root script writes converge on `commitWorkspace`. Token/audit writers and central provisioning use separate collections. Admin/server code intentionally bypasses client rules, so its authorization, scope, concurrency and atomicity were tested separately. No unprotected compatibility writer remains in the inspected supported source. External Admin credentials/old deployed server instances are outside client Rules enforcement; they must not continue serving writes after cutover.

Read-only production inspection found ruleset `projects/social-media-script/rulesets/61872f7a-e3b8-44c7-913f-f7ba65a441f7`: its only match allowed an owner to read/write the entire `users/{uid}` document. This is an actual current bypass, not a hypothetical gap. The snapshot is retained in `evidence/deployed-rules-readonly.json` and `evidence/deployed-firestore.rules`. No rule was deployed. The new local rules replace that owner write grant with protected field restrictions and immutable owner-readable history. There were no other production matches to reconcile in that inspected ruleset; recheck for drift immediately before release.

### Evidence and limits

- Focused regressions ran red before caller/schema and staff-relationship fixes. Client rules also failed against the actual read-only deployed rule snapshot (`rules-deployed-red.txt`), then passed against the candidate (`rules-integrated.txt`).
- ScriptAI Node 22 syntax/full existing suite: **53 passed, 0 failed, 2 skipped**. The two skipped cases are opt-in emulator suites, both separately run and passed.
- Actual Firestore emulator 1.20.4 / Java 21: transactional regression **1 passed**. Includes legacy lazy baseline, v1/v2/v3, stale save/restore, exact retries, immutable snapshot collision causing commit failure without losing current state, unrelated root data and script preservation.
- Actual Firebase client SDK + rules-unit-testing authenticated owner/other/anonymous contexts: **1 passed**. Includes read isolation, forged creation, history modification/deletion, counter rewind, workspace delete, valid non-script updates and a real offline queued old overwrite rejected on reconnect. Admin/disabled-rules context was used only to seed disposable data, never as proof of client enforcement.
- Content Flo focused tests: **39 passed** across six files; existing opt-in cross-app memory test: **1 passed**. Full existing suite: **633 passed, 0 failed, 4 skipped** (the new emulator integration, existing cross-app test and two checkout-dependent conformance cases). All four opt-in cases subsequently passed with their required environment: cross-app and emulator each 1 passed, conformance 7 passed / 0 skipped. TypeScript, changed-source ESLint/Prettier and the Next.js webpack production build passed on Node 22. A successful local build is not deployment or authenticated browser proof.
- New real integration test: **1 passed**. Actual Content Flo `upsertCreatorPlanningPackage` + `createScriptAiAutomationClient` over loopback HTTP to actual ScriptAI API handlers, real scoped integration-token authorization, actual Firestore emulator transactions. Content Flo uses its supported disposable `MemoryRepository`; ScriptAI uses the emulator, not the synthetic reciprocal fixture. Content and reciprocal pointers are created by the actual services. It verifies the actual script redirect, Flow v1→v2 with changed structured direction block, fresh instance/read reopen, restore v1 as v3 retaining v2, same IDs/links, stale Flow/ScriptAI saves, stale restore, manual history-endpoint v4/retry, unrelated scripts and non-script Content Flo updates. Invalid/missing history identity and insufficient backend token scope are rejected.
- That test's history/save endpoint uses the existing injected identity seam for the disposable owner. It does NOT claim Firebase sign-in. ScriptAI's production request authorizer hardcodes Google's live `accounts:lookup` endpoint and the browser uses the live Firebase configuration. There is no supported local Auth-emulator routing in that flow. A fully authenticated two-app browser journey cannot run locally without a separately scoped auth/test-environment change or using live credentials/data. Neither was done. The real redirect handler is verified; opening it in a locally authenticated two-app browser remains unverified.
- Prior browser evidence remains valid for unchanged UI: actual ScriptAI UI/save functions with explicitly fake local identity and emulator records, v1→v2, closed/reopened v2, restored v1 as v3 and inspected retained v2; desktop/390px. This is separate from the newly verified real Flow service/API integration and is not promoted to authenticated two-app acceptance.
- No live write/recovery verification. Previous sign-in established app access only. No live draft or protected production script was modified.

One intermediate cross-app rerun was invalidated when an emulator rules test cleared its shared disposable project. The rules suite now requires the separate `demo-script-rules` project; the final integration rerun passed on `demo-script-revisions`. Earlier test-only assertion/command-shape errors were fixed and final results above replace those failed runs. No production data was involved.

### Reproduce

Use Node 22 (`/opt/homebrew/opt/node@22/bin/node` in this environment), Java 21 and the existing Firestore emulator. Emulator launch used:

```sh
/opt/homebrew/opt/openjdk@21/bin/java -jar /Users/jackd/.cache/firebase/emulators/cloud-firestore-emulator-v1.20.4.jar --host 127.0.0.1 --port 8787 --project_id demo-script-revisions
```

From ScriptAI:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
RUN_REVISION_EMULATOR=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 FIREBASE_PROJECT_ID=demo-script-revisions node --test tests/revision-emulator.test.mjs
RUN_REVISION_RULES=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 FIREBASE_PROJECT_ID=demo-script-rules node --test tests/revision-rules.test.mjs
# Expected failure against the read-only production snapshot, never a deployment:
RUN_REVISION_RULES=1 REVISION_RULES_FILE=evidence/deployed-firestore.rules FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 FIREBASE_PROJECT_ID=demo-script-rules node --test tests/revision-rules.test.mjs
```

From Content Flo:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec vitest run tests/creator-planning.integration.test.ts tests/creator-planning-scriptai-connection.test.ts tests/content-script-actions.component.test.tsx tests/script-redirect.test.ts tests/script-connections.integration.test.ts tests/creator-planning-mcp.test.ts
SCRIPTAI_CHECKOUT_DIR=/Users/jackd/.codex/worktrees/script-revision-history pnpm exec vitest run tests/creator-planning-cross-app.e2e.test.ts
RUN_REVISION_EMULATOR=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 FIREBASE_PROJECT_ID=demo-script-revisions SCRIPTAI_CHECKOUT_DIR=/Users/jackd/.codex/worktrees/script-revision-history pnpm exec vitest run tests/script-revisions-emulator.test.ts
pnpm typecheck
pnpm test
pnpm build
```

Actual test execution used the explicit Node 22 executable and local Vitest/TypeScript/ESLint entrypoints. Initial dependency installation used installed pnpm 11.19.0 (runtime reported Node 24); no lockfile changed in Flow. Test/build evidence uses explicit Node 22. Durable logs are in each worktree's `evidence/` directory. Rules tests clear only the dedicated `demo-script-rules` emulator project. Other emulator tests delete only their own random disposable owner and token.

## Coordinated release and rollback (not executed)

No bulk migration/backfill is needed. Preserve lazy baselines: first changed save retains the actual current body/counter, never invented earlier text. New revision/receipt subcollections are additive; no custom composite index is needed.

Jack has explicitly authorized commits/pushes/PRs/merges for these two branches, normal main-triggered Vercel deployments, the narrowly scoped Firestore Rules release and one disposable non-public live linkage/recovery test. That authorization does not remove the target-verification and safe-cutover gates. Verify exact Vercel project/domain/main bindings and current production ruleset before acting; do not use manual `vercel --prod` or promotion.

Exact dependency order:

1. Preserve/copy any unsaved open-tab drafts before the maintenance cutover. Hold script editing/integration submissions during the staged release; do not change automation job settings. Resolve/drain any already-running privileged old backend requests using the actual hosting invocation limit, which is not pinned in this repository. No history guarantee is claimed during the pre-cutover state.
2. Release **ScriptAI backend and its bundled browser assets** through the verified normal Git/main deployment. All privileged supported writers must be this revision-protected implementation. Verify its exact deployed SHA and wait for old invocations to drain. Do not resume script writes while direct-client permissions remain permissive.
3. Re-fetch production rules and compare with the captured ruleset. If unchanged, release the reviewed local `firestore.rules` using the new narrowly scoped `firebase.json`: `firebase deploy --only firestore:rules --project social-media-script --config firebase.json`. This command is documented only, not run. Read back the released ruleset. Any newer/overlapping allow requires reconciliation and emulator regression before release; never overwrite unreviewed rule changes. Direct old tabs/offline queues now fail permission-denied instead of bypassing history.
4. Release **Content Flo caller/schema changes** through its verified normal Git/main deployment; restart/reload the existing MCP process so both package schemas expose `expectedScriptRecordVersion`. No role or feature-flag change is required. The separately expired integration credential was renewed by Jack before release, with unchanged scopes. During the gap, changed older integration submissions without the base version fail safely; creation and identical retries remain supported.
5. Reload saved-draft browser sessions into the new ScriptAI build, then perform the separately authorized disposable non-public live test: correct reciprocal link, both save paths, close/reopen, v1→v2→restore v1 as v3, stale save/restore, old-client denial and scoped access. Only after backend, rules and callers are verified together should writes resume and live recovery be accepted.

Old/offline client recovery: do not keep pressing Save or attach a newly fetched revision to stale text. Keep the old tab open long enough to copy its unsaved changes to a temporary private draft. Reload the current client, open the exact linked script and compare current content/history. Apply only the deliberately reviewed edit on that fetched base. ScriptAI's current network save is not a durable offline queue; failed saves keep in-memory text and show failure. Content Flo's ordinary autosave likewise requires Saved before closing. The client SDK's old offline queue may show an optimistic local write before permission-denied; that is not server persistence. Temporary recovery text is not another editable script master.

Rollback: preserve current bodies, counters, revisions and receipts. Keep the restrictive rules and protected backend even if callers/UI must be rolled back; unsupported old saves remain rejected. Prefer a forward fix. If the protected backend cannot run, leave script writes unavailable rather than restoring an unprotected writer. Never roll back the rules to owner-wide writes, delete history/receipts, reset counters, rewind bodies or restore a whole workspace. No migration rollback is required.

## Changed files

ScriptAI original repair retained: `server/script-revisions.js`, `server/revision-store.js`, `server/script-history-handler.js`, `api/script-history.js`, `server/automation-store.js`, `server/script-automation.js`, `server/staff-handler.js` (persistence branch only), `assets/js/director-auth.js` (persistence/hydration only), `assets/js/director.js`, `assets/css/nova-theme.css`, `scripts/check-project.mjs`, `scripts/preview-script-history.mjs`, revision test/helper files, existing script-automation/staff tests, README and this document.

This close-out adds `firestore.rules`, `firebase.json`, `tests/revision-rules.test.mjs`, exact test-only Firebase client/rules-unit-testing dependencies in `package.json`/lock, a shared relationship guard in `server/script-revisions.js` reused by both history/staff persistence, and focused staff/client tests. Auth/session/provider logic is unchanged. Evidence files contain disposable test results and the read-only rules snapshot.

Content Flo: `src/lib/creator-planning/contract.ts`, `src/lib/creator-planning/service.ts`, `src/lib/domain/schemas.ts`, both `schemas/creator-planning-package.v1.json` and `.v2.json`, `tests/creator-planning.integration.test.ts`, `tests/creator-planning-mcp.test.ts`, `tests/script-revisions-emulator.test.ts`, `docs/CREATOR_PLANNING_AUTOMATION.md`, local evidence. No Content Flo auth, UI styling, provider or job-setting files changed.

## Dashboard count repair, 1 October 2026

The revision transaction's caller-dependent reporting flag left automation writes carrying older `reportSummary` and `reportUpdatedAt` values. A fresh count-only projection found one stale summary and three legacy workspaces without summaries; the deployed Dashboard correctly displayed unknown counts rather than using them.

The shared transaction now derives count-only reporting metadata for every changed workspace, including automation saves, alongside the saved body and immutable history. Identical retries still do not write. No private content is imported into Dashboard, no legacy backfill is performed, and existing authorization, rules and conflict checks are unchanged.

In isolated `codex/automation-report-counts` from main `fea64da8c00271b19d4120dabb3206b6c17362ec`, Node 22 project checks pass: 59 tests pass and two opt-in suites are skipped. The separately enabled Firestore emulator test passes with actual server timestamps inside Dashboard's one-second freshness tolerance, reopen/restore checks and commit-failure rollback. Two new transaction regressions cover automation count refresh and failure consistency. Release approval and production verification remain outstanding.
