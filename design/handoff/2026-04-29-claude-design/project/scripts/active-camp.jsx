/* global React */

// ============================================================
// Data — scenario from copy spec (Stripe payments-v1)
// ============================================================
const PARTICIPANTS = [
  {
    id: "claude",
    name: "Claude",
    animal: "fox",
    state: "modakbul",
    summaryEn: "Expanding checkout unit tests from 7 to 23",
    summaryKo: "결제 단위 테스트를 7건에서 23건으로 확장 중",
    nextEn: "Wrap up 4 edge cases, then push",
    nextKo: "엣지 케이스 4건 마무리 후 push",
    meta: "Ghostty · 32m active",
    pos: { left: "30%", bottom: "32%" },
    term: [
      { p: "claude:payments-v1 ❯", c: "rerun tests/checkout/*.test.ts", tone: "" },
      { p: "", c: "PASS  tests/checkout/intent.test.ts (12)", tone: "ok" },
      { p: "", c: "PASS  tests/checkout/webhook.test.ts (8)", tone: "ok" },
      { p: "", c: "RUN   tests/checkout/edge-3ds.test.ts ...", tone: "" },
    ]
  },
  {
    id: "codex",
    name: "Codex",
    animal: "owl",
    state: "modakbul",
    summaryEn: "Building webhook retry queue with idempotency keys",
    summaryKo: "webhook 재시도 큐 구현 · idempotency key 통합",
    nextEn: "Awaiting retry-limit and backoff decision",
    nextKo: "재시도 한도와 백오프 정책 회신 대기",
    meta: "tmux:1 · 18m active",
    pos: { left: "62%", bottom: "30%" },
    term: [
      { p: "codex ❯", c: "implement webhook retry queue", tone: "" },
      { p: "", c: "→ src/payments/retry-queue.ts created", tone: "ok" },
      { p: "", c: "→ src/payments/idempotency.ts updated", tone: "ok" },
      { p: "", c: "[?] need policy: max retries + backoff curve", tone: "warn" },
    ]
  },
  {
    id: "gemini",
    name: "Gemini",
    animal: "deer",
    state: "deungbul",
    summaryEn: "PCI-DSS 4.0 audit summary ready. Awaiting your judgment",
    summaryKo: "PCI-DSS 4.0 감사 보고서 작성 완료. 사람의 판단을 기다림",
    nextEn: "Read the report, decide if release is safe",
    nextKo: "보고서 검토 후 출시 가능 여부 결정",
    meta: "Ghostty:2 · last update 9m ago",
    pos: { left: "78%", bottom: "20%" },
    term: [
      { p: "gemini ❯", c: "compile pci-dss-4.0 audit summary", tone: "" },
      { p: "", c: "checked 14 controls, 2 advisory notes", tone: "ok" },
      { p: "", c: "summary ready: docs/audit-pci-2026-04-29.md", tone: "ok" },
      { p: "", c: "[!] needs human review before release", tone: "warn" },
    ]
  },
  {
    id: "termA",
    name: "Terminal-A",
    animal: "cat",
    state: "yeongi",
    summaryEn: "Tried integration tests, STRIPE_SECRET_KEY missing from env",
    summaryKo: "통합 테스트 실행 시도 중 STRIPE_SECRET_KEY 누락",
    nextEn: "Pull the key from 1Password, restore .env",
    nextKo: "1Password에서 키 회수 후 .env 복구",
    meta: "Ghostty:3 · stalled 14m",
    pos: { left: "16%", bottom: "20%" },
    term: [
      { p: "you ❯", c: "npm run test:integration", tone: "" },
      { p: "", c: "Error: STRIPE_SECRET_KEY is undefined", tone: "err" },
      { p: "", c: "  at loadStripeClient (src/payments/stripe.ts:12)", tone: "err" },
      { p: "you ❯", c: "_", tone: "" },
    ]
  }
];

const STATE_META = {
  bulssi:   { en: "bulssi", ko: "불씨", desc: "Just started · weak trust" },
  modakbul: { en: "modakbul", ko: "모닥불", desc: "In active progress" },
  deungbul: { en: "deungbul", ko: "등불", desc: "Ready for review" },
  yeongi:   { en: "yeongi", ko: "연기", desc: "Blocked · needs help" },
  jangjak:  { en: "jangjak", ko: "장작", desc: "Next move prepared" },
};

const ACTIVITY = [
  { t: "14:21", who: "Terminal-A", ev: "→ yeongi · STRIPE_SECRET_KEY missing" },
  { t: "14:18", who: "Claude",     ev: "→ modakbul · asked for retry policy decision" },
  { t: "14:12", who: "Gemini",     ev: "→ deungbul · audit summary prepared" },
  { t: "14:05", who: "Codex",      ev: "→ modakbul · started webhook retry queue" },
  { t: "14:02", who: "—",          ev: "mission started · secure checkout audit" },
];

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  top: Math.random() * 60,
  left: Math.random() * 100,
  big: Math.random() > 0.85,
  tw: Math.random() > 0.6,
  delay: Math.random() * 4,
}));

// ============================================================
// Reusable bits
// ============================================================
function CornerAccents() {
  return (
    <>
      <span className="ca-tl" />
      <span className="ca-bl" />
      <span className="ca-br" />
    </>
  );
}

function StatePip({ state }) {
  return <span className="state-pip" data-state={state} />;
}

function FireMini({ state }) {
  return (
    <div className="fire-mini" data-state={state}>
      <div className="core" />
    </div>
  );
}

function Animal({ kind, size = 48 }) {
  return <div className="animal" data-kind={kind} style={{ width: size, height: size }} />;
}

function Campfire() {
  return (
    <div className="campfire">
      <div className="logs"><div className="log-stripe" /></div>
      <div className="embers" />
      <div className="flame" />
      <div className="spark s1" />
      <div className="spark s2" />
      <div className="spark s3" />
    </div>
  );
}

// Sky / aurora / mountains scene background
function SceneBackground({ aurora, starDensity }) {
  const visibleStars = STARS.slice(0, Math.floor(STARS.length * starDensity));
  return (
    <>
      <div className="sky" />
      <div className="stars">
        {visibleStars.map(s => (
          <span
            key={s.id}
            className={`star ${s.big ? "big" : ""} ${s.tw ? "tw" : ""}`}
            style={{ top: `${s.top}%`, left: `${s.left}%`, animationDelay: `${s.delay}s` }}
          />
        ))}
      </div>
      <div className="moon" />
      <div className="aurora" style={{ "--aurora-opacity": aurora }}>
        <div className="ribbon r1" />
        <div className="ribbon r2" />
        <div className="ribbon r3" />
      </div>
      <div className="mountains">
        <div className="layer far" />
        <div className="layer mid" />
      </div>
      <div className="forest">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className={`pine ${i % 3 === 0 ? "t2" : ""}`}
            style={{ left: `${(i * 7.5) - 5}%`, transform: `scale(${0.7 + (i % 3) * 0.15})` }}
          />
        ))}
      </div>
      <div className="ground" />
      <div className="camp-floor" />
    </>
  );
}

// ============================================================
// Layout pieces
// ============================================================
function StatusBar({ project, mission, koMission }) {
  return (
    <div className="status-bar">
      <span className="project-tag">{project}</span>
      <div className="mission">
        Mission · {mission}
        <span className="ko">미션 · {koMission}</span>
      </div>
      <div className="stat" data-tone="active"><span className="dot" /> 2 working now</div>
      <div className="stat" data-tone="review"><span className="dot" /> 1 to review</div>
      <div className="stat" data-tone="block"><span className="dot" /> 1 blocked</div>
      <div className="stat" data-tone="sync"><span className="dot" /> synced just now</div>
    </div>
  );
}

function TerminalRail({ activeId, onPick }) {
  return (
    <aside className="rail">
      <div>
        <div className="section-h">Local · 로컬</div>
        <div className="term-line"><span className="k">status</span> · <span className="v cyan">building</span></div>
        <div className="term-line"><span className="k">branch</span> · <span className="v">feat/checkout-audit</span></div>
        <div className="term-line"><span className="k">last seen</span> · <span className="v">17m ago</span></div>
        <div className="term-line"><span className="k">device</span> · <span className="v">MacBook Air</span></div>
        <div className="term-line"><span className="k">adapters</span> · <span className="v">claude, codex, gemini</span></div>
        <div className="term-line"><span className="k">freshness</span> · <span className="v">healthy</span></div>
        <div className="term-line"><span className="k">lock</span> · <span className="v">no lock held</span></div>
      </div>
      <div>
        <div className="section-h">Terminal Stations · 4</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PARTICIPANTS.map(p => (
            <div
              key={p.id}
              className="term-station"
              data-active={activeId === p.id}
              onClick={() => onPick(p)}
            >
              <div className="ts-head">
                <StatePip state={p.state} />
                <span className="ts-name">{p.name}</span>
                <span className="ts-meta" style={{ marginLeft: "auto" }}>{p.meta.split(" · ")[0]}</span>
              </div>
              <div className="ts-cmd">
                <span className="prompt">❯ </span>
                {p.term[p.term.length - 1].c.length > 32
                  ? p.term[p.term.length - 1].c.slice(0, 32) + "…"
                  : p.term[p.term.length - 1].c}
              </div>
              <div className="ts-meta">
                {STATE_META[p.state].ko} · {p.summaryKo.length > 24 ? p.summaryKo.slice(0, 24) + "…" : p.summaryKo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function CampScene({ aurora, starDensity, density, onPick, fireOverride }) {
  const visible = density === "sparse" ? PARTICIPANTS.slice(0, 2) :
                  density === "dense"  ? [...PARTICIPANTS, ...PARTICIPANTS.map(p => ({...p, id: p.id+"-2", pos: { left: `${parseInt(p.pos.left)+8}%`, bottom: `${parseInt(p.pos.bottom)-6}%` }}))] :
                  PARTICIPANTS;
  return (
    <main className="scene">
      <SceneBackground aurora={aurora} starDensity={starDensity} />

      <div className="mission-card">
        <div className="label">Mission · 모닥불 active</div>
        <div className="title">Secure checkout audit + v1.2 release</div>
        <div className="ko-title">결제 흐름 보안 검토 + v1.2 출시</div>
        <div className="next">
          <span className="next-label">Next move</span>
          Restore Stripe env → rerun integration tests → reply to Gemini
        </div>
      </div>

      <div className="hearth">
        <Campfire />
      </div>

      {visible.map(p => (
        <div
          key={p.id}
          className="participant"
          data-state={fireOverride || p.state}
          style={p.pos}
          onClick={() => onPick(p)}
        >
          <div className="glow" />
          <Animal kind={p.animal} size={48} />
          <FireMini state={fireOverride || p.state} />
          <div className="tag">
            <span className="pip-inline state-pip" data-state={fireOverride || p.state} />
            {p.name}
          </div>
        </div>
      ))}
    </main>
  );
}

function ReturnPanel({ onPick }) {
  const working = PARTICIPANTS.filter(p => p.state === "modakbul");
  const waiting = PARTICIPANTS.filter(p => p.state === "deungbul" || p.state === "yeongi");
  return (
    <aside className="return-panel">
      <div className="block">
        <div className="block-h">Working now · 활동 중<span className="count">{working.length}</span></div>
        {working.map(p => (
          <div key={p.id} className="item" data-state={p.state} onClick={() => onPick(p)}>
            <StatePip state={p.state} />
            <div className="body">
              <div className="name">{p.name}</div>
              <div className="desc">{p.summaryEn}</div>
              <div className="ko-desc">{p.summaryKo}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="block">
        <div className="block-h">Waiting on you · 당신을 기다림<span className="count">{waiting.length}</span></div>
        {waiting.map(p => (
          <div key={p.id} className="item" data-state={p.state} onClick={() => onPick(p)}>
            <StatePip state={p.state} />
            <div className="body">
              <div className="name">{p.name} · {STATE_META[p.state].ko}</div>
              <div className="desc">{p.summaryEn}</div>
              <div className="ko-desc">{p.summaryKo}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="block">
        <div className="block-h">Next move · 다음 행동</div>
        <div className="next-move-box">
          <div className="arrow">
            <span className="step">Restore Stripe env</span>
            <span className="sep">→</span>
            <span className="step">rerun integration tests</span>
            <span className="sep">→</span>
            <span className="step">reply to Gemini review</span>
          </div>
          <div className="estimate">est · ~25 minutes</div>
        </div>
      </div>
    </aside>
  );
}

function ActivityStrip() {
  return (
    <div className="activity">
      <div className="label-stamp">Recent · 최근</div>
      {ACTIVITY.map((a, i) => (
        <div key={i} className="event">
          <span className="time">{a.t}</span>
          <span className="text"><span className="who">{a.who}</span> {a.ev}</span>
        </div>
      ))}
    </div>
  );
}

function ParticipantDrawer({ p, onClose }) {
  if (!p) return null;
  return (
    <>
      <div className={`drawer-backdrop ${p ? "open" : ""}`} onClick={onClose} />
      <aside className={`drawer ${p ? "open" : ""}`}>
        <button className="close" onClick={onClose}>[esc] close</button>
        <div className="head">
          <Animal kind={p.animal} size={64} />
          <div>
            <div className="who-name">{p.name}</div>
            <div className="who-meta">{p.meta}</div>
          </div>
        </div>
        <div className="state-row">
          <FireMini state={p.state} />
          <div>
            <div className="nm">{STATE_META[p.state].en}</div>
            <div className="ko">{STATE_META[p.state].ko} · {STATE_META[p.state].desc}</div>
          </div>
        </div>
        <div>
          <div className="field-h">Current · 지금 하고 있는 일</div>
          <div className="field-body">
            {p.summaryEn}
            <span className="ko">{p.summaryKo}</span>
          </div>
        </div>
        <div>
          <div className="field-h">Next move · 다음 행동</div>
          <div className="field-body">
            {p.nextEn}
            <span className="ko">{p.nextKo}</span>
          </div>
        </div>
        <div>
          <div className="field-h">Live terminal · 라이브 터미널</div>
          <div className="term-output">
            <div className="pad">
              {p.term.map((l, i) => (
                <div key={i}>
                  {l.p && <span className="prompt">{l.p} </span>}
                  <span className={l.tone}>{l.c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="primary">Attach to terminal · 터미널 연결</button>
          <button>Acknowledge review · 검토 확인</button>
          <button>Mark blocker resolved · 차단 해소</button>
        </div>
      </aside>
    </>
  );
}

// ============================================================
// Full Active Camp screen
// ============================================================
function ActiveCampScreen({ tweaks, drawerP, setDrawerP }) {
  return (
    <div data-screen-label="Active Camp" data-theme={tweaks.theme} data-lofi={tweaks.lofi ? "on" : "off"}
      style={{ width: 1440, height: 900, position: "relative", overflow: "hidden", background: "var(--bg)" }}>
      <StatusBar project="payments-v1" mission="Secure checkout audit + v1.2 release" koMission="결제 흐름 보안 검토 + v1.2 출시" />
      <div className="workspace">
        <TerminalRail activeId={drawerP?.id} onPick={setDrawerP} />
        <CampScene
          aurora={tweaks.auroraIntensity}
          starDensity={tweaks.starDensity}
          density={tweaks.density}
          fireOverride={tweaks.fireOverride === "auto" ? null : tweaks.fireOverride}
          onPick={setDrawerP}
        />
        <ReturnPanel onPick={setDrawerP} />
      </div>
      <ActivityStrip />
      <ParticipantDrawer p={drawerP} onClose={() => setDrawerP(null)} />
    </div>
  );
}

window.ActiveCampScreen = ActiveCampScreen;
window.PARTICIPANTS = PARTICIPANTS;
window.STATE_META = STATE_META;
window.ACTIVITY = ACTIVITY;
window.SceneBackground = SceneBackground;
window.Campfire = Campfire;
window.FireMini = FireMini;
window.Animal = Animal;
window.StatePip = StatePip;
