# Design Document

## Overview

This enhancement modifies the `copySelectedCells.ts` bookmarklet to support Shadow DOM traversal and adds user feedback notifications. The solution leverages an existing `ShadowQuery` utility and integrates with the notification system from `mailto_utils`.

## Architecture

The solution consists of three main components:

1. **ShadowQuery Utility**: A TypeScript utility that provides shadow DOM-aware querying methods
2. **Enhanced copySelectedCells Script**: The modified bookmarklet that uses ShadowQuery instead of standard DOM methods
3. **Notification System**: Reused notification functionality from mailto_utils for user feedback

## Components and Interfaces

### ShadowQuery Interface

```typescript
interface ShadowQueryInterface {
    find(selector: string, root?: Element | Document | ShadowRoot): Element | null;
    findAll(selector: string, root?: Element | Document | ShadowRoot): Element[];
    closest(selector: string, element: Element): Element | null;
    getHost(element: Element): Element | null;
}
```

### Key Methods

- `findAll()`: Recursively searches through DOM and shadow roots to find all matching elements
- `find()`: Returns the first matching element across shadow boundaries
- `closest()`: Traverses up the DOM tree, crossing shadow boundaries
- `getHost()`: Finds the host element of a shadow root

### Integration Points

1. **Import Integration**: copySelectedCells imports both ShadowQuery and showNotification
2. **Query Replacement**: Standard `document.querySelectorAll()` replaced with `ShadowQuery.findAll()`
3. **Feedback Integration**: Clipboard operations wrapped with success/error notifications

## Data Models

### Cell Selection Model
- Input: CSS selector `'td.cell-selected .cell-content'`
- Processing: Shadow DOM traversal to collect all matching elements
- Output: Array of DOM elements containing cell content

### Notification Model
- Success: "Copied X cells to clipboard!" with actual count
- Error: "Failed to copy to clipboard"
- No Data: "No selected cells found"

## Error Handling

1. **Clipboard API Failures**: Caught and displayed via error notification
2. **No Selected Cells**: Detected and communicated to user
3. **Shadow DOM Access**: Gracefully handles closed shadow roots (skips them)
4. **Type Safety**: TypeScript ensures proper parameter types throughout

## Testing Strategy

### Manual Testing Scenarios
1. Test on pages with only regular DOM elements
2. Test on pages with only shadow DOM elements  
3. Test on pages with mixed regular and shadow DOM elements
4. Test error scenarios (clipboard API blocked, no selected cells)
5. Verify notification display and timing (5-second auto-dismiss)

### Browser Compatibility
- Modern browsers supporting Shadow DOM v1
- Clipboard API support required
- Graceful degradation for unsupported features