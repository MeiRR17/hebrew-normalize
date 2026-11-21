import { normalizeHebrew, DEFAULT_OPTIONS, PRESETS } from './src/index.js';
import { findDuplicateLines, duplicateSummary } from './src/duplicates.js';
const $=id=>document.getElementById(id);
const source=$('source'), output=$('output'),preset=$('preset');
const optionNames=Object.keys(DEFAULT_OPTIONS);
const example=[
  'שָׁלוֹם עוֹלָם!',
  'כָּל מֶלֶךְ וּמְלָכִים — שָׁלוֹם־עֲלֵיכֶם.',
  'תּוֹרָה בְּנִיקּוּד וְטַעֲמֵ֣י הַמִּקְרָ֔א.',
  'צו״ל, מנכ"ל, ד"ר, וכתיב מעורב with English.',
  'אותיות סופיות: מלך, שלום, אבן, יוסף, ארץ.',
].join('\n');
let result='';
let lastDuplicates=null;
let editRevision=0;
let fileImportRevision=0;
function notice(message,error=false){
  $('notice').textContent=message;
  $('notice').className='notice'+(error?' error':'');
}
function applySettings(settings){
  for(const key of optionNames)$(key).checked=settings[key]===true;
}
function selectedSettings(){
  return Object.fromEntries(optionNames.map(key=>[key,$(key).checked]));
}
function count(value){
  return [...value].length.toLocaleString('he-IL')+' תווים';
}
function clearDuplicates(){
  lastDuplicates=null;
  $('download-duplicates').disabled=true;
  $('download-duplicate-counts').disabled=true;
  $('duplicates-groups').replaceChildren();
  $('duplicates-summary').textContent='הטקסט או הכללים השתנו. הרץ בדיקה חדשה.';
}
function update(){
  editRevision++;
  clearDuplicates();
  $('source-count').textContent=count(source.value);
  try{
    result=normalizeHebrew(source.value,selectedSettings());
    output.value=result;
    $('output-count').textContent=count(result);
    const originalPoints=[...source.value].length;
    const resultPoints=[...result].length;
    $('change-message').textContent=source.value===result?'ללא שינוי':
      'הטקסט השתנה · '+Math.abs(originalPoints-resultPoints)+' תווים בהפרש אורך';
    notice('');
  }catch(error){
    output.value='';result='';$('output-count').textContent='0 תווים';
    $('change-message').textContent='שגיאה';
    notice(error.message,true);
  }
}
function save(name,content,type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=name;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
preset.addEventListener('change',()=>{
  if(preset.value==='custom')return;
  const config=preset.value==='search'?PRESETS.search:
    preset.value==='display'?PRESETS.display:DEFAULT_OPTIONS;
  applySettings(config);update();
});
for(const key of optionNames)$(key).addEventListener('change',()=>{
  preset.value='custom';
  update();
});
source.addEventListener('input',update);
$('sample').addEventListener('click',()=>{
  if(source.value.trim() && source.value!==example &&
    !confirm('להחליף את הטקסט הנוכחי בטקסט לדוגמה?'))return;
  source.value=example;update();
});
$('import').addEventListener('click',()=>$('file').click());
$('file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file)return;
  const request=++fileImportRevision;
  const revision=editRevision;
  if(file.size>2_000_000){notice('הקובץ גדול מ־2MB.',true);return;}
  try{
    const data=await file.text();
    if(request!==fileImportRevision)return;
    if(revision!==editRevision){
      notice('הטקסט או הכללים השתנו במהלך הקריאה. הייבוא הישן בוטל כדי למנוע דריסה.',true);
      return;
    }
    if(data.length>2_000_000)throw new RangeError('הטקסט חורג ממגבלת 2 מיליון תווים.');
    if(source.value.trim() && !confirm('לייבא קובץ במקום הטקסט הנוכחי?'))return;
    if(request!==fileImportRevision || revision!==editRevision)return;
    source.value=data;update();
  }catch(error){
    if(request===fileImportRevision)notice('טעינת הקובץ נכשלה: '+error.message,true);
  }
});
$('download').addEventListener('click',()=>save('normalized-hebrew.txt',result,'text/plain;charset=utf-8'));
$('copy').addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText(result);
    notice('התוצאה הועתקה ללוח.');
  }catch{
    output.focus();output.select();
    notice('העתקה אוטומטית נחסמה. הטקסט סומן להעתקה ידנית.',true);
  }
});

function analyzeDuplicates(){
  try{
    const analyzed=findDuplicateLines(source.value,selectedSettings());
    lastDuplicates=analyzed;
    const counts=duplicateSummary(analyzed);
    $('duplicates-summary').textContent=
      counts.nonEmptyLines.toLocaleString('he-IL')+' שורות לא ריקות · '+
      counts.duplicateGroups.toLocaleString('he-IL')+' קבוצות כפולות · '+
      counts.redundantLines.toLocaleString('he-IL')+' שורות עודפות' +
      (counts.normalizedEmpty ? ' · '+counts.normalizedEmpty+' שורות שהתרוקנו בנרמול' : '');
    const region=$('duplicates-groups');
    region.replaceChildren();
    if(!analyzed.groups.length){
      const message=document.createElement('p');
      message.textContent='לא נמצאו שורות שמקבלות מפתח נרמול זהה.';
      region.append(message);
    }else{
      const list=document.createElement('ol');
      const maxShown=200;
      for(const group of analyzed.groups.slice(0,maxShown)){
        const item=document.createElement('li');
        const key=document.createElement('code');
        key.dir='auto';
        key.textContent=[...group.normalized].slice(0,110).join('')+
          ([...group.normalized].length>110?'…':'');
        const lines=document.createElement('span');
        lines.textContent=' שורות: '+group.lines.join(', ');
        item.append(key,lines);list.append(item);
      }
      region.append(list);
      if(analyzed.groups.length>maxShown){
        const more=document.createElement('p');
        more.textContent='מוצגות 200 הקבוצות הראשונות בלבד. הדוח להורדה כולל את כל הקבוצות.';
        region.append(more);
      }
    }
    $('download-duplicates').disabled=false;
    $('download-duplicate-counts').disabled=false;
    notice('ניתוח הכפילויות הושלם מקומית. ערכי המקור לא נשלחו לשרת.');
  }catch(error){
    lastDuplicates=null;
    $('download-duplicates').disabled=true;
    $('download-duplicate-counts').disabled=true;
    $('duplicates-groups').replaceChildren();
    $('duplicates-summary').textContent='הבדיקה נכשלה.';
    notice(error.message,true);
  }
}
$('find-duplicates').addEventListener('click',analyzeDuplicates);
$('download-duplicate-counts').addEventListener('click',()=>{
  if(!lastDuplicates)return;
  const report={
    format:'hebrew-normalize-duplicate-summary-v1',
    counts:duplicateSummary(lastDuplicates),
    advisory:'Counts only. Normalized keys, line numbers and original content are omitted.',
  };
  save('hebrew-duplicate-counts.json',JSON.stringify(report,null,2)+'\n',
    'application/json;charset=utf-8');
  notice('סיכום מספרי נשמר. הדוח אינו כולל מפתחות או שורות טקסט.');
});
$('download-duplicates').addEventListener('click',()=>{
  if(!lastDuplicates)return;
  const report={
    format:'hebrew-normalize-duplicate-lines-v1',
    counts:duplicateSummary(lastDuplicates),
    groups:lastDuplicates.groups,
  };
  save('hebrew-duplicate-lines.json',JSON.stringify(report,null,2)+'\n',
    'application/json;charset=utf-8');
  notice('דוח הכפילויות נשמר. הוא כולל מפתחות מנורמלים — יש לבדוק מידע רגיש לפני שיתוף.');
});

preset.value='search';
applySettings(PRESETS.search);
source.value=example;
update();
