/* global React, PARTICIPANTS, STATE_META, SceneBackground, Campfire, FireMini, Animal, StatePip */

// ============================================================
// Empty Camp (F-1)
// ============================================================
function EmptyCampScreen({ tweaks }) {
  return (
    <div data-screen-label="Empty Camp" data-theme={tweaks.theme} data-lofi={tweaks.lofi ? "on" : "off"}
      style={{ width: 1440, height: 900, position: "relative", overflow: "hidden", background: "var(--bg)" }}>
      {/* Status bar */}
      <div className="status-bar">
        <span className="project-tag">campsite · empty</span>
        <div className="mission" style={{ color: "var(--on-surface-faint)" }}>
          No mission yet
          <span className="ko">아직 미션이 없어요</span>
        </div>
        <div className="stat" data-tone="sync"><span className="dot" /> ready</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 360px", height: "calc(100% - 50px - 56px)" }}>
        {/* Left rail (empty state) */}
        <aside className="rail">
          <div>
            <div className="section-h">Local · 로컬</div>
            <div className="term-line"><span className="k">status</span> · <span className="v cyan">idle</span></div>
            <div className="term-line"><span className="k">branch</span> · <span className="v">main</span></div>
            <div className="term-line"><span className="k">device</span> · <span className="v">MacBook Air</span></div>
            <div className="term-line"><span className="k">adapters</span> · <span className="v">claude, codex, gemini</span></div>
          </div>
          <div>
            <div className="section-h">Terminal Stations · 0</div>
            <div style={{
              padding: 16,
              background: "var(--surface-high)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--on-surface-faint)",
              lineHeight: 1.6,
              position: "relative"
            }}>
              <span style={{position:"absolute",top:0,left:0,width:4,height:4,background:"var(--tertiary)"}} />
              <span style={{position:"absolute",bottom:0,right:0,width:4,height:4,background:"var(--tertiary)"}} />
              No participants yet.<br/>
              Run <span style={{color:"var(--tertiary)"}}>campsite camp join</span><br/>
              from any terminal to enter.
            </div>
          </div>
          <div>
            <div className="section-h">Fire-state legend · 화로 범례</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {Object.entries(STATE_META).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatePip state={k} />
                  <div>
                    <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--on-surface)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{v.en}</div>
                    <div style={{fontFamily:"var(--font-kr)",fontSize:10,color:"var(--on-surface-faint)"}}>{v.ko} · {v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Empty scene */}
        <main className="scene">
          <SceneBackground aurora={tweaks.auroraIntensity} starDensity={tweaks.starDensity} />
          {/* Empty fire pit (jangjak — ready to start) */}
          <div className="hearth" style={{ opacity: 0.8 }}>
            <div className="campfire" style={{ filter: "none" }}>
              <div className="logs" style={{ background: "linear-gradient(180deg, transparent 0 4px, #5a3a22 4px 8px, #3e2614 8px 12px, #2a1a0d 12px 16px)" }}>
                <div className="log-stripe" />
              </div>
            </div>
          </div>
          {/* Mission prompt card */}
          <div className="mission-card" style={{ top: "32%" }}>
            <div className="label">Set a mission · 미션 설정</div>
            <div className="title">Light your first campfire</div>
            <div className="ko-title">첫 모닥불을 피워 보세요</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--surface-low)", padding: "8px 10px", color: "var(--on-surface)" }}>
                <span style={{ color: "var(--tertiary)" }}>❯ </span>campsite mission new "..."
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--surface-low)", padding: "8px 10px", color: "var(--on-surface-dim)" }}>
                <span style={{ color: "var(--tertiary)" }}>❯ </span>campsite camp join --as=claude
              </div>
            </div>
            <div className="next">
              <span className="next-label">Tip</span>
              A camp without a fire is still a camp. No pressure.
            </div>
          </div>
        </main>

        {/* Right return panel — empty state copy */}
        <aside className="return-panel">
          <div className="block">
            <div className="block-h">Working now · 활동 중<span className="count">0</span></div>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: 12, color: "var(--on-surface-faint)",
              padding: "12px 14px", background: "var(--surface-high)", lineHeight: 1.5
            }}>
              Nobody is working right now.
              <div style={{fontFamily:"var(--font-kr)",marginTop:4,color:"var(--on-surface-faint)"}}>지금은 아무도 작업하지 않고 있어요.</div>
            </div>
          </div>
          <div className="block">
            <div className="block-h">Waiting on you · 당신을 기다림<span className="count">0</span></div>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: 12, color: "var(--on-surface-faint)",
              padding: "12px 14px", background: "var(--surface-high)", lineHeight: 1.5
            }}>
              Nothing to review. Take a breath.
              <div style={{fontFamily:"var(--font-kr)",marginTop:4,color:"var(--on-surface-faint)"}}>검토할 것이 없어요. 잠시 쉬어도 좋아요.</div>
            </div>
          </div>
          <div className="block">
            <div className="block-h">Next move · 다음 행동</div>
            <div className="next-move-box">
              <div className="arrow">
                <span className="step">Set a mission</span>
                <span className="sep">→</span>
                <span className="step">join a terminal</span>
                <span className="sep">→</span>
                <span className="step">light the fire</span>
              </div>
              <div className="estimate">est · &lt; 1 minute</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="activity">
        <div className="label-stamp">Recent · 최근</div>
        <div className="event">
          <span className="time">--:--</span>
          <span className="text" style={{ color: "var(--on-surface-faint)" }}>No activity yet · 아직 활동이 없어요</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Multi-Project Hub (F-3)
// ============================================================
const PROJECTS = [
  { id: "payments-v1", name: "payments-v1", mission: "Secure checkout audit + v1.2 release", ko: "결제 흐름 보안 검토", state: "modakbul", participants: 4, blocked: 1, review: 1, since: "32m" },
  { id: "design-tokens-v3", name: "design-tokens-v3", mission: "Design tokens v3 cleanup + Storybook sync", ko: "디자인 토큰 v3 정리", state: "deungbul", participants: 2, blocked: 0, review: 1, since: "1h 12m" },
  { id: "user-schema-0042", name: "user-schema-0042", mission: "Apply user schema migration 0042", ko: "사용자 스키마 0042 마이그레이션", state: "yeongi", participants: 3, blocked: 1, review: 0, since: "4h" },
  { id: "login-page", name: "login-page (side)", mission: "Build the login page", ko: "로그인 페이지 만들기", state: "bulssi", participants: 1, blocked: 0, review: 0, since: "12m" },
  { id: "release-notes-q2", name: "release-notes-q2", mission: "Draft Q2 release notes ready for review", ko: "Q2 릴리스 노트 초안", state: "jangjak", participants: 1, blocked: 0, review: 0, since: "yesterday" },
  { id: "incident-2026-04-27", name: "incident-2026-04-27", mission: "Postmortem for billing webhook outage", ko: "결제 webhook 장애 포스트모템", state: "modakbul", participants: 2, blocked: 0, review: 0, since: "2h" },
];

const ANIMAL_BY_STATE = { modakbul: "fox", deungbul: "deer", yeongi: "cat", bulssi: "rabbit", jangjak: "owl" };

function MultiProjectScreen({ tweaks }) {
  return (
    <div data-screen-label="Multi-Project Hub" data-theme={tweaks.theme} data-lofi={tweaks.lofi ? "on" : "off"}
      style={{ width: 1440, height: 900, position: "relative", overflow: "hidden", background: "var(--bg)" }}>
      <div className="status-bar">
        <span className="project-tag">campsite · 6 camps</span>
        <div className="mission">
          All camps · valley view
          <span className="ko">전체 캠프 · 계곡 뷰</span>
        </div>
        <div className="stat" data-tone="active"><span className="dot" /> 4 working</div>
        <div className="stat" data-tone="review"><span className="dot" /> 2 to review</div>
        <div className="stat" data-tone="block"><span className="dot" /> 2 blocked</div>
        <div className="stat" data-tone="sync"><span className="dot" /> synced 2m ago</div>
      </div>

      <main className="scene" style={{ height: "calc(100% - 50px - 56px)" }}>
        <SceneBackground aurora={tweaks.auroraIntensity} starDensity={tweaks.starDensity} />

        {/* Valley grid of mini-camps */}
        <div style={{
          position: "absolute",
          inset: "8% 6% 12% 6%",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          gap: "20px",
          zIndex: 3
        }}>
          {PROJECTS.map((p, i) => (
            <div key={p.id} className="mini-camp" data-state={p.state}>
              <span className="ca-tl-pin" />
              <span className="ca-br-pin" />
              {/* mini-scene */}
              <div className="mc-scene">
                <div className="mc-fire">
                  <FireMini state={p.state} />
                </div>
                <div className="mc-animal" style={{ left: "20%" }}>
                  <Animal kind={ANIMAL_BY_STATE[p.state] || "fox"} size={32} />
                </div>
                {p.participants > 1 && (
                  <div className="mc-animal" style={{ left: "70%" }}>
                    <Animal kind={i % 2 === 0 ? "owl" : "rabbit"} size={32} />
                  </div>
                )}
                {/* tiny pines */}
                <div className="mc-pine" style={{ left: "5%", transform: "scale(0.5)" }}><div className="pine" /></div>
                <div className="mc-pine" style={{ right: "8%", transform: "scale(0.4)" }}><div className="pine t2" /></div>
              </div>
              {/* info */}
              <div className="mc-meta">
                <div className="mc-head">
                  <StatePip state={p.state} />
                  <span className="mc-name">{p.name}</span>
                  <span className="mc-state-ko">{STATE_META[p.state].ko}</span>
                </div>
                <div className="mc-mission">{p.mission}</div>
                <div className="mc-mission-ko">{p.ko}</div>
                <div className="mc-stats">
                  <span>{p.participants} 참여</span>
                  {p.blocked > 0 && <span style={{ color: "var(--yeongi-edge)" }}>{p.blocked} blocked</span>}
                  {p.review > 0 && <span style={{ color: "var(--deungbul)" }}>{p.review} review</span>}
                  <span style={{ marginLeft: "auto", color: "var(--on-surface-faint)" }}>{p.since}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="activity">
        <div className="label-stamp">Across camps · 전체</div>
        <div className="event"><span className="time">14:21</span><span className="text"><span className="who">payments-v1 · Terminal-A</span> → yeongi · STRIPE_SECRET_KEY missing</span></div>
        <div className="event"><span className="time">13:58</span><span className="text"><span className="who">user-schema-0042 · Codex</span> → yeongi · staging backfill timeout</span></div>
        <div className="event"><span className="time">13:40</span><span className="text"><span className="who">design-tokens-v3 · Gemini</span> → deungbul · 12 conflicts resolved</span></div>
        <div className="event"><span className="time">12:10</span><span className="text"><span className="who">release-notes-q2 · Claude</span> → jangjak · draft ready</span></div>
      </div>
    </div>
  );
}

window.EmptyCampScreen = EmptyCampScreen;
window.MultiProjectScreen = MultiProjectScreen;
