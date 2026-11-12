/** CURRENT PHOTOGRAPHED source lines 1-25. */
import { BaseEntity, FetchedEntityUpdate } from '@parlament/models';
import { pick, sortedUniqBy } from 'lodash';
export const uniqueSortedIdAndUpdatedAt = <T extends BaseEntity>(entities: T[]): FetchedEntityUpdate<T>[] =>
  sortedUniqBy(entities?.map((entity) => pick(entity, ['id', 'updatedAt'])) ?? [], (entity) => entity.id);
export const uniqueSortedById = <T extends BaseEntity>(entities: T[]): T[] =>
  sortedUniqBy(entities ?? [], (entity) => entity.id);
export const uniqueSortedRepIdAndUpdatedAt = <T extends BaseEntity & { repId: string }>(
  entities: T[],
): FetchedEntityUpdate<T>[] =>
  sortedUniqBy(entities?.map((entity) => pick(entity, ['id', 'updatedAt']))
    .map((entity) => ({ id: entity.id, updatedAt: entity.updatedAt })) ?? [], (entity) => entity.id);
