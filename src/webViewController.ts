import * as vscode from "vscode";
import { Logger } from "./logger";
import { CalculationType, SettingKeys, Store } from "./store";

export enum Actions {
  UpdateSpeed = "updateSpeed",
  UpdateValue = "updateWPM",
  CharacterTyped = "characterTyped",
  Pause = "pause",
}

type PostMessagePayloads = {
  [Actions.UpdateSpeed]: { speed: number };
  [Actions.UpdateValue]: { type: string; value: string; average: string };
  [Actions.CharacterTyped]: { character: string };
  [Actions.Pause]: { type: string };
};

export class WebViewController implements vscode.WebviewViewProvider {
  private static instance: WebViewController;
  private webView: vscode.WebviewView | undefined;
  private logger: Logger = Logger.getInstance();
  private context: vscode.ExtensionContext;
  private store: Store;

  private constructor(context: vscode.ExtensionContext, store: Store) {
    this.context = context;
    this.store = store;
  }

  public static getInstance(
    context: vscode.ExtensionContext,
    store: Store
  ): WebViewController {
    if (!WebViewController.instance) {
      WebViewController.instance = new WebViewController(context, store);
      WebViewController.instance.logger.info(
        "WebViewController instance created"
      );
    }
    return WebViewController.instance;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.logger.info("Resolving webview view");
    this.webView = webviewView;
    this.createWebview();
  }

  private createWebview(): void {
    this.logger.info("Creating catjam webview");
    if (!this.webView) {
      return;
    }

    const { webview } = this.webView;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };
    this.logger.debug("Webview panel set up successfully");

    const catjamVideo = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "catjam.mp4")
    );
    this.logger.debug("Video URI generated", { uri: catjamVideo.toString() });

    const calculationType = this.store.getSetting<CalculationType>(
      SettingKeys.CALCULATION_TYPE
    );
    const average = this.store.getValueAverage(calculationType);

    webview.html = this.getWebviewContent(
      catjamVideo,
      calculationType,
      average.toFixed(0)
    );
    this.logger.info("Webview content set and webview is ready");
  }

  public onDidDispose(
    cb: (e: void) => void,
    thisArgs?: any,
    context?: vscode.ExtensionContext
  ): void {
    this.webView?.onDidDispose(cb, null, context?.subscriptions);
  }

  public postMessage<K extends keyof PostMessagePayloads>(
    action: K,
    data: PostMessagePayloads[K]
  ): void {
    this.logger.debug("Posting message to webview", { action, data });

    if (!this.webView) {
      this.logger.error("Cannot post message: webview is not initialized");
      return;
    }

    if (!this.webView.visible) {
      this.logger.error("Web view is not visible, aborting post message");
      return;
    }

    this.webView.webview.postMessage({ action, data });
    this.logger.info("Message posted successfully", { action, data });
  }

  private getWebviewScript(): string {
    return `
          const catjamVideo = document.getElementById('catjam');
          const overlayContainer = document.getElementById('overlayContainer');
          const valueElement = document.getElementById('valueOverlay');
          const averageElement = document.getElementById('averageOverlay');

          // initial speed
          catjamVideo.defaultPlaybackRate = 0;
          catjamVideo.playbackRate = 0;

          window.addEventListener('message', event => {
            const message = event.data; // The JSON data our extension sent
            const action = message.action;
            const data = message.data;
            switch (action) {
              case "${Actions.UpdateSpeed}":
                const speed = parseFloat(data.speed);
                if (!isNaN(speed)) {
                  catjamVideo.defaultPlaybackRate = speed;
                  catjamVideo.playbackRate = speed;
                }
                break;

              case "${Actions.UpdateValue}":
                const value = parseFloat(data.value);
                const average = parseFloat(data.average);
                if (!isNaN(value)) {
                  // Handle value update if needed
                  valueElement.textContent = "Current " + data.type + ": " + value
                }

                if (!isNaN(average)) {
                  averageElement.textContent = data.type + " average: " + average;
                }
                break;

              case "${Actions.Pause}":
                valueElement.textContent = "Current " + data.type + ": IDLE"
                catjamVideo.defaultPlaybackRate = 0;
                catjamVideo.playbackRate = 0;
                break;
              
              case "${Actions.CharacterTyped}":
                const typedChar = data.character;
                if (typedChar && typedChar !== " ") {
                  newCharacterTyped(typedChar);
                }
                break;
              default:
                console.error('Unknown action:', action);
            }
          });

          const generateRandomPosition = () => {
            const randomLeft = 20 + Math.random() * 60;
            const randomTop = 40 + Math.random() * 20;
            return {
              left: randomLeft + '%',
              top: randomTop + '%'
            };
          }

          const generateRandomColor = () => {
            const colors = ['#ffd86f', '#ff6f61', '#61ff6f', '#6f61ff', '#ff61ff', '#61ffff'];
            return colors[Math.floor(Math.random() * colors.length)];
          }
          
          const newCharacterTyped = (character) => {
            if (Math.random() > 0.5) return;
            const el = document.createElement('p');
            el.textContent = character;
            const randomPositions = generateRandomPosition();
            el.style.position = 'absolute';
            el.style.left = randomPositions.left;
            el.style.top = randomPositions.top;
            el.className = 'character-typed';
            el.style.color = generateRandomColor();
            overlayContainer.appendChild(el);
            setTimeout(() => {
              el.remove();
            }, 1000);
          }`;
  }

  private getWebviewCss(): string {
    return `
        body {
          margin: 0;
          font-family: "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #1f1f1f, #2a2a2a);
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          height: 100vh;
          padding: 20px;
        }

        video {
          width: 100%;
          height: 100%;
          max-width: 600px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          display: block;
        }

        /* WPM under video */
        #wpm {
          margin-top: 0.8rem;
          font-size: 1.2rem;
          text-align: center;
          font-weight: 500;
          color: #ffd86f;
        }

        /* Overlay style for WPM */
        .overlay-container {
          position: relative;
          display: inline-block;
        }

        .value-overlay {
          position: absolute;
          bottom: 8px;
          background: rgba(0, 0, 0, 0.6);
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #ffd86f;
          font-weight: bold;
          pointer-events: none;
        }

        .character-typed {
          position: absolute;
          font-size: 1.2rem;
          animation: fadeOut 1s forwards
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: translateY(0);
          }

          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }

        @media (max-width: 500px) {
          #wpm {
            font-size: 1rem;
          }
          .value-overlay {
            font-size: 0.8rem;
            padding: 3px 6px;
          }
        }
    `;
  }

  private getWebviewContent(
    video: vscode.Uri,
    defaultType: string,
    defaultAverage: string
  ): string {
    this.logger.debug("Generating webview HTML content");

    const sanitizedVideo = video.toString().replace(/[<>"']/g, (match) => {
      const entityMap: { [key: string]: string } = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entityMap[match];
    });

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
        <style>
          ${this.getWebviewCss()}
        </style>
      </head>
      <body>
        <div class="overlay-container" id="overlayContainer">
          <video autoplay loop muted id="catjam">
            <source src="${sanitizedVideo}" type="video/mp4" />
          </video>
          <div class="value-overlay" style="right:12px;" id="valueOverlay">${defaultType}: IDLE</div>
          <div class="value-overlay" style="left:12px;" id="averageOverlay">${defaultType} average: ${defaultAverage}</div>
        </div>
        
        <script>
          ${this.getWebviewScript()}
        </script>
      </body>
    </html>`;
  }
}
