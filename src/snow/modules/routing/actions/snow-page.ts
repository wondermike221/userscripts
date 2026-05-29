import { showToast } from '@violentmonkey/ui';

export function fillWorkNotes(text: string): void {
  const el = document.querySelector(
    'textarea[id*="work_notes"]',
  ) as HTMLTextAreaElement | null;
  if (!el) {
    showToast('Work notes field not found', { theme: 'dark' });
    return;
  }
  el.value = text;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  showToast('Work notes filled', { theme: 'dark' });
}

export function fillComments(text: string): void {
  const el = document.querySelector(
    'textarea[id*="comments"]',
  ) as HTMLTextAreaElement | null;
  if (!el) {
    showToast('Comments field not found', { theme: 'dark' });
    return;
  }
  el.value = text;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  showToast('Comments filled', { theme: 'dark' });
}
