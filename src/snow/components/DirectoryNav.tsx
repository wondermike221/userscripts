// DirectoryNav.tsx
import {
  createSignal,
  createEffect,
  For,
  Show,
  onCleanup,
  createMemo,
} from 'solid-js';
import { Transition } from 'solid-transition-group'; // Make sure to import Transition
import { DirectoryTree, Node, NodeType } from '../modules/DirectoryTree';
import './styles.css';

interface DirectoryNavProps {
  tree: DirectoryTree;
  onLeafAction?: (actionDescription: string, node: Node) => void; // Callback when a leaf node is triggered
}

export function DirectoryNav(props: DirectoryNavProps) {
  const [currentNode, setCurrentNode] = createSignal<Node>(props.tree.root);
  const [isFocused, setIsFocused] = createSignal(false);
  // Determines the animation classes: 'slide-forward', 'slide-backward', or 'initial-load' for no animation on first render
  const [transitionName, setTransitionName] = createSignal<
    'slide-forward' | 'slide-backward' | 'initial-load'
  >('initial-load');

  let containerRef: HTMLDivElement | undefined;

  // Display name for the current directory, could be truncated if path is too long
  const currentDisplayName = createMemo(() => {
    const node = currentNode();
    if (!node) return '';
    // For root or top-level items, just show the name.
    // For deeper items, you might want a breadcrumb, but for simplicity, just the current name.
    return node.name;
  });

  // Options to display in the current view
  const options = createMemo((): (Node & { displayIndex: number })[] => {
    const node = currentNode();
    if (node && node.type === NodeType.DIRECTORY && node.children) {
      return node.children.map((child, index) => ({
        ...child,
        displayIndex: index + 1,
      }));
    }
    return [];
  });

  // Navigate to a child node or execute action
  const navigateTo = (node: Node) => {
    if (!node) return;

    if (node.type === NodeType.DIRECTORY) {
      // Before changing currentNode, set the transition direction
      setTransitionName('slide-forward');
      setCurrentNode(node);
    } else if (node.type === NodeType.LEAF && node.action) {
      node.action();
      if (props.onLeafAction) {
        props.onLeafAction(`Executed: ${node.name}`, node);
      }
    }
  };

  // Navigate to the parent directory
  const goBack = () => {
    const parent = currentNode()?.parent;
    if (parent) {
      setTransitionName('slide-backward');
      setCurrentNode(parent);
    }
  };

  // Keyboard event handler
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isFocused()) return;

    if (event.key === 'Backspace') {
      event.preventDefault();
      if (currentNode()?.parent) {
        // Only go back if there's a parent
        goBack();
      }
    } else if (event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const index = parseInt(event.key) - 1; // 0-based index
      const currentOpts = options();
      if (index >= 0 && index < currentOpts.length) {
        navigateTo(currentOpts[index]);
      }
    }
  };

  // Effect to add/remove global keyboard listener based on focus
  createEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
    if (isFocused()) {
      document.addEventListener('keydown', onKeyDown);
    } else {
      document.removeEventListener('keydown', onKeyDown);
    }
    onCleanup(() => {
      document.removeEventListener('keydown', onKeyDown);
    });
  });

  // Set initial load to false after first render so transitions apply subsequently
  createEffect(() => {
    if (transitionName() === 'initial-load') {
      // After a tick, allow transitions.
      queueMicrotask(() => setTransitionName('slide-forward')); // Or any default if preferred
    }
  });

  return (
    <div
      ref={containerRef}
      class="directory-nav-container"
      tabindex="0" // Make it focusable
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div class="directory-header">
        <Show when={currentNode()?.parent !== null}>
          <button onClick={goBack} class="back-button" aria-label="Go back">
            &larr; {/* Left arrow HTML entity */}
          </button>
        </Show>
        <div class="current-path" title={currentDisplayName()}>
          {currentDisplayName()}
        </div>
      </div>

      <div class="options-list-wrapper">
        <Transition
          name={transitionName()}
          mode="outin" // Ensures old content transitions out before new content transitions in
        >
          {/* The key={currentNode().id} is crucial for <Transition> to detect content change */}
          <div
            class="options-view"
            style={{ display: currentNode() ? 'block' : 'none' }}
            key={currentNode()?.id || 'empty'}
          >
            <Show
              when={
                currentNode() &&
                options().length === 0 &&
                currentNode().type === NodeType.DIRECTORY
              }
              fallback={
                <ul>
                  <For each={options()}>
                    {(item) => (
                      <li
                        class="options-list-item"
                        onClick={() => navigateTo(item)}
                        role="button"
                        aria-label={`Option ${item.displayIndex}: ${item.name}${item.type === NodeType.DIRECTORY ? ', directory' : ''}`}
                      >
                        <span class="option-number">{item.displayIndex}.</span>
                        <span class="option-name">{item.name}</span>
                        <Show when={item.type === NodeType.DIRECTORY}>
                          <span class="option-type-indicator">&rarr;</span>{' '}
                          {/* Right arrow for directory */}
                        </Show>
                      </li>
                    )}
                  </For>
                </ul>
              }
            >
              <p
                style={{
                  padding: '20px 10px',
                  color: '#777',
                  'text-align': 'center',
                }}
              >
                This directory is empty.
              </p>
            </Show>
          </div>
        </Transition>
      </div>
    </div>
  );
}
