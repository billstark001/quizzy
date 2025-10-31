/**
 * Version Management Module
 * 
 * This module provides version management and conflict detection capabilities
 * completely independent from IDB or any database implementation.
 * 
 * Key features:
 * - Version evolution with hash-based version identifiers
 * - Conflict detection for merge operations
 * - Version history tracking
 * - Import conflict resolution logic
 * - Utility functions for version management
 */

export * from './types';
export * from './utils';
export * from './version-core';
export * from './import-handler';
