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

### 1. ~~Tag System Architectural Issue~~ ✅ COMPLETED

**Status:** ✅ Completed
**Category:** Architecture

The tag system has been successfully migrated from string-based to ID-based architecture in database v6. This provides:
- Centralized tag management
- Easy tag renaming across all content
- Tag merging capabilities
- Multilingual support
- Referential integrity

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

### 3. ~~Search Index Rebuild Performance~~ ✅ COMPLETED

**Status:** ✅ Completed
**Category:** Performance

The search index rebuild performance has been optimized with incremental indexing. Search indices are only updated for entities with the `searchCacheInvalidated` flag, significantly improving performance.

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

## Future Roadmaps 📋

For comprehensive implementation plans, see dedicated roadmap documents:

### Mobile Web, PWA, and Offline Access
**Document:** [MOBILE_PWA_ROADMAP.md](MOBILE_PWA_ROADMAP.md)

**Overview:** Transform Quizzy into a mobile-first Progressive Web App with enhanced offline capabilities.

**Key Features:**
- Mobile-optimized responsive design
- PWA with install capabilities and service worker
- Touch gestures and mobile-specific UI
- Offline-first architecture
- Performance optimization for mobile networks
- Native mobile capabilities (share, clipboard, etc.)

**Timeline:** 5.5-7 months (22-28 weeks)

**Status:** Planning Phase

---

### Cloud Synchronization
**Document:** [CLOUD_SYNC_DESIGN.md](CLOUD_SYNC_DESIGN.md)

**Overview:** Add optional cloud synchronization for multi-device support while maintaining offline-first design.

**Key Features:**
- Multi-device sync with conflict resolution
- Hono-based backend (simple and extensible)
- JWT authentication
- Optional end-to-end encryption
- WebSocket for real-time updates
- Self-hosting support

**Timeline:** 6-9 months (25-36 weeks)

**Status:** Design Phase

---

## Planned Features 📋

### 10.1. ~~Enhanced Import/Export System for Complete Quiz Papers~~ ✅ COMPLETED

**Status:** ✅ Completed
**Category:** Data Management / Import/Export

A comprehensive import/export system has been implemented with:
- Multiple export formats (separate, complete, human-readable)
- Automatic tag reconciliation on import
- Question conflict resolution with user interaction
- Batch operations and translations (EN/JA/ZH)
- Full portability and backward compatibility

See [EXPORT_IMPORT_GUIDE.md](EXPORT_IMPORT_GUIDE.md) for complete documentation.

### 11. Advanced Analytics Dashboard

**Status:** 📋 Planned  
**Category:** Features / Analytics

**Description:** Comprehensive analytics with charts and insights.

**Features:**
- Learning curves over time
- Knowledge gap identification
- Question difficulty calibration
- Predictive analytics
- Visual charts and graphs

---

### 12. Collaborative Authoring

**Status:** 📋 Planned  
**Category:** Features / Collaboration

**Description:** Multi-user content creation.

**Features:**
- Real-time collaboration
- Comment and review system
- Change tracking
- Role-based permissions
- Shared question banks

**Note:** Depends on cloud sync implementation (see [CLOUD_SYNC_DESIGN.md](CLOUD_SYNC_DESIGN.md))

---

### 13. Question Bank Management

**Status:** 📋 Planned  
**Category:** Features / Organization

**Description:** Large-scale question organization.

**Features:**
- Folder hierarchy
- Bulk operations
- Import from standard formats (QTI, Moodle XML)
- Version control with branching
- Advanced filtering and search

---

### 14. Native Mobile Applications

**Status:** 📋 Planned (Low Priority)  
**Category:** Platform / Mobile

**Description:** Native mobile apps (after PWA implementation).

**Note:** PWA implementation should be prioritized first (see [MOBILE_PWA_ROADMAP.md](MOBILE_PWA_ROADMAP.md)). Native apps may be considered later if PWA limitations are encountered.

**Potential Features:**
- React Native apps for iOS/Android
- Native performance optimization
- Deep OS integration
- Camera for image questions
- Advanced offline capabilities

---

### 15. AI-Assisted Authoring

**Status:** 📋 Planned  
**Category:** Features / AI

**Description:** AI tools for content creation.

**Features:**
- Question generation from text
- Distractor generation for multiple choice
- Difficulty estimation
- Tag suggestion
- Grammar and clarity checking
- Translation support

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
