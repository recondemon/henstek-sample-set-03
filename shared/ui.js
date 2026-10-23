(function(){
const {validate,decode,seed,places,categories}=Journal;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const date=value=>new Date(value+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
function download(value,name,type='application/json'){const url=URL.createObjectURL(new Blob([value],{type}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
async function connect(key,render){
 let archive,blocked=false;
 const status=document.getElementById('status');
 function tell(message){status.textContent=message;}
 try{archive=window.journalStore?await window.journalStore.load():localStorage.getItem(key)?decode(localStorage.getItem(key)):structuredClone(seed);}catch(e){blocked=true;archive={...seed,entries:[]};tell('Saved data needs recovery. It has not been overwritten. '+e.message);}
 async function save(next){try{if(blocked)throw Error('Preserve your saved journal before recovery; writes are blocked.');const clean=validate(next);if(window.journalStore) await window.journalStore.save(clean);else{const old=localStorage.getItem(key);if(old){decode(old);localStorage.setItem(key+'.previous',old);}localStorage.setItem(key,JSON.stringify(clean));} archive=clean;render(archive);return true;}catch(e){tell('Could not save. '+e.message);return false;}}
 const dialog=document.getElementById('entry-dialog'),form=document.getElementById('entry-form');let editing=null;
 function edit(entry=null,place='lake'){editing=entry?.id||null;form.reset();form.elements.title.value=entry?.title||'';form.elements.place.value=entry?.place||place;form.elements.category.value=entry?.category||'moment';form.elements.date.value=entry?.date||new Date().toLocaleDateString('en-CA');form.elements.notes.value=entry?.notes||'';document.getElementById('editor-heading').textContent=entry?'Keep the memory':'A small thing, remembered';dialog.showModal();form.elements.title.focus();}
 document.getElementById('cancel-entry').onclick=()=>dialog.close();
 form.addEventListener('submit',async e=>{e.preventDefault();const fields=Object.fromEntries(new FormData(form));const previous=archive.entries.find(e=>e.id===editing);const item={id:editing||crypto.randomUUID(),...fields,starred:previous?.starred||false};const next={...archive,entries:editing?archive.entries.map(e=>e.id===editing?item:e):[item,...archive.entries]};if(await save(next)){dialog.close();tell('Observation saved to this device.');}});
 const file=document.getElementById('import-file'),confirm=document.getElementById('import-dialog');let pending=null;
 file.addEventListener('change',async()=>{const f=file.files[0];if(!f)return;try{if(f.size>500000)throw Error('Choose a JSON journal under 500 KB.');pending=decode(await f.text());document.getElementById('import-count').textContent=`This replaces your current journal with ${pending.entries.length} entries. Export your current copy first if you want to keep it.`;confirm.showModal();}catch(e){tell(e.message);}finally{file.value='';}});
 document.getElementById('cancel-import').onclick=()=>{pending=null;confirm.close();};
 document.getElementById('confirm-import').onclick=async()=>{if(pending&&await save(pending)){pending=null;confirm.close();tell('Journal imported.');}};
 const api={get value(){return archive;},edit,tell,save,async toggle(id){const next={...archive,entries:archive.entries.map(e=>e.id===id?{...e,starred:!e.starred}:e)};await save(next);},async export(){try{if(window.journalStore){if(await window.journalStore.export())tell('Journal exported.');}else{download(JSON.stringify(archive,null,2),'stillwater-journal.json');tell('Journal export prepared.');}}catch(e){tell(e.message);}},import(){file.click();}};
 return api;
}
window.JournalUI={el,date,download,connect};
})();
