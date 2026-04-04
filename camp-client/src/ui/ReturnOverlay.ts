import { getRelativeTime, formatEventsSummary } from '../systems/Narrative';

/**
 * ReturnOverlay — pure HTML/CSS "while you were away" overlay.
 * Replaces the old Phaser-based ReturnScene.
 *
 * Semi-transparent dark overlay with warm welcome text.
 * Click anywhere to dismiss. Auto-dismiss after 8 seconds.
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
  ) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'return-overlay';

    const isNew = !lastSession;

    // Header
    const header = document.createElement('div');
    header.className = 'return-overlay__header';
    header.textContent = isNew ? '새로운 캠프에 오신 걸 환영해요.' : '돌아왔어요.';
    this.overlay.appendChild(header);

    // Subheader (relative time)
    if (!isNew && lastSession) {
      const sub = document.createElement('div');
      sub.className = 'return-overlay__sub';
      sub.textContent = `마지막으로 여기 있었던 건 ${getRelativeTime(lastSession)} 전이에요.`;
      this.overlay.appendChild(sub);
    }

    // Event summary bullets
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
    const subEl = this.overlay.querySelector('.return-overlay__sub') as HTMLElement | null;
    if (subEl) {
      subEl.style.opacity = '0';
      subEl.style.transition = 'opacity 1000ms ease-out';
      setTimeout(() => { subEl.style.opacity = '1'; }, 2000);
    }

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
