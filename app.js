import { normalizeHebrew, DEFAULT_OPTIONS, PRESETS } from './src/index.js';
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
function update(){
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
  if(file.size>2_000_000){notice('הקובץ גדול מ־2MB.',true);return;}
  try{
    const data=await file.text();
    if(data.length>2_000_000)throw new RangeError('הטקסט חורג ממגבלת 2 מיליון תווים.');
    if(source.value.trim() && !confirm('לייבא קובץ במקום הטקסט הנוכחי?'))return;
    source.value=data;update();
  }catch(error){notice('טעינת הקובץ נכשלה: '+error.message,true);}
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
preset.value='search';
applySettings(PRESETS.search);
source.value=example;
update();
