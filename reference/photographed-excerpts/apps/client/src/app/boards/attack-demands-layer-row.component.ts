/** CURRENT PHOTOGRAPHED `buildBoardRows`, source ~263-317.
 * `req` is recursively defined; original class, field types and imports not pictured.
 */
private buildBoardRows(flatArray: VirtualScrollItem[], tree: Dictionary<LayerElement>, maxCardsInRow: number): BoardRow[] {
  const rows: BoardRow[] = [];
  const folderElements = flatArray.filter(({ id, nodeLevel }) => isFolderLayerElement(tree[id]) && nodeLevel === 0);
  if (!isEmpty(folderElements)) {
    const req = (id: string) => {
      const node = tree[id];
      if (isFolderLayerElement(node)) {
        rows.push([{ id: node.id, origIndex: flatArray.findIndex((item) => item.id === node.id) }]);
        const firstChildId = first(node.childrenIds);
        if (flatArray.some((item) => item.id === firstChildId)) {
          if (isFolderLayerElement(tree[firstChildId])) {
            node.childrenIds.forEach((childId) => { req(childId); });
          } else {
            rows.push(...chunk(node.childrenIds.map((childId) => ({
              id: childId, origIndex: flatArray.findIndex((item) => item.id === childId),
            })), maxCardsInRow));
          }
        }
      }
    };
    folderElements.forEach((folder) => { req(folder.id); });
  } else {
    rows.push(...chunk(flatArray.map(({ id }) => ({
      id, origIndex: flatArray.findIndex((item) => item.id === id),
    })), maxCardsInRow));
  }
  return rows;
}
