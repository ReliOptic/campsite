import { ParticipantEntry } from '../systems/StateLoader';

/**
 * ParticipantBar — horizontal bar at the bottom showing active participants.
 * Simple text with status dots. No avatars, no mascots.
 */
export class ParticipantBar {
  private container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'participant-bar';
    parent.appendChild(this.container);
  }

  update(participants: ParticipantEntry[]): void {
    this.container.innerHTML = '';

    if (participants.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'participant-bar__item';
      empty.style.color = 'var(--text-hint)';
      empty.textContent = '참여자 없음';
      this.container.appendChild(empty);
      return;
    }

    for (const p of participants) {
      const item = document.createElement('span');
      item.className = 'participant-bar__item';

      const dot = document.createElement('span');
      dot.className = `participant-bar__dot participant-bar__dot--${p.status}`;

      const name = document.createTextNode(p.name);

      item.appendChild(dot);
      item.appendChild(name);
      this.container.appendChild(item);
    }
  }
}
