/** CURRENT PHOTOGRAPHED excerpts from AttackDemandService; requires original imports.
 * Only visible portions included. IMPORTANT: do not treat this as complete service.
 */
export class AttackDemandService {
  subscribeToAttackDemandUpdates(ids: string[], targetIds?: string[], realityId?: ConnectableReality) {
    return this.hasura.subscribe<
      { subscribeToAttackDemandUpdates: (FetchedEntityUpdate<AttackDemand> &
        { target?: { updatedAt?: string } })[] },
      { ids: string[]; targetIds: string[] }
    >({
      query: gql`
        subscription AttackDemandUpdates($ids: [String!], $targetIds: [String!]) {
          subscribeToAttackDemandUpdates: replications_${this.tableName}(
            where: { _or: [ { id: { _in: $ids } }, { targetId: { _in: $targetIds } } ] }
          ) { id updatedAt target { updatedAt } }
        }`,
      variables: { ids, targetIds: targetIds ?? [] },
      reality: realityId,
    }).pipe(
      map(({ data }) => data?.subscribeToAttackDemandUpdates?.map(({ target, ...attackDemand }) => ({
        ...attackDemand,
        updatedAt: combineTargetAndAttackDemandUpdatedAt(attackDemand.updatedAt, target?.updatedAt),
      }))),
      noNull(),
    );
  }

  subscribeToAttackDemandsUpdatedAt(ids: string[], reality: ConnectableReality) {
    const characterType = convertRealityToCharacterType(reality);
    const query = (apollo: Apollo) => apollo.subscribe<
      { attackDemandsUpdatedAtByIds: AttackDemandUpdatedAtResult },
      AttackDemandsSubscriptionParameters
    >({
      query: attackDemandsUpdatedAtByIdsSubscription,
      variables: { attackDemandIds: ids, characterType },
    });
    return this.allocationBoardService.runQuery(query).pipe(
      map(({ data }) => data.attackDemandsUpdatedAtByIds?.attackDemands), noNull(),
    );
  }

  getAggregatedAttackDemandsByIds(ids: string[], reality: ConnectableReality) {
    const characterType = convertRealityToCharacterType(reality);
    const query = (apollo: Apollo) => apollo.query<
      { attackDemandsByIds: AggregatedAttackDemandsResult },
      AttackDemandsSubscriptionParameters
    >({
      query: attackDemandsByIdsQuery, variables: { attackDemandIds: ids, characterType },
    });
    return this.allocationBoardService.runQuery(query).pipe(
      map(({ data }) => data.attackDemandsByIds?.attackDemands), noNull(),
    );
  }

  attackDemandsIdsAndAmountInAllocationBoardLiveQuery(
    allocationBoardFolderId: string,
    finderFilters: FinderFilters | undefined,
    filters: AllocationBoardFilters | undefined,
    specificAttackDemandIds: string[] | undefined,
    orderBy: AllocationBoard['orderBy'],
    groupBy: AttackDemandGroupBy[] | undefined,
    searchBy: string[] | undefined,
    characterType: OperationCharacterType,
  ): Observable<AllocationBoardSearchResult> {
    const query = (apollo: Apollo) => apollo.subscribe<
      { allocationBoardSearch: AllocationBoardSearchResult }, AllocationBoardSearchParameters
    >({
      query: allocationBoardAttackDemandsTree,
      variables: {
        allocationBoardFolderId,
        ...{
          objectiveIds: finderFilters?.objectiveIds ?? [],
          attackPlanIds: finderFilters?.attackPlanIds ?? [],
          missionIds: finderFilters?.missionIds ?? [],
          warriorMissionIds: finderFilters?.warriorMissionIds ?? [],
          operationalPlanIds: finderFilters?.operationalPlanIds ?? [],
          connectionDataIds: finderFilters?.connectionDataIds ?? [],
          missionOrderIds: finderFilters?.missionOrderIds ?? [],
        },
        ...filters,
        targetCode: searchBy,
        characterType,
        groupBy: groupBy?.map(({ value }) => value),
        specificAttackDemandIds,
        orderBy: orderBy?.propertyName as AllocationBoardSortByOptions,
        orderByType: orderBy?.type?.toUpperCase() as OrderByType | undefined,
      },
    });
    return this.allocationBoardService.runQuery(query).pipe(
      map((result) => result.data?.allocationBoardSearch), noNull(),
    );
  }

  buildAllocationBoardTree({ allocationBoard, checked, specificAttackDemandIds }: {
    allocationBoard: AllocationBoard;
    checked?: FinderFilters;
    specificAttackDemandIds?: string[];
  }): Observable<AllocationBoardTreeResponse> {
    const playwrightMock = this.playwrightMockInjector.mockedAllocationBoardTree(allocationBoard);
    if (playwrightMock) return playwrightMock;
    if (
      isEmpty(checked?.objectiveIds) && isEmpty(checked?.missionIds) &&
      isEmpty(checked?.attackPlanIds) && isEmpty(checked?.warriorMissionIds) &&
      isEmpty(checked?.operationalPlanIds) && isEmpty(checked?.connectionDataIds) &&
      isEmpty(checked?.missionOrderIds) && isEmpty(specificAttackDemandIds)
    ) {
      return of({
        fullQueryAttackDemandCount: 0,
        allocationBoardId: allocationBoard.id,
        allocationBoardName: allocationBoard.name,
        attackDemandsTree: {
          [allocationBoard.id]: <FolderLayerElement>{
            id: allocationBoard.id, name: allocationBoard.name, childrenIds: [],
            icon: AttackDemandsLayerStaticNodes.root.icon,
            parentId: LayersMenuLayers.ATTACK_DEMANDS,
          },
        },
        attackDemandDynamicFilterOptions: {
          sectorIdFilterOptions: [], attackFactorFilterOptions: [],
          targetComplexityFilterOptions: [], reasonForComplexityFilterOptions: [],
          operationalPlanFilterOptions: [], attackPlanFilterOptions: [],
          warriorMissionFilterOptions: [],
        },
      });
    }
    return this.store.select(selectCharacterType).pipe(
      noNull(), take(1),
      switchMap((characterType) => this.store.select(
        selectAttackDemandsFolderGroupByByFolderId(allocationBoard.id),
      ).pipe(
        switchMap((groupBy) => combineLatest([
          this.attackDemandsIdsAndAmountInAllocationBoardLiveQuery(
            allocationBoard.id, checked,
            this.getFiltersByAllocationBoardState(allocationBoard.filterChosenOptions),
            specificAttackDemandIds, allocationBoard.orderBy, groupBy,
            allocationBoard.searchBy, characterType,
          ).pipe(
            switchMap(({ tree, filters, fullQueryAttackDemandCount }) => of({
              fullQueryAttackDemandCount, filters,
              tree: {
                ...tree,
                [allocationBoard.id]: <FolderLayerElement>{
                  ...tree[allocationBoard.id], parentId: LayersMenuLayers.ATTACK_DEMANDS,
                  icon: AttackDemandsLayerStaticNodes.root.icon, name: allocationBoard.name,
                },
              },
            })),
          ),
        ]).pipe(
          map(([{ tree, filters, fullQueryAttackDemandCount }]) => ({
            allocationBoardId: allocationBoard.id,
            allocationBoardName: allocationBoard.name,
            attackDemandsTree: tree,
            attackDemandDynamicFilterOptions: filters,
            fullQueryAttackDemandCount,
          })), noNull(),
        )),
      )),
    );
  }
  // UNSEEN: getFiltersByAllocationBoardState() full body and the rest of the service.
}
