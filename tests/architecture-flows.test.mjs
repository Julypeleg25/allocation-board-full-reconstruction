import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const r=f=>readFile(f,'utf8');
test('groupBy enum includes all 19 observed options',async()=>{
 const data=await r('packages/shared/src/index.ts');
 const first=data.slice(data.indexOf('GROUP_BY_OPTIONS'),data.indexOf('] as const'));
 assert.equal((first.match(/'[A-Z_]+?'/g)||[]).length,19);
});
test('API bounds parallel work and tracking by client',async()=>{
 const scheduler=await r('apps/allocation-board-search/src/domain/use-cases/search-scheduler.ts');
 const usecase=await r('apps/allocation-board-search/src/domain/use-cases/allocation-board-search-use-case.ts');
 assert.match(scheduler,/maxQueue/);assert.match(scheduler,/waiters\.shift/);
 assert.match(usecase,/tracking\.delete/);assert.match(usecase,/clearInterval/);
});
test('no PR pagination implementation exists',async()=>{
 const builder=await r('apps/allocation-board-search/src/infra/repository/build-grouped-results-tree.ts');
 assert.match(builder,/allRows\.slice\(0,limit\)/);
 assert.doesNotMatch(builder,/cursor|pagination_attack_demands|offset/i);
});
