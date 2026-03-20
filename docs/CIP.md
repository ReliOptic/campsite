# Continuous Improvement Projects (CIP)

> Campsite roadmap items derived from gap analysis against the
> Harness Engineering and AgentOps framework (book ref: `/root/harness-engineering-book`).
>
> Each CIP addresses a structural gap between the book's theoretical framework
> and Campsite's current implementation. Items are ordered by horizon,
> not by priority within a horizon.

---

## Status Legend

| Tag | Meaning |
|-----|---------|
| `PROPOSED` | Identified, not yet designed. |
| `DESIGNING` | Active design / spike in progress. |
| `READY` | Design complete, waiting for implementation slot. |
| `IN_PROGRESS` | Implementation underway. |
| `SHIPPED` | Merged and released. |
| `DEFERRED` | Consciously postponed. |

---

## Overview

| CIP | Title | Horizon | Status |
|-----|-------|---------|--------|
| CIP-01 | In-Session Workflow Envelope | H1 | `PROPOSED` |
| CIP-02 | Failure Budget Ledger | H1 | `PROPOSED` |
| CIP-03 | HOR-Aware Token Accounting | H1 | `PROPOSED` |
| CIP-04 | Task Decomposition Protocol | H2 | `PROPOSED` |
| CIP-05 | Multi-Agent Session Orchestration | H2 | `PROPOSED` |
| CIP-06 | Operational Compiler Pipeline | H2 | `PROPOSED` |
| CIP-07 | Entropy Dashboard and Drift Detection | H2 | `PROPOSED` |
| CIP-08 | Agent Self-Monitoring Hooks | H3 | `PROPOSED` |
| CIP-09 | Self-Immune Recovery Loop | H3 | `PROPOSED` |
| CIP-10 | Agent-1 → Agent-2 Transition Gate | H3 | `PROPOSED` |

**Horizons:**
- **H1** — Near-term. Extends current architecture without breaking changes.
- **H2** — Mid-term. Requires new subsystems but stays within CLI-first constraints.
- **H3** — Long-term. Depends on agent capability advances and H1/H2 foundations.

---

## Horizon 1 — Extend the Envelope

### CIP-01: In-Session Workflow Envelope

**Book Reference:** Ch.3 (Operational Envelope), Ch.5 (MTTR, IFR decay)

**Current State:**
Campsite validates at session boundaries only (`sync` and `save`).
Between those two commands the agent runs unmonitored.
There is no signal for IFR decay, context overflow, or mid-session drift.

**Gap:**
The book defines the operational envelope as a continuous runtime construct,
not just entry/exit gates. IFR (Instruction Following Rate) degrades during
long sessions, and intervention timing matters.

**Proposed Implementation:**

1. **Session heartbeat file** — `.campsite/heartbeat`
   - Agent (or a lightweight watcher) writes a timestamp + token-count
     at regular intervals.
   - `campsite peek` reads this to show elapsed tokens and time.
   - `campsite validate --live` warns if heartbeat goes stale (agent hung or crashed).

2. **Mid-session checkpoint command** — `campsite checkpoint`
   - Snapshots `status.md` and `handoff.md` to `.campsite/checkpoints/`.
   - Records git diff since last sync.
   - Does not release lock or clean compiled files.
   - Enables rollback if agent drifts.

3. **Session Protocol injection into compiled context**
   - Add instruction block asking the agent to call a checkpoint
     after completing each major subtask.
   - Phrased as a request, not enforced (agents cannot be forced to comply).

**Acceptance Criteria:**
- `campsite peek` shows token count and elapsed time.
- `campsite checkpoint` creates a recoverable snapshot.
- Agent session protocol includes checkpoint instruction.

**Dependencies:** None (extends existing lock/peek infrastructure).

---

### CIP-02: Failure Budget Ledger

**Book Reference:** Ch.3 (Failure Budget Reallocation, 6-axis taxonomy), Ch.5 (quantitative exchange rates)

**Current State:**
Campsite's design aligns narratively with Failure Budget Reallocation
("silent drift → visible failure"), but there is no tracking mechanism.
Failures are handled ad hoc. There is no ledger.

**Gap:**
The book defines a 6-axis failure taxonomy and proposes quantitative
exchange rates between failure classes. Campsite has no way to record,
classify, or trend failures over time.

**Proposed Implementation:**

1. **Failure event log** — `.campsite/failures.jsonl`
   - Each line: `{ timestamp, project, agent, class, description, resolution }`
   - Classes (from book): `context_loss`, `logical_drift`, `tool_failure`,
     `permission_violation`, `stale_state`, `concurrency_collision`
   - Appended by `campsite save` (user-prompted) or `campsite recover` (automatic).

2. **`campsite failures` command**
   - Show recent failures, grouped by class.
   - Show trend: "3 context_loss events this week vs 1 last week."

3. **`campsite save` post-session prompt**
   - After hash comparison, optionally ask:
     "Did anything go wrong this session? [y/N]"
   - If yes, prompt for failure class and one-line description.

4. **Dashboard integration**
   - `campsite dashboard` shows failure count per project.

**Acceptance Criteria:**
- Failure events are recorded in structured format.
- `campsite failures` produces a readable summary.
- Dashboard shows per-project failure trend.

**Dependencies:** None.

---

### CIP-03: HOR-Aware Token Accounting

**Book Reference:** Ch.3 (HOR definition), Ch.5 (optimal HOR, CostIndex)

**Current State:**
Campsite compiles context files but does not measure their size.
There is no concept of token overhead, and no way to know if the
compiled context is consuming a disproportionate share of the agent's
context window.

**Gap:**
The book defines HOR = harness token overhead / total token budget.
An optimal HOR exists — beyond it, the harness becomes the primary
bottleneck. Campsite has no visibility into this.

**Proposed Implementation:**

1. **Context size report on sync**
   - After compilation, print estimated token count of each context file.
   - Use a simple heuristic: `word_count * 1.3` (rough token estimate).
   - Warn if estimated tokens exceed a configurable threshold
     (default: 4000 tokens, ~3% of a 128k window).

2. **`campsite stats` command**
   - Show per-project: compiled context size, source file sizes,
     HOR estimate (context tokens / typical agent window).
   - Show trend over last N sessions from history.

3. **Section-level size breakdown**
   - Show which section (status, handoff, decisions, readme) contributes
     most to compiled context size.
   - Enable users to trim bloated sections.

4. **Configurable context budget**
   ```bash
   CAMPSITE_TOKEN_BUDGET=4000    # warn if compiled context exceeds this
   CAMPSITE_TOKEN_ESTIMATOR=1.3  # words-to-tokens multiplier
   ```

**Acceptance Criteria:**
- `campsite sync` reports estimated token count per compiled file.
- Warning fires when context exceeds budget.
- `campsite stats` shows size breakdown and HOR estimate.

**Dependencies:** None.

---

## Horizon 2 — New Subsystems

### CIP-04: Task Decomposition Protocol

**Book Reference:** Ch.7 (decomposition retry in self-immune loop), PRD §10.4

**Current State:**
`handoff.md` encodes one next task with optional fallback.
Decomposition is entirely manual — the human or agent decides how to
break work into subtasks. There is no structural support for multi-step
task plans.

**Gap:**
The book describes agent-initiated replanning and decomposition retry
as part of the self-immune loop. Campsite has no concept of a task
breaking into subtasks, tracking subtask completion, or re-planning
when a subtask fails.

**Proposed Implementation:**

1. **Extended handoff.md schema**
   ```markdown
   ## Task Plan

   - [x] Set up Stripe SDK
   - [x] Create payment service skeleton
   - [ ] Implement checkout endpoint
   - [ ] Write integration tests
   - [ ] Connect webhook handler

   ## Current Subtask

   - task: Implement checkout endpoint
   - entry-point: src/services/payment.ts:createCheckout()
   - estimate: 30 minutes
   ```

2. **`campsite plan` command**
   - Parse task plan from handoff.md.
   - Show progress: "3/5 subtasks complete."
   - Warn if current subtask is stale (no change in N hours).

3. **Compiled context includes task plan**
   - Agent sees the full plan and current position.
   - Session protocol instructs: "Check off completed subtasks in handoff.md."

4. **Decomposition instruction in session protocol**
   - If the task is large, the compiled context asks the agent to decompose
     it into subtasks and write the plan to handoff.md before starting work.

**Acceptance Criteria:**
- `handoff.md` supports checkbox-style task plans.
- `campsite plan` shows task progress.
- Compiled context includes task plan with current position.

**Dependencies:** None (extends existing handoff.md contract).

---

### CIP-05: Multi-Agent Session Orchestration

**Book Reference:** Ch.3 (orchestration vs harness), Ch.7 (multi-agent self-immune)

**Current State:**
Campsite supports one agent per session. The lock prevents concurrent
access. Switching agents requires `save` → `sync` → new agent.
There is no concept of parallel agent execution or task routing.

**Gap:**
The book distinguishes orchestration (multi-agent routing) from harness
(single-agent runtime envelope). Campsite's PRD lists "live multi-agent
scheduler" as a non-goal, but the book suggests multi-agent coordination
is necessary for Agent-2.

**Proposed Implementation:**

Phase A — Sequential multi-agent (low risk):

1. **`campsite relay` command**
   - Define a sequence: `campsite relay claude codex gemini`
   - Each agent runs in turn. Between agents, campsite auto-saves and re-syncs.
   - handoff.md carries context forward.

2. **Agent-specific sections in handoff.md**
   ```markdown
   ## For Claude
   - task: Design the API schema

   ## For Codex
   - task: Implement the schema as code

   ## For Gemini
   - task: Review and suggest improvements
   ```

Phase B — Parallel multi-agent (higher risk, future):

3. **Parallel lock model**
   - Multiple read-locks with one write-lock.
   - Agents working on different files can run concurrently.
   - Requires conflict detection on save.

4. **Task routing**
   - Based on task type (design → claude, implementation → codex, review → gemini).
   - Campsite picks the agent based on task metadata.

**Acceptance Criteria:**
- Phase A: `campsite relay` executes agents sequentially with auto-handoff.
- Phase B: Parallel sessions with conflict detection.

**Dependencies:** CIP-04 (task decomposition for routing).

---

### CIP-06: Operational Compiler Pipeline

**Book Reference:** Ch.6 (Operational Compiler, marginal ROI ordering, pareto frontier)

**Current State:**
Campsite compiles source files into agent context — this is a form of
operational compilation. But there is no feedback loop: no measurement
of which compiled sections are effective, no ablation, no marginal ROI
ordering.

**Gap:**
The book defines the Operational Compiler as an incremental system that
adds components based on measured ΔMTTR/ΔHOR. Campsite adds all sections
uniformly without measuring their contribution.

**Proposed Implementation:**

1. **Section effectiveness tracking**
   - After each session, optionally record which compiled sections the agent
     referenced or used (manual tag or agent self-report).
   - Store in `.campsite/section-usage.jsonl`.

2. **Ablation mode**
   - `campsite sync --ablate=decisions` compiles without the decisions section.
   - Compare session effectiveness with and without specific sections.

3. **Marginal ROI report**
   - `campsite compiler-report` analyzes section usage data.
   - Recommends which sections to expand, shrink, or remove.
   - Maps to book's ΔMTTR/ΔHOR framework.

4. **Adaptive compilation (future)**
   - Based on accumulated data, automatically adjust section order and size.
   - Sections with low usage get summarized; high-usage sections get expanded.

**Acceptance Criteria:**
- Section usage can be recorded.
- Ablation mode works for any section.
- Compiler report produces actionable recommendations.

**Dependencies:** CIP-03 (token accounting for ΔHOR measurement).

---

### CIP-07: Entropy Dashboard and Drift Detection

**Book Reference:** Ch.3 (CLI-Anything entropy control), Ch.6 (ontology, semantic firewall)

**Current State:**
Campsite manages entropy through templates, fixed file structure,
and validation. But there is no measurement of entropy over time.
Status files can grow unbounded. decisions.md can become inconsistent.
There is no drift detection between what status.md claims and what
the code actually shows.

**Gap:**
The book frames entropy management as continuous: observe drift,
compile corrections, deploy. Campsite validates structure but not
semantic consistency.

**Proposed Implementation:**

1. **Status-code consistency check**
   - `campsite validate --deep` compares status.md claims against code:
     - "What Works" entries → check if referenced files/tests exist.
     - "phase: deployed" → check if deploy/ directory has artifacts.
     - "branch: feat/x" → check if current git branch matches.
   - Warnings, not hard failures. Drift is flagged, not blocked.

2. **File growth tracking**
   - Track size of status.md, handoff.md, decisions.md over sessions.
   - Warn if files exceed a threshold (e.g., decisions.md > 200 lines).
   - Suggest archiving old decisions.

3. **Entropy score on dashboard**
   - Per-project score based on: freshness, consistency, file size,
     open blockers count.
   - `campsite dashboard` shows a health indicator per project.

4. **`campsite tidy` command**
   - Archive old decisions to `docs/decisions-archive.md`.
   - Trim "What Works" to recent entries.
   - Reset staleness counters.

**Acceptance Criteria:**
- `campsite validate --deep` detects status-code drift.
- Dashboard shows per-project health score.
- `campsite tidy` reduces file entropy.

**Dependencies:** None.

---

## Horizon 3 — Toward Agent-2

### CIP-08: Agent Self-Monitoring Hooks

**Book Reference:** Ch.7 (ARCC self-estimate, cliff-proximity detection)

**Current State:**
Campsite monitors at the file/lock/validation level.
There is no mechanism for the agent to report its own confidence,
token usage, or capability assessment back to campsite.

**Gap:**
The book defines self-monitoring as the agent's ability to estimate
its own ARCC and detect proximity to a capability cliff.
Campsite has no input channel from agent to harness.

**Proposed Implementation:**

1. **Agent report file** — `.campsite/agent-report.md`
   - Session protocol instructs the agent to write a brief self-assessment
     before session end:
     ```markdown
     ## Agent Self-Report
     - confidence: high | medium | low
     - tokens-used: ~12000
     - subtasks-completed: 3/5
     - blockers-hit: 1
     - drift-detected: no
     ```

2. **`campsite save` reads agent report**
   - If confidence is "low", suggest human review before committing.
   - If blockers > 0, flag for next session.

3. **History integration**
   - Store agent self-reports in session history.
   - `campsite stats` shows confidence trends per project.
   - Declining confidence across sessions = potential cliff proximity.

4. **Compiled context includes self-report instruction**
   - Always present in session protocol section.
   - Agents that support structured output can auto-generate.

**Acceptance Criteria:**
- Agent report file schema is defined.
- `campsite save` reads and acts on agent self-report.
- Confidence trend is visible in stats.

**Dependencies:** CIP-01 (session heartbeat for token tracking).

---

### CIP-09: Self-Immune Recovery Loop

**Book Reference:** Ch.7 (self-immune system, self-initiated recovery)

**Current State:**
Recovery is operator-initiated (`campsite recover`).
There is no mechanism for the agent or system to automatically
detect failure and initiate recovery during a session.

**Gap:**
The book's self-immune system includes: detect failure → classify →
attempt recovery (retry, decompose, escalate) → verify.
Campsite has the recovery infrastructure but no automatic trigger.

**Proposed Implementation:**

1. **Watchdog mode** — `campsite watch`
   - Background process that monitors the active session.
   - Checks heartbeat staleness, lock age, and agent-report signals.
   - On anomaly detection:
     - If heartbeat stale > threshold: warn or auto-recover.
     - If agent reports low confidence: suggest checkpoint.
     - If lock age exceeds limit: notify operator.

2. **Recovery strategy file** — `.campsite/recovery-strategy.md`
   - Per-project recovery playbook:
     ```markdown
     ## On Agent Crash
     1. campsite recover
     2. Review git diff
     3. Update handoff.md with crash context
     4. campsite sync && claude

     ## On Persistent Failure (3+ attempts)
     1. Decompose task into smaller subtasks
     2. Try with a different agent
     3. Escalate to human review
     ```

3. **Automatic retry** (opt-in)
   - If agent exits with error and auto-retry is enabled:
     ```bash
     CAMPSITE_AUTO_RETRY=1
     CAMPSITE_MAX_RETRIES=2
     ```
   - Campsite re-syncs and relaunches the agent.
   - After max retries, falls back to escalation.

4. **Escalation protocol**
   - Write `.campsite/escalation.md` with failure context.
   - Notify operator (e.g., write to a known file, send a desktop notification).

**Acceptance Criteria:**
- `campsite watch` detects session anomalies.
- Recovery strategy is configurable per project.
- Auto-retry works for transient agent failures.

**Dependencies:** CIP-01 (heartbeat), CIP-02 (failure ledger), CIP-08 (agent self-report).

---

### CIP-10: Agent-1 → Agent-2 Transition Gate

**Book Reference:** Ch.7 (transition conditions, ARCC floor, temporal stability)

**Current State:**
Campsite assumes Agent-1 behavior: the agent is tool-using but fragile,
requires human-written handoff, and cannot self-recover.

**Gap:**
The book defines Agent-2 as a Continuous Learner with self-immune
capabilities. The transition requires: consistent self-monitoring,
reliable self-recovery, and temporal stability (performance does not
degrade over extended periods).

**Proposed Implementation:**

1. **Capability assessment framework**
   - `campsite assess` runs a standardized mini-evaluation:
     - Can the agent read and correctly summarize status.md?
     - Can the agent update handoff.md with a coherent next task?
     - Can the agent detect an intentionally introduced error in status.md?
   - Score: 0-3 (basic, competent, reliable).

2. **Transition readiness score**
   - Based on accumulated data:
     - Self-report confidence consistency (CIP-08)
     - Failure rate trend (CIP-02)
     - Recovery success rate (CIP-09)
     - Session duration stability
   - `campsite maturity` shows project + agent readiness.

3. **Progressive autonomy levels**
   ```
   Level 0 (current): Human writes handoff, agent executes.
   Level 1: Agent proposes handoff, human approves.
   Level 2: Agent writes handoff, campsite validates.
   Level 3: Agent self-monitors, self-recovers, writes handoff autonomously.
   ```
   - Each level unlocks when the previous level's metrics are stable.

4. **Guardrail relaxation**
   - At higher autonomy levels, some validation can be relaxed:
     - Level 2+: agent can auto-checkpoint without human trigger.
     - Level 3+: agent can initiate recovery without operator.
   - Always: campsite retains kill-switch (`campsite save --force`).

**Acceptance Criteria:**
- `campsite assess` produces a capability score.
- `campsite maturity` shows transition readiness.
- Progressive autonomy levels are documented and enforceable.

**Dependencies:** CIP-02, CIP-08, CIP-09 (full feedback loop).

---

## Dependency Graph

```
                    CIP-01 (Heartbeat)
                   /        \
            CIP-03 (HOR)   CIP-08 (Self-Monitor)
              |               |
            CIP-06 (OC)    CIP-09 (Self-Immune)
                              |
  CIP-02 (Failure) ─────────┤
                              |
  CIP-04 (Decompose) ───── CIP-05 (Multi-Agent)
                              |
  CIP-07 (Entropy) ─────── CIP-10 (Agent-2 Gate)
```

---

## Relationship to Book Concepts

| Book Concept | CIP |
|---|---|
| Operational Envelope (Ch.3) | CIP-01 |
| Failure Budget Reallocation (Ch.3, Ch.5) | CIP-02 |
| HOR / Optimal HOR (Ch.3, Ch.5) | CIP-03 |
| Task Decomposition Retry (Ch.7) | CIP-04 |
| Multi-Agent Orchestration (Ch.3, Ch.7) | CIP-05 |
| Operational Compiler (Ch.6) | CIP-06 |
| Entropy Control / Ontology (Ch.3, Ch.6) | CIP-07 |
| ARCC Self-Monitoring (Ch.7) | CIP-08 |
| Self-Immune System (Ch.7) | CIP-09 |
| Agent-1 → Agent-2 Transition (Ch.7) | CIP-10 |

---

## Design Principles for All CIPs

Carried forward from Campsite's existing architecture and the book:

1. **CLI-first.** Every CIP must work from a plain terminal.
2. **No daemon.** Campsite exits after each command. `campsite watch` is the only
   exception, and it must be opt-in.
3. **Plain text state.** All state files remain human-readable markdown or JSONL.
4. **Incremental.** Each CIP ships independently. No CIP requires all others.
5. **Earn your place.** A component is added only if its marginal ROI
   (ΔMTTR / ΔHOR) is positive.
6. **Measure first.** Before building, define what "better" looks like.
   After shipping, measure whether it happened.
7. **4GB-safe.** No CIP may introduce a resident service, database,
   or memory-heavy dependency.

---

*Document created: 2026-03-20*
*Derived from: Harness Engineering and AgentOps (book), Campsite PRD v2*
