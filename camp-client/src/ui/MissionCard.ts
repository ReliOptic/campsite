/**
 * MissionCard — displays the current mission title and status.
 * The full title is always shown (word-wrap, never truncated).
 */
export class MissionCard {
  private container: HTMLElement;
  private titleEl: HTMLElement;
  private statusEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'dash-card mission-card';

    const label = document.createElement('div');
    label.className = 'dash-card__label';
    label.textContent = 'MISSION';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'mission-card__title';

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'mission-card__status';

    this.container.appendChild(label);
    this.container.appendChild(this.titleEl);
    this.container.appendChild(this.statusEl);
    parent.appendChild(this.container);
  }

  update(title: string, status: string): void {
    this.titleEl.textContent = title;
    this.statusEl.textContent = status;
  }
}
