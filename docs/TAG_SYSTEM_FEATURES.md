# Tag System Features

## Overview

The Quizzy tag system uses an ID-based architecture that provides powerful tag management capabilities. Tags can be used to organize questions and papers by knowledge points, categories, or any custom classification.

**Key Features:**
- ✅ Centralized tag management
- ✅ Tag search and filtering
- ✅ Rename tags globally
- ✅ Merge duplicate tags
- ✅ Multilingual tag names
- ✅ Tag alternatives (aliases)
- ✅ Automatic tag suggestions
- ✅ Backward compatibility with string-based tags

---

## Tag Management Interface

### Accessing Tag Management

**Option 1:** Settings Page
- Navigate to Settings
- Find the tag management section

**Option 2:** Tag Management Page
- Dedicated page for comprehensive tag management
- Full table view of all tags with search and filtering

### Features

#### 1. View All Tags

Browse all tags in a table format:
- **Name**: Primary tag name
- **Alternatives**: Alternative names/aliases
- **ID**: Unique identifier
- **Actions**: Edit, Delete buttons

#### 2. Search & Filter

Search tags by:
- Primary name
- Alternative names
- Case-insensitive matching

**Usage:**
```
Type in search box: "java"
Results: "JavaScript", "Java", and any tags with "java" in alternatives
```

#### 3. Rename Tags

Edit tag names inline:
1. Click "Edit" button on any tag
2. Modify the name
3. Click "Save"
4. **All questions and papers automatically reflect the change**

**Example:**
```
Before: Tag name = "js"
After:  Tag name = "JavaScript"
Result: All questions with this tag now show "JavaScript"
```

#### 4. Merge Duplicate Tags

Combine multiple tags into one:
1. Select 2 or more tags using checkboxes
2. Click "Merge Tags" button
3. First selected tag becomes the primary tag
4. **All questions/papers using merged tags are updated automatically**

**Example:**
```
Tags to merge: "javascript", "js", "JavaScript"
Action: Select all three, click Merge
Result: All become "javascript" (first selected)
        Questions using any of these now use the merged tag
```

#### 5. Delete Tags

Remove unused tags:
1. Click "Delete" button on any tag
2. Confirm deletion
3. Tag is soft-deleted (marked as deleted)

**Note:** Questions/papers will still reference the tag ID, but the tag won't appear in lists.

---

## Using Tags in Questions & Papers

### Adding Tags

**In Question/Paper Editor:**
1. Click on the tags field
2. Start typing tag name
3. Tag suggestions appear as you type
4. Select existing tag or create new one
5. Tag is automatically saved as an ID reference

**Creating New Tags:**
- Simply type a new tag name
- System automatically creates a new tag entity
- New tag is available for all questions/papers

### Tag Suggestions

As you type, the system shows:
- Existing tags that match
- Tag alternatives (aliases)
- Recently used tags

### Tag Display

Tags are displayed with:
- **Categories**: Outlined style for visual distinction
- **Tags**: Filled style
- Automatic name resolution from tag IDs

---

## Search by Tags

### Basic Search

Search questions or papers by tags:
1. Go to Tags page
2. Select one or more tags
3. Click "Search by Tags"
4. Results show all questions/papers with selected tags

### Advanced Search

The tag search supports:
- Multiple tag selection (OR logic)
- Both tag IDs and names
- Legacy string-based tags
- Tag alternatives

**Search Logic:**
```
Tags selected: ["JavaScript", "React"]
Results: Questions with "JavaScript" OR "React" OR both
Scoring: Questions with both tags rank higher
```

---

## Technical Details

### Tag Entity Structure

```typescript
type Tag = {
  id: ID;                              // Unique identifier
  mainName: string;                    // Primary display name
  mainNames: Record<string, string>;   // Localized names
  alternatives: string[];              // Alternative names/aliases
  deleted?: boolean;                   // Soft delete flag
  lastUpdate?: number;                 // Last modification timestamp
  currentVersion?: string;             // Version control
};
```

### Question/Paper Tag Fields

```typescript
type Question = {
  // New ID-based system (recommended)
  tagIds?: ID[];          // Array of tag IDs
  categoryIds?: ID[];     // Array of category IDs
  
  // Legacy string-based (deprecated, for compatibility)
  tags?: string[];
  categories?: string[];
  
  // ... other fields
};
```

### Tag Resolution in UI

Tags are automatically resolved using the `useTagResolver` hook:

```typescript
const { displayTags, displayCategories } = useTagResolver(
  question.tags,        // fallback strings
  question.tagIds,      // primary IDs
  question.categories,
  question.categoryIds
);
```

---

## Best Practices

### Naming Conventions

**DO:**
- Use clear, descriptive names: "JavaScript", "Object-Oriented Programming"
- Use consistent capitalization: "JavaScript" not "javascript" or "JAVASCRIPT"
- Use full names for primary tag, abbreviations as alternatives

**DON'T:**
- Use special characters unless necessary
- Use overly generic names: "programming", "coding"
- Create duplicate tags with different spellings

### Organizing Tags

**Categories vs Tags:**
- **Categories**: Broad classification (e.g., "Frontend", "Backend", "Database")
- **Tags**: Specific topics (e.g., "React", "SQL", "Authentication")

**Example Organization:**
```
Question: "What is React Context API?"
Categories: ["Frontend", "JavaScript"]
Tags: ["React", "State Management", "Context API"]
```

### Tag Maintenance

**Regular Review:**
1. Check for duplicate tags monthly
2. Merge similar tags
3. Rename unclear tags to more descriptive names
4. Clean up unused tags

**Merging Strategy:**
```
Step 1: Identify duplicates
  - "javascript", "js", "JavaScript"
  
Step 2: Decide on primary name
  - Choose "JavaScript" (official name)
  
Step 3: Add alternatives
  - Keep "js" as alternative
  - Remove duplicate "javascript"
  
Step 4: Merge all tags
```

---

## Keyboard Shortcuts

**Tag Management Page:**
- `Ctrl/Cmd + F`: Focus search box
- `Space`: Toggle tag selection (when focused)
- `Enter`: Confirm edit (when editing)
- `Escape`: Cancel edit (when editing)

**Tag Selection Dialog:**
- `Enter`: Save tag
- `Escape`: Cancel

---

## Troubleshooting

### Tags Not Appearing in Search

**Problem:** Added tags don't show in search results

**Solution:**
1. Go to Settings
2. Enable "Force Refresh"
3. Click "Refresh Search Indices"
4. Wait for completion

### Duplicate Tags After Import

**Problem:** Imported data created duplicate tags

**Solution:**
1. Go to Tag Management page
2. Search for duplicates
3. Select all duplicates
4. Click "Merge Tags"

### Tag Name Not Updating

**Problem:** Renamed tag but questions still show old name

**Solution:**
1. Check if questions were migrated to use tag IDs
2. Run migration from Settings page if needed
3. Refresh the page
4. Clear browser cache if issue persists

### Cannot Delete Tag

**Problem:** Delete button doesn't work

**Solution:**
- Tags can only be soft-deleted
- Questions/papers still reference the tag ID
- To fully remove, edit affected questions/papers first
- Then delete the tag

---

## API Usage

### For Plugin Developers

**Get Tag by Name:**
```typescript
const tag = await controller.getTag("JavaScript");
// Creates tag if doesn't exist
```

**Get Tag by ID:**
```typescript
const tag = await controller.getTagById(tagId);
```

**List All Tags:**
```typescript
const tags = await controller.listTags();
```

**Update Tag:**
```typescript
await controller.updateTag(tagId, {
  mainName: "New Name",
  mainNames: { en: "New Name", ja: "新しい名前" }
});
```

**Merge Tags:**
```typescript
const mergedId = await controller.mergeTags([id1, id2, id3]);
```

**Delete Tag:**
```typescript
const success = await controller.deleteTag(tagId);
```

---

## Localization

Tags support multilingual names:

```typescript
const tag = {
  id: "tag-123",
  mainName: "JavaScript",
  mainNames: {
    en: "JavaScript",
    ja: "ジャバスクリプト",
    zh: "JavaScript"
  },
  alternatives: ["js", "JS"]
};
```

**Display Logic:**
1. Check `mainNames[currentLanguage]`
2. Fall back to `mainName` if not available
3. Show alternatives in tooltip/dropdown

---

## Migration Notes

### Automatic Migration

When upgrading to database v6:
- All string-based tags are converted to tag entities
- Questions/papers get `tagIds` and `categoryIds` fields
- Old string fields are kept for compatibility
- Search works with both formats

### Manual Migration

Available in Settings page:
- Click "Migrate Tags to ID System"
- View statistics after completion
- Safe to run multiple times

For complete migration details, see [TAG_MIGRATION_GUIDE.md](TAG_MIGRATION_GUIDE.md).

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Related Documents:**
- [TAG_MIGRATION_GUIDE.md](TAG_MIGRATION_GUIDE.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BUGS_AND_TODO.md](BUGS_AND_TODO.md)
