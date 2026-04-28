function esc(s) { if (!s) return ""; const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
setInterval(async () => {
  try {
    const r = await fetch("camp-state.json?t=" + Date.now());
    if (!r.ok) return;
    const d = await r.json();
    document.getElementById("working-now").textContent = d.working_now;
    document.getElementById("waiting-on-you").textContent = d.waiting_on_you;
    document.getElementById("next-move").textContent = d.next_move;
    document.getElementById("camp-footer").textContent = d.participant_count + " participants in camp";
    if (d.participants) {
      const sl = { bulssi: "불씨", modakbul: "모닥불", deungbul: "등불", yeongi: "연기", jangjak: "장작" };
      const l = document.getElementById("participant-list");
      l.innerHTML = "";
      d.participants.forEach(p => {
        const e = document.createElement("div");
        e.className = "participant";
        e.setAttribute("data-state", p.state);
        const lb = sl[p.state] || p.state;
        const ic = '<svg width="12" height="12"><use href="#ico-' + p.state + '"/></svg>';
        let dt = '<span class="detail-label">Summary</span>' + esc(p.summary);
        if (p.blocker) dt += '<span class="detail-label">Blocker</span><span class="detail-blocker">' + esc(p.blocker) + '</span>';
        if (p.next) dt += '<span class="detail-label">Next action</span><span class="detail-next">' + esc(p.next) + '</span>';
        dt += '<span class="detail-label">Resume</span><span class="detail-resume">' + esc(p.tool) + " in " + esc(p.terminal) + '</span>';
        e.innerHTML = '<div class="participant-header"><span class="participant-name">' + esc(p.name) + '</span><span class="state-chip state-' + p.state + '">' + ic + lb + '</span></div><div class="participant-detail">' + dt + '</div>';
        e.onclick = () => {
          const dd = e.querySelector(".participant-detail");
          dd.style.display = dd.style.display === "block" ? "none" : "block";
        };
        l.appendChild(e);
      });
    }
  } catch (e) { console.debug("[camp-poll] fetch error:", e); }
}, 3000)
