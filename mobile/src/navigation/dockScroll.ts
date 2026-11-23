type DockItemBounds = {x:number;width:number};

export function clampDockOffset(offset:number,viewport:number,content:number):number {
  if(!Number.isFinite(offset)||!Number.isFinite(viewport)||!Number.isFinite(content)||viewport<=0)return 0;
  return Math.max(0,Math.min(offset,Math.max(0,content-viewport)));
}

/** Move only as far as needed. Oversized items align at their start. */
export function revealDockItem(offset:number,viewport:number,content:number,item:DockItemBounds):number {
  let next=clampDockOffset(offset,viewport,content);
  if(item.width>=viewport||item.x<next)next=item.x;
  else if(item.x+item.width>next+viewport)next=item.x+item.width-viewport;
  return clampDockOffset(next,viewport,content);
}

export function dockOverflow(offset:number,viewport:number,content:number):{left:boolean;right:boolean} {
  if(viewport<=0)return {left:false,right:false};
  const current=clampDockOffset(offset,viewport,content);
  return {left:current>1,right:content-viewport-current>1};
}
