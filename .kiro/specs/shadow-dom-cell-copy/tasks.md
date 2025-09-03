# Implementation Plan

- [x] 1. Convert ShadowQuery utility to proper TypeScript
  - Convert JSDoc types to TypeScript interfaces and type annotations
  - Add proper export statement for module usage
  - Fix all TypeScript type issues and implicit any types
  - _Requirements: 3.1, 3.2_

- [x] 2. Export showNotification function from mailto_utils
  - Change showNotification from private function to exported function
  - Ensure function remains compatible with existing usage
  - _Requirements: 3.3_

- [x] 3. Integrate ShadowQuery into copySelectedCells bookmarklet
  - Add import statement for ShadowQuery utility
  - Replace document.querySelectorAll with ShadowQuery.findAll
  - Maintain existing selector syntax and functionality
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Add user feedback notifications to copySelectedCells
  - Import showNotification function from mailto_utils
  - Wrap clipboard operation with proper promise handling
  - Add success notification with cell count
  - Add error notification for clipboard failures
  - Add notification for no selected cells scenario
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Test and validate the enhanced bookmarklet
  - Verify shadow DOM traversal works correctly
  - Confirm notifications display properly
  - Test error handling scenarios
  - Validate TypeScript compilation
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_