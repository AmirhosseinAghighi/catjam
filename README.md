# 🐱 Cat Jam - VS Code Extension

A VS Code extension that displays a catjam meme synchronized with your typing speed!

## 🎯 Features

- **Real-time Typing Metrics**: Track your typing speed with multiple calculation methods like WPM, KPM, NCS
- **Synchronized Video**: The cat jams faster as you type faster!

### Why?

After installing Spicetify, i found a fun extension to install, it was a catjam synchronized with music beats! [link to extension](https://github.com/BlafKing/spicetify-cat-jam-synced)
One night while i was listening to music, i just got an idea! why don't we sync this with typing speed?
After a little research, i found that we don't have many good typing tests in vscode, and i think it's a good place to test something like typing speed! so why not mix these two achievements and create a useful and fun extension?!

## 🚀 Getting Started

1. Install the extension from the VS Code Marketplace
2. Open any project in VS Code
3. Look for the "Cat Jam" panel in the Explorer sidebar
4. Start typing and watch your feline friend jam along!

## ⚙️ Extension Settings

This extension contributes the following settings:

### `catjam.speedCalculation`

Choose your preferred typing speed calculation method:

- **KPM** (Keystrokes Per Minute): Counts all keystrokes including special characters
- **WPM** (Words Per Minute): Standard words per minute calculation (default)
- **NCS** (Net Coding Speed): Specialized metric for coding activities

### `catjam.showBackspaceRatio`

- **Type**: boolean
- **Default**: false
- **Description**: Show backspace ratio

## 🛠️ Requirements

- Visual Studio Code version 1.103.0 or higher
- No additional dependencies required!

## 🧪 Testing

This extension includes comprehensive test coverage with unit tests, integration tests, and end-to-end testing scenarios. All tests have been written with the assistance of Claude 4 (Anthropic's AI assistant) to ensure thorough coverage and reliability. (i just ate chips while it was writing tests and testing them, it was a horror movie)

### Running Tests

```bash
pnpm run test
```

### Development

```bash
# Install dependencies
pnpm install

# Compile TypeScript
pnpm run compile

# Watch mode for development
pnpm run watch

# Linting
pnpm run lint
```

## 📝 Release Notes

### 0.0.1

Initial release of Cat Jam:

- Basic cat animation synchronized to typing speed
- Multiple speed calculation methods (KPM, WPM, NCS)
- Explorer panel integration
- Session tracking with idle detection
- Configurable settings for speed calculation and backspace ratio display

## 🤝 Contributing

Contributions are welcome!
Feel free to submit issues and feature requests or even pull requests.

**Enjoy coding with your new friend! 🐱✨**

