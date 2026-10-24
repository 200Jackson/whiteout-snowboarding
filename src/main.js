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
  const width=300, depth=1000, nx=260, nz=760, positions=[],colors=[],indices=[];
  for(let j=0;j<=nz;j++) for(let i=0;i<=nx;i++){
    const x=-width/2+width*i/nx,z=210-depth*j/nz,y=terrainHeight(x,z);positions.push(x,y,z);
    const n=terrainNormal(x,z);const steep=1-n.y;const wave=Math.sin(x*.17+z*.035)*.09+Math.sin(z*.11-x*.09)*.055+Math.sin(x*.49+z*.23)*.025;
    const shade=THREE.MathUtils.clamp(steep*3.8+wave+0.52,0,2.9);const lo=Math.floor(shade),hi=Math.min(3,lo+1);const c=snowColors[lo].clone().lerp(snowColors[hi],shade-lo);
    if(y>8)c.lerp(new THREE.Color('#d6eaf8'),Math.min(.58,(y-8)*.016));
    if(steep>.22)c.lerp(new THREE.Color('#a9c8dc'),Math.min(.38,(steep-.22)*1.1));colors.push(c.r,c.g,c.b);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const terrain=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,metalness:0}));terrain.receiveShadow=true;terrain.frustumCulled=false;scene.add(terrain);
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

// Rider: articulated anatomical rig. Joint pivots are parented hierarchically so
// motion propagates naturally from torso -> shoulder/elbow/wrist and hip/knee/ankle.
const rider=new THREE.Group();scene.add(rider);const boardRig=new THREE.Group();rider.add(boardRig);const body=new THREE.Group();rider.add(body);
const boardShape=new THREE.Shape();boardShape.moveTo(0,-1.12);boardShape.quadraticCurveTo(.16,-1.12,.19,-.86);boardShape.lineTo(.145,.72);boardShape.quadraticCurveTo(.13,1.1,0,1.12);boardShape.quadraticCurveTo(-.13,1.1,-.145,.72);boardShape.lineTo(-.19,-.86);boardShape.quadraticCurveTo(-.16,-1.12,0,-1.12);
const boardGeo=new THREE.ExtrudeGeometry(boardShape,{depth:.055,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:8});boardGeo.rotateX(Math.PI/2);boardGeo.translate(0,.005,0);const board=new THREE.Mesh(boardGeo,boardMat);board.castShadow=true;boardRig.add(board);
const topStripe=new THREE.Mesh(new THREE.BoxGeometry(.065,.014,1.45),boardBright);topStripe.position.y=.045;boardRig.add(topStripe);
for(const z of [-.48,.48]){const bind=new THREE.Mesh(new THREE.BoxGeometry(.31,.1,.26),darkMat);bind.position.set(0,.08,z);boardRig.add(bind);}
function capsule(parent,r,len,material,pos){const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,8),material);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function pivot(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function bone(parent,r,len,material){return capsule(parent,r,len,material,[0,-len/2,0]);}
function ball(parent,r,material,pos=[0,0,0]){const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),material);o.position.set(...pos);o.castShadow=true;parent.add(o);return o;}
// Pelvis and a short, segmented spine give the torso a little independent flex.
const pelvis=pivot(body,0,.58,.02);capsule(pelvis,.205,.17,pantsMat,[0,0,0]);
const lowerSpine=pivot(pelvis,0,.10,0);const lumbar=bone(lowerSpine,.17,.20,jacketMat);lumbar.position.y=.04;lumbar.rotation.x=-.08;
const chest=pivot(lowerSpine,0,.17,0);const torso=bone(chest,.245,.37,jacketMat);torso.position.y=.12;torso.rotation.x=-.12;
// A small back protector/pack follows the chest rather than floating independently.
const pack=new THREE.Mesh(new THREE.BoxGeometry(.29,.34,.13),mat('#f5f7ed'));pack.position.set(0,.12,.18);pack.castShadow=true;chest.add(pack);
// Neck, head, helmet and visor are separate articulated pieces.
const neck=pivot(chest,0,.31,-.005);capsule(neck,.075,.11,skinMat,[0,.045,0]);
const headPivot=pivot(neck,0,.095,-.01);ball(headPivot,.145,skinMat,[0,.065,-.015]);
const helmet=new THREE.Mesh(new THREE.SphereGeometry(.18,16,12,0,Math.PI*2,0,Math.PI*.62),helmetMat);helmet.position.set(0,.105,-.015);helmet.scale.set(1,1.08,1.08);headPivot.add(helmet);
const visor=new THREE.Mesh(new THREE.BoxGeometry(.285,.065,.075),visorMat);visor.position.set(0,.085,-.15);headPivot.add(visor);
// Shoulders -> elbows -> wrists -> five small fingers per hand.
const armL=pivot(chest,-.245,.255,0),armR=pivot(chest,.245,.255,0);
ball(armL,.09,jacketMat);ball(armR,.09,jacketMat);
const upperArmL=bone(armL,.072,.265,jacketMat),upperArmR=bone(armR,.072,.265,jacketMat);upperArmL.rotation.z=-.48;upperArmR.rotation.z=.48;
const elbowL=pivot(armL,-.12,-.23,0),elbowR=pivot(armR,.12,-.23,0);ball(elbowL,.061,jacketMat);ball(elbowR,.061,jacketMat);
const forearmL=bone(elbowL,.061,.235,jacketMat),forearmR=bone(elbowR,.061,.235,jacketMat);forearmL.rotation.z=-.12;forearmR.rotation.z=.12;
const wristL=pivot(elbowL,-.035,-.22,-.005),wristR=pivot(elbowR,.035,-.22,-.005);ball(wristL,.045,darkMat);ball(wristR,.045,darkMat);
const gloveL=ball(wristL,.068,darkMat,[0,-.045,-.015]),gloveR=ball(wristR,.068,darkMat,[0,-.045,-.015]);
for(const hand of [wristL,wristR]){for(let f=0;f<4;f++){const finger=pivot(hand,(f-1.5)*.024,-.085,-.012);bone(finger,.012,.052,darkMat);finger.rotation.z=(f-1.5)*-.09;}const thumb=pivot(hand,.055,-.035,-.005);bone(thumb,.014,.055,darkMat);thumb.rotation.z=-.65;}
// Independent hip, knee, ankle and toe pivots for both legs.
const hipL=pivot(pelvis,-.12,-.06,-.005),hipR=pivot(pelvis,.12,-.06,-.005);ball(hipL,.085,pantsMat);ball(hipR,.085,pantsMat);
const thighL=bone(hipL,.09,.255,pantsMat),thighR=bone(hipR,.09,.255,pantsMat);
const kneeL=pivot(hipL,0,-.245,0),kneeR=pivot(hipR,0,-.245,0);ball(kneeL,.072,pantsMat);ball(kneeR,.072,pantsMat);
const shinL=bone(kneeL,.067,.245,pantsMat),shinR=bone(kneeR,.067,.245,pantsMat);
const ankleL=pivot(kneeL,0,-.235,-.005),ankleR=pivot(kneeR,0,-.235,-.005);ball(ankleL,.045,darkMat);ball(ankleR,.045,darkMat);
function makeBoot(parent){const boot=new THREE.Mesh(new THREE.BoxGeometry(.145,.135,.255),darkMat);boot.position.set(0,-.045,-.075);boot.castShadow=true;parent.add(boot);const toe=pivot(parent,0,-.045,-.19);const toeCap=new THREE.Mesh(new THREE.BoxGeometry(.12,.075,.10),boardBright);toeCap.position.set(0,-.012,-.025);toe.add(toeCap);return {boot,toe};}
const bootL=makeBoot(ankleL),bootR=makeBoot(ankleR);

// High-detail technical riding kit: layered panels and protective hardware follow the rig.
const trimMat=mat('#ffb15b',.58), seamMat=mat('#d7e6e9',.82), rubberMat=mat('#263b49',.8), metalMat=mat('#b9d4dd',.3,{metalness:.72}), glowMat=mat('#b8ff4f',.32,{emissive:'#426b12',emissiveIntensity:.28});
function panel(parent,geometry,material,position,rotation=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(geometry,material);m.position.set(...position);m.rotation.set(...rotation);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function lineBar(parent,a,b,r,material){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=new THREE.Vector3().subVectors(B,A);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),7),material);m.position.copy(A).add(B).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(m);return m;}
// Jacket collar, front storm flap, zip pull, chest seams and articulated shoulder overlays.
panel(chest,new THREE.TorusGeometry(.105,.027,7,16,Math.PI),darkMat,[0,.30,-.012],[Math.PI/2,0,0],[1.12,1,.7]);
panel(chest,new THREE.BoxGeometry(.025,.31,.018),darkMat,[0,.12,-.247]);
panel(chest,new THREE.BoxGeometry(.009,.26,.008),metalMat,[.018,.12,-.259]);
panel(chest,new THREE.BoxGeometry(.045,.035,.018),trimMat,[.028,.23,-.261]);
panel(chest,new THREE.BoxGeometry(.12,.055,.018),glowMat,[-.115,.19,-.245],[0,0,-.12]);
lineBar(chest,[-.17,.12,-.24],[-.10,.02,-.25],.006,seamMat);lineBar(chest,[.17,.12,-.24],[.10,.02,-.25],.006,seamMat);
// Shoulder yokes and padded elbow guards are parented to their respective moving limbs.
for(const [arm,sign] of [[armL,-1],[armR,1]]){
 panel(arm,new THREE.SphereGeometry(.092,12,9),trimMat,[0,-.035,-.002],[0,0,0],[1.04,.72,1.02]);
 panel(arm,new THREE.BoxGeometry(.085,.105,.025),rubberMat,[sign*.02,-.12,-.055],[0,0,sign*.18]);
}
for(const [elbow,sign] of [[elbowL,-1],[elbowR,1]]){
 panel(elbow,new THREE.SphereGeometry(.066,12,9),rubberMat,[0,-.005,-.035],[0,0,0],[1,.92,.48]);
 panel(elbow,new THREE.BoxGeometry(.055,.022,.012),glowMat,[0,.012,-.065]);
}
// Forearm cuff, glove knuckle guards, and finger articulation details.
for(const wrist of [wristL,wristR]){
 panel(wrist,new THREE.CylinderGeometry(.052,.046,.055,10),trimMat,[0,-.025,0]);
 panel(wrist,new THREE.BoxGeometry(.082,.025,.05),rubberMat,[0,-.055,-.045]);
 for(let i=0;i<3;i++)panel(wrist,new THREE.BoxGeometry(.012,.012,.025),metalMat,[(i-1)*.022,-.057,-.071]);
}
// Hip belt, buckle, cargo pockets and reinforced articulated knees.
panel(pelvis,new THREE.BoxGeometry(.34,.045,.22),darkMat,[0,.035,-.012]);
panel(pelvis,new THREE.BoxGeometry(.055,.052,.018),metalMat,[0,.035,-.13]);
for(const [hip,sign] of [[hipL,-1],[hipR,1]]){
 panel(hip,new THREE.BoxGeometry(.09,.105,.025),rubberMat,[sign*.055,-.09,-.078],[0,0,sign*.08]);
 panel(hip,new THREE.BoxGeometry(.055,.012,.01),trimMat,[sign*.055,-.06,-.094]);
}
for(const [knee,sign] of [[kneeL,-1],[kneeR,1]]){
 panel(knee,new THREE.SphereGeometry(.074,12,9),rubberMat,[0,-.005,-.055],[0,0,0],[1,.93,.52]);
 panel(knee,new THREE.BoxGeometry(.085,.018,.014),trimMat,[0,.025,-.085]);
 panel(knee,new THREE.BoxGeometry(.045,.012,.012),glowMat,[0,-.01,-.089]);
}
// Boot shells, lace loops, ankle gaiters and binding straps are attached to the correct moving pieces.
for(const [ankle,boot] of [[ankleL,bootL],[ankleR,bootR]]){
 panel(ankle,new THREE.CylinderGeometry(.061,.07,.075,10),rubberMat,[0,-.025,-.01]);
 for(let i=0;i<4;i++){
  const yy=-.015-i*.024;
  lineBar(ankle,[-.045,yy,-.10],[.045,yy-.008,-.10],.004,metalMat);
 }
 panel(ankle,new THREE.BoxGeometry(.11,.025,.018),glowMat,[0,-.095,-.145]);
}
for(const z of [-.48,.48]){
 panel(boardRig,new THREE.BoxGeometry(.27,.018,.045),trimMat,[0,.14,z]);
 panel(boardRig,new THREE.BoxGeometry(.025,.04,.05),metalMat,[-.12,.14,z]);
 panel(boardRig,new THREE.BoxGeometry(.025,.04,.05),metalMat,[.12,.14,z]);
}
// Helmet vents, goggle strap, side ear pads and rear dial make the head read as equipment.
panel(headPivot,new THREE.BoxGeometry(.19,.018,.018),darkMat,[0,.205,.09],[.12,0,0]);
for(let i=0;i<4;i++)panel(headPivot,new THREE.BoxGeometry(.035,.009,.012),rubberMat,[(i-1.5)*.037,.235,.035],[.18,0,0]);
panel(headPivot,new THREE.BoxGeometry(.018,.045,.08),trimMat,[-.176,.07,.005]);
panel(headPivot,new THREE.CylinderGeometry(.024,.024,.018,10),metalMat,[0,.07,.16],[Math.PI/2,0,0]);
// A visible pack harness follows the chest; small reflective strips improve silhouette readability.
lineBar(chest,[-.14,.27,.15],[-.075,.02,.17],.018,darkMat);lineBar(chest,[.14,.27,.15],[.075,.02,.17],.018,darkMat);
panel(chest,new THREE.BoxGeometry(.07,.035,.018),trimMat,[0,.10,.205]);
panel(chest,new THREE.BoxGeometry(.12,.025,.015),glowMat,[0,-.015,-.24]);
// Pooled snow puffs and persistent paired tracks.
// Fine windblown snowfall close to the camera adds scale and speed without external assets.
const snowCount=760,snowPositions=new Float32Array(snowCount*3),snowDrift=new Float32Array(snowCount*3);
for(let i=0;i<snowCount;i++){snowPositions[i*3]=rand(-24,24);snowPositions[i*3+1]=rand(-2,24);snowPositions[i*3+2]=rand(-38,12);snowDrift[i*3]=rand(-1.2,1.2);snowDrift[i*3+1]=rand(-3.8,-1.2);snowDrift[i*3+2]=rand(-.6,.6);}
const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPositions,3));const snowField=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:'#f5fbff',size:.075,transparent:true,opacity:.62,depthWrite:false,sizeAttenuation:true}));scene.add(snowField);
function updateSnow(dt){snowField.position.set(state.x,terrainHeight(state.x,state.z)+1.2,state.z);for(let i=0;i<snowCount;i++){const k=i*3;snowPositions[k]+=snowDrift[k]*dt-state.vx*dt*.055;snowPositions[k+1]+=snowDrift[k+1]*dt;snowPositions[k+2]+=snowDrift[k+2]*dt-state.vz*dt*.055;if(snowPositions[k+1]<-2){snowPositions[k]=rand(-24,24);snowPositions[k+1]=rand(14,25);snowPositions[k+2]=rand(-38,12);}if(snowPositions[k+2]<-42)snowPositions[k+2]=12;if(snowPositions[k+2]>14)snowPositions[k+2]=-38;}snowGeo.attributes.position.needsUpdate=true;}
const puffCount=500,puffPos=new Float32Array(puffCount*3),puffLife=new Float32Array(puffCount),puffVel=Array.from({length:puffCount},()=>new THREE.Vector3());const puffGeo=new THREE.BufferGeometry();puffGeo.setAttribute('position',new THREE.BufferAttribute(puffPos,3));const puffs=new THREE.Points(puffGeo,new THREE.PointsMaterial({color:'#f8fdff',size:.22,transparent:true,opacity:.82,depthWrite:false,sizeAttenuation:true}));scene.add(puffs);let puffCursor=0;
function puff(x,y,z,n=8,power=1){for(let i=0;i<n;i++){const k=puffCursor++%puffCount;puffPos[k*3]=x+rand(-.45,.45);puffPos[k*3+1]=y+rand(0,.35);puffPos[k*3+2]=z+rand(-.45,.45);puffLife[k]=rand(.35,.9);puffVel[k].set(rand(-1,1)*power,rand(.4,2.2)*power,rand(-1,1)*power);}puffGeo.attributes.position.needsUpdate=true;}
const trackN=100,trackLeft=new Float32Array(trackN*3),trackRight=new Float32Array(trackN*3);for(let i=0;i<trackN;i++){trackLeft[i*3+1]=-1000;trackRight[i*3+1]=-1000;}const trackGeoL=new THREE.BufferGeometry(),trackGeoR=new THREE.BufferGeometry();trackGeoL.setAttribute('position',new THREE.BufferAttribute(trackLeft,3));trackGeoR.setAttribute('position',new THREE.BufferAttribute(trackRight,3));const trackMat=new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.5});scene.add(new THREE.Line(trackGeoL,trackMat),new THREE.Line(trackGeoR,trackMat));let trackCursor=0,trackTimer=0;

const state={x:0,z:155,vx:0,vz:-5,heading:0,edge:0,airY:0,airVy:0,airborne:false,airSpin:0,spinInput:0,score:0,distance:0,paused:false,crashed:false,crashTimer:0,carve:0,airTime:0,combo:1};
const keys=new Set(),touch=new Set();let lastTurn=0;const pressed=(...ks)=>ks.some(k=>keys.has(k)||touch.has(k));
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','q','e'].includes(e.key.toLowerCase()))e.preventDefault();const k=e.key.toLowerCase();if(!keys.has(k)){if(k===' '&&!state.paused)jump();if(k==='r')resetRun();if(k==='p'||k==='escape')togglePause();}keys.add(k);});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();touch.clear();});
document.querySelectorAll('[data-hold]').forEach(b=>{const k=b.dataset.hold;b.addEventListener('pointerdown',e=>{e.preventDefault();touch.add(k);b.setPointerCapture(e.pointerId);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>touch.delete(k));});document.querySelector('[data-action="jump"]').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
function toast(t){const el=$('#toast');el.textContent=t;el.style.opacity='1';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.opacity='0',1000);}
function resetRun(){Object.assign(state,{x:0,z:155,vx:0,vz:-5,heading:0,edge:0,airY:0,airVy:0,airborne:false,airSpin:0,spinInput:0,score:0,distance:0,paused:false,crashed:false,crashTimer:0,carve:0,airTime:0,combo:1});rider.visible=true;$('#pause-screen').classList.add('hidden');$('#status').textContent='READY TO RIDE';trackLeft.fill(0);trackRight.fill(0);for(let i=0;i<trackN;i++){trackLeft[i*3+1]=-1000;trackRight[i*3+1]=-1000;}trackGeoL.attributes.position.needsUpdate=true;trackGeoR.attributes.position.needsUpdate=true;}
function togglePause(){state.paused=!state.paused;$('#pause-screen').classList.toggle('hidden',!state.paused);}$('#pause').addEventListener('click',togglePause);$('#resume').addEventListener('click',togglePause);$('#restart').addEventListener('click',resetRun);
function jump(){const speed=Math.hypot(state.vx,state.vz);if(!state.paused&&!state.airborne&&!state.crashed&&speed>3.5){state.airborne=true;state.airVy=5.2+Math.min(2.8,speed*.075);state.airY=.06;state.airSpin=0;state.spinInput=0;state.airTime=0;toast('OLLIE!');puff(state.x,terrainHeight(state.x,state.z)+.2,state.z,18,1.2);}}
function updatePhysics(dt){
  if(state.paused)return;
  if(state.crashed){state.crashTimer-=dt;if(state.crashTimer<=0)resetRun();return;}
  const left=pressed('a','arrowleft','left'),right=pressed('d','arrowright','right');
  const brake=pressed('s','arrowdown','brake'),accelerate=pressed('w','arrowup');
  const turn=(right?1:0)-(left?1:0),sl=slopeAt(state.x,state.z);
  const speed=Math.hypot(state.vx,state.vz);
  state.edge=THREE.MathUtils.damp(state.edge,turn*(brake?1.2:1),7,dt);
  if(!state.airborne){
    // Forward is always the rider's nose. W adds thrust; terrain gravity only
    // changes speed along that direction, so the rider cannot mysteriously reverse.
    const steerRate=1.15+Math.min(speed/18,1)*1.35;
    state.heading+=turn*steerRate*dt;
    const fx=Math.sin(state.heading),fz=-Math.cos(state.heading);
    let forwardSpeed=state.vx*fx+state.vz*fz;
    const slopeGravity=-9.81*(sl.dx*fx+sl.dz*fz)/(1+sl.dx*sl.dx+sl.dz*sl.dz);
    forwardSpeed+=slopeGravity*dt;
    if(accelerate)forwardSpeed+=10.5*dt;
    if(brake)forwardSpeed-=18*dt;
    forwardSpeed-=((.18+forwardSpeed*.018)+(Math.abs(turn)*speed*.16))*dt;
    forwardSpeed=THREE.MathUtils.clamp(forwardSpeed,0,accelerate?31:27);
    // Small lateral drift remains possible, but edge grip quickly brings the
    // board back under the rider rather than allowing an uncontrollable slide.
    const lateral=state.vx*Math.cos(state.heading)+state.vz*Math.sin(state.heading);
    const sideGrip=Math.exp(-(brake?8.5:5.8)*dt);
    const side=lateral*sideGrip;
    state.vx=fx*forwardSpeed+Math.cos(state.heading)*side;
    state.vz=fz*forwardSpeed+Math.sin(state.heading)*side;
    state.carve=Math.abs(turn)*forwardSpeed*forwardSpeed*(.018+Math.abs(state.edge)*.035);
  }else{
    const spin=(pressed('e')?1:0)-(pressed('q')?1:0);
    state.spinInput=THREE.MathUtils.damp(state.spinInput,spin,5,dt);
    state.airSpin+=state.spinInput*2.9*dt;state.heading+=turn*1.05*dt;
    if(accelerate){state.vx+=Math.sin(state.heading)*2.2*dt;state.vz-=Math.cos(state.heading)*2.2*dt;}
    state.airVy-=9.81*dt;state.airY+=state.airVy*dt;state.airTime+=dt;
  }
  state.x+=state.vx*dt;state.z+=state.vz*dt;
  state.distance=Math.max(state.distance,155-state.z);
  if(Math.abs(state.x)>105)state.vx+=-Math.sign(state.x)*Math.min(30,(Math.abs(state.x)-105)*2)*dt;
  const ground=terrainHeight(state.x,state.z);
  if(state.airborne&&state.airY<=0){
    state.airY=0;state.airborne=false;const impact=Math.abs(state.airVy),spin=Math.abs(state.airSpin);
    if(impact>10.5||spin>5.4){state.crashed=true;state.crashTimer=1.2;state.vx*=.25;state.vz*=.25;toast('WIPEOUT');$('#status').textContent='WIPEOUT — RESETTING';}
    else{const points=Math.round((state.airTime*100+spin*75)*(impact<7?1.25:1));state.score+=points;toast(spin>2.8?`${Math.round(spin*57)}° SPIN  +${points}`:`CLEAN LANDING  +${points}`);state.vx*=.97;state.vz*=.97;puff(state.x,ground+.1,state.z,22,1.5);}
    state.airVy=0;state.airSpin=0;state.airTime=0;
  }
  const y=ground+state.airY;rider.position.set(state.x,y,state.z);rider.rotation.y=state.heading;
  const speedNow=Math.hypot(state.vx,state.vz);
  boardRig.rotation.x=state.airborne?-.16:Math.atan(sl.dz)*.72;
  boardRig.rotation.z=state.airborne?Math.sin(state.airSpin)*.08:-state.edge*.36;
  body.rotation.x=state.airborne?-.12:THREE.MathUtils.damp(body.rotation.x,accelerate?-.08:-.015,5,dt);
  body.rotation.z=state.airborne?Math.sin(state.airSpin)*.12:-turn*.10;body.rotation.y=state.airborne?state.airSpin*.12:0;
  chest.rotation.x=state.airborne?-.16:THREE.MathUtils.damp(chest.rotation.x,accelerate?-.12:-.025,5,dt);
  chest.rotation.z=state.airborne?Math.sin(state.airTime*7)*.06:-turn*.10;
  armL.rotation.z=-.10-turn*.14+(state.airborne?Math.sin(state.airTime*8)*.18:0);armR.rotation.z=.10-turn*.14-(state.airborne?Math.sin(state.airTime*8)*.18:0);
  elbowL.rotation.z=state.airborne?-.25:-.08;elbowR.rotation.z=state.airborne?.25:.08;
  wristL.rotation.x=state.airborne?-.18:0;wristR.rotation.x=state.airborne?.18:0;
  hipL.rotation.x=state.airborne?-.30:Math.sin(state.distance*.08)*.025;hipR.rotation.x=state.airborne?-.30:Math.sin(state.distance*.08+1)*.025;
  kneeL.rotation.x=state.airborne?-.62:.06+Math.abs(turn)*.12;kneeR.rotation.x=state.airborne?-.62:.06+Math.abs(turn)*.12;
  ankleL.rotation.x=state.airborne?.16:-.04;ankleR.rotation.x=state.airborne?.16:-.04;
  bootL.toe.rotation.x=state.airborne?-.08:0;bootR.toe.rotation.x=state.airborne?-.08:0;
  if(!state.airborne&&Math.abs(turn)>.05&&speedNow>4&&Math.random()<Math.min(1,dt*23))puff(state.x+Math.cos(state.heading)*.45,y+.08,state.z+Math.sin(state.heading)*.45,3+Math.floor(Math.abs(turn)*5),Math.min(2,speedNow/12));
  trackTimer+=dt;if(!state.airborne&&trackTimer>.08&&speedNow>3){trackTimer=0;const lx=Math.cos(state.heading)*.24,lz=Math.sin(state.heading)*.24;trackLeft[trackCursor*3]=state.x+lx;trackLeft[trackCursor*3+1]=y+.045;trackLeft[trackCursor*3+2]=state.z+lz;trackRight[trackCursor*3]=state.x-lx;trackRight[trackCursor*3+1]=y+.045;trackRight[trackCursor*3+2]=state.z-lz;trackCursor=(trackCursor+1)%trackN;trackGeoL.attributes.position.needsUpdate=true;trackGeoR.attributes.position.needsUpdate=true;}
  for(let i=0;i<puffCount;i++)if(puffLife[i]>0){puffLife[i]-=dt;puffPos[i*3]+=puffVel[i].x*dt+state.vx*dt*.025;puffPos[i*3+1]+=puffVel[i].y*dt;puffPos[i*3+2]+=puffVel[i].z*dt+state.vz*dt*.025;puffVel[i].y-=2.5*dt;if(puffLife[i]<=0)puffPos[i*3+1]=-1000;}puffGeo.attributes.position.needsUpdate=true;
  updateHud();if(state.distance>790){toast('RUN COMPLETE');state.score+=500;state.z=155;state.distance=0;state.x=0;state.vx=0;state.vz=-5;state.heading=0;}
}
function updateHud(){const speed=Math.round(Math.hypot(state.vx,state.vz)*3.6);$('#speed').textContent=String(speed).padStart(2,'0');$('#speedbar').style.width=Math.min(100,speed/100*100)+'%';$('#distance').textContent=`${Math.round(state.distance)} M DOWN`;$('#progress').style.width=Math.min(100,state.distance/790*100)+'%';$('#score').textContent=String(state.score).padStart(5,'0');if(!state.crashed)$('#status').textContent=state.airborne?'AIRBORNE':speed<4?'FIND YOUR LINE':pressed('s','arrowdown','brake')?'CHECKING SPEED':state.carve>8?'CARVING':'FULL SEND';}
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),forward=new THREE.Vector3();function updateCamera(dt){const speed=Math.hypot(state.vx,state.vz);forward.set(Math.sin(state.heading),0,-Math.cos(state.heading));const back=5.8+Math.min(speed*.095,2.6);const side=Math.sin(state.heading)*state.edge*.9;const desired=new THREE.Vector3(state.x-forward.x*back+side,terrainHeight(state.x,state.z)+2.65+Math.min(speed*.035,1.05)+state.airY*.28,state.z-forward.z*back);camPos.copy(desired);camera.position.lerp(camPos,1-Math.exp(-(state.airborne?3.3:6.3)*dt));camLook.set(state.x+forward.x*(3.8+speed*.085),terrainHeight(state.x,state.z)+.95+state.airY*.22,state.z+forward.z*(3.8+speed*.085));camera.lookAt(camLook);camera.rotateZ(-state.edge*.035);camera.fov=THREE.MathUtils.damp(camera.fov,66+Math.min(speed*.25,9),3.4,dt);camera.updateProjectionMatrix();sun.position.set(state.x-85,140,state.z+60);sun.target.position.set(state.x,0,state.z-25);}
let last=performance.now(),acc=0;const fixed=1/120;function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.045);last=now;if(!state.paused){acc+=dt;while(acc>=fixed){updatePhysics(fixed);acc-=fixed;}}updateCamera(Math.max(dt,.001));updateSnow(Math.min(dt,.04));renderer.render(scene,camera);}function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setSize(innerWidth,innerHeight);}window.addEventListener('resize',resize);
$('#loading').style.opacity='0';setTimeout(()=>{$('#loading')?.remove();$('#hud').classList.remove('hidden');},500);updateHud();requestAnimationFrame(frame);
