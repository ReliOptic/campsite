import { getRelativeTime } from '../systems/Narrative';
import { EventEntry as StateEventEntry } from '../systems/StateLoader';

/**
 * Event entry with a timestamp and description.
 */
export interface EventEntry {
  timestamp: string;  // ISO string
  description: string;
}

/**
 * EventFeed — shows the last 3-5 events as a simple list.
 * Most recent at top.
 */
export class EventFeed {
  private container: HTMLElement;
  private listEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'dash-card event-feed';

    const label = document.createElement('div');
    label.className = 'dash-card__label';
    label.textContent = 'RECENT';

    this.listEl = document.createElement('ul');
    this.listEl.className = 'event-feed__list';

    this.container.appendChild(label);
    this.container.appendChild(this.listEl);
    parent.appendChild(this.container);
  }

  /**
   * Update the feed with event descriptions (backward compat).
   */
  updateFromStrings(events: string[]): void {
    this.listEl.innerHTML = '';

    const display = events.slice(0, 5);
    if (display.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'event-feed__item';
      empty.innerHTML = '<span class="event-feed__desc" style="color:var(--text-hint)">아직 기록된 ���벤트가 없어요</span>';
      this.listEl.appendChild(empty);
      return;
    }

    for (const desc of display) {
      const li = document.createElement('li');
      li.className = 'event-feed__item';

      const descSpan = document.createElement('span');
      descSpan.className = 'event-feed__desc';
      descSpan.textContent = desc;

      li.appendChild(descSpan);
      this.listEl.appendChild(li);
    }
  }

  /**
   * Update with full event entries (timestamp + description).
   */
  updateFromEntries(events: EventEntry[]): void {
    this.listEl.innerHTML = '';

    const display = events.slice(0, 5);
    if (display.length === 0) {
      this.updateFromStrings([]);
      return;
    }

    for (const event of display) {
      const li = document.createElement('li');
      li.className = 'event-feed__item';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'event-feed__time';
      timeSpan.textContent = getRelativeTime(event.timestamp);

      const descSpan = document.createElement('span');
      descSpan.className = 'event-feed__desc';
      descSpan.textContent = event.description;

      li.appendChild(timeSpan);
      li.appendChild(descSpan);
      this.listEl.appendChild(li);
    }
  }

  /**
   * Update with structured collector events (preferred for live data).
   */
  updateFromStateEvents(events: StateEventEntry[]): void {
    this.listEl.innerHTML = '';

    // Show most recent first, limit to 5
    const display = [...events].reverse().slice(0, 5);
    if (display.length === 0) {
      this.updateFromStrings([]);
      return;
    }

    for (const event of display) {
      const li = document.createElement('li');
      li.className = 'event-feed__item';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'event-feed__time';
      timeSpan.textContent = getRelativeTime(event.timestamp);

      const descSpan = document.createElement('span');
      descSpan.className = 'event-feed__desc';
      descSpan.textContent = event.description;

      li.appendChild(timeSpan);
      li.appendChild(descSpan);
      this.listEl.appendChild(li);
    }
  }
}
