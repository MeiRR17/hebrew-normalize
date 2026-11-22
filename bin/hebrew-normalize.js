#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { summarizeDuplicateLines } from '../src/duplicates.js';
import { normalizeHebrew, PRESETS } from '../src/index.js';

const MAX_INPUT_BYTES = 4_000_000;
const MAX_INPUT_CHARS = 2_000_000;

const HELP = [
  'hebrew-normalize — Unicode normalization for Hebrew search and display',
  '',
  'Usage: hebrew-normalize [options] [file.txt]',
  '       cat file.txt | hebrew-normalize --mode search',
  '       hebrew-normalize --duplicate-counts corpus.txt',
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
  '  --duplicate-counts      Emit duplicate-line aggregates as JSON; no source text',
  '  --output FILE           Write to a new file; never overwrite',
  '  -h, --help              Show this usage text',
].join('\n');

function optionsFromArgs(argv) {
  let mode='default',input=null,output=null,json=false,help=false,duplicateCounts=false;
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
    else if(arg==='--duplicate-counts')duplicateCounts=true;
    else if(Object.hasOwn(flags,arg))overrides[flags[arg][0]]=flags[arg][1];
    else if(arg.startsWith('-'))throw new Error('Unknown option: '+arg);
    else if(input)throw new Error('Only one input filename is supported.');
    else input=arg;
  }
  if(duplicateCounts && json)throw new Error('--duplicate-counts already emits JSON; do not combine it with --json.');
  const preset=mode==='search'?PRESETS.search:mode==='display'?PRESETS.display:
    duplicateCounts?PRESETS.search:{};
  if(overrides.normalizePunctuation===false)overrides.normalizeMaqaf=false;
  if(overrides.collapseWhitespace===false)overrides.trim=false;
  return {help,input,output,json,duplicateCounts,settings:{...preset,...overrides}};
}
/**
 * Read a bounded UTF-8 stream from a file or stdin. Fatal decoding avoids
 * silently changing user data, and streaming caps protect file inputs too.
 */
async function readInput(path) {
  const stream = path ? createReadStream(path, { highWaterMark: 64 * 1024 }) : process.stdin;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, value = '';
  for await (const chunk of stream) {
    bytes += chunk.byteLength;
    if (bytes > MAX_INPUT_BYTES) {
      throw new RangeError('Input exceeds 4,000,000 UTF-8 bytes.');
    }
    try {
      value += decoder.decode(chunk, { stream: true });
    } catch {
      throw new TypeError('Input must be valid UTF-8.');
    }
    if (value.length > MAX_INPUT_CHARS) {
      throw new RangeError('Input exceeds 2,000,000 JavaScript characters.');
    }
  }
  try {
    value += decoder.decode();
  } catch {
    throw new TypeError('Input must be valid UTF-8.');
  }
  if (value.length > MAX_INPUT_CHARS) {
    throw new RangeError('Input exceeds 2,000,000 JavaScript characters.');
  }
  return value;
}
async function main(argv){
  const opts=optionsFromArgs(argv);
  if(opts.help){process.stdout.write(HELP+'\n');return;}
  if(!opts.input&&process.stdin.isTTY)throw new Error('Provide a file or pipe text via stdin.');
  if(opts.input&&opts.output&&opts.input===opts.output)throw new Error('Refusing to overwrite the input file.');
  const source = await readInput(opts.input);
  let result;
  if (opts.duplicateCounts) {
    const counts = summarizeDuplicateLines(source, opts.settings);
    result = JSON.stringify({
      format: 'hebrew-normalize-duplicate-summary-v1',
      counts,
      advisory: 'Counts only. Normalized keys, line numbers and original content are omitted.',
    }, null, 2) + '\n';
  } else {
    const normalized = normalizeHebrew(source, opts.settings);
    result = opts.json ? JSON.stringify(normalized) + '\n' : normalized;
  }
  if(opts.output){
    await writeFile(opts.output,result,{encoding:'utf8',flag:'wx'});
    process.stderr.write('Wrote normalized output to '+opts.output+'\n');
  }else process.stdout.write(result);
}
main(process.argv.slice(2)).catch(error=>{
  process.stderr.write('hebrew-normalize: '+error.message+'\n');
  process.exitCode=1;
});
