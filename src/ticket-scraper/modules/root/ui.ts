export function addTitles() {
  const cellsWithText = document.querySelectorAll('span[ng-cell-text]');
  for (const cell of cellsWithText) {
    cell.setAttribute('title', cell.textContent);
  }
}

export function addTitle(node) {
  node.setAttribute('title', node.textContent);
}

const SPINNER_STYLES = `.scraper-loading-spinner {
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
  
  #loading-spinner-container {
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
  
  #loading-spinner-container.hidden {
    display: none;
  }`;

export function addLoadingSpinner() {
  // create styles element
  const style = document.createElement('style');
  style.textContent = SPINNER_STYLES;

  // create spinner element
  const spinner = document.createElement('div');
  spinner.classList.add('scraper-loading-spinner');

  // create spinner-container element
  const spinnerContainer = document.createElement('div');
  spinnerContainer.setAttribute('id', 'loading-spinner-container');
  spinnerContainer.classList.add('hidden');
  spinnerContainer.appendChild(spinner);

  // add click handler
  spinnerContainer.addEventListener('click', () => {
    spinnerContainer.classList.toggle('hidden');
  });

  // add to body
  document.head.appendChild(style);
  document.body.appendChild(spinnerContainer);
}
