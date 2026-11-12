import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import ts from 'typescript';
const roots=['apps/allocation-board-search/src','apps/client/src','packages/shared/src'];
let total=0;
async function scan(dir){
 for(const item of await readdir(dir,{withFileTypes:true})){
  const f=join(dir,item.name);
  if(item.isDirectory())await scan(f);
  else if(f.endsWith('.ts')){
   const src=await readFile(f,'utf8');
   const r=ts.transpileModule(src,{fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,
    module:ts.ModuleKind.ESNext,experimentalDecorators:true,emitDecoratorMetadata:true}});
   const errs=(r.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
   if(errs.length)throw Error(f+': '+errs.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join('; '));
   total++;
  }
 }
}
for(const root of roots)await scan(root);
console.log('TypeScript syntax OK:',total,'files. Full typecheck requires npm install.');
