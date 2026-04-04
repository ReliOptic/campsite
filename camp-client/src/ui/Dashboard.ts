import { StateLoader } from '../systems/StateLoader';
import { FireStateHero } from './FireStateHero';
import { MissionCard } from './MissionCard';
import { NextActionCard } from './NextActionCard';
import { EventFeed } from './EventFeed';
import { ParticipantBar } from './ParticipantBar';
import { ReturnOverlay } from './ReturnOverlay';

/**
 * Dashboard — main HTML/CSS overlay on top of the Phaser canvas.
 *
 * Creates the DOM structure and child components, reads CampState
 * from StateLoader, and distributes data to children.
 */
export class Dashboard {
  private container: HTMLElement;
  private fireHero: FireStateHero;
  private missionCard: MissionCard;
  private nextActionCard: NextActionCard;
  private eventFeed: EventFeed;
  private participantBar: ParticipantBar;
  private returnOverlay: ReturnOverlay | null = null;
  private loader: StateLoader;

  constructor() {
    this.loader = new StateLoader();

    // Get or create the dashboard container
    let el = document.getElementById('dashboard');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dashboard';
      document.body.appendChild(el);
    }
    this.container = el;

    // Build the dashboard structure
    this.buildHeader();

    // Fire state hero
    this.fireHero = new FireStateHero(this.container);

    // Middle row: mission + next action
    const middle = document.createElement('div');
    middle.className = 'dash-middle';
    this.container.appendChild(middle);

    this.missionCard = new MissionCard(middle);
    this.nextActionCard = new NextActionCard(middle);

    // Event feed
    this.eventFeed = new EventFeed(this.container);

    // Participant bar
    this.participantBar = new ParticipantBar(this.container);

    // Initial data render
    this.refresh();

    // Show return overlay if there's a last session
    this.showReturnOverlay();
  }

  private buildHeader(): void {
    const header = document.createElement('div');
    header.className = 'dash-header';

    const title = document.createElement('span');
    title.className = 'dash-header__title';
    title.textContent = 'Campsite';

    const status = document.createElement('span');
    status.className = 'dash-header__status';
    status.textContent = '';

    header.appendChild(title);
    header.appendChild(status);
    this.container.appendChild(header);
  }

  private showReturnOverlay(): void {
    const lastSession = this.loader.getLastSession();
    const events = this.loader.getEventsSummary();

    // Always show overlay (welcome for new, return for existing)
    this.returnOverlay = new ReturnOverlay(lastSession, events);
    this.returnOverlay.onDismiss = () => {
      this.returnOverlay = null;
    };
  }

  /**
   * Refresh all child components with current state data.
   */
  refresh(): void {
    this.fireHero.update(this.loader.getFireState());
    this.missionCard.update(
      this.loader.getMissionTitle(),
      this.loader.getMissionStatus(),
    );
    this.nextActionCard.update(this.loader.getNextAction());
    this.eventFeed.updateFromStrings(this.loader.getEventsSummary());
    this.participantBar.update(this.loader.getParticipants());
  }

  /**
   * Re-read state from window.CAMP_STATE and update all components.
   */
  update(): void {
    this.loader = new StateLoader();
    this.refresh();
  }
}
