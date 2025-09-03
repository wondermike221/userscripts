import { ShadowQuery } from '../../utils/ShadowQuery';
import { showNotification } from '../../utils/mailto_utils';

// Get all selected cells using ShadowQuery to traverse shadow DOMs
const selectedCells = ShadowQuery.findAll('td.cell-selected .cell-content');

// Extract text content from each cell
const cellContents: string[] = [];
selectedCells.forEach((cell) => {
  cellContents.push(cell.textContent?.trim() || '');
});

// Join contents with newlines for columnar format
const clipboardText = cellContents.join('\n');

// Copy to clipboard
if (clipboardText) {
  navigator.clipboard
    .writeText(clipboardText)
    .then(() => {
      showNotification(`Copied ${selectedCells.length} cells to clipboard!`);
    })
    .catch((err) => {
      console.error('Failed to copy to clipboard:', err);
      showNotification('Failed to copy to clipboard');
    });
} else {
  showNotification('No selected cells found');
}
