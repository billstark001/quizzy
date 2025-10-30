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

### 1. Tag System Architectural Issue ✅ COMPLETED

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

### 3. Search Index Rebuild Performance ✅ COMPLETED

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

### 10.1. Enhanced Import/Export System for Complete Quiz Papers ✅ COMPLETED

**Status:** ✅ Implemented  
**Category:** Data Management / Import/Export

**Implementation Complete:**

**✅ New Type System:**
- `CompleteQuestion` and `CompleteQuestionDraft` - no foreign keys, tags as strings
- `CompleteQuizPaper` and `CompleteQuizPaperDraft` - embedded questions, string-based tags
- Backward compatibility maintained with legacy types

**✅ Import Features Implemented:**
1. **Tag Reconciliation:**
   - ✅ Automatic tag matching by name, multilingual names, or aliases
   - ✅ Reuses existing tags when matched
   - ✅ Creates new tags when no match found
   - ✅ Builds mapping from string names to tag IDs

2. **Question Conflict Resolution:**
   - ✅ Matches existing questions by title, content, solution, and type
   - ✅ Presents conflicts to user via async callback
   - ✅ User chooses: keep existing, use imported, or keep both
   - ✅ Batch resolution options (keep all/use all/keep both)
   - ✅ Interactive conflict resolution dialog with translations (EN/JA/ZH)

3. **Complete Import Flow:**
   - ✅ Parses complete paper/question format
   - ✅ Reconciles all tags first
   - ✅ Checks each question for duplicates
   - ✅ Resolves conflicts with user input
   - ✅ Converts to standard format with IDs
   - ✅ Imports into database

**✅ Export Options Implemented:**

**Option 1: Separate Export (with IDs)**
- ✅ Exports paper/question, questions array, tags array
- ✅ Keeps all entity IDs
- ✅ Optional: remove search/version indices
- Use case: Backup with referential integrity

**Option 2: Complete Export (no foreign keys)**
- ✅ Exports single CompleteQuizPaperDraft object
- ✅ All questions embedded (no ID references)
- ✅ All tags as string names
- ✅ Optional: keep entity IDs for tracking
- Use case: Self-contained portable format

**Option 3: Human-Readable Export**
- ✅ Generates formatted markdown text
- ✅ Includes all content in readable form
- ✅ Backend implementation complete
- ✅ Works for both papers and questions
- Use case: Printing, sharing, documentation

**✅ Frontend UI Implemented:**
- Export dialog with format selection
- Conflict resolution dialog
- Translations in EN/JA/ZH
- Integration with paper import/export workflows

**Benefits Achieved:**
- ✅ True portability of quiz content
- ✅ No broken references on import
- ✅ Intelligent duplicate detection
- ✅ User control over conflicts
- ✅ Multiple export formats for different needs

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
