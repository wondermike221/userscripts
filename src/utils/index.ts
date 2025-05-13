// import { showToast } from '@violentmonkey/ui';

export function checkPermission() {
  const perm = Notification.permission;
  if (perm === 'granted') {
    return Promise.resolve(true);
  } else if (perm === 'denied') {
    return Promise.resolve(false);
  } else {
    return Notification.requestPermission();
  }
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function copyTextToClipboard(text, mime = 'text/plain') {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  const type = mime;
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];

  navigator.clipboard.write(data).then(
    function () {
      console.log('Async: Copying to clipboard was successful!');
    },
    function (err) {
      console.error('Async: Could not copy text: ', err);
    },
  );
}

export function copyRichTextToClipboard(clipboardItems) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(clipboardItems);
    return;
  }
  navigator.clipboard.write(clipboardItems).then(
    function () {
      console.log('Async: Copying to clipboard was successful!');
    },
    function (err) {
      console.error('Async: Could not copy text: ', err);
    },
  );
}

export function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    const msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

export function poll(
  work_func,
  first_attempt_time,
  max_attempt_minutes,
  frequency,
) {
  const firstAttempt = new Date(first_attempt_time);
  if (
    first_attempt_time +
      new Date(firstAttempt.getTime() + max_attempt_minutes * 60000) <
    new Date()
  )
    return;

  const work_result = work_func();
  if (!work_result) {
    setTimeout(
      poll,
      frequency,
      work_func,
      first_attempt_time,
      max_attempt_minutes,
      frequency,
    );
  }
}

export function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

export async function makeRequest(
  url,
  method = 'GET',
  payload = null,
): Promise<string> {
  return new Promise(function (resolve, reject) {
    GM_xmlhttpRequest({
      url,
      method,
      data: payload,
      onload: (r) => {
        if (r.status === 200) {
          resolve(r.responseText);
        } else {
          reject(new Error(`Request failed with status ${r.status}`));
        }
      },
      onerror: () => reject(new Error('Request failed')),
    });
  });
}

// Converts a plain text table to an HTML table
export function convertPlainTextToHTMLTable(plainText) {
  const rows = plainText.trim().split('\n');
  const htmlRows = rows.map((row) => {
    const cells = row
      .split('\t')
      .map((cell) => `<td>${cell.trim()}</td>`)
      .join('');
    return `<tr>${cells}</tr>`;
  });
  return `<table>${htmlRows.join('')}</table>`;
}

// Converts an HTML table to a plain text table
export function convertHTMLTableToPlainText(htmlTable) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlTable, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));
  const plainTextRows = rows.map((row) => {
    const cells = Array.from(row.querySelectorAll('td, th'))
      .map((cell) => cell.textContent.trim())
      .join('\t');
    return cells;
  });
  return plainTextRows.join('\n');
}

// Edits a specific cell in a plain text table
export function editPlainTextTableCell(
  plainText,
  rowIndex,
  colIndex,
  newValue,
) {
  const rows = plainText.trim().split('\n');
  rows[rowIndex] = rows[rowIndex]
    .split('\t')
    .map((cell, i) => (i === colIndex ? newValue : cell))
    .join('\t');
  return rows.join('\n');
}

// Gets the value of a specific cell in a plain text table
export function getPlainTextTableCell(plainText, rowIndex, colIndex) {
  const rows = plainText.trim().split('\n');
  return rows[rowIndex].split('\t')[colIndex].trim();
}

// Edits a specific cell in an HTML table
export function editHTMLTableCell(htmlTable, rowIndex, colIndex, newValue) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlTable, 'text/html');
  const cell = doc.querySelectorAll('tr')[rowIndex].querySelectorAll('td, th')[
    colIndex
  ];
  cell.textContent = newValue;
  return doc.body.innerHTML;
}

// Gets the value of a specific cell in an HTML table
export function getHTMLTableCell(htmlTable, rowIndex, colIndex) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlTable, 'text/html');
  const cell = doc.querySelectorAll('tr')[rowIndex].querySelectorAll('td, th')[
    colIndex
  ];
  return cell.textContent.trim();
}

// deprecated
/* export function getCells(i) {
  const data = getDataFromCells();
  let text = '';
  data.forEach((row) => {
    const cell = row[i];
    text = text.concat(`${cell}\n`);
  });
  return text;
}

// deprecated
export function getDataFromCells() {
  const rows = document.querySelectorAll('div[ng-row]');
  const data = [];

  rows.forEach((row, rIdx) => {
    data.push([]);
    const cells = row.querySelectorAll(
      'div[ng-cell] span[ng-cell-text]',
    ) as NodeListOf<HTMLElement>;
    cells.forEach((cell) => data[rIdx].push(cell.outerText));
  });
  return data;
}

// deprecated
export async function getCostCenterFromHub(profileURL) {
  try {
    const r = await makeRequest(profileURL);
    const data = JSON.parse(r).data;
    return data.costCenterCode;
  } catch (e) {
    console.error(e);
    const title = 'Failure!';
    const body =
      'Data was not scraped successfully. Check that the hub is still logged in.';
    showToast(`${title}: ${body}`, { theme: 'dark' });
  }
} */
