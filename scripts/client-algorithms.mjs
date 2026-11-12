/** Benchmark reconstructed client algorithms without an Angular browser. */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let lib;
try{lib=require('../packages/shared/dist/legacy-algorithms.js');}
catch{throw Error('Run npm run build:shared before benchmark:client');}
const {buildGroupedTree}=require('../packages/shared/dist/tree.js');
const size=Math.min(60000,Number(process.env.ROWS??5000));
const rows=Array.from({length:size},(_,i)=>({id:`D-${i+1}`,OPERATIONAL_PLAN:`Plan ${i%500}, Plan ${((i+17)%500)}`,TARGET_COUNTRY:`Country ${i%7}`}));
const tree=buildGroupedTree(rows,['OPERATIONAL_PLAN','TARGET_COUNTRY'],'root');
console.log('input rows',size,'tree nodes',Object.keys(tree).length);
function bench(name,f){const t=performance.now();const out=f();console.log(name,(performance.now()-t).toFixed(1),'ms');return out;}
const a=bench('baselineLeafCounts',()=>lib.baselineLeafCounts(tree));
const b=bench('candidateLeafCounts',()=>lib.candidateLeafCounts(tree));
if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Leaf count parity failed');
console.info('Parity: OK, identical leaf-count dictionaries');
