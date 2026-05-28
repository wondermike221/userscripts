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

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function copyTextToClipboard(text: string, mime = 'text/plain') {
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

export async function copyRichTextToClipboard(clipboardItems: ClipboardItem[]) {
  if (!navigator.clipboard) {
    const blb = await clipboardItems[0].getType('text/plain');
    const text = await blb.text();
    fallbackCopyTextToClipboard(text);
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

export function fallbackCopyTextToClipboard(text: string) {
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
  work_func: CallableFunction,
  first_attempt_time: number,
  max_attempt_minutes: number,
  frequency: number,
) {
  if (Date.now() > first_attempt_time + max_attempt_minutes * 60000) return;

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

export function waitForElm(selector: string) {
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
  url: string,
  method = 'GET',
  payload: string | null = null,
): Promise<string> {
  return new Promise(function (resolve, reject) {
    GM_xmlhttpRequest({
      url,
      method,
      data: payload ?? undefined,
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
export function convertPlainTextToHTMLTable(plainText: string) {
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
export function convertHTMLTableToPlainText(htmlTable: string) {
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
  plainText: string,
  rowIndex: number,
  colIndex: number,
  newValue: string,
) {
  const rows = plainText.trim().split('\n');
  rows[rowIndex] = rows[rowIndex]
    .split('\t')
    .map((cell, i) => (i === colIndex ? newValue : cell))
    .join('\t');
  return rows.join('\n');
}

// Gets the value of a specific cell in a plain text table
export function getPlainTextTableCell(
  plainText: string,
  rowIndex: number,
  colIndex: number,
) {
  const rows = plainText.trim().split('\n');
  return rows[rowIndex].split('\t')[colIndex].trim();
}

// Edits a specific cell in an HTML table
export function editHTMLTableCell(
  htmlTable: string,
  rowIndex: number,
  colIndex: number,
  newValue: string,
) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlTable, 'text/html');
  const cell = doc.querySelectorAll('tr')[rowIndex].querySelectorAll('td, th')[
    colIndex
  ];
  cell.textContent = newValue;
  return doc.body.innerHTML;
}

// Gets the value of a specific cell in an HTML table
export function getHTMLTableCell(
  htmlTable: string,
  rowIndex: number,
  colIndex: number,
) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlTable, 'text/html');
  const cell = doc.querySelectorAll('tr')[rowIndex].querySelectorAll('td, th')[
    colIndex
  ];
  return cell.textContent.trim();
}
