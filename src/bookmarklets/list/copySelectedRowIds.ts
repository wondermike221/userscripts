import { ShadowQuery } from '../../utils/ShadowQuery';
import { showNotification } from '../../utils/mailto_utils';

// Get all selected cells using ShadowQuery to traverse shadow DOMs
const selectedRows = ShadowQuery.findAll('tr.is-checked') as HTMLElement[]; // Cast to HTMLElement[] for type safety

// Extract text content from each cell
const cellContents: string[] = [];
selectedRows.forEach((row) => {
  cellContents.push(row.dataset.key.split('@').at(-1) || '');
});

// Join contents with newlines for columnar format
const clipboardText = cellContents.join('\n');

// Copy to clipboard
if (clipboardText) {
  navigator.clipboard
    .writeText(clipboardText)
    .then(() => {
      showNotification(`Copied ${selectedRows.length} IDs to clipboard!`);
    })
    .catch((err) => {
      console.error('Failed to copy to clipboard:', err);
      showNotification('Failed to copy to clipboard');
    });
} else {
  showNotification('No selected rows found');
}
