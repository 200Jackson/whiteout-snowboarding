import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc7d9e7);
scene.fog = new THREE.FogExp2(0xc7d9e7, 0.00155);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1800);
camera.position.set(0, 7, 15);

const hemi = new THREE.HemisphereLight(0xeaf5ff, 0x77899a, 2.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 3.2);
sun.position.set(-90, 150, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
sun.shadow.bias = -0.00025;
scene.add(sun);

const mat = (color, roughness=0.92, extra={}) => new THREE.MeshStandardMaterial({color, roughness, ...extra});
const snowMat = mat(0xe9f1f5, 0.98);
const packedSnowMat = mat(0xd8e5eb, 0.95);
const pineMats = [mat(0x405e60),mat(0x58756f),mat(0x304c52)];
const trunkMat = mat(0x625c54);
const rockMat = mat(0x788b96, 1);
const boardMat = mat(0x172b3b, 0.32, {metalness:0.24});
const boardAccentMat = mat(0xd5f0f6, 0.38, {metalness:0.12});
const jacketMat = mat(0xc34b31, 0.72);
const pantsMat = mat(0x202d3b, 0.85);
const darkMat = mat(0x17232d, 0.8);
const helmetMat = mat(0x202c34, 0.28, {metalness:0.12});
const goggleMat = new THREE.MeshStandardMaterial({color:0x8dd3dc,roughness:0.18,metalness:0.35});
const skinMat = mat(0xb98969,0.82);

function terrainHeight(x,z) {
  const base = 0.014 * z + 0.000012*z*z;
  const cross = 1.3*Math.sin(x*0.026 + z*0.009) + 0.7*Math.sin(x*0.061-z*0.013);
  const roll = 0.65*Math.sin(z*0.035+x*0.015) + 0.35*Math.sin(z*0.075-x*0.03);
  const ridge = 2.2*Math.exp(-Math.pow((Math.abs(x)-45)/17,2))*Math.sin(z*0.018);
  return base + cross + roll + ridge;
}
function terrainNormal(x,z) {
  const e=0.35, hx=(terrainHeight(x+e,z)-terrainHeight(x-e,z))/(2*e), hz=(terrainHeight(x,z+e)-terrainHeight(x,z-e))/(2*e);
  return new THREE.Vector3(-hx,1,-hz).normalize();
}
function makeTerrain() {
  const width=300, depth=900, nx=100, nz=260;
  const positions=[], uvs=[], indices=[];
  for(let j=0;j<=nz;j++){
    const z=220 - depth*j/nz;
    for(let i=0;i<=nx;i++){
      const x=-width/2 + width*i/nx;
      positions.push(x,terrainHeight(x,z),z);
      uvs.push(i/nx*16,j/nz*40);
    }
  }
  for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){
    const a=j*(nx+1)+i,b=a+1,c=a+(nx+1),d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices); geo.computeVertexNormals();
  const terrainMat = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.99, vertexColors:false});
  const mesh=new THREE.Mesh(geo,terrainMat); mesh.receiveShadow=true; mesh.frustumCulled=false; scene.add(mesh);
  // Subtle wind-scoured lines follow the slope and help communicate scale.
  const lineMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.12});
  const lines=new THREE.Group();
  for(let k=0;k<34;k++){
    const x0=-125+k*7.5;
    const pts=[];
    for(let n=0;n<120;n++){
      const z=170-n*6.5, x=x0+Math.sin(z*.025+k)*2.4;
      pts.push(new THREE.Vector3(x,terrainHeight(x,z)+0.025,z));
    }
    const g=new THREE.BufferGeometry().setFromPoints(pts);
    lines.add(new THREE.Line(g,lineMat));
  }
  scene.add(lines);
  return mesh;
}
makeTerrain();

// Sky gradient and distant jagged peaks.
const skyGeo = new THREE.SphereGeometry(1500,32,20);
const skyMat = new THREE.ShaderMaterial({
  side:THREE.BackSide,
  uniforms:{topColor:{value:new THREE.Color(0x6e9bb7)},bottomColor:{value:new THREE.Color(0xe3edf3)},offset:{value:80},exponent:{value:0.65}},
  vertexShader:`varying vec3 vWorldPosition; void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorldPosition=p.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform vec3 topColor;uniform vec3 bottomColor;uniform float offset;uniform float exponent;varying vec3 vWorldPosition;void main(){float h=normalize(vWorldPosition+vec3(0.0,offset,0.0)).y;gl_FragColor=vec4(mix(bottomColor,topColor,max(pow(max(h,0.0),exponent),0.0)),1.0);}`
});
scene.add(new THREE.Mesh(skyGeo,skyMat));
function addPeak(x,z,h,r,color) {
  const geo=new THREE.ConeGeometry(r,h,7,1);
  const mesh=new THREE.Mesh(geo,mat(color,1));
  mesh.position.set(x,terrainHeight(x,z)+h*0.48,z);
  mesh.rotation.y=Math.random()*1.2;
  mesh.castShadow=true;scene.add(mesh);
  const capGeo=new THREE.ConeGeometry(r*0.62,h*0.39,7,1);
  const cap=new THREE.Mesh(capGeo,mat(0xeaf1f4,0.96));
  cap.position.set(x,mesh.position.y+h*0.29,z);cap.rotation.y=mesh.rotation.y;scene.add(cap);
}
for(let i=0;i<30;i++){
  const side=i%2?1:-1, x=side*(100+Math.random()*230), z=-500+Math.random()*620;
  addPeak(x,z,55+Math.random()*100,30+Math.random()*42, i%3===0?0x91a8b6:0x819bab);
}

// Trees: instanced to keep the scene performant.
function makeTreeGeometry() {
  const group=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.22,1.8,6),trunkMat);
  trunk.position.y=.9;group.add(trunk);
  for(let i=0;i<3;i++){
    const cone=new THREE.Mesh(new THREE.ConeGeometry(0.75-i*.12,1.8,7),pineMats[i%pineMats.length]);
    cone.position.y=1.25+i*.78;group.add(cone);
  }
  return group;
}
const treeProto=makeTreeGeometry();
const treeGeo=[], treeMats=[];
treeProto.traverse(o=>{if(o.isMesh){treeGeo.push(o.geometry);treeMats.push(o.material);}});
const treeGroup=new THREE.Group();
const treeCount=900;
const dummy=new THREE.Object3D();
const treeInst=[];
treeGeo.forEach((g,idx)=>{
  const inst=new THREE.InstancedMesh(g,treeMats[idx],treeCount);
  inst.castShadow=idx>0;inst.receiveShadow=true;treeGroup.add(inst);treeInst.push(inst);
});
for(let i=0;i<treeCount;i++){
  const side=Math.random()<.5?-1:1;
  const x=side*(28+Math.random()*112);
  const z=-450+Math.random()*780;
  const y=terrainHeight(x,z);
  dummy.position.set(x,y,z);
  const s=0.65+Math.random()*1.3;
  dummy.scale.set(s,s,s);
  dummy.rotation.y=Math.random()*Math.PI*2;
  dummy.updateMatrix();
  treeInst.forEach(inst=>inst.setMatrixAt(i,dummy.matrix));
}
treeInst.forEach(i=>i.instanceMatrix.needsUpdate=true);
scene.add(treeGroup);

// Rock clusters on the shoulders of the run.
const rockGeo=new THREE.DodecahedronGeometry(1,0);
for(let i=0;i<150;i++){
  const side=Math.random()<.5?-1:1,x=side*(19+Math.random()*115),z=-400+Math.random()*730;
  const s=.4+Math.random()*2.1;
  const rock=new THREE.Mesh(rockGeo,rockMat);
  rock.position.set(x,terrainHeight(x,z)+s*.35,z);
  rock.scale.set(s*1.4,s*.7,s);
  rock.rotation.set(Math.random(),Math.random()*3,Math.random());
  rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);
}

// Rider rig: board, boots, legs, jacket, arms, helmet and reflective goggles.
const rider=new THREE.Group();scene.add(rider);
const boardGroup=new THREE.Group();rider.add(boardGroup);
const board=new THREE.Mesh(new THREE.BoxGeometry(.34,.075,1.72,2,1,8),boardMat);
board.castShadow=true;board.receiveShadow=true;boardGroup.add(board);
const tip1=new THREE.Mesh(new THREE.SphereGeometry(.17,12,8),boardMat);tip1.scale.set(1,.22,1.6);tip1.position.z=-.78;boardGroup.add(tip1);
const tip2=tip1.clone();tip2.position.z=.78;boardGroup.add(tip2);
const stripe=new THREE.Mesh(new THREE.BoxGeometry(.055,.012,1.15),boardAccentMat);stripe.position.y=.044;boardGroup.add(stripe);
for(const z of [-.42,.42]){
  const binding=new THREE.Mesh(new THREE.BoxGeometry(.3,.09,.23),darkMat);binding.position.set(0,.07,z);boardGroup.add(binding);
}
function capsule(parent,r,len,material,pos) {
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,8),material);
  m.position.set(...pos);m.castShadow=true;parent.add(m);return m;
}
const body=new THREE.Group();rider.add(body);
const torso=capsule(body,.27,.48,jacketMat,[0,.88,0]);torso.rotation.x=-.18;
const pelvis=capsule(body,.22,.18,pantsMat,[0,.55,.04]);
const legL=capsule(body,.105,.34,pantsMat,[-.14,.34,-.03]);
const legR=capsule(body,.105,.34,pantsMat,[.14,.34,-.03]);
const bootL=new THREE.Mesh(new THREE.BoxGeometry(.13,.12,.25),darkMat);bootL.position.set(-.14,.12,-.04);body.add(bootL);
const bootR=bootL.clone();bootR.position.x=.14;body.add(bootR);
const head=new THREE.Mesh(new THREE.SphereGeometry(.18,18,12),skinMat);head.position.set(0,1.27,-.03);head.castShadow=true;body.add(head);
const helmet=new THREE.Mesh(new THREE.SphereGeometry(.195,18,12,0,Math.PI*2,0,Math.PI*.62),helmetMat);helmet.position.set(0,1.31,-.02);helmet.scale.set(1,1.05,1.05);helmet.castShadow=true;body.add(helmet);
const goggles=new THREE.Mesh(new THREE.BoxGeometry(.28,.075,.08),goggleMat);goggles.position.set(0,1.31,-.19);body.add(goggles);
const armL=capsule(body,.075,.38,jacketMat,[-.34,.88,.02]);armL.rotation.z=-.58;armL.rotation.x=-.2;
const armR=capsule(body,.075,.38,jacketMat,[.34,.88,.02]);armR.rotation.z=.58;armR.rotation.x=-.2;
const gloveL=new THREE.Mesh(new THREE.SphereGeometry(.085,10,8),darkMat);gloveL.position.set(-.48,.68,-.03);body.add(gloveL);
const gloveR=gloveL.clone();gloveR.position.x=.48;body.add(gloveR);

// Airborne snow particles, pooled and reused.
const particleCount=800, particlePositions=new Float32Array(particleCount*3), particleLife=new Float32Array(particleCount);
const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
const particleMat=new THREE.PointsMaterial({color:0xf7fcff,size:.12,transparent:true,opacity:.75,depthWrite:false});
const particles=new THREE.Points(particleGeo,particleMat);scene.add(particles);
let particleCursor=0;
function spray(pos,amount=10,force=1){
  for(let i=0;i<amount;i++){
    const k=particleCursor++%particleCount;
    particlePositions[k*3]=pos.x+(Math.random()-.5)*.7;
    particlePositions[k*3+1]=pos.y+Math.random()*.25;
    particlePositions[k*3+2]=pos.z+(Math.random()-.5)*.7;
    particleLife[k]=.35+Math.random()*.7;
  }
  particleGeo.attributes.position.needsUpdate=true;
}

// Physics state, SI-ish units: metres, seconds, m/s. Board heading is a yaw angle.
const state={
  x:0,z:135,vx:0,vz:-1.5,heading:0,edge:0,airY:0,airVy:0,airborne:false,
  yawAir:0,score:0,runDistance:0,paused:false,crashed:false,crashTimer:0,
  groundedSpeed:0,carveG:0
};
const keys=new Set();
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  keys.add(e.key.toLowerCase());
  if(e.key.toLowerCase()==='r') resetRun();
  if(e.key==='Escape'||e.key.toLowerCase()==='p') togglePause();
  if(e.key===' '&&!e.repeat&&!state.paused&&!state.crashed) jump();
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function jump(){
  if(!state.airborne&&state.airY<.12&&Math.hypot(state.vx,state.vz)>3){
    state.airborne=true;
    // Pop is stronger at speed; the slope contributes to takeoff direction.
    state.airVy=3.7+Math.min(2.0,Math.hypot(state.vx,state.vz)*.055);
    state.yawAir=0;
    showToast('OLLIE');
  }
}
function showToast(t){const el=document.querySelector('#toast');el.textContent=t;el.style.opacity='1';clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.style.opacity='0',950)}
function resetRun(){
  Object.assign(state,{x:0,z:135,vx:0,vz:-1.5,heading:0,edge:0,airY:0,airVy:0,airborne:false,yawAir:0,score:0,runDistance:0,paused:false,crashed:false,crashTimer:0,groundedSpeed:0,carveG:0});
  rider.visible=true;document.querySelector('#pause-screen').classList.add('hidden');
}
function togglePause(){state.paused=!state.paused;document.querySelector('#pause-screen').classList.toggle('hidden',!state.paused)}
document.querySelector('#pause').addEventListener('click',togglePause);
document.querySelector('#resume').addEventListener('click',togglePause);
document.querySelector('#restart').addEventListener('click',resetRun);

function slopeAt(x,z){
  const e=.35;
  return {dx:(terrainHeight(x+e,z)-terrainHeight(x-e,z))/(2*e), dz:(terrainHeight(x,z+e)-terrainHeight(x,z-e))/(2*e)};
}
function updatePhysics(dt){
  if(state.paused)return;
  if(state.crashed){
    state.crashTimer-=dt;
    if(state.crashTimer<=0)resetRun();
    return;
  }
  const up=keys.has('w')||keys.has('arrowup'), down=keys.has('s')||keys.has('arrowdown');
  const left=keys.has('a')||keys.has('arrowleft'), right=keys.has('d')||keys.has('arrowright');
  const turn=(right?1:0)-(left?1:0);
  const speed=Math.hypot(state.vx,state.vz);
  const slope=slopeAt(state.x,state.z);
  const gravity=9.81;
  const normal=terrainNormal(state.x,state.z);
  // Gravity projected onto the local slope; velocity is then resolved in world coordinates.
  const gX=-gravity*normal.x*normal.y;
  const gZ=-gravity*normal.z*normal.y;
  state.vx+=gX*dt;
  state.vz+=gZ*dt;
  const groundSpeed=Math.hypot(state.vx,state.vz);
  // Steering changes heading; carving lateral force depends on speed, edge angle and grip.
  const targetEdge=turn*.72;
  state.edge=THREE.MathUtils.damp(state.edge,targetEdge,3.2,dt);
  if(!state.airborne){
    const turnRate=(0.22+Math.min(1.0,groundSpeed/11)*0.92)*turn;
    state.heading+=turnRate*dt;
    const forwardX=Math.sin(state.heading),forwardZ=-Math.cos(state.heading);
    const lateralX=Math.cos(state.heading),lateralZ=Math.sin(state.heading);
    const forwardSpeed=state.vx*forwardX+state.vz*forwardZ;
    const lateralSpeed=state.vx*lateralX+state.vz*lateralZ;
    const edgeGrip=0.3+Math.abs(state.edge)*1.45;
    const lateralAccel=-lateralSpeed*(1.8+edgeGrip*3.2);
    state.vx+=lateralX*lateralAccel*dt;
    state.vz+=lateralZ*lateralAccel*dt;
    // Speed-dependent snow drag and deliberate braking.
    const drag=0.0065*groundSpeed*groundSpeed + (down?5.8:0) + (up?-0.75:0);
    if(groundSpeed>0.001){
      const scale=Math.max(0,1-drag*dt/groundSpeed);
      state.vx*=scale;state.vz*=scale;
    }
    // A board on an edge sheds a little speed; stronger edge engagement makes tighter arcs.
    const carveLoss=Math.abs(turn)*Math.abs(state.edge)*groundSpeed*.055;
    if(groundSpeed>0.001){const sc=Math.max(0,1-carveLoss*dt/groundSpeed);state.vx*=sc;state.vz*=sc;}
    state.carveG=Math.abs(turn)*groundSpeed*groundSpeed*(.025+Math.abs(state.edge)*.11);
  } else {
    state.yawAir+=turn*1.65*dt;
    state.heading+=turn*1.65*dt;
    state.airVy-=gravity*dt;
    state.airY+=state.airVy*dt;
  }
  state.x+=state.vx*dt;
  state.z+=state.vz*dt;
  state.runDistance=Math.max(state.runDistance,135-state.z);
  // Gentle boundaries funnel the player back into the playable corridor.
  if(Math.abs(state.x)>126){state.vx+=-Math.sign(state.x)*Math.min(10,Math.abs(state.x)-126)*dt*2.4;}
  const groundY=terrainHeight(state.x,state.z);
  if(state.airborne&&state.airY<=0){
    state.airY=0;state.airborne=false;
    if(state.airVy < -8.2){
      state.crashed=true;state.crashTimer=1.4;state.vx*=.22;state.vz*=.22;
      showToast('HARD LANDING');document.querySelector('#status').textContent='RECOVERING';
    } else {
      showToast(state.yawAir>.7?'CLEAN SPIN':'SOLID LANDING');
      state.vx*=.97;state.vz*=.97;
    }
    state.airVy=0;state.yawAir=0;
  }
  state.groundedSpeed=groundSpeed;
  // Rider and board are positioned on the slope; camera follows smoothly below.
  const y=groundY+state.airY;
  rider.position.set(state.x,y,state.z);
  rider.rotation.y=state.heading;
  const pitch=Math.atan(slope.dz);
  const roll=Math.atan(slope.dx);
  boardGroup.rotation.x=state.airborne?-.15: pitch*.65;
  boardGroup.rotation.z=state.airborne?0:-state.edge*.36;
  body.rotation.x=state.airborne?-0.18+Math.sin(state.yawAir)*.08:-.05;
  body.rotation.z=state.airborne?Math.sin(state.yawAir)*.12:-turn*.11;
  // Keep board nearly aligned with downhill velocity at low speed, but let rider control it.
  const angle=state.heading;
  if(!state.airborne&&Math.abs(turn)>0&&groundSpeed>5&&Math.random()<.75){
    const p=new THREE.Vector3(state.x+Math.cos(angle)*.65,y+.08,state.z+Math.sin(angle)*.65);
    spray(p,2+Math.floor(Math.abs(turn)*5),Math.min(1.8,groundSpeed/12));
  }
  // Snow spray drifts down behind the rider.
  for(let i=0;i<particleCount;i++){
    if(particleLife[i]>0){
      particleLife[i]-=dt;
      particlePositions[i*3+1]-=dt*1.4;
      particlePositions[i*3]+=state.vx*dt*.06;
      particlePositions[i*3+2]+=state.vz*dt*.06;
      if(particleLife[i]<=0){particlePositions[i*3+1]=-9999;}
    }
  }
  particleGeo.attributes.position.needsUpdate=true;
  updateHud();
}
function updateHud(){
  const kmh=Math.round(state.groundedSpeed*3.6);
  document.querySelector('#speed').textContent=kmh.toString().padStart(2,'0');
  document.querySelector('#speedbar').style.width=Math.min(100,kmh/90*100)+'%';
  document.querySelector('#distance').textContent=Math.round(state.runDistance)+' M DOWN';
  document.querySelector('#progress').style.width=Math.min(100,state.runDistance/720*100)+'%';
  if(!state.crashed)document.querySelector('#status').textContent=state.airborne?'AIRBORNE':kmh<3?'READY TO RIDE':state.carveG>10?'CARVING':'DESCENDING';
}
const cameraTarget=new THREE.Vector3();
const cameraPos=new THREE.Vector3();
function updateCamera(dt){
  const speed=Math.hypot(state.vx,state.vz);
  const forward=new THREE.Vector3(Math.sin(state.heading),0,-Math.cos(state.heading));
  const desired=new THREE.Vector3(state.x-forward.x*(8.5+Math.min(speed*.16,5)),terrainHeight(state.x,state.z)+4.2+Math.min(speed*.05,2.2)+state.airY*.45,state.z-forward.z*(8.5+Math.min(speed*.16,5)));
  cameraPos.copy(desired);
  camera.position.lerp(cameraPos,1-Math.exp(-2.5*dt));
  cameraTarget.set(state.x+forward.x*7,terrainHeight(state.x,state.z)+1.25+state.airY*.25,state.z+forward.z*7);
  camera.lookAt(cameraTarget);
  camera.fov=THREE.MathUtils.damp(camera.fov,62+Math.min(speed*.38,9),2,dt);camera.updateProjectionMatrix();
  // Move key scenic elements with run origin to keep a broad slope in view.
  sun.target.position.set(state.x,0,state.z-30);
}
let last=performance.now(),accumulator=0;
const fixed=1/120;
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min((now-last)/1000,.05);last=now;
  if(!state.paused){
    accumulator+=dt;
    while(accumulator>=fixed){updatePhysics(fixed);accumulator-=fixed;}
  }
  updateCamera(Math.max(dt,.001));
  renderer.render(scene,camera);
}
function onResize(){
  camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
}
window.addEventListener('resize',onResize);
document.querySelector('#loading').style.opacity='0';
setTimeout(()=>{document.querySelector('#loading').remove();document.querySelector('#hud').classList.remove('hidden');},650);
updateHud();
requestAnimationFrame(frame);
