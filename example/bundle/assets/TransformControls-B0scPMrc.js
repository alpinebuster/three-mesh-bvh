import{m as gt,V as r,aJ as vt,ar as M,q as ut,O as it,f as ft,w as Et,j as f,X as m,l as st,ag as at,M as o,aK as N,al as I,e as It,ak as k,s as Xt,t as Qt,a7 as Yt}from"./ExtendedTriangle-CFC-kWKu.js";const A=new gt,d=new r,X=new r,c=new M,rt={X:new r(1,0,0),Y:new r(0,1,0),Z:new r(0,0,1)},tt={type:"change"},lt={type:"mouseDown",mode:null},ht={type:"mouseUp",mode:null},ct={type:"objectChange"};class Lt extends vt{constructor(n,e=null){super(void 0,e);const s=new Dt(this);this._root=s;const i=new jt;this._gizmo=i,s.add(i);const h=new qt;this._plane=h,s.add(h);const t=this;function a(w,Y){let z=Y;Object.defineProperty(t,w,{get:function(){return z!==void 0?z:Y},set:function(Z){z!==Z&&(z=Z,h[w]=Z,i[w]=Z,t.dispatchEvent({type:w+"-changed",value:Z}),t.dispatchEvent(tt))}}),t[w]=Y,h[w]=Y,i[w]=Y}a("camera",n),a("object",void 0),a("enabled",!0),a("axis",null),a("mode","translate"),a("translationSnap",null),a("rotationSnap",null),a("scaleSnap",null),a("space","world"),a("size",1),a("dragging",!1),a("showX",!0),a("showY",!0),a("showZ",!0),a("minX",-1/0),a("maxX",1/0),a("minY",-1/0),a("maxY",1/0),a("minZ",-1/0),a("maxZ",1/0);const y=new r,Q=new r,T=new M,j=new M,q=new r,nt=new M,W=new r,S=new r,g=new r,b=0,v=new r;a("worldPosition",y),a("worldPositionStart",Q),a("worldQuaternion",T),a("worldQuaternionStart",j),a("cameraPosition",q),a("cameraQuaternion",nt),a("pointStart",W),a("pointEnd",S),a("rotationAxis",g),a("rotationAngle",b),a("eye",v),this._offset=new r,this._startNorm=new r,this._endNorm=new r,this._cameraScale=new r,this._parentPosition=new r,this._parentQuaternion=new M,this._parentQuaternionInv=new M,this._parentScale=new r,this._worldScaleStart=new r,this._worldQuaternionInv=new M,this._worldScale=new r,this._positionStart=new r,this._quaternionStart=new M,this._scaleStart=new r,this._getPointer=Zt.bind(this),this._onPointerDown=Ht.bind(this),this._onPointerHover=At.bind(this),this._onPointerMove=Tt.bind(this),this._onPointerUp=zt.bind(this),e!==null&&this.connect()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointermove",this._onPointerHover),this.domElement.addEventListener("pointerup",this._onPointerUp),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerHover),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.style.touchAction="auto"}getHelper(){return this._root}pointerHover(n){if(this.object===void 0||this.dragging===!0)return;n!==null&&A.setFromCamera(n,this.camera);const e=et(this._gizmo.picker[this.mode],A);e?this.axis=e.object.name:this.axis=null}pointerDown(n){if(!(this.object===void 0||this.dragging===!0||n!=null&&n.button!==0)&&this.axis!==null){n!==null&&A.setFromCamera(n,this.camera);const e=et(this._plane,A,!0);e&&(this.object.updateMatrixWorld(),this.object.parent.updateMatrixWorld(),this._positionStart.copy(this.object.position),this._quaternionStart.copy(this.object.quaternion),this._scaleStart.copy(this.object.scale),this.object.matrixWorld.decompose(this.worldPositionStart,this.worldQuaternionStart,this._worldScaleStart),this.pointStart.copy(e.point).sub(this.worldPositionStart)),this.dragging=!0,lt.mode=this.mode,this.dispatchEvent(lt)}}pointerMove(n){const e=this.axis,s=this.mode,i=this.object;let h=this.space;if(s==="scale"?h="local":(e==="E"||e==="XYZE"||e==="XYZ")&&(h="world"),i===void 0||e===null||this.dragging===!1||n!==null&&n.button!==-1)return;n!==null&&A.setFromCamera(n,this.camera);const t=et(this._plane,A,!0);if(t){if(this.pointEnd.copy(t.point).sub(this.worldPositionStart),s==="translate")this._offset.copy(this.pointEnd).sub(this.pointStart),h==="local"&&e!=="XYZ"&&this._offset.applyQuaternion(this._worldQuaternionInv),e.indexOf("X")===-1&&(this._offset.x=0),e.indexOf("Y")===-1&&(this._offset.y=0),e.indexOf("Z")===-1&&(this._offset.z=0),h==="local"&&e!=="XYZ"?this._offset.applyQuaternion(this._quaternionStart).divide(this._parentScale):this._offset.applyQuaternion(this._parentQuaternionInv).divide(this._parentScale),i.position.copy(this._offset).add(this._positionStart),this.translationSnap&&(h==="local"&&(i.position.applyQuaternion(c.copy(this._quaternionStart).invert()),e.search("X")!==-1&&(i.position.x=Math.round(i.position.x/this.translationSnap)*this.translationSnap),e.search("Y")!==-1&&(i.position.y=Math.round(i.position.y/this.translationSnap)*this.translationSnap),e.search("Z")!==-1&&(i.position.z=Math.round(i.position.z/this.translationSnap)*this.translationSnap),i.position.applyQuaternion(this._quaternionStart)),h==="world"&&(i.parent&&i.position.add(d.setFromMatrixPosition(i.parent.matrixWorld)),e.search("X")!==-1&&(i.position.x=Math.round(i.position.x/this.translationSnap)*this.translationSnap),e.search("Y")!==-1&&(i.position.y=Math.round(i.position.y/this.translationSnap)*this.translationSnap),e.search("Z")!==-1&&(i.position.z=Math.round(i.position.z/this.translationSnap)*this.translationSnap),i.parent&&i.position.sub(d.setFromMatrixPosition(i.parent.matrixWorld)))),i.position.x=Math.max(this.minX,Math.min(this.maxX,i.position.x)),i.position.y=Math.max(this.minY,Math.min(this.maxY,i.position.y)),i.position.z=Math.max(this.minZ,Math.min(this.maxZ,i.position.z));else if(s==="scale"){if(e.search("XYZ")!==-1){let a=this.pointEnd.length()/this.pointStart.length();this.pointEnd.dot(this.pointStart)<0&&(a*=-1),X.set(a,a,a)}else d.copy(this.pointStart),X.copy(this.pointEnd),d.applyQuaternion(this._worldQuaternionInv),X.applyQuaternion(this._worldQuaternionInv),X.divide(d),e.search("X")===-1&&(X.x=1),e.search("Y")===-1&&(X.y=1),e.search("Z")===-1&&(X.z=1);i.scale.copy(this._scaleStart).multiply(X),this.scaleSnap&&(e.search("X")!==-1&&(i.scale.x=Math.round(i.scale.x/this.scaleSnap)*this.scaleSnap||this.scaleSnap),e.search("Y")!==-1&&(i.scale.y=Math.round(i.scale.y/this.scaleSnap)*this.scaleSnap||this.scaleSnap),e.search("Z")!==-1&&(i.scale.z=Math.round(i.scale.z/this.scaleSnap)*this.scaleSnap||this.scaleSnap))}else if(s==="rotate"){this._offset.copy(this.pointEnd).sub(this.pointStart);const a=20/this.worldPosition.distanceTo(d.setFromMatrixPosition(this.camera.matrixWorld));let y=!1;e==="XYZE"?(this.rotationAxis.copy(this._offset).cross(this.eye).normalize(),this.rotationAngle=this._offset.dot(d.copy(this.rotationAxis).cross(this.eye))*a):(e==="X"||e==="Y"||e==="Z")&&(this.rotationAxis.copy(rt[e]),d.copy(rt[e]),h==="local"&&d.applyQuaternion(this.worldQuaternion),d.cross(this.eye),d.length()===0?y=!0:this.rotationAngle=this._offset.dot(d.normalize())*a),(e==="E"||y)&&(this.rotationAxis.copy(this.eye),this.rotationAngle=this.pointEnd.angleTo(this.pointStart),this._startNorm.copy(this.pointStart).normalize(),this._endNorm.copy(this.pointEnd).normalize(),this.rotationAngle*=this._endNorm.cross(this._startNorm).dot(this.eye)<0?1:-1),this.rotationSnap&&(this.rotationAngle=Math.round(this.rotationAngle/this.rotationSnap)*this.rotationSnap),h==="local"&&e!=="E"&&e!=="XYZE"?(i.quaternion.copy(this._quaternionStart),i.quaternion.multiply(c.setFromAxisAngle(this.rotationAxis,this.rotationAngle)).normalize()):(this.rotationAxis.applyQuaternion(this._parentQuaternionInv),i.quaternion.copy(c.setFromAxisAngle(this.rotationAxis,this.rotationAngle)),i.quaternion.multiply(this._quaternionStart).normalize())}this.dispatchEvent(tt),this.dispatchEvent(ct)}}pointerUp(n){n!==null&&n.button!==0||(this.dragging&&this.axis!==null&&(ht.mode=this.mode,this.dispatchEvent(ht)),this.dragging=!1,this.axis=null)}dispose(){this.disconnect(),this._root.dispose()}attach(n){return this.object=n,this._root.visible=!0,this}detach(){return this.object=void 0,this.axis=null,this._root.visible=!1,this}reset(){this.enabled&&this.dragging&&(this.object.position.copy(this._positionStart),this.object.quaternion.copy(this._quaternionStart),this.object.scale.copy(this._scaleStart),this.dispatchEvent(tt),this.dispatchEvent(ct),this.pointStart.copy(this.pointEnd))}getRaycaster(){return A}getMode(){return this.mode}setMode(n){this.mode=n}setTranslationSnap(n){this.translationSnap=n}setRotationSnap(n){this.rotationSnap=n}setScaleSnap(n){this.scaleSnap=n}setSize(n){this.size=n}setSpace(n){this.space=n}}function Zt(p){if(this.domElement.ownerDocument.pointerLockElement)return{x:0,y:0,button:p.button};{const n=this.domElement.getBoundingClientRect();return{x:(p.clientX-n.left)/n.width*2-1,y:-(p.clientY-n.top)/n.height*2+1,button:p.button}}}function At(p){if(this.enabled)switch(p.pointerType){case"mouse":case"pen":this.pointerHover(this._getPointer(p));break}}function Ht(p){this.enabled&&(document.pointerLockElement||this.domElement.setPointerCapture(p.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.pointerHover(this._getPointer(p)),this.pointerDown(this._getPointer(p)))}function Tt(p){this.enabled&&this.pointerMove(this._getPointer(p))}function zt(p){this.enabled&&(this.domElement.releasePointerCapture(p.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.pointerUp(this._getPointer(p)))}function et(p,n,e){const s=n.intersectObject(p,!0);for(let i=0;i<s.length;i++)if(s[i].object.visible||e)return s[i];return!1}const V=new Yt,l=new r(0,1,0),pt=new r(0,0,0),dt=new ut,J=new M,$=new M,P=new r,mt=new ut,O=new r(1,0,0),H=new r(0,1,0),C=new r(0,0,1),K=new r,L=new r,R=new r;class Dt extends it{constructor(n){super(),this.isTransformControlsRoot=!0,this.controls=n,this.visible=!1}updateMatrixWorld(n){const e=this.controls;e.object!==void 0&&(e.object.updateMatrixWorld(),e.object.parent===null?console.error("TransformControls: The attached 3D object must be a part of the scene graph."):e.object.parent.matrixWorld.decompose(e._parentPosition,e._parentQuaternion,e._parentScale),e.object.matrixWorld.decompose(e.worldPosition,e.worldQuaternion,e._worldScale),e._parentQuaternionInv.copy(e._parentQuaternion).invert(),e._worldQuaternionInv.copy(e.worldQuaternion).invert()),e.camera.updateMatrixWorld(),e.camera.matrixWorld.decompose(e.cameraPosition,e.cameraQuaternion,e._cameraScale),e.camera.isOrthographicCamera?e.camera.getWorldDirection(e.eye).negate():e.eye.copy(e.cameraPosition).sub(e.worldPosition).normalize(),super.updateMatrixWorld(n)}dispose(){this.traverse(function(n){n.geometry&&n.geometry.dispose(),n.material&&n.material.dispose()})}}class jt extends it{constructor(){super(),this.isTransformControlsGizmo=!0,this.type="TransformControlsGizmo";const n=new ft({depthTest:!1,depthWrite:!1,fog:!1,toneMapped:!1,transparent:!0}),e=new Et({depthTest:!1,depthWrite:!1,fog:!1,toneMapped:!1,transparent:!0}),s=n.clone();s.opacity=.15;const i=e.clone();i.opacity=.5;const h=n.clone();h.color.setHex(16711680);const t=n.clone();t.color.setHex(65280);const a=n.clone();a.color.setHex(255);const y=n.clone();y.color.setHex(16711680),y.opacity=.5;const Q=n.clone();Q.color.setHex(65280),Q.opacity=.5;const T=n.clone();T.color.setHex(255),T.opacity=.5;const j=n.clone();j.opacity=.25;const q=n.clone();q.color.setHex(16776960),q.opacity=.25,n.clone().color.setHex(16776960);const W=n.clone();W.color.setHex(7895160);const S=new f(0,.04,.1,12);S.translate(0,.05,0);const g=new m(.08,.08,.08);g.translate(0,.04,0);const b=new st;b.setAttribute("position",new at([0,0,0,1,0,0],3));const v=new f(.0075,.0075,.5,3);v.translate(0,.25,0);function w(_,G){const x=new k(_,.0075,3,64,G*Math.PI*2);return x.rotateY(Math.PI/2),x.rotateX(Math.PI/2),x}function Y(){const _=new st;return _.setAttribute("position",new at([0,0,0,1,1,1],3)),_}const z={X:[[new o(S,h),[.5,0,0],[0,0,-Math.PI/2]],[new o(S,h),[-.5,0,0],[0,0,Math.PI/2]],[new o(v,h),[0,0,0],[0,0,-Math.PI/2]]],Y:[[new o(S,t),[0,.5,0]],[new o(S,t),[0,-.5,0],[Math.PI,0,0]],[new o(v,t)]],Z:[[new o(S,a),[0,0,.5],[Math.PI/2,0,0]],[new o(S,a),[0,0,-.5],[-Math.PI/2,0,0]],[new o(v,a),null,[Math.PI/2,0,0]]],XYZ:[[new o(new N(.1,0),j.clone()),[0,0,0]]],XY:[[new o(new m(.15,.15,.01),T.clone()),[.15,.15,0]]],YZ:[[new o(new m(.15,.15,.01),y.clone()),[0,.15,.15],[0,Math.PI/2,0]]],XZ:[[new o(new m(.15,.15,.01),Q.clone()),[.15,0,.15],[-Math.PI/2,0,0]]]},Z={X:[[new o(new f(.2,0,.6,4),s),[.3,0,0],[0,0,-Math.PI/2]],[new o(new f(.2,0,.6,4),s),[-.3,0,0],[0,0,Math.PI/2]]],Y:[[new o(new f(.2,0,.6,4),s),[0,.3,0]],[new o(new f(.2,0,.6,4),s),[0,-.3,0],[0,0,Math.PI]]],Z:[[new o(new f(.2,0,.6,4),s),[0,0,.3],[Math.PI/2,0,0]],[new o(new f(.2,0,.6,4),s),[0,0,-.3],[-Math.PI/2,0,0]]],XYZ:[[new o(new N(.2,0),s)]],XY:[[new o(new m(.2,.2,.01),s),[.15,.15,0]]],YZ:[[new o(new m(.2,.2,.01),s),[0,.15,.15],[0,Math.PI/2,0]]],XZ:[[new o(new m(.2,.2,.01),s),[.15,0,.15],[-Math.PI/2,0,0]]]},wt={START:[[new o(new N(.01,2),i),null,null,null,"helper"]],END:[[new o(new N(.01,2),i),null,null,null,"helper"]],DELTA:[[new I(Y(),i),null,null,null,"helper"]],X:[[new I(b,i.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]],Y:[[new I(b,i.clone()),[0,-1e3,0],[0,0,Math.PI/2],[1e6,1,1],"helper"]],Z:[[new I(b,i.clone()),[0,0,-1e3],[0,-Math.PI/2,0],[1e6,1,1],"helper"]]},yt={XYZE:[[new o(w(.5,1),W),null,[0,Math.PI/2,0]]],X:[[new o(w(.5,.5),h)]],Y:[[new o(w(.5,.5),t),null,[0,0,-Math.PI/2]]],Z:[[new o(w(.5,.5),a),null,[0,Math.PI/2,0]]],E:[[new o(w(.75,1),q),null,[0,Math.PI/2,0]]]},_t={AXIS:[[new I(b,i.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]]},xt={XYZE:[[new o(new It(.25,10,8),s)]],X:[[new o(new k(.5,.1,4,24),s),[0,0,0],[0,-Math.PI/2,-Math.PI/2]]],Y:[[new o(new k(.5,.1,4,24),s),[0,0,0],[Math.PI/2,0,0]]],Z:[[new o(new k(.5,.1,4,24),s),[0,0,0],[0,0,-Math.PI/2]]],E:[[new o(new k(.75,.1,2,24),s)]]},bt={X:[[new o(g,h),[.5,0,0],[0,0,-Math.PI/2]],[new o(v,h),[0,0,0],[0,0,-Math.PI/2]],[new o(g,h),[-.5,0,0],[0,0,Math.PI/2]]],Y:[[new o(g,t),[0,.5,0]],[new o(v,t)],[new o(g,t),[0,-.5,0],[0,0,Math.PI]]],Z:[[new o(g,a),[0,0,.5],[Math.PI/2,0,0]],[new o(v,a),[0,0,0],[Math.PI/2,0,0]],[new o(g,a),[0,0,-.5],[-Math.PI/2,0,0]]],XY:[[new o(new m(.15,.15,.01),T),[.15,.15,0]]],YZ:[[new o(new m(.15,.15,.01),y),[0,.15,.15],[0,Math.PI/2,0]]],XZ:[[new o(new m(.15,.15,.01),Q),[.15,0,.15],[-Math.PI/2,0,0]]],XYZ:[[new o(new m(.1,.1,.1),j.clone())]]},Pt={X:[[new o(new f(.2,0,.6,4),s),[.3,0,0],[0,0,-Math.PI/2]],[new o(new f(.2,0,.6,4),s),[-.3,0,0],[0,0,Math.PI/2]]],Y:[[new o(new f(.2,0,.6,4),s),[0,.3,0]],[new o(new f(.2,0,.6,4),s),[0,-.3,0],[0,0,Math.PI]]],Z:[[new o(new f(.2,0,.6,4),s),[0,0,.3],[Math.PI/2,0,0]],[new o(new f(.2,0,.6,4),s),[0,0,-.3],[-Math.PI/2,0,0]]],XY:[[new o(new m(.2,.2,.01),s),[.15,.15,0]]],YZ:[[new o(new m(.2,.2,.01),s),[0,.15,.15],[0,Math.PI/2,0]]],XZ:[[new o(new m(.2,.2,.01),s),[.15,0,.15],[-Math.PI/2,0,0]]],XYZ:[[new o(new m(.2,.2,.2),s),[0,0,0]]]},Mt={X:[[new I(b,i.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]],Y:[[new I(b,i.clone()),[0,-1e3,0],[0,0,Math.PI/2],[1e6,1,1],"helper"]],Z:[[new I(b,i.clone()),[0,0,-1e3],[0,-Math.PI/2,0],[1e6,1,1],"helper"]]};function E(_){const G=new it;for(const x in _)for(let D=_[x].length;D--;){const u=_[x][D][0].clone(),F=_[x][D][1],B=_[x][D][2],U=_[x][D][3],St=_[x][D][4];u.name=x,u.tag=St,F&&u.position.set(F[0],F[1],F[2]),B&&u.rotation.set(B[0],B[1],B[2]),U&&u.scale.set(U[0],U[1],U[2]),u.updateMatrix();const ot=u.geometry.clone();ot.applyMatrix4(u.matrix),u.geometry=ot,u.renderOrder=1/0,u.position.set(0,0,0),u.rotation.set(0,0,0),u.scale.set(1,1,1),G.add(u)}return G}this.gizmo={},this.picker={},this.helper={},this.add(this.gizmo.translate=E(z)),this.add(this.gizmo.rotate=E(yt)),this.add(this.gizmo.scale=E(bt)),this.add(this.picker.translate=E(Z)),this.add(this.picker.rotate=E(xt)),this.add(this.picker.scale=E(Pt)),this.add(this.helper.translate=E(wt)),this.add(this.helper.rotate=E(_t)),this.add(this.helper.scale=E(Mt)),this.picker.translate.visible=!1,this.picker.rotate.visible=!1,this.picker.scale.visible=!1}updateMatrixWorld(n){const s=(this.mode==="scale"?"local":this.space)==="local"?this.worldQuaternion:$;this.gizmo.translate.visible=this.mode==="translate",this.gizmo.rotate.visible=this.mode==="rotate",this.gizmo.scale.visible=this.mode==="scale",this.helper.translate.visible=this.mode==="translate",this.helper.rotate.visible=this.mode==="rotate",this.helper.scale.visible=this.mode==="scale";let i=[];i=i.concat(this.picker[this.mode].children),i=i.concat(this.gizmo[this.mode].children),i=i.concat(this.helper[this.mode].children);for(let h=0;h<i.length;h++){const t=i[h];t.visible=!0,t.rotation.set(0,0,0),t.position.copy(this.worldPosition);let a;if(this.camera.isOrthographicCamera?a=(this.camera.top-this.camera.bottom)/this.camera.zoom:a=this.worldPosition.distanceTo(this.cameraPosition)*Math.min(1.9*Math.tan(Math.PI*this.camera.fov/360)/this.camera.zoom,7),t.scale.set(1,1,1).multiplyScalar(a*this.size/4),t.tag==="helper"){t.visible=!1,t.name==="AXIS"?(t.visible=!!this.axis,this.axis==="X"&&(c.setFromEuler(V.set(0,0,0)),t.quaternion.copy(s).multiply(c),Math.abs(l.copy(O).applyQuaternion(s).dot(this.eye))>.9&&(t.visible=!1)),this.axis==="Y"&&(c.setFromEuler(V.set(0,0,Math.PI/2)),t.quaternion.copy(s).multiply(c),Math.abs(l.copy(H).applyQuaternion(s).dot(this.eye))>.9&&(t.visible=!1)),this.axis==="Z"&&(c.setFromEuler(V.set(0,Math.PI/2,0)),t.quaternion.copy(s).multiply(c),Math.abs(l.copy(C).applyQuaternion(s).dot(this.eye))>.9&&(t.visible=!1)),this.axis==="XYZE"&&(c.setFromEuler(V.set(0,Math.PI/2,0)),l.copy(this.rotationAxis),t.quaternion.setFromRotationMatrix(dt.lookAt(pt,l,H)),t.quaternion.multiply(c),t.visible=this.dragging),this.axis==="E"&&(t.visible=!1)):t.name==="START"?(t.position.copy(this.worldPositionStart),t.visible=this.dragging):t.name==="END"?(t.position.copy(this.worldPosition),t.visible=this.dragging):t.name==="DELTA"?(t.position.copy(this.worldPositionStart),t.quaternion.copy(this.worldQuaternionStart),d.set(1e-10,1e-10,1e-10).add(this.worldPositionStart).sub(this.worldPosition).multiplyScalar(-1),d.applyQuaternion(this.worldQuaternionStart.clone().invert()),t.scale.copy(d),t.visible=this.dragging):(t.quaternion.copy(s),this.dragging?t.position.copy(this.worldPositionStart):t.position.copy(this.worldPosition),this.axis&&(t.visible=this.axis.search(t.name)!==-1));continue}t.quaternion.copy(s),this.mode==="translate"||this.mode==="scale"?(t.name==="X"&&Math.abs(l.copy(O).applyQuaternion(s).dot(this.eye))>.99&&(t.scale.set(1e-10,1e-10,1e-10),t.visible=!1),t.name==="Y"&&Math.abs(l.copy(H).applyQuaternion(s).dot(this.eye))>.99&&(t.scale.set(1e-10,1e-10,1e-10),t.visible=!1),t.name==="Z"&&Math.abs(l.copy(C).applyQuaternion(s).dot(this.eye))>.99&&(t.scale.set(1e-10,1e-10,1e-10),t.visible=!1),t.name==="XY"&&Math.abs(l.copy(C).applyQuaternion(s).dot(this.eye))<.2&&(t.scale.set(1e-10,1e-10,1e-10),t.visible=!1),t.name==="YZ"&&Math.abs(l.copy(O).applyQuaternion(s).dot(this.eye))<.2&&(t.scale.set(1e-10,1e-10,1e-10),t.visible=!1),t.name==="XZ"&&Math.abs(l.copy(H).applyQuaternion(s).dot(this.eye))<.2&&(t.scale.set(1e-10,1e-10,1e-10),t.visible=!1)):this.mode==="rotate"&&(J.copy(s),l.copy(this.eye).applyQuaternion(c.copy(s).invert()),t.name.search("E")!==-1&&t.quaternion.setFromRotationMatrix(dt.lookAt(this.eye,pt,H)),t.name==="X"&&(c.setFromAxisAngle(O,Math.atan2(-l.y,l.z)),c.multiplyQuaternions(J,c),t.quaternion.copy(c)),t.name==="Y"&&(c.setFromAxisAngle(H,Math.atan2(l.x,l.z)),c.multiplyQuaternions(J,c),t.quaternion.copy(c)),t.name==="Z"&&(c.setFromAxisAngle(C,Math.atan2(l.y,l.x)),c.multiplyQuaternions(J,c),t.quaternion.copy(c))),t.visible=t.visible&&(t.name.indexOf("X")===-1||this.showX),t.visible=t.visible&&(t.name.indexOf("Y")===-1||this.showY),t.visible=t.visible&&(t.name.indexOf("Z")===-1||this.showZ),t.visible=t.visible&&(t.name.indexOf("E")===-1||this.showX&&this.showY&&this.showZ),t.material._color=t.material._color||t.material.color.clone(),t.material._opacity=t.material._opacity||t.material.opacity,t.material.color.copy(t.material._color),t.material.opacity=t.material._opacity,this.enabled&&this.axis&&(t.name===this.axis||this.axis.split("").some(function(y){return t.name===y}))&&(t.material.color.setHex(16776960),t.material.opacity=1)}super.updateMatrixWorld(n)}}class qt extends o{constructor(){super(new Xt(1e5,1e5,2,2),new ft({visible:!1,wireframe:!0,side:Qt,transparent:!0,opacity:.1,toneMapped:!1})),this.isTransformControlsPlane=!0,this.type="TransformControlsPlane"}updateMatrixWorld(n){let e=this.space;switch(this.position.copy(this.worldPosition),this.mode==="scale"&&(e="local"),K.copy(O).applyQuaternion(e==="local"?this.worldQuaternion:$),L.copy(H).applyQuaternion(e==="local"?this.worldQuaternion:$),R.copy(C).applyQuaternion(e==="local"?this.worldQuaternion:$),l.copy(L),this.mode){case"translate":case"scale":switch(this.axis){case"X":l.copy(this.eye).cross(K),P.copy(K).cross(l);break;case"Y":l.copy(this.eye).cross(L),P.copy(L).cross(l);break;case"Z":l.copy(this.eye).cross(R),P.copy(R).cross(l);break;case"XY":P.copy(R);break;case"YZ":P.copy(K);break;case"XZ":l.copy(R),P.copy(L);break;case"XYZ":case"E":P.set(0,0,0);break}break;case"rotate":default:P.set(0,0,0)}P.length()===0?this.quaternion.copy(this.cameraQuaternion):(mt.lookAt(d.set(0,0,0),P,l),this.quaternion.setFromRotationMatrix(mt)),super.updateMatrixWorld(n)}}export{Lt as T};
