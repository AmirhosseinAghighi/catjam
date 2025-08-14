import * as vscode from "vscode";

export enum SettingKeys {
  CALCULATION_TYPE = "calculationType",
  SHOW_BACK_RATIO = "showBackRatio",
}

export enum CalculationType {
  WPM = "wpm",
  KPM = "kpm",
  NCS = "ncs",
}

export class Store {
  private static instance: Store;
  private context: vscode.ExtensionContext;
  private webViewController: vscode.WebviewViewProvider | undefined;
  private settings = new Map<SettingKeys, string | boolean>();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadSettings();
  }

  public loadSettings(): void {
    this.loadSetting(SettingKeys.CALCULATION_TYPE, CalculationType.WPM);
    this.loadSetting(SettingKeys.SHOW_BACK_RATIO, false);
  }

  public getSetting<T extends string | boolean>(key: SettingKeys): T {
    return this.settings.get(key) as T;
  }

  public addComputedValueToAverage(
    type: CalculationType,
    value: number
  ): number {
    const currentAverage = this.getState<number>(type) || 0;
    const newAverage = (currentAverage + value) / 2;
    this.setState(type, newAverage);
    return newAverage;
  }

  public getValueAverage(type: CalculationType): number {
    return this.getState<number>(type) ?? 0;
  }

  private getState<T>(key: string): T | undefined {
    return this.context.globalState.get<T>(key);
  }

  private setState<T>(key: string, value: T): Thenable<void> {
    return this.context.globalState.update(key, value);
  }

  private loadSetting(key: SettingKeys, defaultValue: string | boolean): void {
    this.settings.set(key, this.context.globalState.get(key, defaultValue));
  }
}
