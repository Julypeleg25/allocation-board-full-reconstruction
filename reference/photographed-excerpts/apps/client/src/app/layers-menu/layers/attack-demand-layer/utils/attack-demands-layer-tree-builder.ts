/** CURRENT PHOTOGRAPHED source lines 1-35, transcribed. Requires original imports/types. */
export class AttackDemandsLayerTreeBuilder {
  static buildTreeFromCacheTree(cacheTrees: Dictionary<Dictionary<LayerElement>>) {
    const newCompleteTree: Record<string, LayerElement> = {};
    const rootChildren: string[] = [];
    for (const treeKey in cacheTrees) {
      if (!Object.hasOwn(cacheTrees, treeKey)) continue;
      rootChildren.push(treeKey);
      const tree = cacheTrees[treeKey];
      for (const nodeKey in tree) {
        if (!Object.hasOwn(tree, nodeKey)) continue;
        const node = tree[nodeKey];
        const id = node.id;
        const existingNode = newCompleteTree[id];
        if (existingNode && isLeafLayerElement(existingNode) && isLeafLayerElement(node)) {
          newCompleteTree[id] = {
            ...node,
            parentsIds: existingNode.parentsIds.concat(node.parentsIds),
          };
        } else {
          newCompleteTree[id] = node;
        }
      }
    }
    return { tree: newCompleteTree, rootChildren };
  }
}
