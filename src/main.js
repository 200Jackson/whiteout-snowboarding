import * as THREE from 'three';
import './style.css';

const $ = (s) => document.querySelector(s);
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.autoUpdate = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#91cce8');
scene.fog = new THREE.FogExp2('#c5e5f2', 0.00082);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1800);
const hemi = new THREE.HemisphereLight(0xdaf4ff, 0x718d9b, 2.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0c9, 3.0); sun.position.set(-85, 140, 60); sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-58; sun.shadow.camera.right=58; sun.shadow.camera.top=82; sun.shadow.camera.bottom=-82; sun.shadow.bias=-0.0003; scene.add(sun);
const fill = new THREE.DirectionalLight(0x8cd9ff, 1.0); fill.position.set(90, 50, -90); scene.add(fill);
const mat = (color, roughness=.9, extra={}) => new THREE.MeshStandardMaterial({color, roughness, ...extra});
const snowColors = [new THREE.Color('#fbfdff'),new THREE.Color('#eaf6fc'),new THREE.Color('#d8eaf5'),new THREE.Color('#c3deed')];
const pineMaterials = [mat('#1d5864'),mat('#287582'),mat('#3d8d94'),mat('#174653')];
const trunkMat = mat('#725c4d');
const boardMat = mat('#142e45',.3,{metalness:.2});
const boardBright = mat('#caff58',.35,{emissive:'#344c08',emissiveIntensity:.22});
const jacketMat = mat('#f05a3c',.65);
const pantsMat = mat('#1b3147',.85);
const darkMat = mat('#101f2c',.65);
const helmetMat = mat('#f5fbff',.25,{metalness:.18});
const visorMat = mat('#4bd3de',.18,{metalness:.45,emissive:'#0b3c4c',emissiveIntensity:.22});
const skinMat = mat('#b9815d',.85);
const rand = (a,b)=>a+Math.random()*(b-a);

// Rolling, readable arcade terrain with vertex-tinted snow facets.
function terrainHeight(x,z){
  const descent = .105*z + .000035*z*z;
  const broad = 4.1*Math.sin(z*.013 + x*.009) + 2.15*Math.sin(x*.028-z*.018) + .8*Math.sin(z*.021+x*.041);
  const rollers = 1.45*Math.sin(z*.055+x*.017) + .72*Math.sin(z*.12-x*.04) + .28*Math.sin(z*.24+x*.19);
  const moguls = .52*Math.sin(z*.19 + Math.sin(x*.08)*1.8) * Math.sin(x*.11);
  const gullies = -1.8*Math.exp(-Math.pow((x-13*Math.sin(z*.009))/4.5,2)) - 1.4*Math.exp(-Math.pow((x+24*Math.sin(z*.007+1.7))/5.5,2));
  const sideRidges = 4.8*Math.exp(-Math.pow((Math.abs(x)-37)/11,2))*(.45+Math.sin(z*.012+1.4));
  // Long, rounded terrain waves give the run a more readable downhill rhythm.
  const wave = 2.1*Math.exp(-Math.pow((z+115)/24,2)) + 2.8*Math.exp(-Math.pow((z+315)/30,2)) + 2.3*Math.exp(-Math.pow((z+555)/27,2));
  return descent+broad+rollers+moguls+gullies+sideRidges+wave;
}
function slopeAt(x,z){const e=.4;return {dx:(terrainHeight(x+e,z)-terrainHeight(x-e,z))/(2*e),dz:(terrainHeight(x,z+e)-terrainHeight(x,z-e))/(2*e)};}
function terrainNormal(x,z){const s=slopeAt(x,z);return new THREE.Vector3(-s.dx,1,-s.dz).normalize();}
{
  const width=300, depth=1000, nx=180, nz=420, positions=[],colors=[],indices=[];
  for(let j=0;j<=nz;j++) for(let i=0;i<=nx;i++){
    const x=-width/2+width*i/nx,z=210-depth*j/nz,y=terrainHeight(x,z);positions.push(x,y,z);
    const n=terrainNormal(x,z);const steep=1-n.y;const wave=Math.sin(x*.17+z*.035)*.09+Math.sin(z*.11-x*.09)*.055+Math.sin(x*.49+z*.23)*.025;
    const c=snowColors[Math.min(3,Math.max(0,Math.floor(steep*7+wave+1.05)))].clone();
    if(y>8)c.lerp(new THREE.Color('#d6eaf8'),Math.min(.58,(y-8)*.016));
    if(steep>.22)c.lerp(new THREE.Color('#a9c8dc'),Math.min(.38,(steep-.22)*1.1));colors.push(c.r,c.g,c.b);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const terrain=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));terrain.receiveShadow=true;terrain.frustumCulled=false;scene.add(terrain);
}
// Stylized gradient sky and layered distant peaks.
const sky=new THREE.Mesh(new THREE.SphereGeometry(1200,32,18),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{top:{value:new THREE.Color('#4b9bc9')},bottom:{value:new THREE.Color('#f1fbff')}},vertexShader:'varying vec3 v; void main(){v=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 v;void main(){float h=clamp(normalize(v+vec3(0.,250.,0.)).y,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,.65)),1.);}'}));scene.add(sky);
function peak(x,z,h,r,color){const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,7,1),mat(color,1,{flatShading:true}));m.position.set(x,terrainHeight(x,z)+h*.45,z);m.rotation.y=rand(0,6);m.castShadow=true;scene.add(m);const cap=new THREE.Mesh(new THREE.ConeGeometry(r*.63,h*.38,7,1),mat('#f2fbff',1,{flatShading:true}));cap.position.set(x,m.position.y+h*.28,z);cap.rotation.y=m.rotation.y;scene.add(cap);}
for(let i=0;i<46;i++){const side=i%2?1:-1;peak(side*rand(90,310),rand(-780,90),rand(55,150),rand(25,65),i%3?'#83b4cc':'#9dc8d9');}
// Low-cost instanced firs, clustered on both sides of the playable line.
const treeCount=1750, dummy=new THREE.Object3D(), treeGroup=new THREE.Group();
const trunkGeo=new THREE.CylinderGeometry(.13,.22,1.65,5), coneGeos=[new THREE.ConeGeometry(.85,1.65,6),new THREE.ConeGeometry(.68,1.5,6),new THREE.ConeGeometry(.5,1.35,6)];
const instanced=[];
for(const [g,m] of [[trunkGeo,trunkMat],[coneGeos[0],pineMaterials[0]],[coneGeos[1],pineMaterials[1]],[coneGeos[2],pineMaterials[2]]]){const im=new THREE.InstancedMesh(g,m,treeCount);im.castShadow=false;im.receiveShadow=true;treeGroup.add(im);instanced.push(im);}
for(let i=0;i<treeCount;i++){
  const side=Math.random()<.5?-1:1,x=side*rand(23,137),z=rand(-780,175),y=terrainHeight(x,z),s=rand(.55,1.55);dummy.position.set(x,y,z);dummy.scale.set(s,s,s);dummy.rotation.y=rand(0,Math.PI*2);dummy.updateMatrix();
  instanced.forEach((im,k)=>{const obj=new THREE.Object3D();obj.position.copy(dummy.position);obj.rotation.copy(dummy.rotation);obj.scale.copy(dummy.scale);if(k===0)obj.position.y+=.82*s;else obj.position.y+=(.65+(k-1)*.65)*s;obj.updateMatrix();im.setMatrixAt(i,obj.matrix);});
}
instanced.forEach(i=>i.instanceMatrix.needsUpdate=true);scene.add(treeGroup);
// Faceted boulders along the shoulders.
const rockGeo=new THREE.DodecahedronGeometry(1,0),rockMat=mat('#93b5c5',1,{flatShading:true});const rocks=new THREE.InstancedMesh(rockGeo,rockMat,210);const rockObj=new THREE.Object3D();
for(let i=0;i<210;i++){const side=Math.random()<.5?-1:1,x=side*rand(20,125),z=rand(-760,170),s=rand(.35,1.8);rockObj.position.set(x,terrainHeight(x,z)+s*.25,z);rockObj.scale.set(s*1.4,s*.8,s);rockObj.rotation.set(rand(0,3),rand(0,6),rand(0,3));rockObj.updateMatrix();rocks.setMatrixAt(i,rockObj.matrix);}rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=false;scene.add(rocks);
// A few colorful flags make the riding corridor legible.
for(let i=0;i<22;i++){const side=i%2?1:-1,x=side*rand(12,17),z=-20-i*34;const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,2.5,5),mat('#29495b'));pole.position.set(x,terrainHeight(x,z)+1.25,z);scene.add(pole);const flag=new THREE.Mesh(new THREE.BoxGeometry(.8,.38,.045),mat(i%3?'#d5ff59':'#ff6847',.6));flag.position.set(x+side*.35,pole.position.y+.75,z);flag.rotation.y=.1*side;scene.add(flag);}

// Rider: stylized helmeted character, board and bindings.
const rider=new THREE.Group();scene.add(rider);const boardRig=new THREE.Group();rider.add(boardRig);const body=new THREE.Group();rider.add(body);
const boardShape=new THREE.Shape();boardShape.moveTo(0,-1.12);boardShape.quadraticCurveTo(.16,-1.12,.19,-.86);boardShape.lineTo(.145,.72);boardShape.quadraticCurveTo(.13,1.1,0,1.12);boardShape.quadraticCurveTo(-.13,1.1,-.145,.72);boardShape.lineTo(-.19,-.86);boardShape.quadraticCurveTo(-.16,-1.12,0,-1.12);
const boardGeo=new THREE.ExtrudeGeometry(boardShape,{depth:.055,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:8});boardGeo.rotateX(Math.PI/2);boardGeo.translate(0,.005,0);const board=new THREE.Mesh(boardGeo,boardMat);board.castShadow=true;boardRig.add(board);
const topStripe=new THREE.Mesh(new THREE.BoxGeometry(.065,.014,1.45),boardBright);topStripe.position.y=.045;boardRig.add(topStripe);
for(const z of [-.48,.48]){const bind=new THREE.Mesh(new THREE.BoxGeometry(.31,.1,.26),darkMat);bind.position.set(0,.08,z);boardRig.add(bind);}
function capsule(parent,r,len,material,pos){const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,8),material);o.position.set(...pos);o.castShadow=true;parent.add(o);return o;}
const torso=capsule(body,.27,.45,jacketMat,[0,.93,0]);torso.rotation.x=-.16;const pack=new THREE.Mesh(new THREE.BoxGeometry(.31,.38,.16),mat('#f5f7ed'));pack.position.set(0,.96,.15);body.add(pack);
const pelvis=capsule(body,.22,.18,pantsMat,[0,.58,.03]);const legL=capsule(body,.105,.33,pantsMat,[-.14,.36,-.02]),legR=capsule(body,.105,.33,pantsMat,[.14,.36,-.02]);
for(const x of [-.14,.14]){const boot=new THREE.Mesh(new THREE.BoxGeometry(.14,.13,.26),darkMat);boot.position.set(x,.13,-.05);body.add(boot);}
const head=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),skinMat);head.position.set(0,1.31,-.035);body.add(head);const helmet=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12,0,Math.PI*2,0,Math.PI*.62),helmetMat);helmet.position.set(0,1.35,-.025);helmet.scale.set(1,1.08,1.08);body.add(helmet);const visor=new THREE.Mesh(new THREE.BoxGeometry(.3,.08,.09),visorMat);visor.position.set(0,1.34,-.18);body.add(visor);
const armL=capsule(body,.075,.38,jacketMat,[-.34,.91,.02]),armR=capsule(body,.075,.38,jacketMat,[.34,.91,.02]);armL.rotation.z=-.52;armR.rotation.z=.52;const gloveL=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),darkMat);gloveL.position.set(-.48,.69,-.02);body.add(gloveL);const gloveR=gloveL.clone();gloveR.position.x=.48;body.add(gloveR);

// Pooled snow puffs and persistent paired tracks.
// Fine windblown snowfall close to the camera adds scale and speed without external assets.
const snowCount=760,snowPositions=new Float32Array(snowCount*3),snowDrift=new Float32Array(snowCount*3);
for(let i=0;i<snowCount;i++){snowPositions[i*3]=rand(-24,24);snowPositions[i*3+1]=rand(-2,24);snowPositions[i*3+2]=rand(-38,12);snowDrift[i*3]=rand(-1.2,1.2);snowDrift[i*3+1]=rand(-3.8,-1.2);snowDrift[i*3+2]=rand(-.6,.6);}
const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPositions,3));const snowField=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:'#f5fbff',size:.075,transparent:true,opacity:.62,depthWrite:false,sizeAttenuation:true}));scene.add(snowField);
function updateSnow(dt){snowField.position.set(state.x,terrainHeight(state.x,state.z)+1.2,state.z);for(let i=0;i<snowCount;i++){const k=i*3;snowPositions[k]+=snowDrift[k]*dt-state.vx*dt*.055;snowPositions[k+1]+=snowDrift[k+1]*dt;snowPositions[k+2]+=snowDrift[k+2]*dt-state.vz*dt*.055;if(snowPositions[k+1]<-2){snowPositions[k]=rand(-24,24);snowPositions[k+1]=rand(14,25);snowPositions[k+2]=rand(-38,12);}if(snowPositions[k+2]<-42)snowPositions[k+2]=12;if(snowPositions[k+2]>14)snowPositions[k+2]=-38;}snowGeo.attributes.position.needsUpdate=true;}
const puffCount=500,puffPos=new Float32Array(puffCount*3),puffLife=new Float32Array(puffCount),puffVel=Array.from({length:puffCount},()=>new THREE.Vector3());const puffGeo=new THREE.BufferGeometry();puffGeo.setAttribute('position',new THREE.BufferAttribute(puffPos,3));const puffs=new THREE.Points(puffGeo,new THREE.PointsMaterial({color:'#f8fdff',size:.22,transparent:true,opacity:.82,depthWrite:false,sizeAttenuation:true}));scene.add(puffs);let puffCursor=0;
function puff(x,y,z,n=8,power=1){for(let i=0;i<n;i++){const k=puffCursor++%puffCount;puffPos[k*3]=x+rand(-.45,.45);puffPos[k*3+1]=y+rand(0,.35);puffPos[k*3+2]=z+rand(-.45,.45);puffLife[k]=rand(.35,.9);puffVel[k].set(rand(-1,1)*power,rand(.4,2.2)*power,rand(-1,1)*power);}puffGeo.attributes.position.needsUpdate=true;}
const trackN=100,trackLeft=new Float32Array(trackN*3),trackRight=new Float32Array(trackN*3);for(let i=0;i<trackN;i++){trackLeft[i*3+1]=-1000;trackRight[i*3+1]=-1000;}const trackGeoL=new THREE.BufferGeometry(),trackGeoR=new THREE.BufferGeometry();trackGeoL.setAttribute('position',new THREE.BufferAttribute(trackLeft,3));trackGeoR.setAttribute('position',new THREE.BufferAttribute(trackRight,3));const trackMat=new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.5});scene.add(new THREE.Line(trackGeoL,trackMat),new THREE.Line(trackGeoR,trackMat));let trackCursor=0,trackTimer=0;

const state={x:0,z:155,vx:0,vz:-2.2,heading:0,edge:0,airY:0,airVy:0,airborne:false,airSpin:0,spinInput:0,score:0,distance:0,paused:false,crashed:false,crashTimer:0,carve:0,airTime:0,combo:1};
const keys=new Set(),touch=new Set();let lastTurn=0;const pressed=(...ks)=>ks.some(k=>keys.has(k)||touch.has(k));
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','q','e'].includes(e.key.toLowerCase()))e.preventDefault();const k=e.key.toLowerCase();if(!keys.has(k)){if(k===' '&&!state.paused)jump();if(k==='r')resetRun();if(k==='p'||k==='escape')togglePause();}keys.add(k);});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();touch.clear();});
document.querySelectorAll('[data-hold]').forEach(b=>{const k=b.dataset.hold;b.addEventListener('pointerdown',e=>{e.preventDefault();touch.add(k);b.setPointerCapture(e.pointerId);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>touch.delete(k));});document.querySelector('[data-action="jump"]').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
function toast(t){const el=$('#toast');el.textContent=t;el.style.opacity='1';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.opacity='0',1000);}
function resetRun(){Object.assign(state,{x:0,z:155,vx:0,vz:-2.2,heading:0,edge:0,airY:0,airVy:0,airborne:false,airSpin:0,spinInput:0,score:0,distance:0,paused:false,crashed:false,crashTimer:0,carve:0,airTime:0,combo:1});rider.visible=true;$('#pause-screen').classList.add('hidden');$('#status').textContent='READY TO RIDE';trackLeft.fill(0);trackRight.fill(0);for(let i=0;i<trackN;i++){trackLeft[i*3+1]=-1000;trackRight[i*3+1]=-1000;}trackGeoL.attributes.position.needsUpdate=true;trackGeoR.attributes.position.needsUpdate=true;}
function togglePause(){state.paused=!state.paused;$('#pause-screen').classList.toggle('hidden',!state.paused);}$('#pause').addEventListener('click',togglePause);$('#resume').addEventListener('click',togglePause);$('#restart').addEventListener('click',resetRun);
function jump(){const speed=Math.hypot(state.vx,state.vz);if(!state.paused&&!state.airborne&&!state.crashed&&speed>3.5){state.airborne=true;state.airVy=5.2+Math.min(2.8,speed*.075);state.airY=.06;state.airSpin=0;state.spinInput=0;state.airTime=0;toast('OLLIE!');puff(state.x,terrainHeight(state.x,state.z)+.2,state.z,18,1.2);}}
function updatePhysics(dt){if(state.paused)return;if(state.crashed){state.crashTimer-=dt;if(state.crashTimer<=0)resetRun();return;}
  const left=pressed('a','arrowleft','left'),right=pressed('d','arrowright','right'),brake=pressed('s','arrowdown','brake'),tuck=pressed('w','arrowup');const turn=(right?1:0)-(left?1:0);const speed=Math.hypot(state.vx,state.vz);const sl=slopeAt(state.x,state.z),normal=terrainNormal(state.x,state.z);
  // Gravity projected onto the slope, with a capped arcade speed envelope.
  // Gravity accelerates downhill along the surface gradient (not uphill along the normal).
  const gx=9.81*normal.x*normal.y,gz=9.81*normal.z*normal.y;state.vx+=gx*dt;state.vz+=gz*dt;
  const currentSpeed=Math.hypot(state.vx,state.vz);const targetEdge=turn*(brake?1.15:.95);state.edge=THREE.MathUtils.damp(state.edge,targetEdge,5.8,dt);
  if(!state.airborne){
    const turnRate=(.18+Math.min(1,currentSpeed/16)*1.42)*turn;state.heading+=turnRate*dt;
    const fx=Math.sin(state.heading),fz=-Math.cos(state.heading),lx=Math.cos(state.heading),lz=Math.sin(state.heading);
    const forward=state.vx*fx+state.vz*fz,side=state.vx*lx+state.vz*lz;
    const grip=3.4+Math.abs(state.edge)*10.5;state.vx+=lx*(-side*grip)*dt;state.vz+=lz*(-side*grip)*dt;
    // Steering generates a controllable arc; hard edge sets dig in and scrub speed.
    const carveAccel=turn*Math.min(currentSpeed,26)*(0.65+Math.abs(state.edge)*1.5);state.vx+=lx*carveAccel*dt;state.vz+=lz*carveAccel*dt;
    const drag=(.012*currentSpeed*currentSpeed)+(brake?13.5:0)+(tuck?-1.65:0)+Math.abs(turn)*Math.abs(state.edge)*currentSpeed*.38;
    const maxSpeed=tuck?34:27; if(currentSpeed>maxSpeed){const excess=currentSpeed-maxSpeed;state.vx-=state.vx/currentSpeed*excess*1.8*dt;state.vz-=state.vz/currentSpeed*excess*1.8*dt;}
    const v=Math.hypot(state.vx,state.vz);if(v>.001){const scale=Math.max(0,1-drag*dt/v);state.vx*=scale;state.vz*=scale;}
    state.carve=Math.abs(turn)*currentSpeed*currentSpeed*(.018+Math.abs(state.edge)*.035);
  }else{
    const spin=(pressed('e')?1:0)-(pressed('q')?1:0);state.spinInput=THREE.MathUtils.damp(state.spinInput,spin,5,dt);state.airSpin+=state.spinInput*2.9*dt;state.heading+=turn*1.05*dt;state.airVy-=9.81*dt;state.airY+=state.airVy*dt;state.airTime+=dt;
  }
  state.x+=state.vx*dt;state.z+=state.vz*dt;state.distance=Math.max(state.distance,155-state.z);
  // Soft mountain boundaries prevent wandering outside the course.
  if(Math.abs(state.x)>105){state.vx+=-Math.sign(state.x)*Math.min(30,(Math.abs(state.x)-105)*2)*dt;}
  const ground=terrainHeight(state.x,state.z);
  if(state.airborne&&state.airY<=0){state.airY=0;state.airborne=false;const impact=Math.abs(state.airVy),spin=Math.abs(state.airSpin);if(impact>10.5||spin>5.4){state.crashed=true;state.crashTimer=1.2;state.vx*=.25;state.vz*=.25;toast('WIPEOUT');$('#status').textContent='WIPEOUT — RESETTING';}else{const points=Math.round((state.airTime*100+spin*75)*(impact<7?1.25:1));state.score+=points;toast(spin>2.8?`${Math.round(spin*57)}° SPIN  +${points}`:`CLEAN LANDING  +${points}`);state.vx*=.97;state.vz*=.97;puff(state.x,ground+.1,state.z,22,1.5);}state.airVy=0;state.airSpin=0;state.airTime=0;}
  const y=ground+state.airY;rider.position.set(state.x,y,state.z);rider.rotation.y=state.heading;const speedNow=Math.hypot(state.vx,state.vz);boardRig.rotation.x=state.airborne?-.16:Math.atan(sl.dz)*.72;boardRig.rotation.z=state.airborne?Math.sin(state.airSpin)*.08:-state.edge*.36;body.rotation.x=state.airborne?-.2:THREE.MathUtils.damp(body.rotation.x,tuck?-.43:-.04,5,dt);body.rotation.z=state.airborne?Math.sin(state.airSpin)*.18:-turn*.18;body.rotation.y=state.airborne?state.airSpin*.35:0;armL.rotation.z=-.52-turn*.18+(state.airborne?Math.sin(state.airTime*8)*.16:0);armR.rotation.z=.52-turn*.18-(state.airborne?Math.sin(state.airTime*8)*.16:0);legL.rotation.x=state.airborne?-.28:Math.sin(state.distance*.08)*.025;legR.rotation.x=state.airborne?-.28:Math.sin(state.distance*.08+1)*.025;
  if(!state.airborne&&Math.abs(turn)>.05&&speedNow>4&&Math.random()<Math.min(1,dt*23)){puff(state.x+Math.cos(state.heading)*.45,y+.08,state.z+Math.sin(state.heading)*.45,3+Math.floor(Math.abs(turn)*5),Math.min(2,speedNow/12));}
  trackTimer+=dt;if(!state.airborne&&trackTimer>.08&&speedNow>3){trackTimer=0;const lx=Math.cos(state.heading)*.24,lz=Math.sin(state.heading)*.24;trackLeft[trackCursor*3]=state.x+lx;trackLeft[trackCursor*3+1]=y+.045;trackLeft[trackCursor*3+2]=state.z+lz;trackRight[trackCursor*3]=state.x-lx;trackRight[trackCursor*3+1]=y+.045;trackRight[trackCursor*3+2]=state.z-lz;trackCursor=(trackCursor+1)%trackN;trackGeoL.attributes.position.needsUpdate=true;trackGeoR.attributes.position.needsUpdate=true;}
  for(let i=0;i<puffCount;i++)if(puffLife[i]>0){puffLife[i]-=dt;puffPos[i*3]+=puffVel[i].x*dt+state.vx*dt*.025;puffPos[i*3+1]+=puffVel[i].y*dt;puffPos[i*3+2]+=puffVel[i].z*dt+state.vz*dt*.025;puffVel[i].y-=2.5*dt;if(puffLife[i]<=0)puffPos[i*3+1]=-1000;}puffGeo.attributes.position.needsUpdate=true;
  updateHud();if(state.distance>790){toast('RUN COMPLETE');state.score+=500;state.z=155;state.distance=0;state.x=0;state.vx=0;state.vz=-2.2;state.heading=0;}
}
function updateHud(){const speed=Math.round(Math.hypot(state.vx,state.vz)*3.6);$('#speed').textContent=String(speed).padStart(2,'0');$('#speedbar').style.width=Math.min(100,speed/100*100)+'%';$('#distance').textContent=`${Math.round(state.distance)} M DOWN`;$('#progress').style.width=Math.min(100,state.distance/790*100)+'%';$('#score').textContent=String(state.score).padStart(5,'0');if(!state.crashed)$('#status').textContent=state.airborne?'AIRBORNE':speed<4?'FIND YOUR LINE':pressed('s','arrowdown','brake')?'CHECKING SPEED':state.carve>8?'CARVING':'FULL SEND';}
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),forward=new THREE.Vector3();function updateCamera(dt){const speed=Math.hypot(state.vx,state.vz);forward.set(Math.sin(state.heading),0,-Math.cos(state.heading));const back=5.8+Math.min(speed*.095,2.6);const side=Math.sin(state.heading)*state.edge*.9;const desired=new THREE.Vector3(state.x-forward.x*back+side,terrainHeight(state.x,state.z)+2.65+Math.min(speed*.035,1.05)+state.airY*.28,state.z-forward.z*back);camPos.copy(desired);camera.position.lerp(camPos,1-Math.exp(-(state.airborne?3.3:6.3)*dt));camLook.set(state.x+forward.x*(3.8+speed*.085),terrainHeight(state.x,state.z)+.95+state.airY*.22,state.z+forward.z*(3.8+speed*.085));camera.lookAt(camLook);camera.rotateZ(-state.edge*.035);camera.fov=THREE.MathUtils.damp(camera.fov,66+Math.min(speed*.25,9),3.4,dt);camera.updateProjectionMatrix();sun.position.set(state.x-85,140,state.z+60);sun.target.position.set(state.x,0,state.z-25);}
let last=performance.now(),acc=0;const fixed=1/120;function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.045);last=now;if(!state.paused){acc+=dt;while(acc>=fixed){updatePhysics(fixed);acc-=fixed;}}updateCamera(Math.max(dt,.001));updateSnow(Math.min(dt,.04));renderer.render(scene,camera);}function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setSize(innerWidth,innerHeight);}window.addEventListener('resize',resize);
$('#loading').style.opacity='0';setTimeout(()=>{$('#loading')?.remove();$('#hud').classList.remove('hidden');},500);updateHud();requestAnimationFrame(frame);
