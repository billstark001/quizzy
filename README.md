# Quizzy

A modern, browser-based quiz management system for creating, organizing, and taking quizzes. Built with React, TypeScript, and IndexedDB for a fully offline-capable experience.

## Features

✨ **Comprehensive Question Types**
- Multiple choice (single and multi-select)
- Fill-in-the-blank with regex support
- Free-text essay questions

📚 **Quiz Paper Management**
- Organize questions into quiz papers
- Customizable question weights
- Time limits and duration tracking
- Random question generation

🔍 **Powerful Search**
- Full-text search with BM25 algorithm
- Tag-based search with prefix matching
- Category organization
- Bookmark system for content management

📊 **Analytics & Statistics**
- Detailed performance tracking
- Statistics by question, tag, and category
- Progress monitoring
- Learning insights

💾 **Data Management**
- All data stored locally in browser (IndexedDB)
- Import/Export functionality
- Version control for synchronization
- Conflict resolution for data merging

🌐 **Modern Tech Stack**
- React 19 with TypeScript
- Chakra UI for beautiful interfaces
- Vite for fast development
- pnpm workspace monorepo structure

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/billstark001/quizzy.git
cd quizzy

# Install dependencies
pnpm install

# Build the common library
pnpm build:common

# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

```bash
# Build all packages
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
quizzy/
├── quizzy-common/          # Core library
│   ├── src/
│   │   ├── types/          # TypeScript type definitions
│   │   ├── db/             # Database operations (IndexedDB)
│   │   ├── search/         # Search algorithms (BM25, Trie)
│   │   ├── utils/          # Utility functions
│   │   └── version/        # Version control system
│   └── package.json
│
├── quizzy-frontend/        # React web application
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable UI components
│   │   ├── dialogs/        # Modal dialogs
│   │   ├── layout/         # Layout components
│   │   └── utils/          # Frontend utilities
│   └── package.json
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # System architecture
│   ├── AUTHORING_GUIDE.md  # Guide for content creators
│   └── BUGS_AND_TODO.md    # Known issues and roadmap
│
├── package.json            # Root package configuration
└── pnpm-workspace.yaml     # pnpm workspace configuration
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### For All Users
- **[README.md](docs/README.md)** - Documentation overview and navigation guide
- **[AUTHORING_GUIDE.md](docs/AUTHORING_GUIDE.md)** - Complete guide for creating questions and quiz papers

### For Developers & Contributors
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed system architecture and technical implementation
- **[BUGS_AND_TODO.md](docs/BUGS_AND_TODO.md)** - Known issues, limitations, and general roadmap
- **[MOBILE_PWA_ROADMAP.md](docs/MOBILE_PWA_ROADMAP.md)** - Mobile web, PWA, and offline access roadmap
- **[CLOUD_SYNC_DESIGN.md](docs/CLOUD_SYNC_DESIGN.md)** - Cloud synchronization architecture and design

### Specialized Guides
- **[TAG_SYSTEM_FEATURES.md](docs/TAG_SYSTEM_FEATURES.md)** - Tag management and features
- **[TAG_MIGRATION_GUIDE.md](docs/TAG_MIGRATION_GUIDE.md)** - Tag system migration documentation
- **[EXPORT_IMPORT_GUIDE.md](docs/EXPORT_IMPORT_GUIDE.md)** - Data export and import guide

## Usage

### Creating Questions

1. Navigate to the Edit section
2. Select "Questions" → "New Question"
3. Choose question type (Multiple Choice, Fill-in-Blank, or Free-Text)
4. Fill in the question content using Markdown
5. Add tags and categories for organization
6. Save your question

### Creating Quiz Papers

1. Go to Edit → Papers → New Paper
2. Fill in paper details (name, description, duration)
3. Add questions by searching or selecting from your question bank
4. Arrange questions in desired order
5. Set question weights if needed
6. Save the paper

### Taking a Quiz

1. Go to Start Quiz page
2. Select a paper or configure random question selection
3. Start the quiz
4. Answer questions
5. Submit and view results

### Managing Content

- **Search**: Use the search box to find questions or papers by content or tags
- **Bookmarks**: Mark questions for review or organization
- **Tags**: Organize questions by knowledge points and categories
- **Statistics**: View performance analytics after completing quizzes

## Data Storage

All data is stored locally in your browser using IndexedDB:

- **Questions**: Your question bank
- **Papers**: Quiz paper definitions
- **Records**: Active quiz sessions
- **Results**: Completed quiz results
- **Statistics**: Performance analytics
- **Tags**: Tag definitions (partially implemented)
- **Bookmarks**: Your bookmarked content

### Backup Your Data

**Important**: Since all data is stored locally, regular backups are recommended:

1. Go to Settings
2. Click "Export Data"
3. Save the JSON file in a safe location
4. To restore, use "Import Data" with your backup file

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Chakra UI** - Component library
- **Vite** - Build tool
- **React Router** - Routing
- **Jotai** - State management
- **React Markdown** - Markdown rendering

### Backend/Data Layer
- **IndexedDB** - Browser database via `idb` wrapper
- **BM25** - Full-text search algorithm
- **Trie** - Prefix-based tag search
- **Version Control** - Custom conflict resolution system

### Development Tools
- **pnpm** - Package manager
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking

## Browser Compatibility

Quizzy works in all modern browsers that support:
- IndexedDB
- ES2020+
- CSS Grid and Flexbox

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

Contributions are welcome! Please:

1. Read the [ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand the system
2. Check [BUGS_AND_TODO.md](docs/BUGS_AND_TODO.md) for planned work
3. Create an issue to discuss major changes
4. Follow the existing code style
5. Write tests for new features
6. Update documentation as needed

## Roadmap

See our comprehensive roadmap documents for detailed implementation plans:

- **[MOBILE_PWA_ROADMAP.md](docs/MOBILE_PWA_ROADMAP.md)** - Mobile web, PWA, and offline access implementation plan
- **[CLOUD_SYNC_DESIGN.md](docs/CLOUD_SYNC_DESIGN.md)** - Cloud synchronization architecture and design
- **[BUGS_AND_TODO.md](docs/BUGS_AND_TODO.md)** - Known issues and general roadmap

### Completed Features ✅
- ✅ Tag system migration (string-based → ID-based for better data integrity)
- ✅ Enhanced import/export system with conflict resolution
- ✅ Search index optimization with incremental updates

### In Planning 📋
- 📋 Mobile web optimization and responsive design
- 📋 Progressive Web App (PWA) with offline capabilities
- 📋 Cloud synchronization for multi-device support
- 📋 Real-time collaboration features
- 📋 Advanced analytics dashboard
- 📋 AI-assisted content generation

## Known Limitations

- **Local Storage Only**: No built-in cloud sync (manual import/export only) - *Cloud sync in design phase*
- **Mobile Optimization**: Basic responsive design; mobile-first redesign planned
- **No PWA**: Cannot be installed as app yet - *PWA implementation planned*
- **No Attachments**: Only text and markdown; images via external URLs only
- **Browser Storage Limits**: Subject to browser IndexedDB quotas

See [BUGS_AND_TODO.md](docs/BUGS_AND_TODO.md) for complete list and [MOBILE_PWA_ROADMAP.md](docs/MOBILE_PWA_ROADMAP.md) and [CLOUD_SYNC_DESIGN.md](docs/CLOUD_SYNC_DESIGN.md) for planned improvements.

## License

This project is licensed under the ISC License. See the LICENSE file for details.

## Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check the `docs/` directory for detailed guides
- **Discussions**: Use GitHub Discussions for questions and community support

## Acknowledgments

Built with modern web technologies:
- React team for React 19
- Chakra UI team for the excellent component library
- IndexedDB community for the `idb` wrapper
- All open-source contributors whose libraries make this project possible

---

**Note**: This project is under active development. The tag system is currently being migrated from a string-based to an ID-based architecture for improved data integrity and features. See [BUGS_AND_TODO.md](docs/BUGS_AND_TODO.md) for details.
