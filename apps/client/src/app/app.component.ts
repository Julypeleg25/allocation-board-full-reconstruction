import {ChangeDetectionStrategy,Component,inject,signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Store} from '@ngrx/store';
import {CdkVirtualScrollViewport, CdkVirtualForOf} from '@angular/cdk/scrolling';
import type {BoardQuery,GroupByOption} from '@lab/shared';
import {GROUP_BY_OPTIONS} from '@lab/shared';
import {BoardActions} from './state/board.actions';
import {selectVirtualRows,selectLoading,selectResult,selectError,selectReceivedCount,selectHiddenIds,selectSelectedIds,type Row} from './state/board.selectors';
@Component({selector:'app-root',standalone:true,
 imports:[CommonModule,CdkVirtualScrollViewport,CdkVirtualForOf],
 changeDetection:ChangeDetectionStrategy.OnPush,
 template:`
 <div class="app">
  <header><strong>Allocation Board • synthetic full-flow lab</strong><small>Angular 20 · NgRx · GraphQL WS · Knex · PostgreSQL</small></header>
  <main>
   <aside>
    <h2>Board selection</h2>
    <label>Campaign ID <input #campaign value="137" /></label>
    <label>Demand IDs (comma separated, overrides campaign when specified)
      <textarea #demandIds placeholder="D-1,D-2,D-3"></textarea></label>
    <h3>Group-by options (19)</h3>
    <div class="options"><label *ngFor="let option of allOptions">
      <input type="checkbox" [checked]="selectedGroups().includes(option)" (change)="toggleGroup(option)" /> {{option}}
    </label></div>
    <div class="actions"><button (click)="watch(campaign.value,demandIds.value)">Open / regroup</button>
      <button (click)="stop()">Close stream</button></div>
    <p>5,000 is a display cutoff; baseline SQL processes every matching demand.</p>
    <p>Visibility is global by demand ID, not just the visible board.</p>
    <p class="warn">Dev-only, synthetic data. The photographed pagination PR is excluded.</p>
   </aside>
   <section class="board">
    <h2>Demand tree</h2>
    <div class="stats">Loading: {{loading()}} · Received: {{received()}} · Matches: {{result()?.fullQueryAttackDemandCount ?? 0}} · Visible tree rows: {{rows().length}}</div>
    <p class="error" *ngIf="error()">{{error()}}</p>
    <div class="stats" *ngIf="result() as r">SQL {{r.timings['sqlMs']?.toFixed(1)}}ms · Filters {{r.timings['filterMs']?.toFixed(1)}}ms · Build {{r.timings['buildMs']?.toFixed(1)}}ms</div>
    <cdk-virtual-scroll-viewport class="viewport" itemSize="31" minBufferPx="930" maxBufferPx="1860">
     <div class="item" *cdkVirtualFor="let row of rows(); trackBy: trackById" [style.padding-left.px]="row.depth*14">
      <button *ngIf="row.type==='folder'" (click)="toggleEye(row.id)">Eye {{row.count}}</button>
      <button *ngIf="row.type==='leaf'" (click)="select(row.id,$event.ctrlKey)">Select</button>
      <span [class.dim]="hidden()[row.id]" [class.highlight]="selected().includes(row.id)">{{row.name}}</span>
     </div>
    </cdk-virtual-scroll-viewport>
   </section>
  </main>
 </div>`})
export class AppComponent{
 private readonly store=inject(Store);
 readonly allOptions=GROUP_BY_OPTIONS;
 readonly selectedGroups=signal<GroupByOption[]>([]);
 readonly rows=this.store.selectSignal(selectVirtualRows);
 readonly loading=this.store.selectSignal(selectLoading);
 readonly error=this.store.selectSignal(selectError);
 readonly result=this.store.selectSignal(selectResult);
 readonly received=this.store.selectSignal(selectReceivedCount);
 readonly hidden=this.store.selectSignal(selectHiddenIds);
 readonly selected=this.store.selectSignal(selectSelectedIds);
 toggleGroup(o:GroupByOption){this.selectedGroups.update(s=>s.includes(o)?s.filter(x=>x!==o):[...s,o]);}
 watch(campaign:string,demandIds:string){
  const ids=demandIds.split(',').map(s=>s.trim()).filter(Boolean);
  const query:BoardQuery={boardId:'demo',allocationBoardFolderId:'root-demo',groupBy:this.selectedGroups(),
   ...(ids.length?{specificAttackDemandIds:ids}:{scoreFilters:{campaignId:campaign}})};
  this.store.dispatch(BoardActions.watch({query}));
 }
 stop(){this.store.dispatch(BoardActions.unwatch());}
 select(id:string,additive:boolean){this.store.dispatch(BoardActions.selectDemand({id,additive}));}
 toggleEye(folderId:string){this.store.dispatch(BoardActions.toggleFolderEye({folderId}));}
 trackById(_index:number,row:Row){return row.viewKey;}
}
