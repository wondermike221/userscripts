function __init() {
    //add spinner
    //const spinner_container = spinner_setup();
  }
  
  var SPINNER_CSS = `.spinner {
      border: 16px solid #f3f3f3; /* Light grey */
      border-top: 16px solid #3498db; /* Blue */
      border-radius: 50%;
      width: 120px;
      height: 120px;
      animation: spin 2s linear infinite;
    
      position: absolute;
      left: 50%;
      top: 50%;
      translate: -100% -100%;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .spinner-container {
      display: block;
      position: fixed;
      height: 100vh;
      width: 100vw;
      top: 0;
      bottom: 0;
      right: 0;
      left: 0;
      background-color:rgba(0, 0, 0, 0.5);
      z-index: 2;
      cursor: pointer;
    }
    
    .spinner-container.hidden {
      display: none;
    }`;
  
  function spinner_setup() {
    //add spinner css to page
    const style = document.createElement("style");
    style.textContent = SPINNER_CSS;
    document.head.append(style);
  
    //add spinner to page as hidden;
    const container = document.createElement("div");
    container.classList.add("spinner-container", "hidden");
    container.setAttribute("id", "scraper_spinner");
    container.addEventListener("click", (e) => {
      container.classList.toggle("hidden");
    });
    //const textNode = document.createTextNode("Scraping...");
    const spinner = document.createElement("div");
    spinner.classList.add("spinner");
    //container.append(textNode);
    container.append(spinner);
    document.body.append(container);
    return container;
  }
  
  function notify({ title, icon, body }) {
    checkPermission().then((pr) => {
      if (typeof Notification === "undefined" || pr === false) {
        alert("Done");
        return;
      }
      return new Notification(title, { body, icon });
    });
  }
  
  function checkPermission() {
    let perm = Notification.permission;
    if (perm === "granted") {
      return Promise.resolve(true);
    } else if (perm === "denied") {
      return Promise.resolve(false);
    } else {
      return Notification.requestPermission();
    }
  }
  
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function copyTextToClipboard(text, mime="text/plain") {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    const type = mime
    const blob = new Blob([text], {type})
    const data = [new ClipboardItem({ [type]: blob})]
  
    navigator.clipboard.write(data)
    .then(
      function () {
        console.log("Async: Copying to clipboard was successful!");
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  }
  
  function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
  
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      var successful = document.execCommand("copy");
      var msg = successful ? "successful" : "unsuccessful";
      console.log("Fallback: Copying text command was " + msg);
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
    }
  
    document.body.removeChild(textArea);
  }
  
  function poll(work_func, first_attempt_time, max_attempt_minutes, frequency) {
    let firstAttempt = new Date(first_attempt_time)
    if((first_attempt_time + new Date(firstAttempt.getTime() + max_attempt_minutes*60000)) < new Date()) return
  
    let work_result = work_func();
    if(!work_result) {
      setTimeout(poll, frequency, work_func, first_attempt_time, max_attempt_minutes, frequency)
    }
  
  }
  
  function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
  
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });
  
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
  }
  
  class Shipment {
      name = "";
      email = "";
      what = "";
      address1 = "";
      address2 = "";
      zip = "";
      city = "";
      state = "";
      phone = "";
      work_order = "";
      cost_center = "";
      qty = "";
      constructor(row) {
        let cols = row.split("\t");
        this.what = cols[2];
        this.qty = cols[3];
        this.work_order = cols[4];
        this.email = cols[5];
        this.cost_center = cols[6];
        this.name = cols[7];
        this.address1 = cols[8];
        this.address2 = cols[9];
        this.city = cols[10];
        this.state = cols[11].toUpperCase();
        this.zip = cols[12];
        this.phone = cols[13];
      }
  }
  
  async function makeRequest(url, method="GET", payload=null) {
    return new Promise(function(resolve, reject) {
      GM.xmlhttpRequest({
        url,
        method,
        data: payload,
        onload: r => {
          if(r.status === 200) {
            resolve(r.responseText)
          } else {
            reject(new Error(`Request failed with status ${r.status}`))
          }
        },
        onerror: e => reject(new Error("Request failed"))
      })
    })
  }
  
  // Converts a plain text table to an HTML table
  function convertPlainTextToHTMLTable(plainText) {
    const rows = plainText.trim().split('\n');
    const htmlRows = rows.map(row => {
      const cells = row.split('\t').map(cell => `<td>${cell.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    });
    return `<table>${htmlRows.join('')}</table>`;
  }
  
  // Converts an HTML table to a plain text table
  function convertHTMLTableToPlainText(htmlTable) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlTable, 'text/html');
    const rows = Array.from(doc.querySelectorAll('tr'));
    const plainTextRows = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent.trim()).join('\t');
      return cells;
    });
    return plainTextRows.join('\n');
  }
  
  // Edits a specific cell in a plain text table
  function editPlainTextTableCell(plainText, rowIndex, colIndex, newValue) {
    const rows = plainText.trim().split('\n');
    rows[rowIndex] = rows[rowIndex].split('\t').map((cell, i) => i === colIndex ? newValue : cell).join('\t');
    return rows.join('\n');
  }
  
  // Gets the value of a specific cell in a plain text table
  function getPlainTextTableCell(plainText, rowIndex, colIndex) {
    const rows = plainText.trim().split('\n');
    return rows[rowIndex].split('\t')[colIndex].trim();
  }
  
  // Edits a specific cell in an HTML table
  function editHTMLTableCell(htmlTable, rowIndex, colIndex, newValue) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlTable, 'text/html');
    const cell = doc.querySelectorAll('tr')[rowIndex].querySelectorAll('td, th')[colIndex];
    cell.textContent = newValue;
    return doc.body.innerHTML;
  }
  
  // Gets the value of a specific cell in an HTML table
  function getHTMLTableCell(htmlTable, rowIndex, colIndex) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlTable, 'text/html');
    const cell = doc.querySelectorAll('tr')[rowIndex].querySelectorAll('td, th')[colIndex];
    return cell.textContent.trim();
  }