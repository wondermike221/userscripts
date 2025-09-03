interface ShadowQueryInterface {
  find(
    selector: string,
    root?: Element | Document | ShadowRoot,
  ): Element | null;
  findAll(selector: string, root?: Element | Document | ShadowRoot): Element[];
  closest(selector: string, element: Element): Element | null;
  getHost(element: Element): Element | null;
}

/**
 * A small library for querying elements across open Shadow DOM boundaries.
 */
export const ShadowQuery: ShadowQueryInterface = {
  /**
   * Finds the first element that matches a selector, traversing into open shadow roots.
   * This is a "deep" version of querySelector.
   */
  find(
    selector: string,
    root: Element | Document | ShadowRoot = document,
  ): Element | null {
    // A recursive function to perform the deep search.
    const findRecursive = (
      currentRoot: Element | Document | ShadowRoot,
    ): Element | null => {
      // First, try to find the element in the current root's light DOM.
      const found = currentRoot.querySelector(selector);
      if (found) {
        return found;
      }

      // If not found, search through all elements in the current root.
      const allElements = currentRoot.querySelectorAll('*');
      for (const element of allElements) {
        // If an element has a shadow root, recurse into it.
        if (element.shadowRoot) {
          const foundInShadow = findRecursive(element.shadowRoot);
          if (foundInShadow) {
            return foundInShadow;
          }
        }
      }

      return null;
    };

    return findRecursive(root);
  },

  /**
   * Finds all elements that match a selector, traversing into open shadow roots.
   * This is a "deep" version of querySelectorAll.
   */
  findAll(
    selector: string,
    root: Element | Document | ShadowRoot = document,
  ): Element[] {
    const results: Element[] = [];

    // A recursive function to perform the deep search and collect all matches.
    const findAllRecursive = (
      currentRoot: Element | Document | ShadowRoot,
    ): void => {
      // Add all matches from the current root's light DOM.
      results.push(...currentRoot.querySelectorAll(selector));

      // Search through all elements in the current root.
      const allElements = currentRoot.querySelectorAll('*');
      for (const element of allElements) {
        // If an element has a shadow root, recurse into it.
        if (element.shadowRoot) {
          findAllRecursive(element.shadowRoot);
        }
      }
    };

    findAllRecursive(root);
    return results;
  },

  /**
   * Traverses up the DOM tree from an element, crossing shadow boundaries,
   * to find the first ancestor that matches a selector.
   */
  closest(selector: string, element: Element): Element | null {
    if (!element) {
      return null;
    }

    // Check the element itself.
    if (element.matches && element.matches(selector)) {
      return element;
    }

    // Use the native `closest` to search within the current DOM/ShadowDOM scope.
    const lightDomMatch = element.closest(selector);
    if (lightDomMatch) {
      return lightDomMatch;
    }

    // If no match is found, we might need to cross a shadow boundary.
    const root = element.getRootNode();
    if (root instanceof ShadowRoot) {
      // If we are inside a shadow root, continue the search from the host element.
      return this.closest(selector, root.host);
    }

    // If we've reached the document root and found nothing, return null.
    return null;
  },

  /**
   * Finds the host element of the shadow root containing the given element.
   */
  getHost(element: Element): Element | null {
    if (!element) {
      return null;
    }
    const root = element.getRootNode();
    // Check if the root is a ShadowRoot, and if so, return its host.
    if (root instanceof ShadowRoot) {
      return root.host;
    }
    // If the element is not in a shadow DOM, it has no shadow host.
    return null;
  },
};
