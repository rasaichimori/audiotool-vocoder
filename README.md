# Audiotool Nexus App

A modern React application built with the Audiotool Nexus SDK for real-time collaborative audio document editing.

## Features

- **🔐 Authentication**: Personal Access Token (PAT) authentication with the Audiotool platform
- **📄 Document Management**: Create and manage synced documents in online/offline modes
- **🎵 Audio Entity Creation**: Create audio effects, oscillators, and other music elements
- **🌐 API Integration**: Full access to Audiotool services (projects, users, samples, presets, etc.)
- **📱 Responsive Design**: Modern, mobile-friendly interface
- **⚡ Real-time Sync**: Live collaboration when connected to online projects

## Prerequisites

1. **Personal Access Token**: Get your PAT from [Audiotool DEV](https://rpc.audiotool.com/dev/)
2. **Nexus SDK**: The app includes the Audiotool Nexus SDK package

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to the displayed URL (usually http://localhost:5173)

4. **Enter your PAT** in the authentication section

5. **Choose connection mode**:
   - **Offline Mode**: Local development without persistence
   - **Online Mode**: Connect to a real Audiotool project for live collaboration

## Usage

### Authentication

1. Visit [Audiotool DEV](https://rpc.audiotool.com/dev/) to generate a Personal Access Token
2. Enter your PAT in the app (it will be stored in localStorage)

### Document Connection

- **Offline Mode**: Perfect for testing and development
- **Online Mode**: Enter a project URL like `https://beta.audiotool.com/studio?project=abc123`

### Creating Audio Elements

Once connected, you can:

- Create delay effects with configurable parameters
- Add oscillators with frequency and waveform settings
- Query all entities in the document
- Modify entity properties in real-time

### API Services

The app demonstrates various Audiotool API services:

- **User Service**: Get current user information
- **Project Service**: List your projects
- **Sample Service**: Search the sample library
- **Additional APIs**: Genre, preset, track, comment, favorite, and event services

## Project Structure

```
src/
├── App.jsx              # Main application component
├── App.css              # Application styles
├── components/
│   └── ApiPanel.jsx     # API service demonstration panel
└── main.jsx             # Application entry point
```

## Key Technologies

- **React 19**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Audiotool Nexus SDK**: Official Audiotool collaboration SDK
- **GRPC/Connect**: For API communication
- **Modern CSS**: Responsive design with CSS Grid and Flexbox

## API Documentation

For detailed API documentation, visit:

- [Audiotool DEV Portal](https://rpc.audiotool.com/dev/)
- Generated protobuf definitions
- GRPC UI for testing

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Notes

- The PAT is stored in localStorage for convenience
- In offline mode, all changes are discarded on page reload
- Online mode requires a valid Audiotool project URL
- Check the browser console for detailed API responses
- The app can currently only create one synced document per tab

## Troubleshooting

1. **Authentication Issues**: Ensure your PAT is valid and has the necessary permissions
2. **Connection Problems**: Check your internet connection for online mode
3. **API Errors**: Verify your PAT has access to the required services
4. **Console Errors**: Check the browser console for detailed error messages
5. **Dependency Issues**: If you see `@bufbuild/protobuf` import errors:
   - Clear Vite cache: `rm -rf node_modules/.vite`
   - Restart the dev server: `npm run dev`
   - Ensure all dependencies are installed: `npm install`
6. **SDK Loading Issues**: The app uses lazy loading for the Nexus SDK to handle import issues gracefully

## Learn More

- [Audiotool Platform](https://www.audiotool.com/)
- [Nexus SDK Documentation](https://rpc.audiotool.com/dev/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
