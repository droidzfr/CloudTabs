# CloudTabs Technical Documentation

## About This Project
This is a simple Chrome extension I created to replace TabCloud for my personal needs. The code was written with AI assistance as I have limited JavaScript experience and no prior Chrome extension development experience.

I'm sharing this code as-is, without any promise of maintenance or updates. While it works for my needs, the code structure and architecture might not follow best practices.

The extension simply allows saving and syncing browser tabs across devices using Chrome's storage API.

## Architecture Overview
**Modular Structure:**
```
.
├── manifest.json          - Extension manifest (MV3)
├── _locales/             - Internationalization
│   ├── en/              - English translations
│   └── fr/              - French translations
├── background/           - Background service worker
│   └── background.js     - Core sync logic
├── popup/               - UI components
│   ├── popup.html       - Main interface
│   ├── popup.css        - Styling
│   └── popup.js         - Interaction logic
└── assets/              - Icons and resources
```

## Core Features

### 1. Internationalization (i18n)
- Uses Chrome's i18n API for multi-language support
- Implements data-i18n and data-i18n-placeholder attributes
- Supports English (default) and French
- Handles dynamic content translation

### 2. Session Management
- Storage limit: 100KB per session
- Chrome sync storage for cross-device accessibility
- Session data structure:
  ```javascript
  {
    title: string,
    date: ISO string,
    tabs: [{
      url: string,
      title: string,
      favIconUrl: string
    }]
  }
  ```

### 3. Storage Monitoring
- Tracks sync storage usage
- Warning threshold at 80% usage
- Automatic quota checks before saves
- Error handling for quota exceeded

### 4. UI Components
- Modal system for errors and confirmations
- Dynamic session list with expandable details
- URL tooltips for tab items
- Responsive layout with CSS styling

## Build System
- **Node.js Build Script**
  - Automated packaging for Chrome Web Store
  - Cross-platform compatibility (Windows, macOS, Linux)
  - Configurable inclusion/exclusion patterns
  - High compression ratio (zlib level 9)
  - File size and quota management

### Build Process
```javascript
{
  input: [manifest.json, background/, popup/, _locales/, assets/],
  exclude: [*.md, *.log, *.zip, .git*, node_modules],
  output: CloudTabs_v{version}.zip
}
```

### Commands
```bash
# Install dependencies
npm install

# Build extension package
npm run build
```

## Asset Management
### Icons
- `icon16.png`: Toolbar and favicon
- `icon48.png`: Extensions page
- `icon128.png`: Chrome Web Store and installation

### Storage
- Chrome sync storage for cross-device sync
- Quota monitoring and warnings
- Auto-cleanup suggestions
- Storage optimization strategies

### Build Artifacts
- Compressed ZIP package
- Version-tagged releases
- Ready for Chrome Web Store submission
- Automated size reporting

## API Integration

### Chrome APIs Used
- **chrome.i18n**
  - getMessage() for translations
  - Default locale handling
- **chrome.storage.sync**
  - Cross-device session storage
  - Quota management (QUOTA_BYTES)
  - getBytesInUse() for storage monitoring
- **chrome.tabs**
  - Query current window tabs
  - Create new tabs for restoration
- **chrome.windows**
  - Create new windows for session restore
- **chrome.runtime**
  - Message passing
  - Extension lifecycle events
