// modules/ServiceNowURLParser.ts
import { createSignal, onCleanup } from 'solid-js';

export interface ServiceNowRecordInfo {
  table: string | null;
  sysId: string | null;
  fullMatch: string | null; // e.g., /record/sc_task/sys_id_value
}

const [currentRecord, setCurrentRecord] = createSignal<ServiceNowRecordInfo>({
  table: null,
  sysId: null,
  fullMatch: null,
});

// Regex to capture specific table names and a 32-character hexadecimal sys_id
// It looks for /record/TABLE_NAME/SYS_ID
// TABLE_NAME can be sc_task, sc_req_item, sys_user, alm_hardware
const SN_URL_REGEX =
  /\/record\/(sc_task|sc_req_item|sys_user|alm_hardware|incident)\/([a-f0-9]{32})/i;

function parseUrl(url: string): ServiceNowRecordInfo {
  const match = url.match(SN_URL_REGEX);
  if (match && match[1] && match[2]) {
    return {
      table: match[1],
      sysId: match[2],
      fullMatch: match[0], // The part of the URL like /record/sc_task/sys_id
    };
  }
  return { table: null, sysId: null, fullMatch: null };
}

function updateRecordInfoFromCurrentLocation() {
  const newInfo = parseUrl(location.href);
  // Only update if there's a change to avoid unnecessary re-renders
  if (
    newInfo.table !== currentRecord()?.table ||
    newInfo.sysId !== currentRecord()?.sysId
  ) {
    setCurrentRecord(newInfo);
  }
}

let isInitialized = false;

export function initializeUrlTracking(): void {
  if (isInitialized) {
    return;
  }

  const handleLocationChange = () => {
    updateRecordInfoFromCurrentLocation();
  };

  // Wrap history methods to detect SPA navigation
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    window.dispatchEvent(new Event('locationchangeevent')); // Custom event
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    window.dispatchEvent(new Event('locationchangeevent')); // Custom event
  };

  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('locationchangeevent', handleLocationChange);

  // Initial parse
  handleLocationChange();
  isInitialized = true;

  // Cleanup function for SolidJS onCleanup or if manually called
  const cleanup = () => {
    window.removeEventListener('popstate', handleLocationChange);
    window.removeEventListener('locationchangeevent', handleLocationChange);
    // Restore original history methods if necessary, though often not required for userscripts
    // history.pushState = originalPushState;
    // history.replaceState = originalReplaceState;
    isInitialized = false;
  };

  // If used within a Solid component's setup (like onMount),
  // onCleanup will handle this. If called globally, cleanup needs manual management if desired.
  if (typeof onCleanup === 'function') {
    onCleanup(cleanup);
  }
}

// Export the reactive getter for the current record
export const getCurrentRecord = currentRecord;
