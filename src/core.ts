import { Logger, LogLevel } from "./logger";

const sessionThreshold = 2000; // 2 second
const catjamBPM = 102.85;

export enum currentStatus {
  SESSION_STARTED,
  SESSION_ACTIVE,
  SESSION_ENDED,
}

export class Core {
  private static instance: Core;
  private logger: Logger = Logger.getInstance();
  private wpm: number = 0;
  private sessionStart: number = -1;
  private typedCharsCountInSession: number = 0;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  public static getInstance(): Core {
    if (!Core.instance) {
      Core.instance = new Core();
    }
    return Core.instance;
  }

  public destroy() {
    this.calculateWPM(new Date().getTime());
    this.typedCharsCountInSession = 0;
    this.sessionStart = -1;
  }

  public charTyped(): void {
    this.typedCharsCountInSession++;
  }

  public updateStates(
    cb: (status: currentStatus, data: { wpm: number; speed: number }) => void
  ): void {
    const currentTime = new Date().getTime();
    let status: currentStatus;
    if (this.sessionStart === -1 && this.typedCharsCountInSession > 0) {
      status = currentStatus.SESSION_STARTED;
    } else if (
      currentTime - this.sessionStart > sessionThreshold &&
      this.typedCharsCountInSession === 0
    ) {
      this.sessionStart = -1;
      status = currentStatus.SESSION_ENDED;
    } else {
      status = currentStatus.SESSION_ACTIVE;
    }

    this.calculateWPM(currentTime);
    cb(status, { wpm: this.wpm, speed: this.calculateVideoSpeed(this.wpm) });
    this.typedCharsCountInSession = 0;
    if (status !== currentStatus.SESSION_ENDED) {
      this.sessionStart = currentTime;
    }
  }

  private calculateWPM(currentTime: number) {
    if (this.sessionStart !== -1) {
      const elapsedMinutes = (currentTime - this.sessionStart) / 60000; // Convert milliseconds to minutes
      this.logger.debug(
        `Elapsed minutes: ${elapsedMinutes}, Typed chars: ${
          this.typedCharsCountInSession
        }, OLD WPM: ${this.wpm}, NEW: ${
          this.typedCharsCountInSession / 5 / elapsedMinutes
        }`
      );
      this.wpm = Math.round(this.typedCharsCountInSession / 5 / elapsedMinutes);
    } else {
      this.wpm = 0;
    }
  }

  private calculateVideoSpeed(wpm: number): number {
    if (wpm === 0) {
      return 0;
    }

    const speed = wpm / catjamBPM;
    return Math.max(0, Math.min(speed, 2));
  }
}
