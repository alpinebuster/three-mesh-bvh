import{T as y,k as l,i as p}from"./MeshBVH-CE-cOGaL.js";function h(r){switch(typeof r){case"number":return 8;case"string":return r.length*2;case"boolean":return 4;default:return 0}}function x(r){return/(Uint|Int|Float)(8|16|32)Array/.test(r.constructor.name)}function d(r,o){const e={nodeCount:0,leafNodeCount:0,depth:{min:1/0,max:-1/0},tris:{min:1/0,max:-1/0},splits:[0,0,0],surfaceAreaScore:0};return r.traverse((i,s,n,t,a)=>{const f=n[3]-n[0],c=n[4]-n[1],m=n[5]-n[2],u=2*(f*c+c*m+m*f);e.nodeCount++,s?(e.leafNodeCount++,e.depth.min=Math.min(i,e.depth.min),e.depth.max=Math.max(i,e.depth.max),e.tris.min=Math.min(a,e.tris.min),e.tris.max=Math.max(a,e.tris.max),e.surfaceAreaScore+=u*y*a):(e.splits[t]++,e.surfaceAreaScore+=u*l)},o),e.tris.min===1/0&&(e.tris.min=0,e.tris.max=0),e.depth.min===1/0&&(e.depth.min=0,e.depth.max=0),e}function S(r){return r._roots.map((o,e)=>d(r,e))}function I(r){const o=new Set,e=[r];let i=0;for(;e.length;){const s=e.pop();if(!o.has(s)){o.add(s);for(let n in s){if(!Object.hasOwn(s,n))continue;i+=h(n);const t=s[n];t&&(typeof t=="object"||typeof t=="function")?x(t)||p()&&t instanceof SharedArrayBuffer||t instanceof ArrayBuffer?i+=t.byteLength:e.push(t):i+=h(t)}}}return i}export{I as e,S as g};
