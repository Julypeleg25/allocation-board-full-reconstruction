import {Injectable} from '@nestjs/common';
import {Subject} from 'rxjs';
@Injectable()
export class EntityChangeListenerService{
 readonly changed=new Subject<{table:string;revision:number}>();
 private revisions=0;
 emit(table:string){this.revisions++;this.changed.next({table,revision:this.revisions});}
 get version(){return this.revisions;}
}
