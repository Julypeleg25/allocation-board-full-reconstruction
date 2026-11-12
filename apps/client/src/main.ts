import {bootstrapApplication} from '@angular/platform-browser';
import {provideStore} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {AppComponent} from './app/app.component';
import {boardReducer} from './app/state/board.reducer';
import {BoardEffects} from './app/state/board.effects';
bootstrapApplication(AppComponent,{
 providers:[provideStore({board:boardReducer}),provideEffects([BoardEffects])]
}).catch(console.error);
