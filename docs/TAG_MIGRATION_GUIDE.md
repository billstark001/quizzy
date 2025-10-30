# Tag System Migration Guide

## Overview

The Quizzy tag system has been upgraded from a string-based to an ID-based architecture. This guide explains the migration process, benefits, and how to use the new system.

**Version:** Database v6  
**Status:** Completed  
**Date:** 2025

---

## What Changed?

### Before Migration (Database v5 and earlier)

Questions and papers stored tags as string arrays:

```typescript
type Question = {
  tags?: string[];        // e.g., ["javascript", "programming"]
  categories?: string[];  // e.g., ["frontend", "basics"]
  // ...
};
```

**Problems with this approach:**
- Renaming a tag required updating every question/paper manually
- Duplicate tags with different spellings were common
- No referential integrity
- Inconsistent search results
- Inaccurate statistics

### After Migration (Database v6)

Questions and papers now reference tag IDs:

```typescript
type Question = {
  tags?: string[];        // Deprecated, kept for backward compatibility
  categories?: string[];  // Deprecated, kept for backward compatibility
  tagIds?: ID[];          // New ID-based tags
  categoryIds?: ID[];     // New ID-based categories
  // ...
};
```

**Benefits:**
- ✅ Rename tags once, changes apply everywhere
- ✅ Merge duplicate tags easily
- ✅ Consistent tag names across all content
- ✅ Better search results
- ✅ Accurate statistics
- ✅ Improved performance

---

## Migration Process

### Automatic Migration

The migration happens automatically when you upgrade to database version 6:

1. **Database Connection**: When the app connects to the database, it checks if migration is needed
2. **Tag Creation**: All unique tag strings are collected and tag entities are created
3. **ID Assignment**: Each question and paper gets `tagIds` and `categoryIds` arrays
4. **Status Tracking**: Migration status is saved to prevent duplicate migrations

**What gets migrated:**
- All questions with tags or categories
- All papers with tags or categories
- Tag entities are created for each unique string

### Manual Migration

You can also trigger migration manually from the Settings page:

1. Navigate to **Settings** page
2. Look for the **"Migrate Tags to ID System"** button
3. Click the button to start migration
4. View migration statistics (questions updated, papers updated, tags created)

**When to use manual migration:**
- If automatic migration failed
- If you imported old data after initial migration
- To re-run migration for verification

---

## Using the New System

### For Users

#### Viewing Tags

Tags are displayed the same way as before. The system automatically resolves tag IDs to display names.

#### Searching by Tags

Search functionality works with both old string tags and new ID-based tags:

```
Search: "javascript programming"
Results: Questions/papers with matching tag IDs or legacy string tags
```

#### Tag Management

**Tag Management Page:**

Navigate to Settings or the dedicated Tag Management page to manage your tags:

**Features:**
- **View All Tags**: Browse all tags with their IDs and alternatives
- **Search Tags**: Filter tags by name or alternative names
- **Rename Tags**: Edit tag names inline - changes apply to all questions/papers automatically
- **Merge Tags**: Select multiple tags and merge them into one
  - Select 2 or more tags using checkboxes
  - Click "Merge Tags" button
  - The first selected tag becomes the primary tag
  - All questions/papers using merged tags are automatically updated
- **Delete Tags**: Remove unused tags with confirmation
- **View Alternatives**: See all alternative names (aliases) for each tag

**In Question/Paper Editor:**
- Click on tags to add/edit them
- Tags are automatically created if they don't exist
- Tag suggestions appear as you type
- Tags are saved as IDs, not strings

### For Developers

#### Creating Questions/Papers

When creating new questions or papers, use tag IDs:

```typescript
const question: Question = {
  content: "What is a closure in JavaScript?",
  tagIds: ["tag-id-javascript", "tag-id-closures"],
  categoryIds: ["tag-id-programming"],
  // ...
};
```

To get or create a tag:

```typescript
const tag = await controller.getTag("javascript");
// Returns existing tag or creates new one
```

#### Accessing Tags

```typescript
// Get tag by name (creates if doesn't exist)
const tag = await controller.getTag("javascript");

// Get tag by ID
const tag = await controller.getTagById(tagId);

// Get multiple tags by IDs
const tags = await controller.getTagsByIds([id1, id2, id3]);

// List all tags
const tags = await controller.listTags();

// Get tag name for display
const tagName = tag.mainName;
const localizedName = tag.mainNames[currentLanguage] || tag.mainName;
```

#### Resolving Tag IDs in UI Components

Use the `useTagResolver` hook to automatically resolve tag IDs to Tag objects:

```typescript
import { useTagResolver } from "@/hooks/useTagResolver";

const MyComponent = ({ question }) => {
  // Automatically resolves tagIds to Tag objects
  const { displayTags, displayCategories, isLoading } = useTagResolver(
    question.tags,      // fallback string tags
    question.tagIds,    // new ID-based tags
    question.categories,
    question.categoryIds
  );

  return (
    <div>
      <TagDisplay tags={displayCategories} isCategory />
      <TagDisplay tags={displayTags} />
    </div>
  );
};
```

#### Search Functions

Search automatically works with both formats:

```typescript
// Searches both string tags and ID-based tags
const results = await controller.findQuestionByTags("javascript");
const paperResults = await controller.findQuizPaperByTags("programming");
```

---

## Migration Status

### Check Migration Status

**In Settings Page:**
- Migration button is disabled if migration is complete
- Status shows completion date and statistics

**Programmatically:**

```typescript
// Check if migration is complete
const isComplete = await controller.isTagMigrationCompleted();

// Get detailed status
const status = await controller.getMigrationStatus();
console.log(status.completed);      // true/false
console.log(status.timestamp);      // migration timestamp
console.log(status.result);         // {questionsUpdated, papersUpdated, tagsCreated}
```

---

## Troubleshooting

### Migration Didn't Run Automatically

**Symptoms:**
- Questions/papers still only have `tags` arrays, no `tagIds`
- Search results seem incomplete

**Solution:**
1. Go to Settings page
2. Click "Migrate Tags to ID System" button
3. Verify migration completed message appears

### Some Tags Are Missing

**Symptoms:**
- Some questions show tag IDs but no display names
- Tag selector missing some tags

**Possible Causes:**
- Tags were added after migration
- Tag was deleted

**Solution:**
1. Check if tag exists: Settings > Tags page
2. If missing, it may have been deleted - recreate it
3. Run migration again if needed

### Search Not Finding Questions

**Symptoms:**
- Tag search returns no results
- Full-text search works but tag search doesn't

**Solution:**
1. Go to Settings page
2. Enable "Force Refresh" switch
3. Click "Refresh Search Indices"
4. Wait for completion

### Duplicate Tags After Migration

**Symptoms:**
- Multiple tags with similar names (e.g., "javascript", "JavaScript", "js")

**Solution:**
1. Go to Tags page
2. Select duplicate tags
3. Use merge function to combine them
4. The merged tag will be used in all questions/papers

---

## Data Model Reference

### Question/Paper Structure

```typescript
type Question = {
  id: ID;
  
  // Deprecated string-based tags (kept for backward compatibility)
  tags?: string[];
  categories?: string[];
  
  // New ID-based tags
  tagIds?: ID[];
  categoryIds?: ID[];
  
  // Other fields...
  content: string;
  type: 'choice' | 'blank' | 'text';
  // ...
};
```

### Tag Entity Structure

```typescript
type Tag = {
  id: ID;                              // Unique identifier
  mainName: string;                    // Primary display name
  mainNames: Record<string, string>;   // Localized names (e.g., {en: "JavaScript", ja: "ジャバスクリプト"})
  alternatives: string[];              // Alternative names/aliases
  deleted?: boolean;                   // Soft delete flag
  lastUpdate?: number;                 // Last modification timestamp
  currentVersion?: string;             // Version control
};
```

### Database Indexes

New indexes created in database v6:

- **papers.tagIds**: Multi-entry index on paper tag IDs
- **papers.categoryIds**: Multi-entry index on paper category IDs
- **questions.tagIds**: Multi-entry index on question tag IDs
- **questions.categoryIds**: Multi-entry index on question category IDs

---

## Performance Considerations

### Indexing

The new ID-based system provides:
- **Faster searches**: ID comparison is faster than string comparison
- **Smaller indexes**: IDs are shorter than tag strings
- **Better caching**: Tag entities are cached for quick lookup

### Memory Usage

- Tag entities are cached in memory
- Tag ID lookups are O(1) operations
- Minimal overhead compared to string-based system

---

## Backward Compatibility

### During Transition

The system maintains both old and new fields during transition:
- `tags` and `categories` (strings) - deprecated
- `tagIds` and `categoryIds` (IDs) - new system

### Search Compatibility

Search functions check both:
1. New `tagIds` and `categoryIds` arrays
2. Legacy `tags` and `categories` arrays

This ensures all data is searchable during and after migration.

### Import/Export

When exporting data:
- Both old and new tag fields are included
- Tag entities are exported separately

When importing data:
- Old string tags are automatically migrated
- New ID-based tags are preserved

---

## API Reference

### Migration Functions

#### `isTagMigrationCompleted()`

Check if tag migration has been completed.

```typescript
const isComplete: boolean = await controller.isTagMigrationCompleted();
```

#### `getMigrationStatus()`

Get detailed migration status information.

```typescript
const status = await controller.getMigrationStatus();
// Returns: {
//   completed: boolean;
//   timestamp?: number;
//   result?: {
//     questionsUpdated: number;
//     papersUpdated: number;
//     tagsCreated: number;
//   };
// }
```

#### `migrateTagsToIds()`

Manually trigger tag migration. Safe to call multiple times (idempotent).

```typescript
const result = await controller.migrateTagsToIds();
// Returns: {
//   questionsUpdated: number;
//   papersUpdated: number;
//   tagsCreated: number;
// }
```

### Tag Management Functions

#### `getTag(name)`

Get existing tag or create new one.

```typescript
const tag: Tag = await controller.getTag("javascript");
```

#### `getTagById(id)`

Get a tag by its ID.

```typescript
const tag: Tag | undefined = await controller.getTagById(tagId);
```

#### `getTagsByIds(ids)`

Get multiple tags by their IDs.

```typescript
const tags: (Tag | undefined)[] = await controller.getTagsByIds([id1, id2, id3]);
```

#### `listTags()`

List all tags.

```typescript
const tags: Tag[] = await controller.listTags();
```

#### `updateTag(id, patch)`

Update tag properties. Changes apply to all questions/papers using this tag.

```typescript
await controller.updateTag(tagId, {
  mainName: "JavaScript",
  mainNames: { en: "JavaScript", ja: "ジャバスクリプト" }
});
```

#### `deleteTag(id)`

Delete a tag (soft delete).

```typescript
const success: boolean = await controller.deleteTag(tagId);
```

#### `mergeTags(ids)`

Merge multiple tags into one. All questions/papers using merged tags are automatically updated to use the first tag ID.

```typescript
const mergedId: ID | undefined = await controller.mergeTags([id1, id2, id3]);
// Returns the ID of the resulting merged tag (the first ID in the array)
```

---

## FAQ

### Q: Will my old data still work?

**A:** Yes, the migration is automatic and preserves all your data. Old string-based tags are converted to ID-based tags.

### Q: Can I undo the migration?

**A:** The old string-based tags are kept in the database for backward compatibility, but there's no automated rollback. If needed, you can export your data, rollback to an older version, and re-import.

### Q: Do I need to update my exports?

**A:** No, the export function includes both old and new tag formats for maximum compatibility.

### Q: How do I know if migration was successful?

**A:** Check the Settings page. If the migration button is disabled and shows a success message with statistics, migration was successful.

### Q: Can I continue using string tags in my code?

**A:** While the system supports string tags for backward compatibility, it's recommended to use tag IDs for all new code. The `getTag()` function makes it easy to get or create tag IDs from strings.

### Q: What happens if I import old data?

**A:** When you import data with string-based tags, the system will automatically create tag entities and migrate them to ID-based tags.

### Q: How do I merge duplicate tags?

**A:** Use the Tag Management page:
1. Navigate to Tag Management (or Settings page)
2. Select 2 or more tags you want to merge using checkboxes
3. Click the "Merge Tags" button
4. All questions and papers using the merged tags will automatically be updated

### Q: Can I rename a tag after it's been created?

**A:** Yes! Use the Tag Management page:
1. Find the tag you want to rename
2. Click the "Edit" button
3. Change the name
4. Click "Save"
5. All questions and papers using this tag will automatically show the new name

### Q: What happens to questions/papers when I delete a tag?

**A:** When you delete a tag, it's soft-deleted (marked as deleted but not removed). Questions and papers will still reference the tag ID, but it won't appear in tag lists. To completely remove tag references, you would need to manually edit the affected questions/papers.

### Q: How does tag search work with the new system?

**A:** Tag search works seamlessly with both string-based (legacy) and ID-based tags. The system builds a Trie cache that includes:
- Tag IDs
- Tag names (mainName)
- Alternative names (aliases)
- Legacy string tags

When you search, the system finds matching tags and returns all questions/papers that use those tags.

---

## Support

For issues or questions about the tag migration:

1. Check this guide for solutions
2. Review the BUGS_AND_TODO.md document
3. Check the ARCHITECTURE.md for technical details
4. Open an issue on GitHub with detailed information about your problem

---

**Last Updated:** 2025  
**Document Version:** 1.1 (Updated with tag management features)  
**Database Version:** 6
