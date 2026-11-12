/** CURRENT PHOTOGRAPHED selector excerpt, lines 207-255. Missing imports and surrounding declarations. */
export const selectAttackDemandLayerPreferencesForSaveWithFilters = createSelector(
  selectAttackDemandLayerPreferencesForSave,
  selectAttackDemandMenuFiltersForStationState,
  (preferences, layerFilters) => <AttackDemandLayerPreferences>{
    ...preferences,
    layerFilters: {
      ...layerFilters,
      showOnlyFavoriteAttackDemands: {},
      favoriteAttackDemands: {},
      filterAttackDemands: {},
      searchByFolder: {},
    },
  },
);
export const selectAttackDemandEyeIsVisible = (attackDemandId) =>
  createSelector(selectAttackDemandsEyeState, (eyeState) => eyeState[attackDemandId]);
export const selectAttackDemandTreeWithSearchFilter = createSelector(
  selectAttackDemandsToShowInAllAllocationBoards,
  selectAttackDemandCacheTrees,
  (attackDemandsToShowInAllAllocationBoards, cacheTrees) => {
    const reducedCacheTrees = reduceCacheTrees(cacheTrees, attackDemandsToShowInAllAllocationBoards);
    const { tree, rootChildren } = AttackDemandsLayerTreeBuilder.buildTreeFromCacheTree(reducedCacheTrees);
    return <Layer>{
      id: AttackDemandsLayerStaticNodes.root.id,
      nodes: {
        ...tree,
        [AttackDemandsLayerStaticNodes.root.id]: {
          ...AttackDemandsLayerStaticNodes.root, childrenIds: rootChildren,
        },
      },
    };
  },
);
export const selectAttackDemandTreeByAllocationBoardId = (id: string) =>
  createSelector(selectAttackDemandTreeWithSearchFilter, ({ nodes }) => {
    const { leafIds, folderIds } = getAllChildrenIds(id, nodes);
    return <Dictionary<LayerElement>>pick(nodes, leafIds, folderIds);
  });
export const selectAttackDemandTreeIdsByAllocationBoardId = (allocationBoardId: string) =>
  createSelector(selectAttackDemandTreeByAllocationBoardId(allocationBoardId), (tree) =>
    Object.keys(tree).filter((id) => !isFolderLayerElement(tree[id])));
