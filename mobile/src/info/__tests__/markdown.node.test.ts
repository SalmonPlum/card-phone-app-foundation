import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseInfoMarkdown, isAllowedInfoLink} from '../markdown.ts';
const source=(body:string,meta='menuLabel: About me')=>`---\n${meta}\n---\n\n${body}`;
test('metadata, CRLF, Czech and all supported blocks preserve text',()=>{
  const doc=parseInfoMarkdown(source('# O mně\n\nHello\nworld **bold *inside*** and [web](https://example.com).\n\n> A quote\n> with more\n\n- one\n- two\n\n3. three\n4. four\n\n---').replace(/\n/g,'\r\n'));
  assert.equal(doc.menuLabel,'About me');
  assert.deepEqual(doc.blocks.map(b=>b.type),['heading','paragraph','quote','list','list','rule']);
  assert.match(JSON.stringify(doc),/Hello world/);
  assert.match(JSON.stringify(doc),/O mně/);
  assert.equal(doc.blocks[4].type==='list'&&doc.blocks[4].start,3);
  assert.match(JSON.stringify(doc),/strong/); assert.match(JSON.stringify(doc),/emphasis/);
});
test('escaped punctuation remains literal and plain apostrophes survive',()=>{
  const doc=parseInfoMarkdown(source("It's \\*literal\\* and **strong**."));
  assert.match(JSON.stringify(doc),/It's \*literal\*/);
});
for(const meta of ['', 'menuLabel: ', 'menuLabel: A\nmenuLabel: B','title: Wrong','menuLabel: A\nother: B','menuLabel: A\n  child: B'])test(`reject metadata ${JSON.stringify(meta)}`,()=>assert.throws(()=>parseInfoMarkdown(source('Hello',meta)),/menuLabel|metadata/i));
for(const body of ['', '![image](x.png)','<script>hi</script>','a | b\n--- | ---','```js\nalert(1)\n```','    code','[bad](javascript:alert)','**unfinished','[unfinished]','- parent\n  - nested'])test(`reject unsupported/malformed body ${JSON.stringify(body)}`,()=>assert.throws(()=>parseInfoMarkdown(source(body))));
test('metadata delimiters and boundaries are required',()=>{
  assert.throws(()=>parseInfoMarkdown('# No metadata'));
  assert.throws(()=>parseInfoMarkdown('---\nmenuLabel: Info\nNo close'));
});
test('only absolute http, https and email destinations launch',()=>{
  for(const url of ['https://example.com/a?q=b','http://example.com','mailto:hello@example.com'])assert.equal(isAllowedInfoLink(url),true,url);
  for(const url of ['javascript:alert(1)','file:///tmp/x','//example.com','https:example.com','https://','mailto:','https://example.com\n','https://user:pass@example.com'])assert.equal(isAllowedInfoLink(url),false,url);
});
test('strong inside emphasis and ordinary underscores retain their text',()=>{
  const doc=parseInfoMarkdown(source('*gentle **strong** gentle* and first_last'));
  assert.deepEqual(doc.blocks[0],{type:'paragraph',children:[{type:'emphasis',children:[{type:'text',text:'gentle '},{type:'strong',children:[{type:'text',text:'strong'}]},{type:'text',text:' gentle'}]},{type:'text',text:' and first_last'}]});
});
test('nested links are invalid even through formatting',()=>{
  assert.throws(()=>parseInfoMarkdown(source('[**[inner](https://inner.example)**](https://outer.example)')),/Link/);
});
test('preserves backslashes before ordinary letters and underscores inside emphasis',()=>{
  const doc=parseInfoMarkdown(source(String.raw`_edit first_name here_ and C:\Users\me`));
  assert.deepEqual(doc.blocks[0],{type:'paragraph',children:[{type:'emphasis',children:[{type:'text',text:'edit first_name here'}]},{type:'text',text:String.raw` and C:\Users\me`}]});
});
for(const body of ['#  ','[ ](https://example.com)','>  ','-  '])test(`reject invisible content ${JSON.stringify(body)}`,()=>assert.throws(()=>parseInfoMarkdown(source(body))));
for(const meta of ['menuLabel: ""',"menuLabel: 'Info'",'menuLabel: "Info"'])test(`reject quoted metadata ${meta}`,()=>assert.throws(()=>parseInfoMarkdown(source('Body',meta)),/menuLabel|metadata/i));
