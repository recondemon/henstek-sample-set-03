import {mkdir,copyFile,rm,cp,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
await rm(resolve(root,'docs'),{recursive:true,force:true});await mkdir(resolve(root,'docs'),{recursive:true});
for(const f of ['index.html','catalog.css']) await copyFile(resolve(root,'public',f),resolve(root,'docs',f));
for(const [folder,dest,script] of [['website','web','app.js'],['desktop','desktop','renderer.js']]){
 const dir=resolve(root,'docs',dest);await mkdir(dir,{recursive:true});
 for(const f of ['index.html','styles.css',script]) await copyFile(resolve(root,'samples',folder,f),resolve(dir,f));
 await cp(resolve(root,'samples',folder,'assets'),resolve(dir,'assets'),{recursive:true});
 for(const [src,name] of [['journal.js','model.js'],['ui.js','ui.js']]){await copyFile(resolve(root,'shared',src),resolve(dir,name));if(folder==='desktop')await copyFile(resolve(root,'shared',src),resolve(root,'samples/desktop',name));}
}
await cp(resolve(root,'public/previews'),resolve(root,'docs/previews'),{recursive:true});await writeFile(resolve(root,'docs/.nojekyll'),'');console.log('Built Stillwater collection, web atlas and desktop journal.');
