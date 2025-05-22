// components/DirectoryNav.tsx
import {
  createSignal,
  createEffect,
  For,
  Show,
  createMemo,
  on,
} from 'solid-js';
import { Transition } from 'solid-transition-group';
import { DirectoryTree, Node, NodeType } from '../modules/DirectoryTree'; // Adjusted import path

interface DirectoryNavProps {
  tree: DirectoryTree;
  onLeafAction?: (actionDescription: string, node: Node) => void;
  initialNodeId?: string;
  onClose?: () => void;
  currentRecordDisplay?: string | null; // Optional prop to display current record info
}

export function DirectoryNav(props: DirectoryNavProps) {
  const initialNode = () =>
    props.initialNodeId
      ? props.tree.findNode(props.initialNodeId)
      : props.tree.root;
  const [currentNode, setCurrentNode] = createSignal<Node>(
    initialNode() || props.tree.root,
  );
  const [isFocused, setIsFocused] = createSignal(false);
  const [transitionName, setTransitionName] = createSignal<
    'slide-forward' | 'slide-backward' | 'initial-load'
  >('initial-load');
  let containerRef: HTMLDivElement | undefined;

  createEffect(
    on(
      () => props.initialNodeId,
      (newInitialId) => {
        if (newInitialId) {
          const node = props.tree.findNode(newInitialId);
          if (node && node.id !== currentNode()?.id) {
            setTransitionName('initial-load');
            setCurrentNode(node);
          }
        } else if (currentNode()?.id !== props.tree.root.id) {
          setTransitionName('initial-load');
          setCurrentNode(props.tree.root);
        }
      },
    ),
  );

  const currentDisplayName = createMemo(() =>
    currentNode() ? currentNode()!.name : 'Loading...',
  );
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

  const navigateTo = (node: Node) => {
    if (!node) return;
    if (node.type === NodeType.DIRECTORY) {
      setTransitionName('slide-forward');
      setCurrentNode(node);
    } else if (node.type === NodeType.LEAF && node.action) {
      try {
        node.action();
        if (props.onLeafAction)
          props.onLeafAction(`Executed: ${node.name}`, node);
      } catch (error) {
        console.error(`Error executing action for "${node.name}":`, error);
        if (props.onLeafAction)
          props.onLeafAction(`Error executing: ${node.name}`, node);
      }
    }
  };

  const goBack = () => {
    const parent = currentNode()?.parent;
    if (parent) {
      setTransitionName('slide-backward');
      setCurrentNode(parent);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isFocused()) return;

    if (event.key === 'Backspace') {
      if (currentNode()?.parent) {
        event.preventDefault();
        event.stopPropagation();
        goBack();
      }
    } else {
      let num = -1;
      if (event.key >= '1' && event.key <= '9') {
        num = parseInt(event.key);
      } else if (event.code.startsWith('Numpad') && event.code.length === 7) {
        const numpadNum = parseInt(event.code.substring(6));
        if (numpadNum >= 1 && numpadNum <= 9) {
          num = numpadNum;
        }
      }

      if (num !== -1) {
        event.preventDefault();
        event.stopPropagation();
        const index = num - 1;
        const currentOpts = options();
        if (index >= 0 && index < currentOpts.length) {
          navigateTo(currentOpts[index]);
        }
      }
    }
  };

  createEffect(
    on(
      currentNode,
      () => {
        if (transitionName() === 'initial-load') {
          queueMicrotask(() => {});
        }
      },
      { defer: true },
    ),
  );

  return (
    <div
      ref={containerRef}
      class="directory-nav-container"
      tabindex="0"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
    >
      <div class="directory-header">
        <div class="header-left-controls">
          <button
            onClick={goBack}
            class="back-button"
            aria-label="Go back"
            disabled={currentNode()?.parent === null}
          >
            &larr;
          </button>
          <div
            class="current-path"
            title={props.tree
              .getNodePathNames(currentNode()?.id || props.tree.root.id)
              .join(' / ')}
          >
            {currentDisplayName()}
          </div>
        </div>
        <Show when={props.onClose}>
          <button
            onClick={() => props.onClose && props.onClose()}
            class="close-button"
            aria-label="Close panel"
          >
            &times; {/* HTML entity for X / multiplication sign */}
          </button>
        </Show>
      </div>
      <Show when={props.currentRecordDisplay}>
        <div class="current-record-info">{props.currentRecordDisplay}</div>
      </Show>
      <div class="options-list-wrapper">
        <Transition name={transitionName()} mode="outin">
          <div
            class="options-view"
            style={{ display: currentNode() ? 'block' : 'none' }}
          >
            <Show
              when={options().length > 0}
              fallback={
                <p class="empty-directory-message">
                  {currentNode()?.type === NodeType.DIRECTORY
                    ? 'This directory is empty.'
                    : 'No options.'}
                </p>
              }
            >
              <ul>
                <For each={options()}>
                  {(item) => (
                    <li
                      class="options-list-item"
                      onClick={() => navigateTo(item)}
                      role="button"
                      tabindex="0"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          navigateTo(item);
                      }}
                      aria-label={`Option ${item.displayIndex}: ${item.name}`}
                    >
                      <span class="option-number">{item.displayIndex}.</span>
                      <span class="option-name">{item.name}</span>
                      <Show when={item.type === NodeType.DIRECTORY}>
                        <span class="option-type-indicator">&rarr;</span>
                      </Show>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>
        </Transition>
      </div>
    </div>
  );
}
