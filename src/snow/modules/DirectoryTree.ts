// modules/DirectoryTree.ts

/**
 * Enum to define the type of a node in the directory.
 */
export enum NodeType {
  DIRECTORY = 'DIRECTORY',
  LEAF = 'LEAF',
}

/**
 * Interface defining the structure of a node's data.
 */
export interface NodeData {
  id: string;
  name: string;
  type: NodeType;
  children?: Node[]; // Only for DIRECTORY type
  action?: () => void; // Only for LEAF type
  parent?: Node | null; // Reference to the parent node
}

/**
 * Represents a node in the directory tree.
 * It can be either a directory (containing other nodes) or a leaf (an action).
 */
export class Node implements NodeData {
  id: string;
  name: string;
  type: NodeType;
  parent: Node | null;
  // Properties specific to type
  children?: Node[];
  action?: () => void;

  /**
   * Creates an instance of Node.
   * @param id A unique identifier for the node.
   * @param name The display name of the node.
   * @param type The type of the node (DIRECTORY or LEAF).
   * @param parent The parent node (null if root).
   * @param action The callback function if the node is a LEAF.
   */
  constructor(
    id: string,
    name: string,
    type: NodeType,
    parent: Node | null = null,
    action?: () => void,
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.parent = parent;

    if (type === NodeType.DIRECTORY) {
      this.children = [];
    } else if (type === NodeType.LEAF) {
      if (typeof action !== 'function') {
        console.warn(
          `Action for LEAF node "${name}" (ID: ${id}) is not a function.`,
        );
        this.action = () =>
          console.warn(`No action defined for "${name}" (ID: ${id})`);
      } else {
        this.action = action;
      }
    }
  }
}

/**
 * Manages the directory tree structure.
 */
export class DirectoryTree {
  root: Node;
  private nodeMap: Map<string, Node>; // For quick node lookup by ID

  /**
   * Creates an instance of DirectoryTree.
   * @param rootName The name for the root directory.
   */
  constructor(rootName: string = 'Root') {
    const rootId = 'root-' + this.generateId();
    this.root = new Node(rootId, rootName, NodeType.DIRECTORY, null);
    this.nodeMap = new Map();
    this.nodeMap.set(rootId, this.root);
  }

  /**
   * Generates a simple unique ID.
   * @returns A random string ID.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  /**
   * Adds a new node (directory or leaf) to a specified parent node.
   * @param parentNode The parent Node object.
   * @param name The display name of the new node.
   * @param type The type of the new node (DIRECTORY or LEAF).
   * @param action Optional callback function if the node is a LEAF.
   * @returns The created Node, or null if creation failed.
   */
  public addNodeToParent(
    parentNode: Node,
    name: string,
    type: NodeType,
    action?: () => void,
  ): Node | null {
    if (!parentNode) {
      console.error(
        `Cannot add node "${name}": Parent node is null or undefined.`,
      );
      return null;
    }
    if (parentNode.type !== NodeType.DIRECTORY) {
      console.error(
        `Parent node "${parentNode.name}" (ID: ${parentNode.id}) is not a directory.`,
      );
      return null;
    }
    // Ensure children array exists (should be initialized in constructor for DIRECTORY)
    if (!parentNode.children) {
      parentNode.children = []; // Should not happen if constructor is correct
      console.warn(
        `Children array was missing for directory node "${parentNode.name}". Initialized.`,
      );
    }

    if (parentNode.children.length >= 9) {
      console.warn(
        `Directory "${parentNode.name}" (ID: ${parentNode.id}) already has 9 items. Cannot add "${name}".`,
      );
      return null;
    }

    const newNodeId = type.toLowerCase() + '-' + this.generateId();
    const newNode = new Node(newNodeId, name, type, parentNode, action);
    parentNode.children.push(newNode);
    this.nodeMap.set(newNodeId, newNode);
    return newNode;
  }

  /**
   * Convenience method to add a node using the parent's ID.
   * @param parentId The ID of the parent node.
   * @param name The display name of the new node.
   * @param type The type of the new node.
   * @param action Optional callback for LEAF nodes.
   * @returns The created Node, or null if parent not found or creation failed.
   */
  public addNode(
    parentId: string,
    name: string,
    type: NodeType,
    action?: () => void,
  ): Node | null {
    const parentNode = this.findNode(parentId);
    if (!parentNode) {
      console.error(`Parent node with id "${parentId}" not found.`);
      return null;
    }
    return this.addNodeToParent(parentNode, name, type, action);
  }

  /**
   * Finds a node in the tree by its ID.
   * @param id The ID of the node to find.
   * @returns The Node if found, otherwise null.
   */
  public findNode(id: string): Node | null {
    return this.nodeMap.get(id) || null;
  }

  /**
   * Retrieves the path from the root to the specified node as an array of node names.
   * Useful for breadcrumbs or displaying the current location.
   * @param nodeId The ID of the target node.
   * @returns An array of strings (node names) representing the path, or an empty array if node not found.
   */
  public getNodePathNames(nodeId: string): string[] {
    const pathNames: string[] = [];
    let currentNode = this.findNode(nodeId);
    while (currentNode) {
      pathNames.unshift(currentNode.name); // Add to the beginning to get path from root to node
      currentNode = currentNode.parent;
    }
    return pathNames;
  }
}
