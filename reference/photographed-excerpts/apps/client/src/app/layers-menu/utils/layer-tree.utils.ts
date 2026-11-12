/** PHOTO-DERIVED CURRENT SOURCE — imports, model definitions, and unseen lines are not invented.
 * This file is documentary TypeScript; NOT production-buildable without original source.
 * Visible approximate lines 19-410 in user-supplied screenshots.
 */
export const getAllChildrenIds = (nodeId: LayerElementId, nodes: NgrxDictionary<LayerElement>) => {
  const leafIds: string[] = [];
  const folderIds: string[] = [];
  const nodeStack = [nodeId];
  while (nodeStack.length > 0) {
    const currentNodeId = nodeStack.pop();
    if (currentNodeId) {
      const currentNode = nodes[currentNodeId];
      if (currentNode) {
        if (isLeafLayerElement(currentNode)) {
          leafIds.push(currentNode.id);
        } else {
          folderIds.push(currentNodeId);
          nodeStack.push(...currentNode.childrenIds);
        }
      }
    }
  }
  return { leafIds, folderIds };
};

export const getChildrenIds = (layerTree: Layer, rootId: string): string[] => {
  const { leafIds, folderIds } = getAllChildrenIds(rootId, layerTree.nodes);
  const relevantFolderIds = folderIds.filter((id) =>
    layerTree.nodes[layerTree.id].childrenIds?.includes(id) &&
    layerTree.nodes[id].childrenIds?.every((childId) => layerTree.nodes[childId].childrenIds?.length === 0),
  );
  return [...leafIds, ...relevantFolderIds];
};

export const getVirtualScrollArray = (
  parentId: LayerElementId,
  nodes: Dictionary<LayerElement>,
  itemsSize: Dictionary<number>,
  expandedPolicy: Record<string, boolean>,
) => {
  const recursive = (parentId: LayerElementId, nodeLevel = 0): VirtualScrollItem[] => {
    const parentNode = nodes[parentId];
    if (!parentNode) return [];
    if (isLeafLayerElement(parentNode)) return [];
    if (isFolderLayerElement(parentNode) && !expandedPolicy[parentNode.id]) return [];
    const childrenIds = parentNode.childrenIds
      ?.filter((childId) => !isNil(nodes[childId]))
      .map<VirtualScrollItem>((childId) => {
        const childNode = nodes[childId];
        return {
          id: childId,
          itemSize: itemsSize?.[childId] ?? (childNode && isLeafLayerElement(childNode) ? 60 : 50),
          currentParentId: parentId,
          nodeLevel,
        };
      });
    return childrenIds.flatMap((childId) => [childId, ...recursive(childId.id, nodeLevel + 1)]);
  };
  return recursive(parentId);
};

export const calculateNodesLeafCount = (nodes: Layer['nodes']) => {
  const leafCount: Record<LayerElementId, number> = mapValues(nodes, () => 0);
  const nodeStack: LayerElementId[] = [];
  const inQueue = new Set<LayerElementId>();
  const enqueue = (id: LayerElementId) => {
    if (inQueue.has(id)) return;
    inQueue.add(id);
    nodeStack.push(id);
  };
  entries(nodes).forEach(([id, node]) => {
    if (node && isLeafLayerElement(node)) enqueue(id);
  });
  for (let i = 0; i < nodeStack.length; i++) {
    const currentNodeId = nodeStack[i];
    inQueue.delete(currentNodeId);
    const currentNode = nodes[currentNodeId];
    if (currentNode) {
      if (isLeafLayerElement(currentNode)) {
        currentNode.parentsIds.forEach((parentId) => {
          leafCount[parentId]++;
          enqueue(parentId);
        });
      }
      if (isFolderLayerElement(currentNode)) {
        leafCount[currentNode.parentId] += leafCount[currentNode.id];
        enqueue(currentNode.parentId);
      }
    }
  }
  return leafCount;
};

export const calculateLayerEyesState = (
  layerNodes: Layer['nodes'],
  shownOnMapEntityIds: Record<LayerElementId, boolean>,
  emptyShouldShowChildrenFolders: string[],
) => {
  const newEyeState: Record<LayerElementId, boolean> = {
    ...shownOnMapEntityIds,
    ...convertIdsToBooleanRecord(emptyShouldShowChildrenFolders, true),
  };
  const queue: LayerElementId[] = [];
  const enqueued = new Set<LayerElementId>();
  const markShown = (id: LayerElementId) => {
    if (enqueued.has(id)) return;
    enqueued.add(id);
    queue.push(id);
  };
  entries(newEyeState).forEach(([id, isShown]) => {
    if (isShown) markShown(id);
  });
  for (let i = 0; i < queue.length; i++) {
    const node = layerNodes[queue[i]];
    if (!node) continue;
    if (isLeafLayerElement(node)) {
      node.parentsIds.forEach((parentId) => {
        newEyeState[parentId] = true;
        markShown(parentId);
      });
    } else if (isFolderLayerElement(node)) {
      newEyeState[node.parentId] = true;
      markShown(node.parentId);
    }
  }
  return newEyeState;
};

export const getAllParentIds = (layerNodes: Layer['nodes'], entityId: string): string[] => {
  const parentIds: string[] = [];
  const outputSeen = new Set<string>();
  const nodeStack: string[] = [entityId];
  while (nodeStack.length > 0) {
    const currentNodeId = nodeStack.pop();
    if (!currentNodeId) continue;
    const currentNode = layerNodes[currentNodeId];
    if (!currentNode) continue;
    if (isLeafLayerElement(currentNode)) {
      currentNode.parentsIds.forEach((parentId) => {
        parentIds.push(parentId);
        outputSeen.add(parentId);
        nodeStack.push(parentId);
      });
    }
    if (isFolderLayerElement(currentNode) && !outputSeen.has(currentNode.parentId)) {
      parentIds.push(currentNode.parentId);
      outputSeen.add(currentNode.parentId);
      nodeStack.push(currentNode.parentId);
    }
  }
  return parentIds;
};

const getNewLeafsToShowOnMap = (
  newTree: LayerElement[],
  newLeafIds: string[],
  shouldShowChildrenPolicy: Record<string, boolean>,
  shownOnMapEntities: Record<string, boolean> | undefined,
  layerId: LayersMenuLayers,
) => {
  const leafIdsToShow: string[] = [];
  const leafIdsToDelete: string[] = [];
  const newTreeMap = keyBy(newTree, 'id');
  const storedSessionState: Record<string, boolean> = getLeafEyeStatesFromSessionStorage(layerId);
  newLeafIds.forEach((newLeafId) => {
    const node = newTreeMap[newLeafId];
    if (!node || !isLeafLayerElement(node)) return;
    const isOnMap = shownOnMapEntities?.[node.id];
    const sessionState = storedSessionState[node.id];
    if (typeof sessionState === 'boolean') {
      if (sessionState && !isOnMap) leafIdsToShow.push(node.id);
      else if (!sessionState && isOnMap) leafIdsToDelete.push(node.id);
    } else {
      const shouldShow = node.parentsIds.some((parentId) => shouldShowChildrenPolicy[parentId]);
      if (shouldShow && !isOnMap) leafIdsToShow.push(node.id);
      else if (!shouldShow && isOnMap) leafIdsToDelete.push(node.id);
    }
  });
  return { leafIdsToShow, leafIdsToDelete };
};

const shouldShowLeaf = (node: LayerElement, prevNode: LayerElement | undefined) =>
  isLeafLayerElement(node) &&
  (!prevNode ||
    (isLeafLayerElement(prevNode) && prevNode.parentsIds.every((prevParentId) => !node.parentsIds.includes(prevParentId))));

const getNewAndFolderChangedLeafIds = (prevTree: Dictionary<LayerElement>, newTree: LayerElement[]) =>
  newTree.filter((node) => shouldShowLeaf(node, prevTree[node.id])).map(({ id }) => id);

const getNewFoldersToShowChildren = ({
  prevTree,
  currTree,
  shouldShowChildrenPolicy,
}: {
  prevTree: Dictionary<LayerElement>;
  currTree: LayerElement[];
  shouldShowChildrenPolicy: Record<string, boolean>;
}) => {
  const newShouldShowChildrenPolicy = { ...shouldShowChildrenPolicy };
  currTree.forEach((node) => {
    const parentShouldShowChildren = isFolderLayerElement(node) && newShouldShowChildrenPolicy[node.parentId];
    if (shouldShowNewFolder(node.id, prevTree, parentShouldShowChildren, shouldShowChildrenPolicy[node.id])) {
      newShouldShowChildrenPolicy[node.id] = true;
    }
  });
  return newShouldShowChildrenPolicy;
};

const shouldShowNewFolder = (
  nodeId: LayerElementId,
  prevTree: Dictionary<LayerElement>,
  parentShouldShowChildren: boolean,
  nodeShouldShowChildren: boolean | undefined,
) => !prevTree[nodeId] && parentShouldShowChildren && isNil(nodeShouldShowChildren);

export const getUpdatedLeafIds = ({
  prev, curr, shouldShowChildrenPolicy, isFirstBuild, isDefaultPreferences, shownOnMapEntities, layerId,
}: {
  prev: { entitiesIds: string[]; tree: Dictionary<LayerElement> };
  curr: { entitiesIds: string[]; tree: LayerElement[] };
  shouldShowChildrenPolicy: Record<string, boolean>;
  isFirstBuild: boolean;
  isDefaultPreferences: boolean;
  shownOnMapEntities: Record<string, boolean>;
  layerId: LayersMenuLayers;
}) => {
  const newShouldShowChildrenPolicy = getNewFoldersToShowChildren({
    prevTree: prev.tree, currTree: curr.tree, shouldShowChildrenPolicy,
  });
  const { leafIdsToShow, leafIdsToDelete } = getNewLeafsToShowOnMap(
    curr.tree,
    getNewAndFolderChangedLeafIds(prev.tree, curr.tree),
    newShouldShowChildrenPolicy,
    !isDefaultPreferences ? shownOnMapEntities : undefined,
    layerId,
  );
  return {
    leafIdsToShow,
    newFoldersToShowChildren: keys(newShouldShowChildrenPolicy).filter((folderId) => newShouldShowChildrenPolicy[folderId]),
    leafIdsToDelete: union(difference(prev.entitiesIds, curr.entitiesIds), leafIdsToDelete),
  };
};

export const applyLayerPreferences = <SubLayer extends string>(
  oldState: LayerReducerState<SubLayer>,
  preferences: LayerPreferences<SubLayer>,
  layerId: LayersMenuLayers,
): Partial<LayerReducerState<SubLayer>> => {
  const newState: Partial<LayerReducerState<SubLayer>> = {};
  if (preferences.expandedFolders) newState.expandedPolicy = preferences.expandedFolders;
  if (preferences.foldersShouldShowChildrenPolicy) {
    newState.shouldShowChildrenPolicy = preferences.foldersShouldShowChildrenPolicy;
    newState.shownOnMap = mapValues(preferences.foldersShouldShowChildrenPolicy, (folders, key) => {
      const foldersToShowChildren = pickBy(folders, (b) => b);
      const entitiesToShow = keys(pickBy(oldState.layerNodesMap[key].entities,
        (node) => isLeafLayerElement(node) && node.parentsIds.some((parentId) =>
          foldersToShowChildren[parentId] || foldersToShowChildren[node.id]),
      ));
      return convertIdsToBooleanRecord(entitiesToShow, true);
    });
  }
  if (preferences.leafsShowOnMap) {
    newState.shownOnMap = {
      ...mapValues(preferences.leafsShowOnMap, (shownOnMapEntities, key) => ({
        ...newState.shownOnMap?.[key], ...shownOnMapEntities,
      })),
    };
  }
  const sessionLeafStates = getLeafEyeStatesFromSessionStorage(layerId);
  if (Object.keys(sessionLeafStates).length) {
    newState.shownOnMap = mapValues(oldState.layerNodesMap, (subLayerState) =>
      pickBy(sessionLeafStates, (_shown, leafId) => {
        const leafNode = subLayerState.entities[leafId];
        return leafNode && isLeafLayerElement(leafNode);
      }),
    );
  }
  return newState;
};

export const convertIdsToBooleanRecord = (ids: string[], bool: boolean): Record<LayerElementId, boolean> => {
  const record: Record<LayerElementId, boolean> = {};
  ids.forEach((id) => { record[id] = bool; });
  return record;
};

export const getGroupByValues = <T extends BaseEntity>(groupByKeys: GroupByOption<T>[] | undefined) =>
  groupByKeys?.map((groupBy) => groupBy.value) ?? [];

export const createSharedParentsNodes = (subLayersNodeMap: Dictionary<LayerElement>[]): Dictionary<LayerElement> => {
  const mergedNodes: Dictionary<LayerElement> = Object.assign({}, ...subLayersNodeMap);
  const allKeys = keys(mergedNodes);
  const leafsMap: Dictionary<LeafLayerElement> = {};
  allKeys.forEach((key) => {
    const leafNode = mergedNodes[key];
    if (isLeafLayerElement(leafNode)) {
      let parents: string[] = leafNode.parentsIds;
      subLayersNodeMap.forEach((subLayerMap) => {
        const leaf = subLayerMap[key];
        if (leaf && isLeafLayerElement(leaf)) parents = union(parents, leaf.parentsIds);
      });
      leafsMap[key] = { ...leafNode, parentsIds: parents };
    }
  });
  return { ...mergedNodes, ...leafsMap };
};
