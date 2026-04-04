/**
 * NextActionCard — shows the next action item.
 * Falls back to a Korean placeholder when empty.
 */
export class NextActionCard {
  private container: HTMLElement;
  private actionEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'dash-card next-card';

    const label = document.createElement('div');
    label.className = 'dash-card__label';
    label.textContent = 'NEXT';

    this.actionEl = document.createElement('div');
    this.actionEl.className = 'next-card__action';

    this.container.appendChild(label);
    this.container.appendChild(this.actionEl);
    parent.appendChild(this.container);
  }

  update(action: string): void {
    if (action && action.trim().length > 0) {
      this.actionEl.textContent = action;
      this.actionEl.className = 'next-card__action';
    } else {
      this.actionEl.textContent = '다음 할 일을 정해보세요';
      this.actionEl.className = 'next-card__action next-card__action--empty';
    }
  }
}
