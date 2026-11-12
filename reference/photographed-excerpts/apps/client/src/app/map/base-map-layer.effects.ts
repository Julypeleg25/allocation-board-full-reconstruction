/** CURRENT PHOTOGRAPHED excerpt: map filter (`getFilteredDataSources`), source lines ~406-427. */
get filteredDataSources(): Observable<{ entities: Dictionary<Entity>; removedByViewport: Set<string> }> {
  return combineLatest([
    this.drawableDataSources,
    this.entityLayerService.layerInitiated$,
    this.entityLayerService.cameraPositionChanged$.pipe(debounceTime(100)),
  ]).pipe(
    map(([entities]) => {
      const entitiesInViewport = this.filterEntityService.entitiesInViewport(values(entities));
      const removedByViewport = keys(entities).filter((id) =>
        !entitiesInViewport.find((entity) => entity.id === id));
      return { entities: this.keyBy(entitiesInViewport), removedByViewport: new Set(removedByViewport) };
    }),
    startWith({ entities: {}, removedByViewport: new Set([]) }),
  );
}
