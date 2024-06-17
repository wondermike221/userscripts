const EXPANDED_STATE = {
  showMoreBtn: false,
  notesTextBox: false,
};

export function expand_things() {
  const showMoreBtn: HTMLElement = document.querySelector(
    'button[ux-id="show-more"]',
  );
  if (EXPANDED_STATE.showMoreBtn || showMoreBtn) {
    showMoreBtn.click();
    EXPANDED_STATE.showMoreBtn = true;
  } else {
    return false;
  }

  const notesTextBox: HTMLElement = document.querySelector(
    '[ux-id="add-note-textbox"]',
  );
  if (EXPANDED_STATE.notesTextBox || notesTextBox) {
    notesTextBox.click();
    EXPANDED_STATE.notesTextBox = true;
  } else {
    return false;
  }

  const statusValue: HTMLElement = document.querySelector(
    '[ux-id="status-value"]',
  );
  statusValue.focus();

  return true;
}

/**
 * Focuses on the search bar
 */
export function focusSearchbar() {
  const searchBtn: HTMLElement = document.querySelector(
    '#header-search_button',
  );
  searchBtn.click();
  //Automatically set to 'All'
  const searchTypeBtn: HTMLElement = document.querySelector(
    'div[ux-id="global-search-dropdown"] ul li a[aria-label="All"]',
  );
  searchTypeBtn.click();
  const searchInput: HTMLInputElement = document.querySelector(
    'input[ux-id="search-text"]',
  );
  searchInput.focus();
}
