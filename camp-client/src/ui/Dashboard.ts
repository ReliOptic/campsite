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
 *
 * Polls camp.json every 10 seconds for live updates.
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
  private pollTimer: ReturnType<typeof setInterval> | null = null;

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

    // Start live polling (10 second interval)
    this.startPolling();
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
    const recovery = this.loader.getRecovery();

    // Always show overlay (welcome for new, return for existing)
    this.returnOverlay = new ReturnOverlay(lastSession, events, recovery);
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

    // Prefer structured events from collector, fall back to string summaries
    const structuredEvents = this.loader.getEvents();
    if (structuredEvents.length > 0) {
      this.eventFeed.updateFromStateEvents(structuredEvents);
    } else {
      this.eventFeed.updateFromStrings(this.loader.getEventsSummary());
    }

    this.participantBar.update(this.loader.getParticipants());

    // Update header status with fire label
    const fireLabel = this.loader.getFireLabel();
    const statusEl = this.container.querySelector('.dash-header__status');
    if (statusEl && fireLabel) {
      statusEl.textContent = fireLabel;
    }
  }

  /**
   * Re-read state from window.CAMP_STATE and update all components.
   */
  update(): void {
    this.loader = new StateLoader();
    this.refresh();
  }

  /**
   * Start polling camp.json every 10 seconds for live updates.
   */
  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      try {
        const response = await fetch('camp.json?t=' + Date.now());
        if (!response.ok) return;
        const data = await response.json();
        (window as unknown as Record<string, unknown>).CAMP_STATE = data;
        this.update();
      } catch {
        // Silently ignore fetch errors (server may be down)
      }
    }, 10_000);
  }

  /** Stop live polling. */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
