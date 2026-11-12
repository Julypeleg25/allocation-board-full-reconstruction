/** CURRENT PHOTOGRAPHED source lines 1-10. */
import { createAction, props } from '@ngrx/store';
import { LayerElement } from '@parlament/models';
import { Dictionary } from 'lodash';
export const saveAttackDemandCacheTree = createAction(
  '[AttackDemand tree cache] Save',
  props<{ id: string; tree: Dictionary<LayerElement> }>(),
);
export const removeAttackDemandCacheTree = createAction(
  '[AttackDemand tree cache] Remove', props<{ id: string }>(),
);
