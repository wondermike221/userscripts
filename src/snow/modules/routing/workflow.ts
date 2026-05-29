import type {
  ActionItem,
  DirectoryItem,
  DirectoryNode,
  InputItem,
  InputType,
  VirtualItem,
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

  branch: (label: string, load: () => Promise<DirectoryNode>): VirtualItem => ({
    type: 'virtual',
    label,
    mode: 'ephemeral',
    load,
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

export function workflowNode(w: Workflow): VirtualItem {
  return { type: 'virtual', label: w.label, mode: 'persistent', load: w.load };
}
