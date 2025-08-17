import { Logger, LogLevel } from "./logger";
import { CalculationType, SettingKeys, Store } from "./store";

const catjamBPM = 102.85;

export enum currentStatus {
  SESSION_STARTED,
  SESSION_ACTIVE,
  SESSION_ENDED,
}

interface TypingData {
  backRatio: number;
  typingData: {
    name: CalculationType;
    value: number;
    average: number;
  };
  videoSpeed: number;
  paused?: boolean;
}

export class Core {
  private static instance: Core;
  private logger: Logger = Logger.getInstance();
  private store: Store;
  private sessionStart: number = -1;
  private typedCharacters: number = 0;
  private deletedCharacters: number = 0;
  private deleteCount: number = 0;
  private totalCharacters: number = 0;
  private IDLE: boolean = true;
  private sessionThreshold: number;

  private constructor(store: Store, sessionThreshold: number) {
    this.store = store;
    this.sessionThreshold = sessionThreshold;
  }

  public static getInstance(
    store: Store,
    sessionThreshold: number = 2000
  ): Core {
    if (!Core.instance) {
      Core.instance = new Core(store, sessionThreshold);
    }
    return Core.instance;
  }

  public destroy() {
    this.calculateWPM(new Date().getTime());
    this.typedCharacters = 0;
    this.sessionStart = -1;
  }

  set setSessionThreshold(threshold: number) {
    this.sessionThreshold = threshold;
    this.logger.debug(`Session threshold set to ${threshold} ms`);
  }

  public keyPressed(character: string): void {
    this.logger.debug(`Key pressed: ${character}`);
    if (character.length === 1) {
      // Single character typed
      const typedChar = character;
      if (typedChar !== "\n" && typedChar !== "\t" && typedChar !== " ") {
        this.typedCharacters++;
        this.totalCharacters++;
      }
    } else if (character.length > 1) {
      // Multiple characters pasted at once
      this.logger.debug(`Text pasted: ${character.length} characters`);
      this.totalCharacters += character.length;
    }

    this.IDLE = false;
  }

  public textDeleted(length: number): void {
    this.deletedCharacters += length;
    this.deleteCount++;
    this.IDLE = false;
    this.logger.debug(`Text deleted: ${length} characters`);
  }

  public updateStates() {
    const currentTime = new Date().getTime();
    let status: currentStatus;
    if (this.sessionStart === -1 && this.typedCharacters > 0) {
      status = currentStatus.SESSION_STARTED;
      this.sessionStart = currentTime - 500;
    } else if (
      currentTime - this.sessionStart > this.sessionThreshold &&
      this.IDLE
    ) {
      status = currentStatus.SESSION_ENDED;
    } else {
      status = currentStatus.SESSION_ACTIVE;
    }

    const result = this.calculateMetrics();
    this.IDLE = true;

    if (status === currentStatus.SESSION_ENDED) {
      this.sessionStart = -1;
      this.typedCharacters = 0;
      this.deletedCharacters = 0;
      this.deleteCount = 0;
      this.totalCharacters = 0;
    }

    return result;
  }

  private calculateMetrics(): TypingData {
    const backRatio = this.calculateBackRatio();
    const selectedCalculationType = this.store.getSetting<CalculationType>(
      SettingKeys.CALCULATION_TYPE
    );

    if (this.sessionStart === -1) {
      return {
        backRatio,
        typingData: {
          name: selectedCalculationType,
          value: 0,
          average: this.store.getValueAverage(selectedCalculationType),
        },
        videoSpeed: 0,
        paused: true,
      };
    }

    const currentTime = new Date().getTime();
    let typingData = {} as { name: CalculationType; value: number };
    let videoSpeed: number = 0;

    switch (selectedCalculationType) {
      case CalculationType.WPM:
        typingData = {
          name: CalculationType.WPM,
          value: this.calculateWPM(currentTime),
        };
        videoSpeed = this.calculateVideoSpeed(typingData.value);
        break;
      case CalculationType.KPM:
        typingData = {
          name: CalculationType.KPM,
          value: this.calculateKPM(currentTime),
        };
        videoSpeed = this.calculateVideoSpeed(typingData.value) / 5;
        break;
      case CalculationType.NCS:
        typingData = {
          name: CalculationType.NCS,
          value: this.calculateNCS(currentTime),
        };
        break;
      default:
        this.logger.error(
          `Unknown calculation type: ${selectedCalculationType}`
        );
    }

    // store the average
    const average = this.store.addComputedValueToAverage(
      selectedCalculationType,
      typingData.value
    );

    return {
      backRatio,
      typingData: { ...typingData, average },
      videoSpeed: this.calculateVideoSpeed(typingData.value),
    };
  }

  private calculateBackRatio() {
    const isBackRatioActive = this.store.getSetting<CalculationType>(
      SettingKeys.SHOW_BACK_RATIO
    );
    if (!isBackRatioActive) {
      return -1;
    }
    if (this.deleteCount === 0 || this.totalCharacters === 0) {
      return 0;
    }
    return (this.deleteCount / this.totalCharacters) * 100;
  }

  private calculateWPM(currentTime: number) {
    const elapsedMinutes = (currentTime - this.sessionStart) / 60000; // Convert milliseconds to minutes
    const result = Math.round(
      (this.typedCharacters - this.deleteCount) / 5 / elapsedMinutes
    );
    return result >= 0 ? result : 0;
  }

  private calculateKPM(currentTime: number): number {
    const elapsedMinutes = (currentTime - this.sessionStart) / 60000; // Convert milliseconds to minutes
    const result = Math.round(this.typedCharacters / elapsedMinutes);
    return result >= 0 ? result : 0;
  }

  private calculateNCS(currentTime: number): number {
    const GrossKPM = this.calculateKPM(currentTime);
    const errorRate = this.deletedCharacters / this.totalCharacters;
    const result = GrossKPM * (1 - errorRate);
    return result;
  }

  private calculateVideoSpeed(value?: number): number {
    if (!value || value === 0) {
      return 0;
    }

    const speed = value / catjamBPM;
    const result = Math.max(0, Math.min(speed, 10));

    return result >= 0 ? result : 0;
  }
}
