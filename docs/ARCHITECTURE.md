# Quizzy Architecture Documentation

## Overview

Quizzy is a web-based quiz management system designed for creating, organizing, and taking quizzes. The project uses a monorepo structure with two main packages managed by pnpm workspaces.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│              Quizzy Frontend                        │
│  (React + Chakra UI + React Router)                 │
│                                                      │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐ │
│  │   Pages     │  │ Components │  │   Dialogs   │ │
│  └─────────────┘  └────────────┘  └─────────────┘ │
│         │                │               │          │
│         └────────────────┴───────────────┘          │
│                       │                              │
└───────────────────────┼──────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│           Quizzy Common Library                     │
│                                                      │
│  ┌──────────┐  ┌─────────┐  ┌──────────────────┐  │
│  │   Types  │  │ Database│  │  Search Engine   │  │
│  │          │  │ (IDB)   │  │  (BM25 + Trie)   │  │
│  └──────────┘  └─────────┘  └──────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Version Control System               │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   IndexedDB      │
              │  (Browser Local) │
              └──────────────────┘
```

### Package Structure

#### 1. quizzy-common (`@quizzy/base`)

Core library providing types, database operations, and utilities.

**Responsibilities:**

- Data structure definitions
- IndexedDB wrapper and operations
- Search functionality (BM25 algorithm, Trie-based tag search)
- Version control for data synchronization
- Utility functions

**Key Modules:**

- `src/types/` - Type definitions
- `src/db/` - Database controllers and operations
- `src/search/` - Search algorithms and indexing
- `src/utils/` - Utility functions
- `src/version/` - Version control system

#### 2. quizzy-frontend (`@quizzy/frontend`)

React-based web application for user interaction.

**Responsibilities:**

- User interface rendering
- User interaction handling
- State management (Jotai)
- Routing (React Router)
- UI components (Chakra UI)

**Key Modules:**

- `src/pages/` - Page components
- `src/components/` - Reusable UI components
- `src/dialogs/` - Modal dialogs
- `src/layout/` - Layout components
- `src/data/` - Data access layer
- `src/utils/` - Frontend utilities

## Data Structures

### Core Entities

#### 1. Question

Represents an individual quiz question.

```typescript
type Question = BaseQuestion & (
  | ChoiceQuestion    // Multiple choice questions
  | BlankQuestion     // Fill-in-the-blank questions
  | TextQuestion      // Free-text questions
);

type BaseQuestion = {
  id: ID;                      // Unique identifier
  name?: string;               // Serial/reference name
  tags?: string[];             // Knowledge point tags (deprecated, use tagIds)
  categories?: string[];       // Syllabus categories (deprecated, use categoryIds)
  tagIds?: ID[];               // Tag IDs (v6+)
  categoryIds?: ID[];          // Category IDs (v6+)
  title?: MarkdownString;      // Question title
  content: MarkdownString;     // Question content (supports Markdown)
  solution?: MarkdownString;   // Solution explanation
  type: QuestionType;          // 'choice' | 'blank' | 'text'
  currentVersion?: string;     // Version hash
  deleted?: boolean;           // Logical deletion flag
  lastUpdate?: number;         // Last update timestamp
  searchCache?: SearchKeywordCache;  // Search index cache
};

type ChoiceQuestion = {
  type: 'choice';
  multiple?: boolean;          // Allow multiple selections
  options: ChoiceQuestionOption[];
};

type ChoiceQuestionOption = {
  id?: ID;
  shouldChoose?: boolean;      // Correct answer flag
  content: MarkdownString;     // Option content
};

type BlankQuestion = {
  type: 'blank';
  blanks: BlankQuestionBlank[];
};

type BlankQuestionBlank = {
  id?: ID;
  key: string;                 // Blank identifier
  answer?: string;             // Expected answer
  answerIsRegExp?: boolean;    // Use regex matching
  answerFlag?: string;         // Regex flags
};

type TextQuestion = {
  type: 'text';
  answer?: MarkdownString;     // Reference answer
};
```

#### 2. QuizPaper

A collection of questions forming a complete quiz.

```typescript
type QuizPaper = {
  id: ID;
  name: string;                // Display name
  img?: string;                // Cover image URL
  desc?: MarkdownString;       // Description
  tags?: string[];             // Knowledge point tags (deprecated, use tagIds)
  categories?: string[];       // Syllabus categories (deprecated, use categoryIds)
  tagIds?: ID[];               // Tag IDs (v6+)
  categoryIds?: ID[];          // Category IDs (v6+)
  questions: ID[];             // Question IDs in order
  weights?: Record<ID, number>;// Question weights for scoring
  duration?: number;           // Time limit in milliseconds
  currentVersion?: string;     // Version hash
  deleted?: boolean;
  lastUpdate?: number;
};
```

#### 3. Tag

Tags for organizing questions and papers by knowledge points.

```typescript
type Tag = {
  id: ID;
  mainName: string;            // Primary tag name
  mainNames: Record<string, string>;  // Localized names
  alternatives: string[];      // Alternative names/aliases
  currentVersion?: string;
  deleted?: boolean;
  lastUpdate?: number;
};
```

**Tag System (Database v6+):**

- ✅ Questions and papers now reference tags by ID (`tagIds`, `categoryIds`)
- ✅ Referential integrity maintained through Tag entities
- ✅ Easy to rename or merge tags (changes apply everywhere)
- ✅ Consistent tag usage across all content
- ✅ Automatic migration from string-based to ID-based system
- See `TAG_MIGRATION_GUIDE.md` for migration details

#### 4. QuizRecord

Tracks an ongoing quiz session.

```typescript
type QuizRecord = {
  id: ID;
  paperId?: ID;                // Reference to QuizPaper
  startTime: number;           // Start timestamp
  timeUsed: number;            // Elapsed time in ms
  answers: Record<ID, Answers>;// Question answers
  lastQuestion?: number;       // Current question index
  paused: boolean;             // Pause state
  lastEnter?: number;          // Last interaction time
  updateTime: number;          // Last update time
  questionOrder: ID[];         // Question order
  randomState?: RandomState;   // For random question selection
  nameOverride?: string;       // Custom quiz name
  currentVersion?: string;
  deleted?: boolean;
  lastUpdate?: number;
};
```

#### 5. QuizResult

Final result after quiz completion.

```typescript
type QuizResult = {
  id: ID;
  paperId?: ID;
  paperName?: string;
  startTime: number;
  timeUsed: number;
  answers: Record<ID, Answers>;
  scores: Record<ID, number>;  // Score per question
  score: number;               // Total score
  totalScore: number;          // Maximum possible score
  percentage: number;          // Score percentage
  stat?: StatBase;             // Statistics
  deleted?: boolean;
  lastUpdate?: number;
};
```

#### 6. Stat

Statistical analysis of quiz results.

```typescript
type StatUnit = {
  correct: number;
  wrong: number;
  noAnswer: number;
};

type StatBase = {
  countByQuestion: Record<ID, StatUnit>;
  countByTag: Record<string, StatUnit>;
  countByCategory: Record<string, StatUnit>;
  scoreByQuestion: Record<ID, StatUnit>;
  scoreByTag: Record<string, StatUnit>;
  scoreByCategory: Record<string, StatUnit>;
  grossCount: StatUnit;
  grossScore: StatUnit;
  grossPercentage: StatUnit;
  countedQuestions: ID[];
  ignoredQuestions: ID[];
  allTags: string[];
  allCategories: string[];
};

type Stat = StatBase & {
  id: ID;
  results: ID[];               // QuizResult IDs
  time: number;                // Generation time
  deleted?: boolean;
  lastUpdate?: number;
};
```

#### 7. Bookmark

User bookmarks for questions or papers.

```typescript
type BookmarkCategory = 'paper' | 'question';

type Bookmark = {
  id: ID;
  typeId: ID;                  // BookmarkType reference
  itemId: ID;                  // Question or Paper ID
  category: BookmarkCategory;  // 'paper' | 'question'
  note?: string;               // User note
  createTime: number;
  currentVersion?: string;
  deleted?: boolean;
  lastUpdate?: number;
};

type BookmarkType = {
  id: ID;
  dispCssColor?: string;       // Color for light mode
  dispCssColorDark?: string;   // Color for dark mode
  name: string;                // Type name
  names: Record<string, string>;  // Localized names
  desc: string;                // Description
  descs: Record<string, string>;  // Localized descriptions
  currentVersion?: string;
  deleted?: boolean;
  lastUpdate?: number;
};
```

### Technical Structures

#### DatabaseIndexed

Common fields for database entities.

```typescript
type DatabaseIndexed = {
  id: ID;                      // Unique identifier (UUID base64)
  deleted?: boolean;           // Logical deletion flag
  lastUpdate?: number;         // Last update timestamp
};
```

#### VersionIndexed

Version control fields for data synchronization.

```typescript
type VersionIndexed = {
  currentVersion?: string;     // Current version hash
  historyVersions?: string[];  // Previous version hashes (max 64)
  lastVersionUpdate?: number;  // Version update timestamp
};
```

#### SearchIndexed

Search cache for performance optimization.

```typescript
type SearchIndexed = {
  searchCache?: SearchKeywordCache;       // Cached keyword data
  searchCacheLastUpdated?: number;        // Cache timestamp
  searchCacheInvalidated?: boolean;       // Cache invalidation flag
};
```

## Database Layer

### IndexedDB Schema

The system uses IndexedDB with the following object stores:

**Database Version: 6** (Current)

#### Version History

- **v6**: Added `tagIds` and `categoryIds` indexes for ID-based tag system
- **v5**: Added version conflict tracking
- **v4**: Added general cache store
- **v1**: Added tags, bookmarks, and bookmark types
- **v0**: Initial schema

#### Object Stores

1. **papers** - Quiz papers
   - Key: `id`
   - Indexes: `deleted`, `lastUpdate`, `name`, `tags` (multi-entry, deprecated), `categories` (multi-entry, deprecated), `tagIds` (multi-entry, v6+), `categoryIds` (multi-entry, v6+)

2. **questions** - Questions
   - Key: `id`
   - Indexes: `deleted`, `lastUpdate`, `name`, `tags` (multi-entry, deprecated), `categories` (multi-entry, deprecated), `tagIds` (multi-entry, v6+), `categoryIds` (multi-entry, v6+)

3. **records** - Quiz records
   - Key: `id`
   - Indexes: `deleted`, `lastUpdate`, `paperId`, `paused`, `startTime`, `updateTime`, `timeUsed`, `lastEnter`

4. **results** - Quiz results
   - Key: `id`
   - Indexes: `deleted`, `lastUpdate`, `paperId`, `startTime`, `timeUsed`, `score`, `totalScore`, `percentage`

5. **stats** - Statistics
   - Key: `id`
   - Indexes: `deleted`, `lastUpdate`, `allTags` (multi-entry), `allCategories` (multi-entry), `results` (multi-entry)

6. **tags** - Tag entities
   - Key: `id`
   - Indexes: `deleted`, `lastUpdate`, `mainName` (unique), `alternatives` (multi-entry)

7. **bookmark_types** - Bookmark types
   - Key: `id`
   - Indexes: `deleted`, `lastUpdate`, `name` (unique)

8. **bookmarks** - Bookmarks
   - Key: `id`
   - Indexes: `deleted`, `lastUpdate`, `typeId`, `itemId`, `category`, `createTime`
   - Composite Indexes: `TIC` (typeId+itemId+category, unique), `IC` (itemId+category), `TC` (typeId+category)

9. **general** - General cache storage
   - Key: `id`
   - Indexes: `type`, `key`

10. **version** - Version conflict records
    - Key: `id`
    - Indexes: `storeId`, `itemId`, `importTime`, `SI` (storeId+itemId)

### Database Operations

#### IDBController

Main controller class implementing `QuizzyController` interface.

**Key Responsibilities:**

- CRUD operations for all entity types
- Search functionality
- Data import/export
- Version control
- Cache management

**Important Methods:**

**Questions & Papers:**

- `importQuestions(...questions)` - Bulk import with conflict resolution
- `importQuizPapers(...papers)` - Bulk import quiz papers
- `importCompleteQuizPapers(...papers)` - Import papers with embedded questions
- `getQuestion(id)` - Get single question
- `getQuestions(ids)` - Batch get questions
- `listQuestions()` - List all non-deleted questions
- `updateQuestion(id, patch)` - Update question
- `deleteQuestion(id)` - Logical deletion
- `findQuestion(query, count?, page?)` - Full-text search
- `findQuestionByTags(query, count?, page?)` - Tag-based search

**Tags:**

- `getTag(payload)` - Get or create tag by name
- `listTags()` - List all tags
- `updateTag(id, tag)` - Update tag
- `deleteTag(id)` - Delete tag
- `mergeTags(ids)` - Merge multiple tags
- `splitToNewTag(src, alternatives)` - Split tag alternatives
- `generateTagHint(query, limit?)` - Tag autocomplete

**Quiz Sessions:**

- `startQuiz(tactics, options?)` - Start new quiz
- `updateQuiz(operation, options?)` - Update quiz state
- `endQuiz(id)` - Complete quiz and generate result
- `getQuizRecord(id)` - Get quiz record
- `deleteQuizRecord(id)` - Delete record

**Results & Stats:**

- `generateStats(...resultIds)` - Generate statistics
- `listStats()` - List all statistics
- `getStat(id)` - Get specific statistic

**Bookmarks:**

- `putBookmarkTIC(payload)` - Create/update bookmark
- `getBookmarkTIC(payload)` - Get bookmark by type+item+category
- `deleteBookmarkTIC(payload)` - Delete bookmark
- `listBookmarks(itemId, isQuestion)` - List bookmarks for item

**Data Sync:**

- `importData(data)` - Import full dataset
- `exportData()` - Export full dataset
- `evolveVersion()` - Update version hashes for all entities

## Search Engine

### BM25 Full-Text Search

The system uses the BM25 algorithm for full-text search across questions and papers.

**Key Features:**

- Keyword extraction and tokenization
- Language detection (Chinese/Japanese segmentation)
- TF-IDF based relevance scoring
- Search cache for performance

**Process:**

1. **Indexing Phase:**
   - Extract keywords from searchable fields
   - Calculate term frequencies
   - Store search cache in entity

2. **Query Phase:**
   - Tokenize query
   - Calculate BM25 scores for each document
   - Return sorted results

**Searchable Fields:**

- Questions: `name`, `tags`, `categories`, `title`, `content`, `solution`, `options`, `blanks`, `answer`
- Papers: `name`, `desc`, `tags`, `categories`, `img`, `weights`, `duration`, `questions`

### Trie-Based Tag Search

For tag and category searching, the system uses a Trie (prefix tree) structure.

**Features:**

- Fast prefix matching
- Query expansion (find related tags)
- Multiple language support
- Cached for performance

**Process:**

1. Build Trie from all tags and categories
2. For query: find matching tags by prefix
3. Expand query to include similar tags
4. Score and rank results by tag relevance

## Version Control System

### Purpose

Enable data synchronization between devices while handling conflicts.

### Version Hash

Each entity has a `currentVersion` field containing a hash of its content:

- Format: `<sequence>-<hash>`
- Generated from specific fields (see `fieldsByStore2` in idb.ts)
- Used to detect changes

### Conflict Resolution

**Import Process:**

1. Compare local and remote versions
2. Determine import status:
   - `same` - Identical, no action
   - `local` - Local is newer, keep local
   - `remote` - Remote is newer, import remote
   - `conflict-local` - Conflict, preserve local
   - `conflict-remote` - Conflict, preserve remote

3. For conflicts:
   - Create `VersionConflictRecord` with patch
   - Store in `version` object store
   - User can review and resolve later

**Conflict Record:**

```typescript
type VersionConflictRecord = {
  id: string;
  storeId: string;              // Object store name
  itemId: string;               // Entity ID
  importTime: number;
  localVersion: string;
  remoteVersion: string;
  preserved: 'local' | 'remote';  // Which version was kept
  patch: Patch<any>;            // Difference as patch
};
```

### Version Evolution

Before import/export, the system can evolve entities to ensure they have version hashes:

- `evolveVersion()` - Update all entities
- `_evolve(storeId, options)` - Update entities in specific store

## State Management

### Frontend State (Jotai)

The frontend uses Jotai for state management with atoms:

**Global State:**

- Database controller instance
- Current user preferences
- UI state (theme, language)
- Cache for frequently accessed data

### Cache Strategy

**Hot Cache (in-memory):**

- Recently accessed entities
- Trie structures for tag search
- BM25 global cache
- LRU eviction (QuickLRU)

**Persistent Cache (IndexedDB):**

- Search indexes
- Trie structures
- BM25 statistics
- Stored in `general` object store

**Cache Invalidation:**

- On entity update/delete
- Manual refresh via `refreshSearchIndices()`
- Cache keys: `bm25::{storeId}`, `trie::{cacheKey}`

## Random Quiz Generation

### Random Question Selection

The system supports weighted random selection:

**Tactics:**

1. **Random Paper** - Select questions from multiple papers with weights
2. **Random Category** - Select from questions in categories
3. **Random Tag** - Select from questions with tags

**Algorithm:**

- Weighted reservoir sampling
- Maintains selection state in `RandomState`
- Ensures no duplicate questions in session

## Bookmark System

### Purpose

Allow users to mark questions/papers for various purposes.

### Features

- Multiple bookmark types with colors
- Reserved types: `default`, `reported`
- Custom notes
- Per-item bookmarks
- TIC (Type-Item-Category) unique constraint

### Use Cases

- Mark difficult questions
- Report issues
- Create study lists
- Organize content by topic

## UI Architecture

### Routing Structure

```
/                           - Entry page
/edit                       - Edit selection page
  /papers                   - Paper list
  /questions                - Question list
  /tags                     - Tag management
  /bookmarks                - Bookmark management
/paper/:id                  - Paper edit page
/question/:id               - Question edit page
/start                      - Start quiz page
/quiz/:id                   - Quiz session page
/records                    - Quiz records list
/results                    - Quiz results list
/result/:id                 - Result detail page
/stats                      - Statistics list
/stat/:id                   - Statistic detail page
/settings                   - Settings page
```

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Main
│       └── Router Outlet
│           ├── Pages
│           ├── Dialogs
│           └── Components
```

### Key UI Components

**SearchBox** - Unified search interface
**QuestionSelectionDialog** - Pick questions for papers
**PaperEdit** - Edit paper content and questions
**StatPanel** - Display statistics
**BookmarkIcon** - Bookmark indicator
**Markdown Renderer** - Render markdown content

## Build & Deployment

### Build Tools

- **Vite** - Frontend build tool
- **TypeScript** - Type checking
- **tsc + tsc-alias** - Common library compilation
- **pnpm** - Package manager

### Build Process

```bash
# Install dependencies
pnpm install

# Build common library
pnpm build:common

# Build frontend
pnpm build:frontend

# Build all
pnpm build

# Development server
pnpm dev
```

### Output

- Common: `quizzy-common/dist/`
- Frontend: `quizzy-frontend/dist/`

### Deployment

The frontend is a static site that can be deployed to:

- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

**Note:** All data is stored locally in browser IndexedDB.

## Export and Import System

### Export Formats

The system supports multiple export formats for questions and quiz papers to meet different use cases:

#### 1. Separate Export Format

Export entities as separate arrays with full referential integrity:

- Paper/Question object (with ID)
- Questions array (with IDs)
- Tags array (with IDs)
- Optional: Remove search and database indices for cleaner output
- **Use case:** Backup with referential integrity, partial data sharing

```typescript
const result = await exportQuizPaper(paperId, {
  format: 'separate',
  keepIds: true,
  removeIndices: true,
});
// Result: { paper: QuizPaper, questions: Question[], tags: Tag[] }
```

#### 2. Complete Export Format (Self-Contained)

Export as a single self-contained object without foreign keys:

- All data embedded (questions, tags as string names)
- No ID references (or optional ID retention)
- Fully portable and self-describing
- **Use case:** Sharing content, importing to other systems, archival

```typescript
const result = await exportQuizPaper(paperId, {
  format: 'complete',
  keepIdsInComplete: false,
});
// Result: CompleteQuizPaper with embedded questions and string tags
```

**CompleteQuizPaper Structure:**

```typescript
type CompleteQuizPaper = {
  id?: ID;                    // Optional
  name: string;
  tags?: string[];            // Direct tag names, not IDs
  categories?: string[];      // Direct category names, not IDs
  questions: CompleteQuestion[]; // Embedded questions
  // ... other fields
};

type CompleteQuestion = {
  id?: ID;                    // Optional
  tags?: string[];            // Direct tag names
  categories?: string[];      // Direct category names
  content: string;
  // ... type-specific fields
};
```

#### 3. Human-Readable Text Format

Export as formatted text for reading/printing:

- Markdown or plain text format
- Suitable for documentation or review
- Not designed for re-import
- **Use case:** Printing, documentation, manual review
- **Note:** Implementation deferred to frontend

### Import with Tag Reconciliation

When importing CompleteQuizPaper/CompleteQuestion formats, the system automatically:

1. **Tag Reconciliation:**
   - For each tag name in the imported data
   - Check if a tag exists with matching:
     - Main name
     - Multilingual names (mainNames)
     - Aliases (alternatives)
   - If match found: Reuse existing tag ID
   - If no match: Create new tag entity
   - Build mapping from string names to tag IDs

2. **Data Conversion:**
   - Convert CompleteQuestion to Question (with tag IDs)
   - Convert CompleteQuizPaper to QuizPaper (with question IDs)
   - Maintain data integrity throughout conversion

```typescript
// Import automatically handles tag reconciliation
const paperIds = await importCompleteQuizPapers(completeData);
```

### Database Reset

A database reset function is available for clearing all data:

- Deletes all questions, papers, quiz records, results, statistics
- Deletes all bookmarks and tags
- Clears edit history and version conflicts
- Re-initializes reserved bookmark types
- **Warning:** This operation is irreversible

```typescript
const recordsDeleted = await resetDatabase();
```

**UI Implementation:**

- Red warning button in settings page
- Confirmation dialog with "DELETE ALL" text input requirement
- Automatic page reload after reset
- Available in EN/JA/ZH languages

## Performance Considerations

### Search Performance

- **Incremental indexing:** Only updates search indices for changed entities via `searchCacheInvalidated` flag
- Search cache reduces repeated calculations
- Trie cache speeds up tag lookup
- Query cache prevents duplicate searches in session
- Lazy loading of search results
- **Future enhancements:** Web Workers for background indexing, progress indicators

### Database Performance

- Indexes on frequently queried fields
- Batch operations for bulk imports
- Logical deletion to preserve references
- Transaction batching

### UI Performance

- React.memo for expensive components
- Virtual scrolling for long lists (if implemented)
- Debounced search input
- Lazy route loading

## Security Considerations

### Data Privacy

- All data stored locally in browser
- No server communication by default
- User owns their data completely

### Input Validation

- Markdown content sanitization
- RegExp validation for blank answers
- ID uniqueness checks

### Data Integrity

- Version control prevents data loss
- Logical deletion preserves relationships
- Referential integrity checks on deletion

## Extensibility

### Adding New Question Types

1. Define type in `types/question.ts`
2. Add validation in `db/question-id.ts`
3. Implement UI components in frontend
4. Update search fields if needed

### Adding New Entity Types

1. Define type in `types/`
2. Add object store in `db/idb.ts` updater
3. Implement CRUD in `IDBController`
4. Update import/export logic
5. Add frontend pages/components

### Custom Search Algorithms

- Implement in `search/` directory
- Update `IDBCore._search()` or add new method
- Cache in `general` object store

## Known Limitations

1. **Tag System**: Tags are stored as strings, not references
2. **No Server Sync**: Manual import/export only
3. **No Multi-User**: Single-user browser-local system
4. **No Real-Time**: No collaborative editing
5. **Browser Storage Limit**: IndexedDB quota restrictions
6. **No Attachment Support**: Only text/markdown content

## Future Architecture Considerations

### Potential Improvements

1. **Tag Reference System**: Store tag IDs instead of strings
2. **Server Backend**: Optional cloud sync
3. **Real-Time Collaboration**: WebSocket support
4. **File Attachments**: Image/PDF storage
5. **Plugin System**: Extensible question types
6. **Mobile Apps**: React Native wrapper
7. **Offline-First PWA**: Service worker integration
8. **Data Compression**: Reduce storage usage
9. **Backup/Restore**: Automated backups
10. **Analytics**: Usage tracking and insights
