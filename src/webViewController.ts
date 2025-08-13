import * as vscode from "vscode";
import { Logger } from "./logger";

export enum Actions {
  UpdateSpeed = "updateSpeed",
  UpdateWPM = "updateWPM",
  CharacterTyped = "characterTyped",
}

export class WebViewController {
  private static instance: WebViewController;
  private panel: vscode.WebviewPanel | undefined;
  private logger: Logger = Logger.getInstance();

  private constructor() {}

  public static getInstance(): WebViewController {
    if (!WebViewController.instance) {
      WebViewController.instance = new WebViewController();
      WebViewController.instance.logger.info(
        "WebViewController instance created"
      );
    }
    return WebViewController.instance;
  }

  public createWebview(context: vscode.ExtensionContext): void {
    this.logger.info("Creating catjam webview");

    this.panel = vscode.window.createWebviewPanel(
      "catjam",
      "Cat Jam",
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "media"),
        ],
      }
    );

    this.logger.debug("Webview panel created successfully");

    const catjamVideo = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "media", "catjam.mp4")
    );

    this.logger.debug("Video URI generated", { uri: catjamVideo.toString() });

    this.panel.webview.html = this.getWebviewContent(catjamVideo);

    this.logger.info("Webview content set and webview is ready");
  }

  public onDidDispose(
    cb: (e: void) => void,
    thisArgs?: any,
    context?: vscode.ExtensionContext
  ): void {
    this.panel?.onDidDispose(cb, null, context?.subscriptions);
  }

  public postMessage(
    action: Actions.UpdateSpeed,
    data: { speed: number }
  ): void;
  public postMessage(action: Actions.UpdateWPM, data: { wpm: number }): void;
  public postMessage(
    action: Actions.CharacterTyped,
    data: { character: string }
  ): void;
  public postMessage(
    action: Actions,
    data: { speed: number } | { character: string } | { wpm: number }
  ): void {
    this.logger.debug("Posting message to webview", { action, data });
    if (!this.panel) {
      this.logger.error(
        "Cannot post message: webview panel is not initialized"
      );
      return;
    }

    if (!this.panel.visible) {
      this.logger.error("web view is not visible, aborting post message");
      return;
    }

    this.panel?.webview.postMessage({ action, data });
    this.logger.info("Message posted successfully", {
      action,
      data,
    });
  }

  private getWebviewScript(): string {
    return `
	const catjamVideo = document.getElementById('catjam');
  const overlayContainer = document.getElementById('overlayContainer');
  const wpmElement = document.getElementById('overlayWpm');

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

      case "${Actions.UpdateWPM}":
        const wpm = parseFloat(data.wpm);
        if (!isNaN(wpm)) {
          // Handle WPM update if needed
          console.log("WPM updated:", wpm);
          wpmElement.textContent = "Current WPM: " + wpm;
        }
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
  }
  
  `;
  }

  private getWebviewCss(): string {
    return `
      <style>
    body {
      margin: 0;
      font-family: "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #1f1f1f, #2a2a2a);
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      min-height: 100vh;
      padding: 20px;
    }

    video {
      width: 100%;
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

    .overlay-wpm {
      position: absolute;
      bottom: 8px;
      right: 12px;
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
      .overlay-wpm {
        font-size: 0.8rem;
        padding: 3px 6px;
      }
    }
    `;
  }

  private getWebviewContent(video: vscode.Uri): string {
    this.logger.debug("Generating webview HTML content");

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
            <source src="${video}" type="video/mp4" />
          </video>
          <div class="overlay-wpm" id="overlayWpm">WPM: 0</div>
        </div>
        
				<script>
					${this.getWebviewScript()}
				</script>
			</body>
		</html>`;
  }
}
