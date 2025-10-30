# Known Bugs and TODO List

## Overview

This document tracks known issues, limitations, and planned improvements for the Quizzy project. Items are organized by priority and category.

**Status Legend:**
- 🔴 Critical - Blocks major functionality or causes data loss
- 🟡 High - Significant impact on usability or performance
- 🟢 Medium - Noticeable but workaround available
- 🔵 Low - Minor inconvenience or edge case
- 📋 Planned - Feature planned for future release

---

## Critical Issues 🔴

### None Currently Identified

No critical issues have been reported. If you encounter a critical bug that causes data loss or system failure, please report immediately.

---

## High Priority Issues 🟡

### 1. Tag System Architectural Issue

**Status:** 🟡 High Priority  
**Category:** Architecture / Data Model  
**Affects:** Questions, Papers, Search, Statistics

#### Current Implementation

The tag system currently stores tags as plain strings in questions and papers:

```typescript
type Question = {
  // ...
  tags?: string[];        // Array of tag strings
  categories?: string[];  // Array of category strings
  // ...
};

type QuizPaper = {
  // ...
  tags?: string[];
  categories?: string[];
  // ...
};
```

#### Problems with Current System

**1. No Referential Integrity**
```typescript
// Scenario: Rename a tag
// Problem: Must update every question/paper manually

// Question 1
{ tags: ["object-oriented-programming"] }

// Question 2
{ tags: ["object-oriented-programming"] }

// After renaming tag to "oop"
// Question 1 updated: { tags: ["oop"] }
// Question 2 NOT updated: { tags: ["object-oriented-programming"] }
// Result: Inconsistent data, broken search
```

**2. Difficult to Merge Tags**
```typescript
// Scenario: Merge duplicate tags
// Tags in use: "javascript", "js", "JavaScript", "JS"

// Must find and replace in ALL questions/papers
const allQuestions = await listQuestions();
for (const q of allQuestions) {
  if (q.tags?.includes("js") || q.tags?.includes("JS")) {
    // Update each question individually
    await updateQuestion(q.id, {
      tags: q.tags.map(t => 
        ["js", "JS"].includes(t) ? "javascript" : t
      )
    });
  }
}
// Complex, error-prone, slow
```

**3. Inconsistent Naming**
```typescript
// Different authors use different conventions:
["Machine-Learning", "machine-learning", "machine_learning", "ML"]

// All refer to the same concept but stored as different strings
// Search results are fragmented
// Statistics are inaccurate
```

**4. No Tag Hierarchy**
```typescript
// Cannot represent relationships:
"programming" 
  ├─ "python"
  │   ├─ "python-basics"
  │   └─ "python-oop"
  └─ "javascript"

// Current system: flat list of strings
// No way to query "all programming questions"
```

**5. Inefficient Search and Indexing**
```typescript
// Multi-entry index on tags array
// Every tag string creates an index entry
// Duplicate strings across questions waste space
// String comparison slower than ID comparison
```

**6. Statistics Fragmentation**
```typescript
// Statistics by tag
{
  "python": { correct: 10, wrong: 5 },
  "Python": { correct: 8, wrong: 3 },  // Should be merged
  "py": { correct: 12, wrong: 4 }      // Should be merged
}
// Inaccurate analytics due to string variations
```

#### Partial Solution: Tag Entity System

A `Tag` entity type already exists but is not integrated:

```typescript
// Tag entity in database
type Tag = {
  id: ID;                              // Unique identifier
  mainName: string;                    // Primary name
  mainNames: Record<string, string>;   // Localized names
  alternatives: string[];              // Aliases
  deleted?: boolean;
  lastUpdate?: number;
  currentVersion?: string;
};

// Database operations available:
- getTag(name) - Get or create tag
- listTags() - List all tags
- updateTag(id, patch) - Update tag
- deleteTag(id) - Delete tag
- mergeTags(ids) - Merge multiple tags
- splitToNewTag(src, alternatives) - Split tag
```

**What Works:**
- Tag entities can be created and managed
- Tag merging and splitting implemented
- Tag alternatives support for aliases
- Multilingual tag names

**What's Missing:**
- Questions/papers still use string arrays, not tag IDs
- No migration path from strings to IDs
- Search still operates on strings
- Statistics still use string-based aggregation
- No automatic tag suggestion during question creation
- No tag usage tracking

#### Proposed Solution: ID-Based Tag System

**Goal:** Replace string-based tags with ID references while maintaining backward compatibility.

##### Phase 1: Data Model Update

```typescript
// New question/paper structure
type Question = {
  // ...
  tagIds?: ID[];          // Array of Tag IDs (new)
  tags?: string[];        // Deprecated, for backward compatibility
  categoryIds?: ID[];     // Array of Tag IDs for categories (new)
  categories?: string[];  // Deprecated
  // ...
};

type QuizPaper = {
  // ...
  tagIds?: ID[];
  tags?: string[];        // Deprecated
  categoryIds?: ID[];
  categories?: string[];  // Deprecated
  // ...
};
```

##### Phase 2: Migration Strategy

```typescript
// Migration process:
async function migrateTagsToIds() {
  // 1. Create tag entities for all existing tag strings
  const allTagStrings = new Set<string>();
  
  const questions = await listQuestions();
  const papers = await listQuizPapers();
  
  for (const q of questions) {
    q.tags?.forEach(t => allTagStrings.add(t));
    q.categories?.forEach(c => allTagStrings.add(c));
  }
  
  for (const p of papers) {
    p.tags?.forEach(t => allTagStrings.add(t));
    p.categories?.forEach(c => allTagStrings.add(c));
  }
  
  // 2. Create or get tag entities
  const tagMap = new Map<string, ID>();
  
  for (const tagStr of allTagStrings) {
    const tag = await getTag(tagStr);
    tagMap.set(tagStr, tag.id);
  }
  
  // 3. Update all questions
  for (const q of questions) {
    const tagIds = q.tags?.map(t => tagMap.get(t)!) ?? [];
    const categoryIds = q.categories?.map(c => tagMap.get(c)!) ?? [];
    
    await updateQuestion(q.id, {
      tagIds,
      categoryIds,
      // Keep old fields for backward compatibility
    });
  }
  
  // 4. Update all papers
  for (const p of papers) {
    const tagIds = p.tags?.map(t => tagMap.get(t)!) ?? [];
    const categoryIds = p.categories?.map(c => tagMap.get(c)!) ?? [];
    
    await updateQuizPaper(p.id, {
      tagIds,
      categoryIds,
    });
  }
  
  // 5. Rebuild search indices
  await refreshSearchIndices(true);
}
```

##### Phase 3: Update Core Operations

```typescript
// Update search to use tag IDs
async function findQuestionByTags(
  query: string, 
  count?: number, 
  page?: number
): Promise<SearchResult<Question>> {
  // 1. Find matching tags by name/alternative
  const tags = await searchTags(query);
  const tagIds = tags.map(t => t.id);
  
  // 2. Search questions by tag IDs
  const questions = await findQuestionsByTagIds(tagIds);
  
  // 3. Rank by relevance
  return rankResults(questions, query);
}

// Update statistics to use tag IDs
async function generateStatsByTags(
  results: QuizResult[]
): Promise<Record<ID, StatUnit>> {
  const statsByTagId: Record<ID, StatUnit> = {};
  
  for (const result of results) {
    for (const [qid, answer] of Object.entries(result.answers)) {
      const question = await getQuestion(qid);
      const tagIds = question?.tagIds ?? [];
      
      for (const tagId of tagIds) {
        if (!statsByTagId[tagId]) {
          statsByTagId[tagId] = defaultStatUnit();
        }
        
        // Accumulate statistics
        const isCorrect = checkAnswer(question, answer);
        if (isCorrect) {
          statsByTagId[tagId].correct++;
        } else {
          statsByTagId[tagId].wrong++;
        }
      }
    }
  }
  
  return statsByTagId;
}
```

##### Phase 4: UI Updates

**Tag Selection Component:**
```typescript
// Autocomplete tag selector
function TagSelector({ 
  value: ID[], 
  onChange: (tags: ID[]) => void 
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  
  // Load tag suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      const result = await generateTagHint(query);
      setSuggestions(result.paperTags);
    };
    loadSuggestions();
  }, [query]);
  
  // Render with tag chips
  return (
    <div>
      {value.map(tagId => (
        <TagChip 
          key={tagId} 
          tagId={tagId} 
          onRemove={() => onChange(value.filter(id => id !== tagId))}
        />
      ))}
      <AutocompleteInput
        value={query}
        onChange={setQuery}
        suggestions={suggestions}
        onSelect={(tag) => onChange([...value, tag.id])}
      />
    </div>
  );
}

// Display tag name from ID
function TagChip({ tagId, onRemove }) {
  const [tag, setTag] = useState<Tag | null>(null);
  
  useEffect(() => {
    getTag(tagId).then(setTag);
  }, [tagId]);
  
  return (
    <Chip onRemove={onRemove}>
      {tag?.mainName ?? tagId}
    </Chip>
  );
}
```

**Tag Management Page:**
```typescript
function TagManagementPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  
  // List all tags with usage count
  useEffect(() => {
    const loadTags = async () => {
      const allTags = await listTags();
      
      // Calculate usage for each tag
      const questions = await listQuestions();
      const papers = await listQuizPapers();
      
      const usage = new Map<ID, number>();
      
      for (const q of questions) {
        q.tagIds?.forEach(id => {
          usage.set(id, (usage.get(id) ?? 0) + 1);
        });
      }
      
      for (const p of papers) {
        p.tagIds?.forEach(id => {
          usage.set(id, (usage.get(id) ?? 0) + 1);
        });
      }
      
      setTags(allTags.map(tag => ({
        ...tag,
        usageCount: usage.get(tag.id) ?? 0
      })));
    };
    
    loadTags();
  }, []);
  
  // Render tag list with actions
  return (
    <TagList
      tags={tags}
      onMerge={handleMergeTags}
      onRename={handleRenameTag}
      onDelete={handleDeleteTag}
    />
  );
}
```

##### Phase 5: Backward Compatibility

**During Transition:**
- Keep both `tags`/`categories` (strings) and `tagIds`/`categoryIds` (IDs)
- Read from IDs if available, fall back to strings
- Write to both fields during migration period
- Display deprecation warnings in UI

**After Migration Complete:**
- Remove string-based fields
- Update all code to use IDs only
- Database migration removes old fields
- Bump major version number

#### Implementation Checklist

**Data Layer:**
- [ ] Add `tagIds` and `categoryIds` fields to Question type
- [ ] Add `tagIds` and `categoryIds` fields to QuizPaper type
- [ ] Update database schema to include new fields
- [ ] Add indexes on new ID fields
- [ ] Implement migration function
- [ ] Update validation to check for tag ID existence
- [ ] Update database updater to version 6

**Search Layer:**
- [ ] Update search to handle both string and ID tags
- [ ] Modify Trie cache to include tag IDs
- [ ] Update BM25 cache to use tag IDs
- [ ] Implement tag ID search functions
- [ ] Update tag hint generation
- [ ] Optimize tag-based queries

**Statistics Layer:**
- [ ] Update stat generation to use tag IDs
- [ ] Implement tag ID aggregation
- [ ] Migrate existing stats to use IDs
- [ ] Update stat display to resolve tag names

**Controller Layer:**
- [ ] Update `findQuestionByTags` to use IDs
- [ ] Update `findQuizPaperByTags` to use IDs
- [ ] Add `getTagsByIds` batch operation
- [ ] Add `searchTagsByName` function
- [ ] Implement tag usage tracking
- [ ] Add tag rename cascade update

**UI Layer:**
- [ ] Create TagSelector component
- [ ] Create TagChip component
- [ ] Update QuestionEditPage to use TagSelector
- [ ] Update PaperEditPage to use TagSelector
- [ ] Create TagManagementPage
- [ ] Add tag merge UI
- [ ] Add tag rename UI
- [ ] Add tag usage statistics display
- [ ] Show migration progress indicator
- [ ] Display deprecation warnings

**Testing:**
- [ ] Unit tests for tag migration
- [ ] Integration tests for tag CRUD with IDs
- [ ] Search tests with tag IDs
- [ ] Statistics tests with tag IDs
- [ ] UI tests for tag selection
- [ ] Performance tests for large tag sets
- [ ] Migration rollback tests

**Documentation:**
- [ ] Update ARCHITECTURE.md with new tag system
- [ ] Update AUTHORING_GUIDE.md with tag ID usage
- [ ] Create MIGRATION_GUIDE.md for users
- [ ] Add inline code documentation
- [ ] Update API documentation

**Deployment:**
- [ ] Create migration script
- [ ] Test migration on sample data
- [ ] Prepare rollback procedure
- [ ] Create backup before migration
- [ ] Staged rollout plan
- [ ] Monitor for issues post-migration

#### Benefits After Implementation

**For Users:**
- Rename tags without updating every question
- Merge duplicate tags easily
- Consistent tag naming across content
- Better search results
- Accurate statistics
- Tag usage insights

**For Developers:**
- Cleaner code with referential integrity
- Faster search with ID-based indexes
- Easier maintenance
- Scalable architecture
- Better data consistency
- Simpler conflict resolution

**Performance Improvements:**
- Smaller index size (IDs vs strings)
- Faster tag comparison (ID equality vs string)
- Reduced storage (deduplicated tag data)
- Cached tag metadata
- Optimized database queries

#### Estimated Effort

**Development:** 3-4 weeks (1 developer)
- Data model: 3 days
- Migration: 4 days
- Controller updates: 5 days
- UI components: 5 days
- Testing: 3 days

**Testing & QA:** 1 week
**Documentation:** 3 days
**Total:** 5-6 weeks

#### Risk Assessment

**Risks:**
- Data loss during migration (Mitigation: Backup + rollback plan)
- Performance impact during migration (Mitigation: Background migration)
- Backward compatibility issues (Mitigation: Dual-field approach)
- User confusion (Mitigation: Clear documentation + UI guidance)

**Priority:** High - Should be addressed before v1.0 release

---

## Medium Priority Issues 🟢

### 2. No Server-Side Synchronization

**Status:** 🟢 Medium  
**Category:** Architecture / Features

**Current State:**
- All data stored in browser IndexedDB
- Manual import/export only
- No cross-device sync
- No real-time collaboration

**Impact:**
- Users must manually transfer data between devices
- No backup except manual exports
- Single-device usage only
- Risk of data loss if browser storage cleared

**Proposed Solution:**
- Implement optional cloud backend
- WebSocket for real-time sync
- Conflict resolution for multi-device edits
- Automatic backup
- End-to-end encryption for privacy

**Workaround:**
- Regular manual exports
- Store exports in cloud storage (Dropbox, Google Drive)
- Import on other devices

---

### 3. Search Index Rebuild Performance

**Status:** 🟢 Medium  
**Category:** Performance

**Current State:**
- Full search index rebuild can be slow with large datasets
- UI blocks during indexing
- No progress indicator

**Impact:**
- Poor UX during initial load or after bulk import
- Appears frozen on large datasets
- User may close browser thinking app crashed

**Proposed Solution:**
- Background indexing with Web Workers
- Incremental indexing (update only changed entities)
- Progress bar for rebuild operations
- Pause/resume capability

**Workaround:**
- Avoid force rebuild unless necessary
- Import in smaller batches
- Wait patiently during initial load

---

### 4. No Attachment Support

**Status:** 🟢 Medium  
**Category:** Features

**Current State:**
- Only text and markdown supported
- No image upload
- No PDF attachments
- External images via URL only

**Impact:**
- Cannot include diagrams locally
- Dependent on external image hosting
- No offline image support
- Limited question types (e.g., image-based questions)

**Proposed Solution:**
- File attachment system
- Base64 encoding for small images
- IndexedDB blob storage
- Image optimization
- PDF viewer integration

**Workaround:**
- Host images externally (imgur, image hosting services)
- Use base64 data URLs (not recommended for large images)
- Link to external documents

---

### 5. Limited Localization

**Status:** 🟢 Medium  
**Category:** Internationalization

**Current State:**
- English interface
- Tag localization partially implemented
- No language switching
- Date/time formatting not localized

**Impact:**
- Limited accessibility for non-English users
- Harder adoption in non-English regions
- Tag system supports multilingual but UI doesn't

**Proposed Solution:**
- Full i18n implementation
- RTL language support
- Localized date/time
- Community translations
- Language switcher in UI

**Workaround:**
- Use browser translation
- English-only interface
- Manual translation of content

---

## Low Priority Issues 🔵

### 6. No Keyboard Shortcuts

**Status:** 🔵 Low  
**Category:** UX

**Description:** No keyboard shortcuts for common operations (save, navigate, search).

**Workaround:** Use mouse/touch interface.

---

### 7. No Dark Mode Preference Persistence

**Status:** 🔵 Low  
**Category:** UI

**Description:** Dark mode preference not saved between sessions.

**Workaround:** Manually toggle each session.

---

### 8. Limited Question Type Extensibility

**Status:** 🔵 Low  
**Category:** Architecture

**Description:** Adding new question types requires core changes.

**Proposed Solution:** Plugin system for custom question types.

---

### 9. No Undo/Redo for Edits

**Status:** 🔵 Low  
**Category:** Features

**Description:** Cannot undo question/paper edits.

**Workaround:** Export before major changes.

---

### 10. Browser Storage Limits

**Status:** 🔵 Low  
**Category:** Limitation

**Description:** IndexedDB has browser-dependent storage limits.

**Workaround:** Regular exports, delete old records.

---

## Planned Features 📋

### 11. Advanced Analytics Dashboard

**Description:** Comprehensive analytics with charts and insights.

**Features:**
- Learning curves over time
- Knowledge gap identification
- Question difficulty calibration
- Predictive analytics

---

### 12. Collaborative Authoring

**Description:** Multi-user content creation.

**Features:**
- Real-time collaboration
- Comment and review system
- Change tracking
- Role-based permissions

---

### 13. Question Bank Management

**Description:** Large-scale question organization.

**Features:**
- Folder hierarchy
- Bulk operations
- Import from standard formats (QTI, Moodle XML)
- Version control with branching

---

### 14. Mobile Applications

**Description:** Native mobile apps.

**Features:**
- React Native apps for iOS/Android
- Offline-first architecture
- Touch-optimized interface
- Mobile-specific features (camera for image questions)

---

### 15. AI-Assisted Authoring

**Description:** AI tools for content creation.

**Features:**
- Question generation from text
- Distractor generation for multiple choice
- Difficulty estimation
- Tag suggestion
- Grammar and clarity checking

---

## Bug Reports Template

When reporting bugs, please include:

1. **Description:** Clear description of the issue
2. **Steps to Reproduce:** How to trigger the bug
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happens
5. **Environment:** Browser, OS, Quizzy version
6. **Screenshots:** If applicable
7. **Data Sample:** Minimal example that reproduces issue (if safe to share)

---

## Contributing

To contribute to bug fixes or feature development:

1. Check this document for planned work
2. Discuss major changes in issues first
3. Follow the coding standards in ARCHITECTURE.md
4. Write tests for new features
5. Update documentation
6. Submit pull request

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Next Review:** After tag system migration
