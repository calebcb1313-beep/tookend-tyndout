(()=>{'use strict';
const c=document.querySelector('#game'),x=c.getContext('2d'),W=960,H=540;
const $=s=>document.querySelector(s), menu=$('#menu'),levels=$('#levels'),pause=$('#pause'),help=$('#help'),toast=$('#toast');
const regions=[
 {name:'THE OVERGROWN COURT',sky:'#17283a',ground:'#385b42',accent:'#9bdc76',boss:'THORNBACK',count:7},
 {name:'GLASSHOUSE GULCH',sky:'#253342',ground:'#48604c',accent:'#9ee4d4',boss:'THE MISTRESS',count:9},
 {name:'THE ROOT MAZE',sky:'#211a32',ground:'#49364a',accent:'#c38be5',boss:'OLD KNUCKLE',count:11},
 {name:'CINDER ORCHARD',sky:'#3a2027',ground:'#694038',accent:'#ff9b55',boss:'ASH PEPPER',count:13},
 {name:'THE SUNKEN PANTRY',sky:'#172e3a',ground:'#31515c',accent:'#75d8df',boss:'MIRE KING',count:15},
 {name:'THE ROYAL ROTUNDA',sky:'#302039',ground:'#65434b',accent:'#ffd76b',boss:'KING TOMATO',count:17}
];
let mode='campaign',region=0,running=false,paused=false,frame=0,camera=0,score=0,seedCount=0,levelWidth=2600,platforms=[],foes=[],shots=[],particles=[],keys={},player,boss=null,gateX=0,last=0;
function rounded(a,b,w,h,r,col){x.fillStyle=col;x.beginPath();x.roundRect(a,b,w,h,r);x.fill()}
function text(t,a,b,size=18,col='#fff',align='left'){x.fillStyle=col;x.font=`900 ${size}px system-ui`;x.textAlign=align;x.fillText(t,a,b)}
function show(el){[menu,levels,pause,help].forEach(e=>e.classList.add('hidden'));el.classList.remove('hidden')}
function say(s){toast.textContent=s;setTimeout(()=>{if(toast.textContent===s)toast.textContent=''},1800)}
function newLevel(i,endless=false){
 region=i%regions.length;mode=endless?'endless':'campaign';frame=0;camera=0;score=0;seedCount=0;levelWidth=endless?3600:2600+i*180;
 player={x:90,y:350,vx:0,vy:0,w:34,h:48,hp:100,max:100,face:1,ground:false,fire:0,inv:0,crouch:false};
 platforms=[{x:0,y:472,w:levelWidth,h:100}];
 for(let a=0;a<12+(i*2);a++){let px=260+a*190+(a%3)*25, py=390-(a%4)*42;platforms.push({x:px,y:py,w:100+(a%3)*25,h:16})}
 foes=[];shots=[];particles=[];boss=null;gateX=levelWidth-150;
 let n=endless?22:regions[region].count;
 for(let a=0;a<n;a++){let ex=360+a*(levelWidth-600)/Math.max(1,n-1);foes.push({x:ex,y:420,hp:30+region*5,max:30+region*5,face:-1,cd:Math.random()*80,kind:a%4===0?'spitter':'crawler',alive:true})}
 if(!endless)boss={x:levelWidth-310,y:380,hp:180+region*30,max:180+region*30,cd:80,alive:true};
 running=true;paused=false;showCanvasOnly();say(regions[region].name);
}
function showCanvasOnly(){[menu,levels,pause,help].forEach(e=>e.classList.add('hidden'))}
function startCampaign(){show(levels);let g=$('#levelGrid');g.innerHTML='';regions.forEach((r,i)=>{let b=document.createElement('button');b.innerHTML=`${String(i+1).padStart(2,'0')}<small>${r.name}</small>`;b.onclick=()=>newLevel(i);g.append(b)})}
$('#campaign').onclick=startCampaign;$('#endless').onclick=()=>newLevel(0,true);$('#how').onclick=()=>show(help);
$('#levelBack').onclick=()=>show(menu);$('#helpBack').onclick=()=>show(menu);$('#resume').onclick=()=>{paused=false;showCanvasOnly()};$('#quit').onclick=()=>{running=false;show(menu)};
function pauseGame(){if(!running)return;paused=!paused;show(paused?pause:menu);if(!paused)showCanvasOnly()}
function hitFoe(f,dmg){f.hp-=dmg;burst(f.x,f.y+10,'#b5e76d',8);if(f.hp<=0){f.alive=false;score+=100;seedCount++;for(let j=0;j<3;j++)particles.push({x:f.x,y:f.y,vx:Math.random()*4-2,vy:-Math.random()*4-1,t:50,col:'#ffd65a',r:4})}}
function burst(a,b,col,n){for(let i=0;i<n;i++)particles.push({x:a,y:b,vx:(Math.random()-.5)*7,vy:(Math.random()-.8)*7,t:24+Math.random()*18,col,r:2+Math.random()*4})}
function fire(){if(!running||paused||player.fire>0)return;player.fire=16;shots.push({x:player.x+player.face*23,y:player.y+20,vx:player.face*9,life:90});burst(player.x+player.face*20,player.y+20,'#e9e46b',4)}
const held={left:false,right:false,down:false,jump:false,fire:false};
const keymap={a:'left',arrowleft:'left',d:'right',arrowright:'right',s:'down',arrowdown:'down',w:'jump',arrowup:'jump',' ':'jump',f:'fire',enter:'fire'};
addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(k==='escape'){pauseGame();e.preventDefault();return}if(keymap[k]){held[keymap[k]]=true;e.preventDefault()}});
addEventListener('keyup',e=>{let k=e.key.toLowerCase();if(keymap[k])held[keymap[k]]=false});
document.querySelectorAll('[data-key]').forEach(b=>{let k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();held[k]=true;b.setPointerCapture(e.pointerId)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>held[k]=false))});
function update(){
 if(!running||paused)return;frame++;player.crouch=held.down;
 let dir=(held.right?1:0)-(held.left?1:0);player.vx=dir*(player.crouch?2.1:4.1);if(dir)player.face=dir;
 if(held.jump&&player.ground){player.vy=-11.5;player.ground=false;burst(player.x,player.y+48,'#b7dc83',5)}
 if(held.fire)fire();
 player.fire=Math.max(0,player.fire-1);player.inv=Math.max(0,player.inv-1);
 player.vy=Math.min(12,player.vy+.48);player.x+=player.vx;player.y+=player.vy;player.ground=false;
 for(const p of platforms){if(player.x+16>p.x&&player.x-16<p.x+p.w&&player.y+player.h>=p.y&&player.y+player.h-player.vy<=p.y&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.ground=true}}
 player.x=Math.max(20,Math.min(levelWidth-20,player.x));
 if(player.y>H+100){player.hp-=20;player.y=350;player.vy=0;player.inv=60}
 foes.forEach(f=>{if(!f.alive)return;let dx=player.x-f.x;f.face=Math.sign(dx)||1;f.cd--;if(f.kind==='spitter'&&Math.abs(dx)<360&&f.cd<0){shots.push({x:f.x,y:f.y+8,vx:Math.sign(dx)*-4,enemy:true,life:100});f.cd=100} else if(Math.abs(dx)<55&&f.cd<0){if(player.inv<=0&&!player.crouch){player.hp-=8;player.inv=42;burst(player.x,player.y,'#ff786d',9)}f.cd=50} else f.x+=Math.sign(dx)*Math.min(1.25,Math.abs(dx)*.004)});
 if(boss&&boss.alive){boss.cd--;if(Math.abs(player.x-boss.x)<100&&boss.cd<0){if(player.inv<=0){player.hp-=16;player.inv=55;burst(player.x,player.y,'#ff7668',12)}boss.cd=65}if(boss.cd===0||boss.cd===-1){for(let j=-1;j<=1;j++)shots.push({x:boss.x,y:boss.y+25,vx:(player.x<boss.x?-1:1)*4,vy:j*1.2,enemy:true,life:120})}boss.x+=Math.sin(frame/70)*.7}
 shots.forEach(s=>{s.x+=s.vx;s.y+=(s.vy||0);s.life--;if(!s.enemy){foes.forEach(f=>{if(f.alive&&Math.abs(s.x-f.x)<22&&Math.abs(s.y-(f.y+20))<35){hitFoe(f,18);s.life=0}});if(boss?.alive&&Math.abs(s.x-boss.x)<55&&Math.abs(s.y-(boss.y+25))<65){boss.hp-=10;s.life=0;burst(boss.x,boss.y,'#ffb65c',7)}}else if(Math.abs(s.x-player.x)<24&&Math.abs(s.y-(player.y+20))<35&&player.inv<=0){player.hp-=7;player.inv=32;s.life=0}});shots=shots.filter(s=>s.life>0&&s.x>-100&&s.x<levelWidth+100);
 particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.t--});particles=particles.filter(p=>p.t>0);
 if(boss&&boss.hp<=0){boss.alive=false;score+=1000;seedCount+=10;burst(boss.x,boss.y,'#ffd56b',70);say('GUARDIAN DEFEATED — THE ROOTS REMEMBER!')}
 let done=player.x>gateX&&(!boss||!boss.alive);
 if(done){running=false;if(mode==='campaign'&&region<5){say('REGION CLEARED');setTimeout(()=>{if(!running) {newLevel(region+1);}},700)}else{show(menu);say('VICTORY! SEEDS: '+seedCount)}}
 if(player.hp<=0){running=false;show(menu);say('THE ROT CLAIMS ANOTHER — SCORE '+score)}
 camera=Math.max(0,Math.min(levelWidth-W,player.x-W*.38));
}
function draw(){
 let r=regions[region];let grad=x.createLinearGradient(0,0,0,H);grad.addColorStop(0,r.sky);grad.addColorStop(1,'#121321');x.fillStyle=grad;x.fillRect(0,0,W,H);
 // distant floating greenhouses and moons
 x.save();x.translate(-camera*.18,0);for(let i=0;i<9;i++){let bx=i*390-80;x.fillStyle='#111c2a';x.beginPath();x.moveTo(bx,350);x.lineTo(bx+90,230+(i%3)*25);x.lineTo(bx+210,350);x.fill();x.strokeStyle='#7fae91';x.globalAlpha=.28;x.lineWidth=3;x.strokeRect(bx+70,250+(i%3)*25,100,90);x.globalAlpha=1;x.fillStyle='#c6d78a';x.beginPath();x.arc(bx+125,285+(i%3)*25,5,0,Math.PI*2);x.fill()}x.restore();
 x.save();x.translate(-camera,0);
 // ground
 platforms.forEach((p,i)=>{rounded(p.x,p.y,p.w,p.h,5,i===0?r.ground:'#47604e');x.fillStyle=r.accent;x.globalAlpha=.75;x.fillRect(p.x,p.y,p.w,4);x.globalAlpha=1;for(let k=0;k<p.w/28;k++){x.fillStyle='#192b2b';x.fillRect(p.x+k*28,p.y+8,3,5)}});
 // strange roots and glowing plants
 for(let i=0;i<levelWidth/130;i++){let xx=i*130+30;x.strokeStyle='#779a62';x.globalAlpha=.5;x.lineWidth=5;x.beginPath();x.moveTo(xx,472);x.quadraticCurveTo(xx-18,420,xx+10,390-(i%3)*18);x.stroke();x.globalAlpha=1;x.fillStyle=r.accent;x.beginPath();x.arc(xx+10,390-(i%3)*18,5,0,Math.PI*2);x.fill()}
 // gate
 x.fillStyle='#2b1c36';x.fillRect(gateX,350,72,122);x.strokeStyle=r.accent;x.lineWidth=5;x.strokeRect(gateX+8,358,56,114);text('EXIT',gateX+36,340,13,r.accent,'center');
 foes.forEach(f=>{if(!f.alive)return;drawVeg(f.x,f.y+40, f.kind==='spitter'?'#9c83c9':'#b2a16a',.82,f.face);bar(f.x-19,f.y-8,38,5,f.hp/f.max,'#a8d96f')});
 if(boss?.alive){drawVeg(boss.x,boss.y+68,'#d93c43',1.65,-1,true);bar(boss.x-58,boss.y-42,116,9,boss.hp/boss.max,'#ff6c62');text(regions[region].boss,boss.x,boss.y-53,15,'#ffe28a','center')}
 shots.forEach(s=>{x.fillStyle=s.enemy?'#e77c77':'#f7e46c';x.shadowBlur=14;x.shadowColor=x.fillStyle;x.beginPath();x.arc(s.x,s.y,s.enemy?7:6,0,Math.PI*2);x.fill();x.shadowBlur=0});
 particles.forEach(p=>{x.globalAlpha=Math.min(1,p.t/20);x.fillStyle=p.col;x.beginPath();x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fill();x.globalAlpha=1});
 if(player&&(player.inv%8<4||player.inv===0))drawVeg(player.x,player.y+player.h,player.crouch?'#f2d66a':'#f4d34f',1,player.face);
 x.restore();
 // HUD
 const hp=player?Math.max(0,player.hp):0,hpMax=player?player.max:100;
 rounded(18,16,240,64,12,'#0b1024cc');text('ROOTBOUND REBELLION',32,39,13,'#c9e7a2');rounded(32,50,205,12,6,'#342b42');rounded(32,50,205*Math.max(0,hp/hpMax),12,6,'#e86b66');text('♥ '+hp,245,61,12,'#fff','right');
 rounded(770,16,172,54,12,'#0b1024cc');text('SEEDS  '+seedCount,856,49,17,'#ffdf72','center');text(mode==='endless'?'ENDLESS GROVE':`REGION ${region+1}/6`,480,28,13,'#fff','center');
}
function bar(a,b,w,h,v,col){rounded(a,b,w,h,4,'#241a2b');rounded(a,b,w*Math.max(0,v),h,4,col)}
function drawVeg(px,base,col,scale,face,big=false){
 x.save();x.translate(px,base);x.scale(scale,scale);
 // shadow and feet
 x.fillStyle='#080b12aa';x.beginPath();x.ellipse(0,0,23,6,0,0,Math.PI*2);x.fill();
 rounded(-18,-45,36,43,15,col);x.fillStyle='#f5dfb2';x.beginPath();x.ellipse(-7,-29,3.2,5,0,0,Math.PI*2);x.ellipse(7,-29,3.2,5,0,0,Math.PI*2);x.fill();
 x.fillStyle='#24172a';x.beginPath();x.arc(-7+face*2,-29,1.5,0,Math.PI*2);x.arc(7+face*2,-29,1.5,0,Math.PI*2);x.fill();
 x.strokeStyle='#40212b';x.lineWidth=2.5;x.beginPath();x.arc(0,-20,6,.15,Math.PI-.15);x.stroke();
 // leaf crown
 x.fillStyle='#62b85d';x.beginPath();x.ellipse(-5,-48,10,5,-.6,0,Math.PI*2);x.ellipse(7,-51,11,5,.5,0,Math.PI*2);x.fill();
 if(big){x.fillStyle='#ffd66c';x.beginPath();x.moveTo(-13,-53);x.lineTo(-9,-72);x.lineTo(0,-60);x.lineTo(9,-75);x.lineTo(14,-53);x.closePath();x.fill()}
 // arms
 x.strokeStyle=col;x.lineWidth=7;x.lineCap='round';x.beginPath();x.moveTo(-14,-34);x.lineTo(-23,-20);x.moveTo(14,-34);x.lineTo(23,-21);x.stroke();
 x.restore();
}
function loop(t){let dt=Math.min(40,t-last);last=t;try{update();draw()}catch(err){console.error('frame failed',err)}requestAnimationFrame(loop)}
requestAnimationFrame(loop);
})();