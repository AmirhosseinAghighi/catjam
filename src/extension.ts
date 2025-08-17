import * as vscode from "vscode";
import { Logger } from "./logger";
import { Actions, WebViewController } from "./webViewController";
import { Core } from "./core";
import { Store } from "./store";

const viewType: string = "catjam";

export function activate(context: vscode.ExtensionContext) {
  const logger: Logger = Logger.getInstance();
  logger.debug('Congratulations, your extension "catjam" is now active!');

  let activeEditor = vscode.window.activeTextEditor;

  const store = new Store(context);
  const core = Core.getInstance(store);
  const webViewProvider = WebViewController.getInstance(context, store);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(viewType, webViewProvider)
  );
  const charTyped = (editor: vscode.TextDocumentChangeEvent) => {
    if (editor.contentChanges.length === 1) {
      const change = editor.contentChanges[0];
      if (change.text.length === 1 && change.rangeLength === 0) {
        const typedChar = change.text;
        if (typedChar !== "\n" && typedChar !== "\t") {
          webViewProvider.postMessage(Actions.CharacterTyped, {
            character: typedChar,
          });
        }
      }
    }
  };

  const updateInterval = setInterval(() => {
    const newData = core.updateStates();
    if (newData && newData.videoSpeed !== undefined) {
      if (newData.paused) {
        webViewProvider.postMessage(Actions.Pause, {
          type: newData.typingData.name,
        });
        return;
      }
      webViewProvider.postMessage(Actions.UpdateSpeed, {
        speed: newData.videoSpeed,
      });
      webViewProvider.postMessage(Actions.UpdateValue, {
        type: newData.typingData.name,
        value: newData.typingData.value.toFixed(0),
        average: newData.typingData.average.toFixed(0),
        backRatio: newData.backRatio.toFixed(2),
      });
      webViewProvider.postMessage(Actions.UpdateBackRatio, {
        backRatio: newData.backRatio.toFixed(2),
      });
    }
  }, 1000);

  webViewProvider.onDidDispose(() => {
    clearInterval(updateInterval);
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    activeEditor = editor;
  });

  vscode.workspace.onDidChangeTextDocument(
    (editor) => {
      if (activeEditor && editor.document === activeEditor.document) {
        const rangeLength = editor.contentChanges[0].rangeLength;
        const rangeText = editor.contentChanges[0].text;
        if (rangeText.length > 0) {
          charTyped(editor);
          core.keyPressed(editor.contentChanges[0].text);
        } else {
          core.textDeleted(editor.contentChanges[0].rangeLength);
        }
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeConfiguration((event) => {
    store.loadSettings();
  });
}

export function deactivate() {}
