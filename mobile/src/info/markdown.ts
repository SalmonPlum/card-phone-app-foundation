/** Deliberately bounded authoring subset; see docs/info-page.md. No runtime I/O. */
export type InfoInline = {type:'text';text:string} | {type:'strong'|'emphasis';children:InfoInline[]} | {type:'link';url:string;children:InfoInline[]};
export type InfoBlock = {type:'heading';level:number;children:InfoInline[]} | {type:'paragraph'|'quote';children:InfoInline[]} | {type:'list';ordered:boolean;start:number;items:InfoInline[][]} | {type:'rule'};
export type InfoDocument = {menuLabel:string;blocks:InfoBlock[]};
export type InfoPage = Record<'en'|'cs',InfoDocument> | null;

export function isAllowedInfoLink(url:string):boolean {
  if (/[\s\u0000-\u001f\u007f]/.test(url)) return false;
  if (/^mailto:[^@?]+@[^@?]+(?:\?[^\s]*)?$/i.test(url)) return true;
  if (!/^https?:\/\//i.test(url)) return false;
  try { const parsed=new URL(url); return !!parsed.hostname&&!parsed.username&&!parsed.password; } catch { return false; }
}

function inlineText(nodes:InfoInline[]):string {
  return nodes.map(node=>node.type==='text'?node.text:inlineText(node.children)).join('');
}

function containsLink(nodes:InfoInline[]):boolean {
  return nodes.some(node=>node.type==='link'||node.type!=='text'&&containsLink(node.children));
}

function inline(source:string):InfoInline[] {
  if(!source.trim())throw new Error('Markdown text must not be blank');
  let pos=0;
  function read(end?:string,depth=0):InfoInline[] {
    if(depth>12)throw new Error('Formatting nesting is too deep');
    const nodes:InfoInline[]=[];
    const text=(value:string)=>{const last=nodes.at(-1);if(last?.type==='text')last.text+=value;else nodes.push({type:'text',text:value});};
    while(pos<source.length){
      const intraword=source[pos]==='_'&&/[\p{L}\p{N}]/u.test(source[pos-1]??'')&&/[\p{L}\p{N}]/u.test(source[pos+1]??'');
      if(end&&!intraword&&source.startsWith(end,pos)&&!(end.length===1&&end!==']'&&source.startsWith(end+end,pos)&&!source.startsWith(end+end+end,pos))){pos+=end.length;return nodes;}
      const c=source[pos];
      if(c==='\\'){
        if(pos+1>=source.length)throw new Error('Trailing escape; use \\\\ for a literal backslash');
        const code=source.charCodeAt(pos+1);
        if(code>=33&&code<=47||code>=58&&code<=64||code>=91&&code<=96||code>=123&&code<=126){text(source[pos+1]);pos+=2;}
        else {text(c);pos++;}
        continue;
      }
      if(c==='`'||c==='<'||c==='>'||c==='|'||source.startsWith('![',pos))throw new Error('Unsupported Markdown: code, HTML, tables and images are not supported');
      if(intraword){text(c);pos++;continue;}
      if(c==='*'||c==='_'){
        const marker=source.startsWith(c+c,pos)?c+c:c;
        pos+=marker.length;
        const children=read(marker,depth+1);
        if(!inlineText(children).trim())throw new Error('Empty emphasis');
        nodes.push({type:marker.length===2?'strong':'emphasis',children});continue;
      }
      if(c==='['){
        pos++;
        const children=read(']',depth+1);
        if(source[pos++]!=='(')throw new Error('Links must use [label](https://example.com)');
        const start=pos;let nesting=1;
        while(pos<source.length&&nesting){if(source[pos]==='(')nesting++;if(source[pos]===')')nesting--;if(nesting)pos++;}
        if(nesting)throw new Error('Unclosed link destination');
        const url=source.slice(start,pos++);
        if(!inlineText(children).trim()||containsLink(children)||!isAllowedInfoLink(url))throw new Error('Link requires a label and an absolute HTTP, HTTPS or mailto destination');
        nodes.push({type:'link',url,children});continue;
      }
      if(c===']')throw new Error('Unexpected closing bracket; escape literal brackets');
      text(c);pos++;
    }
    if(end)throw new Error(`Unclosed Markdown formatting: ${end}`);
    return nodes;
  }
  return read();
}

export function parseInfoMarkdown(source:string):InfoDocument {
  const lines=source.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n');
  if(lines[0]!=='---')throw new Error('Expected metadata header with menuLabel');
  const close=lines.indexOf('---',1);
  if(close<0)throw new Error('Unclosed metadata header');
  const metadata=lines.slice(1,close).filter(line=>line.trim());
  if(metadata.length!==1||!/^menuLabel: *\S/.test(metadata[0]))throw new Error('Metadata must contain exactly one nonempty menuLabel field');
  const menuLabel=metadata[0].slice('menuLabel:'.length).trim();
  if(/^["']|["']$/.test(menuLabel))throw new Error('menuLabel must be plain unquoted text');
  if(/[\u0000-\u001f\u007f]/.test(menuLabel))throw new Error('menuLabel contains control characters');
  const body=lines.slice(close+1),blocks:InfoBlock[]=[];
  const listPattern=/^(\s*)([-+*]|\d+\.)\s+(.+)$/;
  const special=(line:string)=>/^(#{1,6}\s|>\s?|(?:[-*_]\s*){3,}$)/.test(line)||listPattern.test(line);
  for(let i=0;i<body.length;){
    const line=body[i];
    if(!line.trim()){i++;continue;}
    if(/^\s/.test(line)||/^```|^~~~/.test(line))throw new Error(`Body line ${i+1}: indented/nested blocks and code are unsupported`);
    if(/^(?:-\s*){3,}$|^(?:\*\s*){3,}$|^(?:_\s*){3,}$/.test(line)){blocks.push({type:'rule'});i++;continue;}
    if(/^(?:[-+*]|\d+\.)\s*$/.test(line))throw new Error('List items must not be blank');
    const heading=/^(#{1,6})\s+(.+)$/.exec(line);
    if(heading){blocks.push({type:'heading',level:heading[1].length,children:inline(heading[2])});i++;continue;}
    if(/^#{1,6}(?:\s|$)/.test(line))throw new Error('Headings must not be blank');
    const item=listPattern.exec(line);
    if(item){
      const ordered=/\d/.test(item[2]),start=ordered?Number.parseInt(item[2],10):1,items:InfoInline[][]=[];
      while(i<body.length){const next=listPattern.exec(body[i]);if(!next||(/\d/.test(next[2])!==ordered))break;if(next[1])throw new Error('Nested lists are unsupported');items.push(inline(next[3]));i++;}
      blocks.push({type:'list',ordered,start,items});continue;
    }
    if(/^>/.test(line)){
      const quote:string[]=[];
      while(i<body.length&&/^>/.test(body[i])){const value=body[i++].replace(/^> ?/,'');if(!value.trim()||special(value))throw new Error('Quotes support text and inline formatting only');quote.push(value);}
      blocks.push({type:'quote',children:inline(quote.join(' '))});continue;
    }
    const paragraph=[line];i++;
    while(i<body.length&&body[i].trim()&&!special(body[i])){
      if(/^\s/.test(body[i])||/^```|^~~~/.test(body[i]))throw new Error('Indented blocks and code are unsupported');
      paragraph.push(body[i++]);
    }
    blocks.push({type:'paragraph',children:inline(paragraph.join(' '))});
  }
  if(!blocks.length)throw new Error('Markdown body must not be empty');
  return {menuLabel,blocks};
}
