import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {shuffleTextureCatalog} from '../shuffleTextureCatalog.ts';
import {validateThemeResource} from '../validateThemeResource.ts';

function luminance(rgb:number[]){
 const linear=rgb.map(value=>{const c=value/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
 return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
}
test('original repeat tile is small translucent RGBA and every supplied on-mat label retains text contrast over its relief',()=>{
 for(const [key,family] of Object.entries(shuffleTextureCatalog)){
 const entry=family.variants[0];
 const base=readFileSync(new URL('../../../'+family.path,import.meta.url));
 assert.equal(base.readUInt32BE(16),family.width);assert.equal(base.readUInt32BE(20),family.height);
 const bytes=readFileSync(new URL('../../../'+entry.path,import.meta.url));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),entry.width);assert.equal(bytes.readUInt32BE(20),entry.height);
 assert.equal(bytes[24],8);assert.equal(bytes[25],6);
 const chunks:Uint8Array[]=[];
 for(let offset=8;offset<bytes.length;){
  const length=bytes.readUInt32BE(offset),kind=bytes.subarray(offset+4,offset+8).toString();
  if(kind==='IDAT')chunks.push(bytes.subarray(offset+8,offset+8+length));
  offset+=length+12;
 }
 const pixels=inflateSync(Buffer.concat(chunks));
 const stride=entry.width*4+1;
 assert.equal(pixels.length,stride*entry.height);
 let maxAlpha=0,minAlpha=255;
 const samples=new Set<number>();
 for(let y=0;y<entry.height;y++){
  assert.equal(pixels[y*stride],0,'original generator writes unfiltered rows');
  for(let x=0;x<entry.width;x++){
   samples.add(pixels.readUInt32BE(y*stride+1+x*4));
   const alpha=pixels[y*stride+1+x*4+3];maxAlpha=Math.max(maxAlpha,alpha);minAlpha=Math.min(minAlpha,alpha);
  }
 }
 assert.ok(minAlpha<maxAlpha);assert.ok(maxAlpha>0&&maxAlpha<255);
 assert.ok(bytes.length<500000);assert.equal(entry.scale,2);
 const resource=validateThemeResource(JSON.parse(readFileSync(new URL('../resource.json',import.meta.url),'utf8')));
 for(const theme of resource.themes){
  if(theme.shuffleSurface?.texture!==key)continue;
  const opacity=theme.shuffleSurface?.opacity??0;
  const base=[1,3,5].map(offset=>parseInt(theme.colors.mat.slice(offset,offset+2),16));
  const label=luminance([1,3,5].map(offset=>parseInt(theme.colors.onMat.slice(offset,offset+2),16)));
  // Check actual relief RGBA combinations, including the darker gingham bands.
  for(const pixel of samples){
   const rgb=[pixel>>>24,(pixel>>>16)&255,(pixel>>>8)&255];
   const amount=(pixel&255)/255*opacity;
   const surface=luminance(base.map((channel,index)=>channel*(1-amount)+rgb[index]*amount));
   assert.ok((Math.max(label,surface)+.05)/(Math.min(label,surface)+.05)>=4.5,theme.id);
  }
 }
 }
});

test('the selected tablecloth texture has visible large gingham checks rather than only fine weave',()=>{
 const family=shuffleTextureCatalog['checked-cloth'];
 assert.ok(family,'checked tablecloth texture must be registered');
 const bytes=readFileSync(new URL('../../../'+family.variants[0].path,import.meta.url));
 const chunks:Uint8Array[]=[];
 for(let offset=8;offset<bytes.length;){
  const length=bytes.readUInt32BE(offset);
  if(bytes.subarray(offset+4,offset+8).toString()==='IDAT')chunks.push(bytes.subarray(offset+8,offset+8+length));
  offset+=length+12;
 }
 const pixels=inflateSync(Buffer.concat(chunks)),stride=family.variants[0].width*4+1;
 function patch(left:number,top:number){
  let sum=0;
  for(let y=top;y<top+32;y++)for(let x=left;x<left+32;x++){
   const index=y*stride+1+x*4,alpha=pixels[index+3]/255;
   sum+=128*(1-alpha)+pixels[index]*alpha;
  }
  return sum/(32*32);
 }
 assert.equal(family.width,320,'80dp checks repeat across a 320dp tile');
 const light=patch(32,32),stripe=patch(192,32),crossing=patch(192,192);
 assert.ok(Math.abs(patch(112,32)-light)<5,'each light square extends beyond the old 32dp boundary');
 assert.ok(light>stripe+24&&stripe>crossing+24,'checks need visibly distinct light, stripe and crossing areas');
 const resource=validateThemeResource(JSON.parse(readFileSync(new URL('../resource.json',import.meta.url),'utf8')));
 for(const theme of resource.themes)assert.equal(theme.shuffleSurface?.texture,'checked-cloth');
});
