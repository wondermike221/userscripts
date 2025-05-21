import { addTitle } from './ui';
import { expand_things } from '.';

/**
 * Adds a mutation observer to the document body to detect changes in the DOM.
 * When a child node is added, it checks if the node matches a certain criteria and performs
 * the corresponding action.
 *
 * @return {MutationObserver} The mutation observer.
 */
export function addObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            nodeMatches(node, 'SPAN', 'ng-cell-text', '')
          ) {
            addTitle(node);
          } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            nodeMatches(node, 'BUTTON', 'ux-id', 'show-more')
          ) {
            expand_things();
          }
        });
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

/**
 * Helper function to check if a node matches a certain criteria.
 * @param node The node to check.
 * @param tagName The tag name to check.
 * @param attribute The attribute to check for existence.
 * @param value The attribute value to check. Leave blank if you only want to check for the existence of the attribute.
 * @returns boolean true if the node matches, false otherwise.
 */
function nodeMatches(node, tagName, attribute, value = '') {
  const tagNameCheck = node.tagName === tagName;
  const attributeCheck = node.hasAttribute(attribute);
  const attributeValueCheck = node.getAttribute(attribute) === value;
  return tagNameCheck && attributeCheck && attributeValueCheck;
}
