#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { normalizeHebrew, PRESETS } from '../src/index.js';

const HELP = [
  'hebrew-normalize — Unicode normalization for Hebrew search and display',
  '',
  'Usage: hebrew-normalize [options] [file.txt]',
  '       cat file.txt | hebrew-normalize --mode search',
  '',
  'Options:',
  '  --mode search|display   Search normalizes final forms; display keeps niqqud',
  '  --keep-niqqud           Preserve niqqud marks',
  '  --keep-tropes           Preserve cantillation marks',
  '  --normalize-finals      Map final letters to regular letters',
  '  --keep-finals           Preserve final forms',
  '  --keep-bidi             Preserve bidi controls',
  '  --keep-spacing          Preserve whitespace and leading/trailing spaces',
  '  --keep-punctuation      Do not normalize geresh/gershayim or maqaf',
  '  --json                  Emit normalized string as JSON',
  '  --output FILE           Write to a new file; never overwrite',
  '  -h, --help              Show this usage text',
].join('\n');

function optionsFromArgs(argv) {
  let mode='default',input=null,output=null,json=false,help=false;
  const overrides={};
  const flags={
    '--keep-niqqud':['removeNiqqud',false],
    '--keep-tropes':['removeCantillation',false],
    '--normalize-finals':['normalizeFinalLetters',true],
    '--keep-finals':['normalizeFinalLetters',false],
    '--keep-bidi':['removeBidiControls',false],
    '--keep-spacing':['collapseWhitespace',false],
    '--keep-punctuation':['normalizePunctuation',false],
  };
  for(let i=0;i<argv.length;i++) {
    const arg=argv[i];
    if(arg==='-h'||arg==='--help'){help=true;continue;}
    if(arg==='--mode'){
      mode=argv[++i];
      if(!['search','display'].includes(mode))throw new Error('Mode must be search or display.');
    } else if(arg==='--output'){
      output=argv[++i];
      if(!output||output.startsWith('--'))throw new Error('Missing --output filename.');
    } else if(arg==='--json')json=true;
    else if(Object.hasOwn(flags,arg))overrides[flags[arg][0]]=flags[arg][1];
    else if(arg.startsWith('-'))throw new Error('Unknown option: '+arg);
    else if(input)throw new Error('Only one input filename is supported.');
    else input=arg;
  }
  const preset=mode==='search'?PRESETS.search:mode==='display'?PRESETS.display:{};
  if(overrides.normalizePunctuation===false)overrides.normalizeMaqaf=false;
  if(overrides.collapseWhitespace===false)overrides.trim=false;
  return {help,input,output,json,settings:{...preset,...overrides}};
}
async function stdin(){
  const chunks=[];let total=0;
  for await(const part of process.stdin){
    total+=part.length;
    if(total>4_000_000)throw new Error('Input is too large.');
    chunks.push(part);
  }
  return Buffer.concat(chunks).toString('utf8');
}
async function main(argv){
  const opts=optionsFromArgs(argv);
  if(opts.help){process.stdout.write(HELP+'\n');return;}
  if(!opts.input&&process.stdin.isTTY)throw new Error('Provide a file or pipe text via stdin.');
  if(opts.input&&opts.output&&opts.input===opts.output)throw new Error('Refusing to overwrite the input file.');
  const source=opts.input?await readFile(opts.input,'utf8'):await stdin();
  const normalized=normalizeHebrew(source,opts.settings);
  const result=opts.json?JSON.stringify(normalized)+'\n':normalized;
  if(opts.output){
    await writeFile(opts.output,result,{encoding:'utf8',flag:'wx'});
    process.stderr.write('Wrote normalized output to '+opts.output+'\n');
  }else process.stdout.write(result);
}
main(process.argv.slice(2)).catch(error=>{
  process.stderr.write('hebrew-normalize: '+error.message+'\n');
  process.exitCode=1;
});
