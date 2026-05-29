import type {
  ActionItem,
  DirectoryItem,
  DirectoryNode,
  DirectoryNodeItem,
  InputItem,
  InputType,
  SelectItem,
} from 'rove';

// ── Step builders ─────────────────────────────────────────────────────────────

export const step = {
  action: (label: string, fn: () => void): ActionItem => ({
    type: 'action',
    label,
    action: fn,
  }),

  input: (
    label: string,
    inputType: InputType,
    storageKey: string,
  ): InputItem => ({
    type: 'input',
    label,
    inputType,
    storageKey,
  }),

  kb: (label: string, url: string): ActionItem => ({
    type: 'action',
    label,
    action: () => window.open(url, '_blank'),
  }),

  // Ephemeral pick list — options loaded async, onSelect fires with chosen string
  branch: (
    label: string,
    load: () => Promise<string[]>,
    onSelect: (value: string) => void,
  ): SelectItem => ({
    type: 'select',
    label,
    load,
    onSelect,
  }),
};

// ── DirectoryNode builder ─────────────────────────────────────────────────────

export function buildSteps(steps: [string, DirectoryItem][]): DirectoryNode {
  return Object.fromEntries(steps);
}

// ── Error node ────────────────────────────────────────────────────────────────

export function errorNode(message: string): DirectoryNode {
  return {
    error: { type: 'action', label: `✗ ${message}`, action: () => {} },
  };
}

// ── Workflow type ─────────────────────────────────────────────────────────────

export interface Workflow {
  label: string;
  load: () => Promise<DirectoryNode>;
}

// Lazy directory — first activation calls load(), result cached, navigates in
export function workflowNode(w: Workflow): DirectoryNodeItem {
  return { type: 'directory', label: w.label, load: w.load };
}
