# Requirements Document

## Introduction

This feature enhances the existing `copySelectedCells.ts` bookmarklet to work properly on web pages that use Shadow DOM extensively. The original script failed to find selected table cells when they were contained within shadow roots, as it relied on standard DOM querying methods that don't traverse shadow boundaries.

## Requirements

### Requirement 1

**User Story:** As a user running the copySelectedCells bookmarklet on pages with Shadow DOM, I want the script to find and copy selected table cells regardless of whether they're in regular DOM or shadow roots, so that I can extract data from modern web applications that use Web Components.

#### Acceptance Criteria

1. WHEN the bookmarklet runs on a page with shadow DOM THEN the system SHALL traverse into open shadow roots to find selected cells
2. WHEN selected cells exist in both regular DOM and shadow DOM THEN the system SHALL find and copy all selected cells from both contexts
3. WHEN the ShadowQuery utility is used THEN the system SHALL maintain the same selector syntax as the original implementation

### Requirement 2

**User Story:** As a user running the copySelectedCells bookmarklet, I want visual feedback about the operation's success or failure, so that I know whether the copy operation worked and how many cells were processed.

#### Acceptance Criteria

1. WHEN the copy operation succeeds THEN the system SHALL display a notification showing the number of cells copied
2. WHEN the copy operation fails THEN the system SHALL display an error notification
3. WHEN no selected cells are found THEN the system SHALL display a notification indicating no cells were found
4. WHEN a notification is displayed THEN the system SHALL show it as a temporary toast message that disappears after 5 seconds

### Requirement 3

**User Story:** As a developer maintaining the codebase, I want the ShadowQuery utility to have proper TypeScript types and be reusable across other bookmarklets, so that shadow DOM traversal can be consistently implemented throughout the project.

#### Acceptance Criteria

1. WHEN the ShadowQuery utility is defined THEN the system SHALL use proper TypeScript interfaces and type annotations
2. WHEN the ShadowQuery utility is exported THEN the system SHALL make it available for import in other modules
3. WHEN the showNotification function is needed THEN the system SHALL export it from mailto_utils for reuse