import {Injectable,inject} from '@angular/core';
import {Actions,createEffect,ofType} from '@ngrx/effects';
import {switchMap,map,catchError,takeUntil,of} from 'rxjs';
import {BoardClientService} from '../transport/board-client.service';
import {BoardActions} from './board.actions';
@Injectable()
export class BoardEffects{
 private actions$=inject(Actions);
 private client=inject(BoardClientService);
 watch$=createEffect(()=>this.actions$.pipe(ofType(BoardActions.watch),switchMap(({query})=>
  this.client.observe(query).pipe(
   map(response=>BoardActions.result({response})),
   takeUntil(this.actions$.pipe(ofType(BoardActions.unwatch))),
   catchError(err=>of(BoardActions.failed({message:String(err)})))
  )
 )));
}
