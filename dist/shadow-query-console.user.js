// ==UserScript==
// @name        Shadow Query Console
// @namespace   https://hixon.dev
// @description A userscript to provide a console for running queries in a shadow DOM environment.
// @match       https://ebayinc.service-now.com/*
// @match       *://*/*
// @version     0.0.2
// @author      Michael Hixon
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/dist/shadow-query-console.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// @grant       unsafeWindow
// ==/UserScript==
(function() {
	//#region src/utils/ShadowQuery.ts
	/**
	* A small library for querying elements across open Shadow DOM boundaries.
	*/
	var ShadowQuery = {
		/**
		* Finds the first element that matches a selector, traversing into open shadow roots.
		* This is a "deep" version of querySelector.
		*/
		find(selector, root = document) {
			const findRecursive = (currentRoot) => {
				const found = currentRoot.querySelector(selector);
				if (found) return found;
				const allElements = currentRoot.querySelectorAll("*");
				for (const element of allElements) if (element.shadowRoot) {
					const foundInShadow = findRecursive(element.shadowRoot);
					if (foundInShadow) return foundInShadow;
				}
				return null;
			};
			return findRecursive(root);
		},
		/**
		* Finds all elements that match a selector, traversing into open shadow roots.
		* This is a "deep" version of querySelectorAll.
		*/
		findAll(selector, root = document) {
			const results = [];
			const findAllRecursive = (currentRoot) => {
				results.push(...currentRoot.querySelectorAll(selector));
				const allElements = currentRoot.querySelectorAll("*");
				for (const element of allElements) if (element.shadowRoot) findAllRecursive(element.shadowRoot);
			};
			findAllRecursive(root);
			return results;
		},
		/**
		* Traverses up the DOM tree from an element, crossing shadow boundaries,
		* to find the first ancestor that matches a selector.
		*/
		closest(selector, element) {
			if (!element) return null;
			if (element.matches && element.matches(selector)) return element;
			const lightDomMatch = element.closest(selector);
			if (lightDomMatch) return lightDomMatch;
			const root = element.getRootNode();
			if (root instanceof ShadowRoot) return this.closest(selector, root.host);
			return null;
		},
		/**
		* Finds the host element of the shadow root containing the given element.
		*/
		getHost(element) {
			if (!element) return null;
			const root = element.getRootNode();
			if (root instanceof ShadowRoot) return root.host;
			return null;
		}
	};
	//#endregion
	//#region src/shadow-query-console/index.ts
	unsafeWindow.ShadowQuery = ShadowQuery;
	//#endregion
})();
