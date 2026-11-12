/** CURRENT PHOTOGRAPHED excerpts lines approx 120-190 and 323-350.
 * Source screenshot does not show the entire class/method, imports or complete builder streams.
 */
export class AttackDemandsLayerEffects {
  buildAttackDemandsTrees$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveAttackDemandCacheTree),
      withLatestFrom(this.store.select(selectAttackDemandCacheTrees)),
      map(([, trees]) => {
        const start = performance.now();
        const result = AttackDemandsLayerTreeBuilder.buildTreeFromCacheTree(trees);
        const duration = performance.now() - start;
        this.logger?.info('LayerMenu', { payload: {
          layer: 'attack-demands', method: 'buildTreeFromCacheTree',
          duration, nodesCount: Object.keys(result.tree).length,
        }});
        return result;
      }),
      map((newTree) => setAttackDemandsLayerNodes({
        updatedNodes: values(newTree.tree), rootChildrenIds: newTree.rootChildren,
      })),
    ),
  );

  updateShownOnMapAttackDemands$ = createEffect(() =>
    combineLatest([this.actions$.pipe(ofType(saveAttackDemandCacheTree)), this.afterApplyPreferences$]).pipe(
      concatLatestFrom(([{ id }]) => [
        this.store.select(selectAttackDemandCacheTreeById(id)).pipe(
          startWith<Dictionary<LayerElement>>({}), pairwise(),
        ),
        this.store.select(selectAttackDemandsSubLayersShouldShowChildrenPolicy('attackDemands')),
        this.store.select(selectAttackDemandsLayersShownOnMapBySubLayer('attackDemands')),
      ]),
      switchMap(([, [prevTree, currTree], shouldShowChildrenPolicy, shownOnMapEntities]) => {
        const { leafIdsToShow, leafIdsToDelete, newFoldersToShowChildren } = getUpdatedLeafIds({
          prev: { tree: prevTree, entitiesIds: keys(pickBy(prevTree, isLeafLayerElement)) },
          curr: { tree: values(currTree), entitiesIds: keys(pickBy(currTree, isLeafLayerElement)) },
          layerId: LayersMenuLayers.ATTACK_DEMANDS,
          isFirstBuild: isEmpty(prevTree),
          shouldShowChildrenPolicy,
          isDefaultPreferences: false,
          shownOnMapEntities,
        });
        this.isFirstBuild.attackDemands = false;
        return [
          updateAttackDemandsLayerShouldShowChildrenPolicy({
            folderIds: newFoldersToShowChildren, shouldShowChildren: true,
          }),
          toggleAttackDemandsOnMap({ ids: leafIdsToShow, show: true }),
          toggleAttackDemandsOnMap({ ids: leafIdsToDelete, show: false }),
        ];
      }),
    ),
  );

  private handleTreeBuilderResponse({
    fullQueryAttackDemandCount, allocationBoardId,
    attackDemandsTree, attackDemandDynamicFilterOptions,
  }: {
    fullQueryAttackDemandCount: number;
    allocationBoardId: string;
    attackDemandsTree: Dictionary<LayerElement>;
    attackDemandDynamicFilterOptions: AttackDemandsDynamicFilterOptions;
  }) {
    const actions: Action[] = [];
    actions.push(updateAllocationBoard({
      allocationBoardId,
      changes: { attackDemandFilterOptions: attackDemandDynamicFilterOptions,
        fullQueryAttackDemandCount, isLoading: false },
    }));
    actions.push(saveAttackDemandCacheTree({ id: allocationBoardId, tree: attackDemandsTree }));
    return actions;
  }
  // UNSEEN: remaining sources for operation/library board effects, other handlers and injected fields.
}
