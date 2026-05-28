<!--
  Pull request template — keep it short. The fields below are the minimum
  context a reviewer needs to understand intent, scope, and how to verify.
  Delete sections that don't apply rather than leaving them blank.
-->

## Summary

<!-- 1–3 bullets describing the change and the user-visible outcome. -->
-
-

## Why

<!-- Link the issue, ADR, or scratchpad entry. Explain trade-offs if the
  approach isn't the obvious one. -->

## Test plan

<!-- Concrete steps a reviewer could run locally. Reference unit tests and
  any manual QA performed (browsers, devices, edge cases). -->
- [ ] `npm run test`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] Manual smoke: <!-- e.g. "open /careers, submit the apply form, verify Sentry event lands" -->

## Security & privacy

<!-- Flag anything that touches PII, authentication, file uploads, secrets,
  or third-party origins. Otherwise: "N/A". -->

## Rollback plan

<!-- Migrations / config changes that need explicit revert steps. Otherwise:
  "Revert the merge commit." -->
