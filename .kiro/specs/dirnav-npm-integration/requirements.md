# Requirements Document

## Introduction

This feature involves integrating a more complete DirNav implementation from an external GitHub repository (https://github.com/wondermike221/DirNav) into the existing userscripts project as an npm module without publishing it to the public npm registry. This will replace or enhance the minimal DirNav implementation currently in the project and provide better directory navigation capabilities for ServiceNow automation workflows.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to import the DirNav module from my external GitHub repository, so that I can use the more complete implementation in my userscripts without duplicating code.

#### Acceptance Criteria

1. WHEN the project is built THEN the system SHALL successfully resolve and include the DirNav module from the GitHub repository
2. WHEN importing DirNav in TypeScript files THEN the system SHALL provide proper type definitions and IntelliSense support
3. WHEN the npm install command is run THEN the system SHALL download and install the DirNav module from the specified GitHub repository
4. IF the GitHub repository is updated THEN the system SHALL be able to pull the latest changes when dependencies are updated

### Requirement 2

**User Story:** As a developer, I want to configure the DirNav module as a local dependency, so that I can maintain version control and avoid publishing to public npm.

#### Acceptance Criteria

1. WHEN package.json is configured THEN the system SHALL reference the GitHub repository using git+https protocol
2. WHEN the dependency is installed THEN the system SHALL treat it as a regular npm module for import purposes
3. WHEN building the project THEN the system SHALL bundle the DirNav module correctly with the userscripts
4. IF the module has its own dependencies THEN the system SHALL resolve and install them automatically

### Requirement 3

**User Story:** As a developer, I want to replace the existing minimal DirNav implementation, so that I can use the enhanced functionality without conflicts.

#### Acceptance Criteria

1. WHEN the new DirNav module is integrated THEN the system SHALL remove or update any existing minimal DirNav code
2. WHEN importing DirNav THEN the system SHALL use the new module instead of any legacy implementation
3. WHEN the userscripts run THEN the system SHALL provide all enhanced DirNav functionality
4. IF there are breaking changes THEN the system SHALL update existing code to use the new API

### Requirement 4

**User Story:** As a developer, I want proper TypeScript integration, so that I can use DirNav with full type safety and IDE support.

#### Acceptance Criteria

1. WHEN importing DirNav THEN the system SHALL provide complete TypeScript type definitions
2. WHEN using DirNav methods THEN the IDE SHALL show proper autocomplete and parameter hints
3. WHEN building TypeScript THEN the system SHALL compile without type errors
4. IF the DirNav module exports types THEN the system SHALL make them available for import

### Requirement 5

**User Story:** As a developer, I want the integration to work with the existing build system, so that the development and production workflows remain unchanged.

#### Acceptance Criteria

1. WHEN running npm run dev THEN the system SHALL include DirNav in the watch and rebuild process
2. WHEN running npm run build THEN the system SHALL bundle DirNav into the production userscripts
3. WHEN the rollup build process runs THEN the system SHALL properly resolve and include the DirNav module
4. IF DirNav has CSS or other assets THEN the system SHALL include them in the build output