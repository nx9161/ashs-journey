# Worktree Protocol — Ash's Journey (room working repo)

**Owner:** Game Producer (seat 20) · **Since:** Phase 4 Wave 3 (2026-10-15)
**Why:** two Wave-2 seats collided sharing one checkout (branch switches,
a stray QA commit `ed20bcb` on the wrong branch, a stash of balance WIP
created "during branch switch"). One checkout per seat ends that class of
incident.

## Rules

1. **One worktree per active seat.** Never `git checkout` a seat branch in
   another seat's worktree. The main checkout (`~/workspace/ashs-journey`)
   stays on `main` and is the integration point — seats do not commit there.
2. **Naming:** `~/workspace/ashs-journey-<seat>` where `<seat>` is the
   short seat key (`qa`, `gd`, `uix`, `fe`, `arch`, `art`, `audio`,
   `balance`, ...). Branch names stay `feat/`, `fix/`, `docs/`, `chore/` +
   slug (house rules).
3. **Creating:** future-wave pads are attached **detached** at `main`'s tip —
   `git worktree add --detach ~/workspace/ashs-journey-<seat> main` —
   so no branch is double-checked-out. The seat runs
   `git checkout -b feat/<slug>` (or attaches its assigned branch) when
   work begins. A branch may be checked out in exactly one worktree; the
   main checkout keeps `main`.
4. **Merging:** the Game Producer merges seat branches to `main` with
   `--no-ff` and a conventional message, after the LCR merge-gate review
   (or a documented producer pass when LCR is next-wave). Merge conflicts
   are resolved in the main checkout; both sides' intent is preserved and
   recorded in the merge record.
5. **Retiring:** after a branch merges to `main`, its worktree is removed
   (`git worktree remove --force` only when `git status` is clean) so no
   one keeps building on a dead branch. Stale branches are deleted from
   origin after the merge.
6. **Stashes:** never leave a stash behind "for another seat". Either
   commit it to the right branch or drop it in the same session, and say
   which in the handoff.
7. **Build artifacts:** `public/` and `dist/` are tracked build outputs —
   rebuild (`node scripts/build.mjs`) before committing, and never hand-edit
   `public/index.html` (it is generated from `SHELL_CSS` in
   `scripts/build.mjs`).

## Current worktrees

| Path | Branch | Seat |
|---|---|---|
| `~/workspace/ashs-journey` | `main` | integration (producer) |
| `~/workspace/ashs-journey-qa` | (detached @ main) | QA Manager (next wave) |
| `~/workspace/ashs-journey-gd` | (detached @ main) | Gameplay Designer (next wave) |
| `~/workspace/ashs-journey-uix` | (detached @ main) | Game UI/UX Designer (next wave) |
| `~/workspace/ashs-journey-fe` | (detached @ main) | Lead Frontend (next wave) |
| `~/workspace/ashs-journey-arch` | (detached @ main) | Game Architect (next wave) |

Retired Wave-2 (merged to main 2026-10-15): `ashs-journey-art`
(`feat/art-sprites`), `ashs-journey-balance` (`feat/balance-slice`).
