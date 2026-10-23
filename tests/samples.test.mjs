import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,readFile,writeFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
const require=createRequire(import.meta.url),{seed,validate,decode,filtered}=require('../shared/journal.js'),{Store}=require('../samples/desktop/store.cjs'),{isAppPage}=require('../samples/desktop/security.cjs');
test('archives round-trip, while malformed dates, duplicate IDs and unknown fields are rejected',()=>{
 assert.deepEqual(decode(JSON.stringify(seed)),seed);
 for(const change of [{date:'2026-02-30'},{date:'2101-01-01'},{id:'<img>'},{title:' '},{title:'a'.repeat(81)},{place:'constructor'},{category:'unknown'},{starred:1},{notes:'a'.repeat(4001)}]){const next=structuredClone(seed);Object.assign(next.entries[0],change);assert.throws(()=>validate(next));}
 const duplicate=structuredClone(seed);duplicate.entries.push(duplicate.entries[0]);assert.throws(()=>validate(duplicate));
 assert.throws(()=>decode(' '.repeat(500001)));assert.throws(()=>validate({...seed,version:2}));
});
test('combined archive byte limits prevent successful saves that cannot be loaded',()=>{
 const entries=Array.from({length:100},(_,i)=>({...seed.entries[0],id:String(i),notes:'界'.repeat(4000)}));assert.throws(()=>validate({...seed,entries}),/500 KB/);
});
test('search, places and favorites compose and remain date ordered',()=>{
 assert.deepEqual(filtered(seed.entries,{query:'WREN',place:'grove'}).map(e=>e.id),['wren']);
 assert.deepEqual(filtered(seed.entries,{starred:true}).map(e=>e.id),['heron','mist']);
 assert.equal(filtered(seed.entries,{category:'plant',starred:true}).length,0);
});
test('native persistence serializes saves and keeps the immediately previous revision',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'stillwater-'));try{const store=new Store(dir);assert.deepEqual(await store.load(),seed);await store.save(seed);const next=structuredClone(seed);next.entries[0].title='New title';await store.save(next);assert.deepEqual(await store.load(),next);assert.deepEqual(JSON.parse(await readFile(join(dir,'journal.previous.json'),'utf8')),seed);}finally{await rm(dir,{recursive:true,force:true});}
});
test('damaged native files survive startup and subsequent save attempts',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'stillwater-'));try{await writeFile(join(dir,'journal.json'),'broken');const store=new Store(dir);await assert.rejects(store.load(),/recovery/);await assert.rejects(store.save(seed),/overwritten/);assert.equal(await readFile(join(dir,'journal.json'),'utf8'),'broken');}finally{await rm(dir,{recursive:true,force:true});}
});
test('damage introduced after load is not overwritten on save',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'stillwater-'));try{const store=new Store(dir);await store.load();await writeFile(join(dir,'journal.json'),'broken');await assert.rejects(store.save(seed));assert.equal(await readFile(join(dir,'journal.json'),'utf8'),'broken');}finally{await rm(dir,{recursive:true,force:true});}
});
test('IPC rejects external documents and lookalike app origins',()=>{
 assert.equal(isAppPage('journal://app/index.html'),true);for(const u of ['https://app/index.html','journal://evil/index.html','journal://user@app/index.html','journal://app/index.html?q=1','journal://app/other.html','invalid'])assert.equal(isAppPage(u),false);
});
test('published pages and their local assets exist',async()=>{
 const root=resolve('docs');for(const page of ['index.html','web/index.html','desktop/index.html']){const html=await readFile(join(root,page),'utf8');assert.match(html,/<title>/);assert.match(html,/name="viewport"/);for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|mailto:|data:)/.test(url))continue;await access(resolve(dirname(join(root,page)),url.split('#')[0]));}}
});
