# Export and Import Guide

## Overview

Quizzy provides flexible export and import capabilities for questions and quiz papers. This guide explains the different formats available and how to use them effectively.

## Export Formats

### 1. Separate Export Format

This format exports data as separate arrays with full referential integrity preserved.

**Structure:**
```typescript
{
  format: 'separate',
  data: {
    paper: QuizPaper,      // Or question: Question
    questions: Question[], // (For papers only)
    tags: Tag[]
  }
}
```

**Features:**
- All entities keep their IDs
- Referential integrity maintained
- Optional: Remove search and database indices for cleaner output
- Questions reference tags by ID
- Papers reference questions by ID

**Use Cases:**
- Creating backups with full data integrity
- Partial data sharing within Quizzy ecosystem
- Migrating data between Quizzy instances

**Example:**
```typescript
const result = await exportQuizPaper(paperId, {
  format: 'separate',
  keepIds: true,
  removeIndices: true,
});

// Result includes paper, all questions, and all referenced tags
const { paper, questions, tags } = result.data;
```

### 2. Complete Export Format (Self-Contained)

This format exports data as a single, self-contained object with no foreign key references.

**Structure:**
```typescript
{
  format: 'complete',
  data: CompleteQuizPaper | CompleteQuizPaperDraft
}
```

**CompleteQuizPaper Format:**
```typescript
{
  id?: string,              // Optional (controlled by keepIdsInComplete)
  name: string,
  tags?: string[],          // Direct tag names, not IDs
  categories?: string[],    // Direct category names, not IDs
  questions: [              // Embedded questions
    {
      id?: string,          // Optional
      tags?: string[],      // Direct tag names
      categories?: string[],
      content: string,
      // ... other fields
    }
  ],
  // ... other fields
}
```

**Features:**
- Fully self-contained (no external references)
- Tags stored as string names instead of IDs
- Questions embedded directly (not referenced)
- Optional ID retention
- Portable across different systems

**Use Cases:**
- Sharing content with others
- Archiving quiz data
- Importing to other quiz systems
- Creating portable quiz banks

**Example:**
```typescript
// Export without IDs for maximum portability
const result = await exportQuizPaper(paperId, {
  format: 'complete',
  keepIdsInComplete: false,
});

const completeData = result.data; // CompleteQuizPaperDraft
```

### 3. Human-Readable Text Format (Future)

This format will export data as formatted text suitable for reading and printing.

**Features (Planned):**
- Markdown or plain text format
- Human-readable layout
- Not designed for re-import
- Suitable for documentation and review

**Use Cases:**
- Printing quiz content
- Creating documentation
- Manual review and editing
- Sharing for non-technical users

**Note:** This format is planned for frontend implementation.

## Import with Tag Reconciliation

When importing data in the Complete format, Quizzy automatically handles tag reconciliation:

### Tag Matching Process

For each tag name in the imported data:

1. **Search for existing tags** by:
   - Main name (`mainName`)
   - Multilingual names (`mainNames`)
   - Alternative names/aliases (`alternatives`)

2. **If match found:**
   - Reuse the existing tag's ID
   - No duplicate tags created
   - Maintains tag consistency

3. **If no match found:**
   - Create a new tag entity
   - Assign a new ID
   - Add to tag database

### Example Import Flow

```typescript
// Import complete quiz paper
const completeData = {
  name: "My Quiz",
  tags: ["javascript", "programming"],
  categories: ["web-development"],
  questions: [
    {
      content: "What is closure?",
      tags: ["javascript", "advanced"],
      type: "text",
      // ...
    }
  ]
};

// Import automatically:
// 1. Finds or creates tags: "javascript", "programming", "web-development", "advanced"
// 2. Converts questions to standard format with tag IDs
// 3. Creates paper with question IDs
const paperIds = await importCompleteQuizPapers(completeData);
```

### Question Conflict Detection (Future Enhancement)

For future versions, the system will support conflict detection:

**Planned Features:**
- Match existing questions by title, content, solution, and type
- Present conflicts to user via async callback
- User can choose to:
  - Keep existing question
  - Use imported question
  - Keep both questions
- Batch conflict resolution UI

**Example API (Planned):**
```typescript
await importCompleteQuizPapers(data, {
  onConflict: async (conflicts) => {
    // conflicts: Array of { existing, imported, metadata }
    // Returns: Array of decisions { action: 'keep'|'replace'|'both' }
    return await showConflictResolutionDialog(conflicts);
  }
});
```

## Export Options Reference

### Common Options

```typescript
interface ExportOptions {
  format: 'separate' | 'complete' | 'text';
  
  // For 'separate' format:
  keepIds?: boolean;          // Default: true
  removeIndices?: boolean;    // Default: false
  
  // For 'complete' format:
  keepIdsInComplete?: boolean; // Default: false
}
```

### Option Details

**`format`**
- `'separate'`: Export as separate arrays (paper/question, questions, tags)
- `'complete'`: Export as single self-contained object
- `'text'`: Export as human-readable text (frontend only)

**`keepIds`** (separate format)
- `true`: Keep all entity IDs (default)
- `false`: Remove IDs (not recommended for separate format)

**`removeIndices`** (separate format)
- `true`: Remove search and database indices from output
- `false`: Keep indices (default)
- Note: Indices are internal fields like `searchCache`, `currentVersion`, etc.

**`keepIdsInComplete`** (complete format)
- `true`: Keep entity IDs in complete format
- `false`: Remove IDs for maximum portability (default)

## Usage Examples

### Export a Quiz Paper for Backup

```typescript
// Export with full integrity for backup
const backup = await exportQuizPaper(paperId, {
  format: 'separate',
  keepIds: true,
  removeIndices: false,
});

// Save to file
const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
downloadFile(blob, 'quiz-backup.json');
```

### Export a Quiz Paper for Sharing

```typescript
// Export as self-contained for sharing
const shared = await exportQuizPaper(paperId, {
  format: 'complete',
  keepIdsInComplete: false,
});

// Share the complete data
const blob = new Blob([JSON.stringify(shared)], { type: 'application/json' });
downloadFile(blob, 'shared-quiz.json');
```

### Export a Single Question

```typescript
// Export question with tags
const questionExport = await exportQuestion(questionId, {
  format: 'complete',
  keepIdsInComplete: false,
});

// Use in another system
const completeQuestion = questionExport.data;
```

### Import Complete Quiz Paper

```typescript
// Load from file
const file = await uploadFile();
const text = await file.text();
const completeData = JSON.parse(text);

// Import with automatic tag reconciliation
const paperIds = await importCompleteQuizPapers(completeData);

console.log(`Imported ${paperIds.length} papers`);
```

## Database Reset

### Warning

**⚠️ The database reset operation is irreversible!**

Resetting the database will permanently delete:
- All questions
- All quiz papers
- All quiz records (in-progress quizzes)
- All quiz results
- All statistics
- All bookmarks and bookmark types (except reserved types)
- All tags
- All edit history and version conflicts
- All cached data

### When to Use

Use database reset when:
- Starting fresh with new content
- Clearing test data
- Removing all personal data
- Troubleshooting severe database issues

### How to Reset

**Via Settings Page:**
1. Go to Settings page
2. Scroll to bottom
3. Click the red "⚠️ Reset Database" button
4. In the confirmation dialog:
   - Read the warning carefully
   - Type "DELETE ALL" exactly
   - Click the reset button
5. Page will automatically reload after reset

**Via API:**
```typescript
const recordsDeleted = await resetDatabase();
console.log(`Deleted ${recordsDeleted} records`);
```

### After Reset

After resetting:
- All data is gone (cannot be recovered)
- Reserved bookmark types are re-initialized
- Search indices are cleared
- Page reloads to fresh state
- You can start adding new content

### Recovery

There is no recovery after reset. Always:
- Export your data before resetting
- Keep backups of important content
- Double-check before confirming reset

## Best Practices

### For Backups

1. Export in `separate` format with `keepIds: true`
2. Keep indices for faster re-import
3. Export regularly (weekly/monthly)
4. Store backups in multiple locations
5. Test restore process periodically

### For Sharing

1. Export in `complete` format without IDs
2. Remove IDs for privacy and portability
3. Include README with context
4. Consider which tags/categories are relevant
5. Test import in a clean database first

### For Migration

1. Export all data using `separate` format
2. Keep IDs if migrating within Quizzy ecosystem
3. Use `complete` format for cross-system migration
4. Verify tag reconciliation after import
5. Check for any conflicts or issues

### For Collaboration

1. Use `complete` format for sharing content
2. Establish tag naming conventions
3. Document any custom categories
4. Version your exported files
5. Use descriptive file names with dates

## Troubleshooting

### Import Issues

**Tags Not Matching:**
- Check tag names are exact matches
- Verify no extra whitespace
- Check multilingual names if using
- Consider manual tag merge after import

**Questions Duplicating:**
- Currently no automatic conflict resolution
- Manually check for duplicates after import
- Use question IDs to identify duplicates
- Delete unwanted duplicates via UI

**IDs Conflicting:**
- Use `keepIdsInComplete: false` for imports
- Let system generate new IDs
- Don't import same data multiple times
- Clear database if severe ID conflicts occur

### Export Issues

**Large Files:**
- Export subsets of data if needed
- Use `removeIndices: true` to reduce size
- Consider splitting into multiple exports
- Compress exported JSON files

**Missing Tags:**
- Verify tags exist before export
- Check tag deletion status
- Ensure tag IDs are valid
- Rebuild tag database if needed

## API Reference

### Export Functions

```typescript
// Export quiz paper
function exportQuizPaper(
  id: ID, 
  options: ExportOptions
): Promise<PaperExportResult>

// Export question
function exportQuestion(
  id: ID, 
  options: ExportOptions
): Promise<QuestionExportResult>
```

### Import Functions

```typescript
// Import complete quiz papers
function importCompleteQuizPapers(
  ...papers: CompleteQuizPaperDraft[]
): Promise<ID[]>

// Import standard quiz papers
function importQuizPapers(
  ...papers: QuizPaper[]
): Promise<ID[]>

// Import questions
function importQuestions(
  ...questions: Question[]
): Promise<ID[]>
```

### Database Functions

```typescript
// Reset entire database
function resetDatabase(): Promise<number>

// Export all data
function exportData(): Promise<QuizzyData>

// Import all data
function importData(data: QuizzyData): Promise<void>
```

## See Also

- [Architecture Documentation](ARCHITECTURE.md) - System design and data structures
- [Tag Migration Guide](TAG_MIGRATION_GUIDE.md) - Tag system and migration
- [Authoring Guide](AUTHORING_GUIDE.md) - Creating questions and papers
- [Bugs and TODO](BUGS_AND_TODO.md) - Known issues and planned features
