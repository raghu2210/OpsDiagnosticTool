# To-do: known gaps and risks

A tech-critic pass on the LongArc Diagnostic Tool as of 2026-07-21 (24-area FnV Warehouse
Diagnostic, v3.1). Not a backlog with owners/dates - a record of what's genuinely wrong or
unvalidated, ranked by consequence, so nothing gets lost between sessions.

## Highest priority - compound everything else below

- [ ] **No persistence.** Every scoring session lives in React state only and is lost on
      tab close, except whatever gets baked into a PDF export. No history, no
      quarter-over-quarter comparison, no audit trail of who scored what when. The tool's
      core value prop (track maturity over time) doesn't actually work today.
- [ ] **No regression test coverage for the scoring engine.** `tests/scoring.test.ts` is
      still the original 4-arg golden-parity fixture from the Python port. It tests none
      of: 24-area rollups, Node-4 problem scoring, weight-sum invariants, or the xlsx
      round-trip. All of that was verified by hand with throwaway scripts, once, then
      deleted - nothing catches a regression if `computeDiagnostic()` changes.

## Data flow / architecture

- [ ] Content's "source of truth" is a spreadsheet checked into git, mutated by one-off
      seed scripts, with no validation gate - a bad manual xlsx edit (weights not summing
      to 1.0, etc.) ships silently with no error, just wrong scores.
- [ ] `recoKey()` reuses the `subpoint_id` column to secretly hold a `problem_id` for
      Node-4 recommendation rows - undocumented in the sheet itself, a trap for future
      editors (including a future session of me).
- [ ] Two independently-coded pipelines (`.xlsx` upload vs. in-app scoring) must agree on
      shape by convention only - no compiler-enforced link, high drift risk on any future
      schema change.
- [ ] Deploy is a fully manual, two-repo, `cp`-driven process with no CI, from a sandbox
      that can't even `git push` - we hit "why isn't this live" confusion twice in one
      session already.
- [ ] Weight rebalancing (e.g. the ×0.82 rescale when adding new areas) is arithmetic
      convenience, not a cost-of-failure methodology - defensible as *a* number, not
      necessarily *the right* number.
- [ ] No environment/config validation - `GOOGLE_SHEET_ID` presence silently switches data
      source with no startup check if credentials are half-configured.
- [ ] Client-side photo attachments have no aggregate payload size guard before the PDF
      export POST - could hit request limits or produce a slow, huge PDF with no warning.
- [ ] No multi-user/concurrency story - single-operator, single-session only. Two people
      auditing the same site simultaneously have no way to merge or attribute scores.

## Checklist / content

- [ ] Every area has almost exactly 2 sub-points x 2 problems regardless of actual domain
      complexity - the data *shape* (fixed 2x2 template) appears to have driven content
      depth rather than the reverse. Warehouse Safety & Compliance gets the same problem
      count as SKU Expansion & Scalability Readiness.
- [ ] Maturity levels are prose ("a rough informal X exists" vs. "X is actively tracked"),
      not measurable thresholds - no inter-rater reliability mechanism, yet the tool
      presents a composite score (e.g. "3.42/5") with more precision than the underlying
      judgment supports.
- [ ] No "not applicable" concept - a blank score is silently treated as "not yet scored"
      and renormalized around. Structurally-inapplicable areas (e.g. Third-Party Labor
      Governance for an all-in-house floor, Collection Center Handling for a warehouse with
      no CC network) distort the composite score instead of being excluded on purpose.
- [ ] Real overlap/double-counting risk across the 119 problem statements, authored across
      three separate rounds with no holistic redundancy pass (e.g. Cost-of-Quality-Failure
      Visibility vs. KPI Tracking & Dashboarding may be scoring the same underlying gap
      twice under different area labels).
- [ ] No sampling/representativeness guidance for auditors - nothing specifies how many
      receiving events, picks, etc. justify a given score. Scores could reasonably diverge
      week to week from pure sampling noise.
- [ ] 73 sub-points / 119 problem statements is a long form with no save/resume - combined
      with the no-persistence issue above, real completion-rate risk in the field.
- [ ] No weight has been field-validated against real incident/cost data - e.g. Cold Chain
      sits at ~7.4% of the module vs. Warehouse Safety & Compliance at ~3.5%; whether safety
      should really be weighted at less than half of cold chain is a live business call
      nobody's reviewed against real data.
- [ ] The entire 119-problem taxonomy is theoretically authored, empirically unvalidated -
      it has never been run against a real warehouse audit to check whether it produces
      sensible, discriminating, actionable scores.
