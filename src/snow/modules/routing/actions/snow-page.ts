import { showToast } from '@violentmonkey/ui';
import { ShadowQuery } from '../../../../utils/ShadowQuery';

function fillField(selector: string, text: string, label: string): void {
  const el = ShadowQuery.find(selector) as HTMLTextAreaElement | null;
  if (!el) {
    showToast(`${label} field not found`, { theme: 'dark' });
    return;
  }
  el.value = text;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  showToast(`${label} filled`, { theme: 'dark' });
}

export function fillWorkNotes(text: string): void {
  fillField('textarea[name*="work_notes"]', text, 'Work notes');
}

export function fillComments(text: string): void {
  fillField('textarea[name*="comments"]', text, 'Comments');
}
