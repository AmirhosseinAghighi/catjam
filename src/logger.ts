import * as vscode from "vscode";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel;

  private constructor(name: string, logLevel: LogLevel = LogLevel.INFO) {
    this.outputChannel = vscode.window.createOutputChannel(name);
    this.logLevel = logLevel;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger("CatJam Logger", LogLevel.DEBUG);
    }
    return Logger.instance;
  }

  // public getOutputChannel(): vscode.OutputChannel {
  //   return this.outputChannel;
  // }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level <= this.logLevel) {
      const timestamp = new Date().toISOString();
      const levelName = LogLevel[level];
      const formattedMessage = `[${timestamp}] [${levelName}] ${message}`;

      if (args.length > 0) {
        this.outputChannel.appendLine(
          `${formattedMessage} ${JSON.stringify(args)}`
        );
      } else {
        this.outputChannel.appendLine(formattedMessage);
      }
    }
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  show(): void {
    this.outputChannel.show();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}
