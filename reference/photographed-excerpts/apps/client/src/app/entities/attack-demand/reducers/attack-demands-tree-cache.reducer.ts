/** CURRENT PHOTOGRAPHED reducer/selector excerpt, lines 11-48. Missing state type/imports. */
export const attackDemandCacheTreeToken = 'attack-demands-cache-tree';
export const attackDemandCacheTreeReducer = createReducer(
  initialAttackDemandTreeState,
  on(saveAttackDemandCacheTree, (state, { id, tree }) => {
    const prevTree = state.cacheTrees[id];
    if (equal(tree, prevTree)) return state;
    const newCacheTrees = { ...state.cacheTrees, [id]: tree };
    return { ...state, cacheTrees: newCacheTrees };
  }),
  on(removeAttackDemandCacheTree, (state, { id }) => ({
    ...state, cacheTrees: omit(state.cacheTrees, id),
  })),
);
export const selectAttackDemandTreeState =
  createFeatureSelector<AttackDemandTreeCacheState>(attackDemandCacheTreeToken);
export const selectAttackDemandCacheTrees =
  createSelector(selectAttackDemandTreeState, (state) => state.cacheTrees);
export const selectAttackDemandCacheTreeById = (id: string) =>
  createSelector(selectAttackDemandCacheTrees, (trees) => trees[id]);
export const selectAttackDemandIdsInCacheTree = (id: string) =>
  createSelector(selectAttackDemandCacheTreeById(id), (tree) =>
    keys(pickBy(tree ?? {}, isLeafLayerElement)),
  );
