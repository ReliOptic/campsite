import { getRelativeTime, formatEventsSummary } from '../systems/Narrative';
import { RecoveryData } from '../systems/StateLoader';

/**
 * ReturnOverlay — pure HTML/CSS "while you were away" overlay.
 *
 * Shows real recovery data when available:
 * - How long you were away
 * - What happened during absence (commits, events, agent activity)
 * - Recent events
 *
 * Semi-transparent dark overlay with warm welcome text.
 * Click anywhere to dismiss. Auto-dismiss after 12 seconds.
 */
export class ReturnOverlay {
  private overlay: HTMLElement;
  private dismissed = false;
  private autoTimer: ReturnType<typeof setTimeout> | null = null;

  /** Callback invoked when overlay is dismissed. */
  onDismiss?: () => void;

  constructor(
    lastSession: string | null,
    eventsSummary: string[],
    recovery?: RecoveryData | null,
  ) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'return-overlay';

    const isNew = !lastSession;
    const hasRecovery = recovery && recovery.absenceSeconds > 0;

    // Header
    const header = document.createElement('div');
    header.className = 'return-overlay__header';
    header.textContent = isNew ? '새로운 캠프에 오신 걸 환영해요.' : '돌아왔어요.';
    this.overlay.appendChild(header);

    // Subheader (real absence data or relative time)
    if (hasRecovery) {
      const sub = document.createElement('div');
      sub.className = 'return-overlay__sub';
      sub.textContent = `${recovery.absenceHuman} 동안 자리를 비웠어요.`;
      this.overlay.appendChild(sub);

      // Absence summary stats
      if (recovery.commitsDuringAbsence > 0 || recovery.eventsDuringAbsence > 0) {
        const stats = document.createElement('div');
        stats.className = 'return-overlay__sub';
        stats.style.marginTop = '4px';

        const parts: string[] = [];
        if (recovery.commitsDuringAbsence > 0) {
          parts.push(`${recovery.commitsDuringAbsence}개 커밋`);
        }
        if (recovery.eventsDuringAbsence > 0) {
          parts.push(`${recovery.eventsDuringAbsence}개 이벤트`);
        }
        if (recovery.lastAgent) {
          const agentStatus = recovery.lastAgentStatus === 'finished' ? '완료' :
            recovery.lastAgentStatus === 'crashed' ? '오류' : recovery.lastAgentStatus;
          parts.push(`${recovery.lastAgent} (${agentStatus})`);
        }
        stats.textContent = parts.join(' · ');
        this.overlay.appendChild(stats);
      }

      // Real events from recovery
      if (recovery.topEvents && recovery.topEvents.length > 0) {
        const list = document.createElement('ul');
        list.className = 'return-overlay__events';
        for (const evt of recovery.topEvents.slice(0, 5)) {
          const li = document.createElement('li');
          li.className = 'return-overlay__event';
          li.textContent = evt.desc;
          list.appendChild(li);
        }
        this.overlay.appendChild(list);
      }
    } else if (!isNew && lastSession) {
      const sub = document.createElement('div');
      sub.className = 'return-overlay__sub';
      sub.textContent = `마지막으로 여기 있었던 건 ${getRelativeTime(lastSession)} 전이에요.`;
      this.overlay.appendChild(sub);

      // Fallback: string event summaries
      const events = formatEventsSummary(eventsSummary, 3);
      if (events.length > 0) {
        const list = document.createElement('ul');
        list.className = 'return-overlay__events';
        for (const e of events) {
          const li = document.createElement('li');
          li.className = 'return-overlay__event';
          li.textContent = e;
          list.appendChild(li);
        }
        this.overlay.appendChild(list);
      }
    }

    // Hint
    const hint = document.createElement('div');
    hint.className = 'return-overlay__hint';
    hint.textContent = '아무 곳이나 클릭하세요';
    this.overlay.appendChild(hint);

    // Staggered fade-in animation
    header.style.opacity = '0';
    header.style.transition = 'opacity 1200ms ease-out';
    setTimeout(() => { header.style.opacity = '1'; }, 100);

    // Subheader fade-in at 2000ms
    const subEls = this.overlay.querySelectorAll('.return-overlay__sub');
    subEls.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = '0';
      htmlEl.style.transition = 'opacity 1000ms ease-out';
      setTimeout(() => { htmlEl.style.opacity = '1'; }, 2000 + i * 500);
    });

    // Events fade-in at 3000ms, staggered
    const eventItems = this.overlay.querySelectorAll('.return-overlay__event');
    eventItems.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = '0';
      htmlEl.style.transition = 'opacity 600ms ease-out';
      setTimeout(() => { htmlEl.style.opacity = '1'; }, 3000 + i * 300);
    });

    // Hint fade-in last
    hint.style.opacity = '0';
    hint.style.transition = 'opacity 800ms ease-out';
    const hintDelay = 3000 + eventItems.length * 300 + 600;
    setTimeout(() => { hint.style.opacity = '1'; }, hintDelay);

    // Click to dismiss
    this.overlay.addEventListener('click', () => this.dismiss());

    // Auto-dismiss after 12 seconds
    this.autoTimer = setTimeout(() => this.dismiss(), 12000);

    document.body.appendChild(this.overlay);
  }

  private dismiss(): void {
    if (this.dismissed) return;
    this.dismissed = true;

    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }

    this.overlay.classList.add('return-overlay--hidden');

    // Remove from DOM after fade-out transition
    setTimeout(() => {
      this.overlay.remove();
      this.onDismiss?.();
    }, 500);
  }

  /** Force-remove the overlay (cleanup). */
  destroy(): void {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
    }
    this.overlay.remove();
  }
}
