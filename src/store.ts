import * as vscode from "vscode";

export enum SettingKeys {
  CALCULATION_TYPE = "calculationType",
  SHOW_BACK_RATIO = "showBackspaceRatio",
  IDLE_THRESHOLD = "idleThreshold",
  UPDATE_INTERVAL = "updateInterval",
}

export enum CalculationType {
  WPM = "WPM",
  KPM = "KPM",
  NCS = "NCS",
}

export class Store {
  private context: vscode.ExtensionContext;
  private settings = new Map<SettingKeys, string | boolean>();
  private configuration: vscode.WorkspaceConfiguration =
    vscode.workspace.getConfiguration("catjam");

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadSettings();
  }

  public loadSettings(): void {
    this.configuration = vscode.workspace.getConfiguration("catjam");
    this.loadSetting(SettingKeys.CALCULATION_TYPE, CalculationType.WPM);
    this.loadSetting(SettingKeys.SHOW_BACK_RATIO, false);
    this.loadSetting(SettingKeys.IDLE_THRESHOLD, "2000");
    this.loadSetting(SettingKeys.UPDATE_INTERVAL, "500");
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
    this.settings.set(key, this.configuration.get(key, defaultValue));
  }
}
