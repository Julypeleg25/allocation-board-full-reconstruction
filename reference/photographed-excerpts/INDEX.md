# Current photographed source inventory

**Only current code photographed in this conversation is transcribed.** No later-state code, no historical comparisons, no parallel implementations. The originally supplied repository itself is unavailable; this directory represents **partial visible functions**. Names/types imported from unphotographed source remain unresolved, so this is documentary source, not a production-buildable checkout.

| File (relative to `photo-source/`) | Visible subject | Coverage |
| --- | --- | --- |
| `apps/client/src/app/layers-menu/utils/layer-tree.utils.ts` | `getAllChildrenIds`, `getChildrenIds`, `getVirtualScrollArray`, `calculateNodesLeafCount`, `calculateLayerEyesState`, `getAllParentIds`, leaf/eye diff helpers, `applyLayerPreferences`, `createSharedParentsNodes` | Substantial functions from screenshots, some imports and surrounding declarations unseen |
| `apps/client/src/app/layers-menu/layers/attack-demand-layer/utils/attack-demands-layer-tree-builder.ts` | `buildTreeFromCacheTree` | Full visible core function |
| `apps/client/src/app/layers-menu/layers/attack-demand-layer/reducers/attack-demands-layer.reducer.ts` | Tree selectors, eye state | Partial selector family |
| `apps/client/src/app/layers-menu/layers/attack-demand-layer/effects/attack-demands-layer.effects.ts` | Tree cache save, merged layer rebuild, show/hide update | Partial effect class, other effects unseen |
| `apps/client/src/app/entities/attack-demand/actions/attack-demand-tree-cache.actions.ts` | Save/remove tree actions | Complete visible action snippet |
| `apps/client/src/app/entities/attack-demand/reducers/attack-demands-tree-cache.reducer.ts` | Deep equality on cache update, memoized selector | Partial state definitions unseen |
| `apps/client/src/app/entities/attack-demand/services/attack-demand.service.ts` | GraphQL subscription, `buildAllocationBoardTree` | Partial service. Incomplete filters and sibling methods |
| `apps/client/src/app/shared/poll-entity.ts` | `defaultDiff` | Function only |
| `apps/client/src/app/shared/unique-sorted-id-and-updated-at.ts` | `sortedUniqBy` ID/version helpers | Visible helper functions |
| `apps/client/src/app/map/base-map-layer.effects.ts` | `filteredDataSources` | Core viewport filter only |
| `apps/client/src/app/boards/attack-demands-layer-row.component.ts` | `buildBoardRows` | Core method only |
| `apps/allocation-board-search/src/infra/repository/attack-demands-repository.service.ts` | Live updated-at/detail reads, joins and component links | Most visible class ~lines 4-259; imports and types unseen |

**Not reconstructed as authentic production source:** grouping repository and base finder, resolver/use-case implementation, complete map effects, full NgRx application, all Angular components/templates, DB schema. A **synthetic and explicitly inferred grouping model** is available separately under `../lab/current-grouping-model/` for query experiments, without pretending it is the unphotographed source.

Photo transcription is a best-effort reading of photographs. Compare against original files before applying any patch or trusting any inferred spelling/signature.
