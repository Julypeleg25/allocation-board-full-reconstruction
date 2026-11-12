/** CURRENT PHOTOGRAPHED source lines 42-70. Rest of polling subscriptions NOT in screenshot. */
const defaultDiff = <Entity extends BaseEntity>(
  previous: FetchedEntityUpdate<Entity>[],
  current: FetchedEntityUpdate<Entity>[],
): EntityUpdate<Entity['id'], Entity['id']> => {
  const deleted = differenceBy(previous, current, 'id').map(({ id }) => id);
  const upserted = differenceWith(current, previous,
    (a, b) => a.id === b.id && a.updatedAt === b.updatedAt,
  ).map(({ id }) => id);
  return { upserted, deleted };
};
// handleEntity() continued beyond visible screenshot; not reconstructed.
