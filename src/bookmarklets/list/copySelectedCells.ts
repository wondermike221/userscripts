import { ShadowQuery } from '../../utils/ShadowQuery';
import { showNotification } from '../../utils/mailto_utils';

// Each entry: [description, selector]. First selector with results wins.
const SELECTORS: [string, string][] = [
  ['SOW workspace', 'td.cell-selected .cell-content'],
  ['Classic UI list view', 'td.list_edit_selected_cell'],
];

let selectedCells: Element[] = [];
for (const [, selector] of SELECTORS) {
  const found = ShadowQuery.findAll(selector);
  if (found.length > 0) {
    selectedCells = found;
    break;
  }
}

const cellContents: string[] = selectedCells.map(
  (cell) => cell.textContent?.trim() || '',
);

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
