import * as vscode from "vscode";
import { Logger } from "./logger";
import { Actions, WebViewController } from "./webViewController";
import { Core } from "./core";

export function activate(context: vscode.ExtensionContext) {
  const logger: Logger = Logger.getInstance();
  logger.debug('Congratulations, your extension "catjam" is now active!');

  let activeEditor = vscode.window.activeTextEditor;
  let onCharTyped: (character?: string) => void = (c) => {};

  const disposable = vscode.commands.registerCommand("catjam.start", () => {
    const core = Core.getInstance();
    const panel = WebViewController.getInstance();
    panel.createWebview(context);
    const updateInterval = setInterval(() => {
      core.updateStates((status, data) => {
        panel.postMessage(Actions.UpdateSpeed, { speed: data.speed });
        panel.postMessage(Actions.UpdateWPM, { wpm: data.wpm });
        logger.debug(
          `Status: ${status}, Speed: ${data.speed}, WPM: ${data.wpm}`
        );
      });
    }, 1000);

    onCharTyped = (character) => {
      if (activeEditor) {
        core.charTyped();
        if (character) {
          panel.postMessage(Actions.CharacterTyped, {
            character,
          });
        }
      }
    };

    panel.onDidDispose(
      () => {
        clearInterval(updateInterval);
        onCharTyped = () => {};
      },
      null,
      context
    );
  });

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    (editor) => {
      if (activeEditor && editor.document === activeEditor.document) {
        if (editor.contentChanges.length === 1) {
          const change = editor.contentChanges[0];
          if (change.text.length === 1 && change.rangeLength === 0) {
            const typedChar = change.text;
            if (typedChar !== "\n" && typedChar !== "\t") {
              logger.debug(`User typed character: ${typedChar}`);
              onCharTyped(typedChar);
            }
          }
        }
      }
    },
    null,
    context.subscriptions
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
