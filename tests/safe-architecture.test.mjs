import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=(x)=>readFile(x,'utf8');
test('explicit experimental candidate and baseline retained',async()=>{
 const joins=await read('apps/allocation-board-search/src/infra/repository/group-by-joins.ts');
 assert.match(joins,/DISTINCT ON/);assert.match(joins,/unnest\(op/);assert.match(joins,/@> ARRAY/);
 const repo=await read('apps/allocation-board-search/src/infra/repository/attack-demand-tree-repository.service.ts');
 assert.match(repo,/Promise\.all/);assert.match(repo,/filterOptions/);
});
test('post SQL cutoff, tree graph, shared eye state exist',async()=>{
 const builder=await read('apps/allocation-board-search/src/infra/repository/build-grouped-results-tree.ts');
 assert.match(builder,/slice\(0,limit\)/);
 const reducer=await read('apps/client/src/app/state/board.reducer.ts');
 assert.match(reducer,/allDescendantLeafIds/);
});
test('local database safety is mandatory',async()=>{
 const p=await read('scripts/pg.mjs');assert.match(p,/REFUSING remote/);
 const m=await read('apps/allocation-board-search/src/http/lab.controller.ts');assert.match(m,/ENABLE_LOCAL_MUTATIONS/);
});
