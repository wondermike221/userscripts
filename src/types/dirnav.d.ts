/**
 * TypeScript type declarations for solid-dirnav-ui module
 * Based on API documentation and usage examples
 */

declare module 'dirnav' {
  import { JSX } from 'solid-js';

  // Core node types
  export type NodeType = 'directory' | 'action' | 'input' | 'virtual-directory';

  // Base node interface
  export interface BaseNode {
    type: NodeType;
  }

  // Directory node with children
  export interface DirectoryNode extends BaseNode {
    type: 'directory';
    children: Record<string, DirTreeNode>;
  }

  // Action node that executes a function
  export interface ActionNode extends BaseNode {
    type: 'action';
    action: () => void | Promise<void>;
  }

  // Input node for editable values with localStorage persistence
  export interface InputNode extends BaseNode {
    type: 'input';
    localStorageKey: string;
    defaultValue?: string;
  }

  // Virtual directory node that loads content dynamically
  export interface VirtualDirectoryNode extends BaseNode {
    type: 'virtual-directory';
    onSelect: () => Promise<DirTree>;
  }

  // Union type for all possible nodes
  export type DirTreeNode =
    | DirectoryNode
    | ActionNode
    | InputNode
    | VirtualDirectoryNode;

  // Directory tree structure
  export type DirTree = Record<string, DirTreeNode>;

  // Shadow DOM wrapper options
  export interface ShadowDOMWrapperOptions {
    hostId?: string;
    attachToBody?: boolean;
    hostElement?: HTMLElement;
    injectStyles?: boolean;
    customStyles?: string;
  }

  // Fuzzy search configuration
  export interface FuzzySearchConfig {
    maxResults?: number;
    minScore?: number;
    pathWeight?: number;
    nameWeight?: number;
    sequenceWeight?: number;
    exactMatchBonus?: number;
    prefixMatchBonus?: number;
  }

  // Shadow DOM wrapper interface
  export interface ShadowDOMWrapper {
    destroy(): void;
  }

  // Component props
  export interface DirnavUIProps {
    initialTree: DirTree;
  }

  // Main exports
  export function createDirTree(tree: DirTree): DirTree;
  export function DirnavUI(props: DirnavUIProps): JSX.Element;
  export function createShadowDOMWrapper(
    component: () => JSX.Element,
    options?: ShadowDOMWrapperOptions,
  ): ShadowDOMWrapper;

  // Default export (if any)
  const DirNav: {
    createDirTree: typeof createDirTree;
    DirnavUI: typeof DirnavUI;
    createShadowDOMWrapper: typeof createShadowDOMWrapper;
  };

  export default DirNav;
}

// Global debug flag
declare global {
  interface Window {
    DIRNAV_DEBUG?: boolean;
  }
}
