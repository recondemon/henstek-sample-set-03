(function(root){
const places = { lake: 'Stillwater Lake', grove: 'Alder Grove', meadow: 'North Meadow' };
const categories = { bird: 'Birds', plant: 'Plants', moment: 'Small moments' };
const seed = {format:'stillwater-journal',version:1,entries:[
{id:'heron',title:'The patient one',place:'lake',category:'bird',date:'2026-10-23',starred:true,notes:'A heron held its place at the water’s edge for almost ten minutes. The whole lake seemed to wait with it.\n\nA reminder to stay a little longer next time.'},
{id:'alder',title:'A little gold in the canopy',place:'grove',category:'plant',date:'2026-10-22',starred:false,notes:'The alder leaves have started turning. A few were floating in yesterday’s rain, small boats following the same current.'},
{id:'mist',title:'Before the world woke up',place:'meadow',category:'moment',date:'2026-10-20',starred:true,notes:'Low mist over the grass. Wet shoes. The kind of morning that asks for nothing except being there.'},
{id:'wren',title:'A voice in the brambles',place:'grove',category:'bird',date:'2026-10-18',starred:false,notes:'Heard the wren before I saw it: a small shape with a much bigger song. I sat on the fallen log until it came back.'}
]};
function validate(value){
 if(!value || value.format!=='stillwater-journal' || value.version!==1 || !Array.isArray(value.entries) || value.entries.length>100) throw Error('Choose a Stillwater version 1 journal with up to 100 entries.');
 const ids=new Set(); const entries=value.entries.map(e=>{
 if(!e || typeof e.id!=='string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(e.id) || ids.has(e.id) || typeof e.title!=='string' || !e.title.trim() || e.title.length>80 || !Object.hasOwn(places,e.place) || !Object.hasOwn(categories,e.category) || typeof e.starred!=='boolean' || typeof e.notes!=='string' || e.notes.length>4000 || typeof e.date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || e.date<'1900-01-01' || e.date>'2100-12-31' || !Number.isFinite(Date.parse(e.date)) || new Date(e.date).toISOString().slice(0,10)!==e.date) throw Error('An entry has invalid or missing fields. No changes were saved.');
 ids.add(e.id); return {id:e.id,title:e.title.trim(),place:e.place,category:e.category,date:e.date,starred:e.starred,notes:e.notes.trim()};
 }); const clean={format:'stillwater-journal',version:1,entries};if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>500000)throw Error('The journal exceeds 500 KB. Shorten some entries before saving.'); return clean;
}
function decode(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>500000) throw Error('Choose a JSON journal under 500 KB.'); return validate(JSON.parse(text));}
function filtered(entries,{query='',place='all',category='all',starred=false}={}){ const q=query.toLowerCase().trim(); return entries.filter(e=>(place==='all'||e.place===place)&&(category==='all'||e.category===category)&&(!starred||e.starred)&&(!q||(e.title+' '+e.notes+' '+places[e.place]).toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title)); }
const api={places,categories,seed,validate,decode,filtered}; if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Journal=api;
})(typeof window==='undefined'?globalThis:window);
