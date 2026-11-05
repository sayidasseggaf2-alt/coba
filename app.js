const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const stage=$('#stage'),picker=$('#picker');
let S,cur=0,edit=false;

// ---------- penyimpanan (IndexedDB, muat foto besar) ----------
const DB={open(){return new Promise((ok,no)=>{const r=indexedDB.open('porto',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=no})},
async get(k){const d=await this.open();return new Promise(r=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r()})},
async set(k,v){const d=await this.open();return new Promise(r=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=r})}};
let tm;const save=()=>{clearTimeout(tm);tm=setTimeout(()=>DB.set('s',S),250)};
const commit=()=>{save();render()};

const def=()=>({name:'Nama Kamu',role:'Desainer • Developer',bio:'Halo! Klik Edit lalu ganti teks ini dengan perkenalan singkatmu.',photo:'',
 contact:{email:'email@kamu.com',wa:'08123456789',ig:'@username'},
 items:[{title:'Proyek Pertama',desc:'Deskripsi singkat proyek.',photo:''}],
 slides:[{type:'home',bg:{k:'aurora'}},
  {type:'text',title:'Tentang Saya',text:'Ceritakan siapa kamu, keahlian, dan pengalamanmu.',photo:'',bg:{k:'grid'}},
  {type:'work',title:'Portofolio',bg:{k:'particles'}},
  {type:'contact',title:'Hubungi Saya',bg:{k:'gradient'}}]});

const get=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o);
const set=(o,p,v)=>{const k=p.split('.'),l=k.pop();k.reduce((a,x)=>a[x],o)[l]=v};
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---------- render ----------
const ed=(p,tag='span',cls='')=>`<${tag} class="${cls}" data-f="${p}" ${edit?'contenteditable="true"':''}>${e(get(S,p))}</${tag}>`;
const photo=(p,cls)=>{const v=get(S,p);return `<div class="ph ${cls} ${v?'':'empty'}" data-up="${p}">${v?`<img src="${e(v)}" alt="">`:'<span>＋ Foto</span>'}</div>`};
const link=(k,fn,ic)=>edit?`<div class="pill">${ic} ${ed('contact.'+k)}</div>`:`<a class="pill" href="${e(fn(S.contact[k]||''))}" target="_blank" rel="noopener">${ic} ${e(S.contact[k])}</a>`;

function body(s,i){
 if(s.type==='home')return `<div>${photo('photo','av')}</div>${ed('name','h1')}${ed('role','p','role')}${ed('bio','p','bio')}<div><button class="btn" data-next>Lihat Portofolio ↓</button></div>`;
 if(s.type==='text')return `<div class="txt">${photo(`slides.${i}.photo`,'side')}<div>${ed(`slides.${i}.title`,'h2')}${ed(`slides.${i}.text`,'p')}</div></div>`;
 if(s.type==='work')return `${ed(`slides.${i}.title`,'h2')}<div class="grid">${S.items.map((it,j)=>`<article class="card" style="--d:${.2+j*.1}s">${photo(`items.${j}.photo`,'cp')}<h3>${ed(`items.${j}.title`)}</h3><p>${ed(`items.${j}.desc`)}</p>${edit?`<button class="x" data-delitem="${j}">✕</button>`:''}</article>`).join('')}</div>`;
 return `${ed(`slides.${i}.title`,'h2')}<div class="pills">${link('email',v=>'mailto:'+v,'✉')}${link('wa',v=>'https://wa.me/'+v.replace(/\D/g,'').replace(/^0/,'62'),'💬')}${link('ig',v=>'https://instagram.com/'+v.replace('@',''),'📷')}</div>`}

const bgHTML=b=>b.k==='image'?`<img src="${e(b.src)}" alt=""><i class="ov"></i>`:b.k==='video'?`<video src="${e(b.src)}" autoplay muted loop playsinline></video><i class="ov"></i>`:'';
const PRE={aurora:'Aurora',grid:'Grid',gradient:'Gradient',particles:'Partikel',none:'Polos'};

function render(){
 stage.innerHTML=S.slides.map((s,i)=>`<section class="slide"><div class="sbg bg-${['image','video'].includes(s.bg.k)?'media':s.bg.k}">${bgHTML(s.bg)}</div><div class="in">${body(s,i)}</div>
 <div class="tools"><select data-preset="${i}"><option value="">Animasi background…</option>${Object.entries(PRE).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><button class="btn" data-bgup="${i}">🖼 Upload background (foto/GIF/video)</button>${s.type!=='home'?`<button class="btn" data-delslide="${i}">🗑 Hapus slide</button>`:''}</div></section>`).join('');
 $('#dots').innerHTML=S.slides.map((_,i)=>`<button class="dot" data-go="${i}" aria-label="Slide ${i+1}"></button>`).join('');
 go(cur)}

function go(n){cur=Math.max(0,Math.min(S.slides.length-1,n));
 $$('.slide').forEach((el,i)=>{el.classList.toggle('active',i===cur);el.classList.toggle('before',i<cur)});
 $$('.dot').forEach((d,i)=>d.classList.toggle('on',i===cur))}

// ---------- upload ----------
const pick=acc=>new Promise(r=>{picker.accept=acc;picker.value='';picker.onchange=()=>r(picker.files[0]);picker.click()});
async function read(f){
 if(f.size>15e6){alert('File terlalu besar (maks 15MB)');return null}
 if(f.type.startsWith('image/')&&f.type!=='image/gif'){const b=await createImageBitmap(f),k=Math.min(1,1600/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=b.width*k;c.height=b.height*k;c.getContext('2d').drawImage(b,0,0,c.width,c.height);return c.toDataURL('image/webp',.85)}
 return new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)})}

// ---------- event ----------
document.addEventListener('click',async ev=>{
 const t=ev.target.closest('button,.ph');if(!t)return;const d=t.dataset;
 if(d.go!=null)return go(+d.go);
 if(t.id==='prev')return go(cur-1);
 if(t.id==='nxt'||d.next!=null)return go(cur+1);
 if(t.id==='ed'){edit=!edit;document.body.classList.toggle('edit',edit);t.textContent=edit?'✔ Selesai':'✎ Edit';return render()}
 if(d.up&&edit){const f=await pick('image/*');const v=f&&await read(f);if(v){set(S,d.up,v);commit()}}
 if(d.bgup!=null){const f=await pick('image/*,video/*');const v=f&&await read(f);if(v){set(S,`slides.${d.bgup}.bg`,{k:f.type.startsWith('video')?'video':'image',src:v});commit()}}
 if(d.delitem!=null&&confirm('Hapus proyek ini?')){S.items.splice(+d.delitem,1);commit()}
 if(d.delslide!=null&&confirm('Hapus slide ini?')){S.slides.splice(+d.delslide,1);cur=Math.min(cur,S.slides.length-1);commit()}
 if(t.id==='addS'){S.slides.splice(S.slides.length-1,0,{type:'text',title:'Slide Baru',text:'Tulis sesuatu...',photo:'',bg:{k:'aurora'}});cur=S.slides.length-2;commit()}
 if(t.id==='addP'){S.items.push({title:'Proyek Baru',desc:'Deskripsi proyek.',photo:''});commit()}
 if(t.id==='exp'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));a.download='data.json';a.click()}
 if(t.id==='imp'){const f=await pick('.json');if(f){try{const j=JSON.parse(await f.text());if(!j.slides)throw 0;S=j;cur=0;commit()}catch{alert('File JSON tidak valid')}}}
 if(t.id==='rst'&&confirm('Hapus semua perubahan di browser ini?')){await DB.set('s',null);location.reload()}
});
document.addEventListener('change',ev=>{const p=ev.target.dataset.preset;if(p!=null&&ev.target.value){set(S,`slides.${p}.bg`,{k:ev.target.value});commit()}});
stage.addEventListener('input',ev=>{const f=ev.target.closest('[data-f]');if(f){set(S,f.dataset.f,f.innerText);save()}});
stage.addEventListener('paste',ev=>{if(ev.target.closest('[contenteditable]')){ev.preventDefault();document.execCommand('insertText',false,ev.clipboardData.getData('text/plain'))}});
document.addEventListener('keydown',ev=>{if(document.activeElement.isContentEditable)return;if(['ArrowRight','ArrowDown','PageDown'].includes(ev.key))go(cur+1);if(['ArrowLeft','ArrowUp','PageUp'].includes(ev.key))go(cur-1)});
let lock=0;addEventListener('wheel',ev=>{const g=ev.target.closest('.grid');if(g&&g.scrollHeight>g.clientHeight)return;if(Date.now()-lock<900||Math.abs(ev.deltaY)<20)return;lock=Date.now();go(cur+(ev.deltaY>0?1:-1))},{passive:true});
let sx=0;addEventListener('touchstart',ev=>sx=ev.touches[0].clientX,{passive:true});
addEventListener('touchend',ev=>{const dx=ev.changedTouches[0].clientX-sx;if(Math.abs(dx)>60&&!document.activeElement.isContentEditable)go(cur+(dx<0?1:-1))});
stage.addEventListener('mousemove',ev=>{const c=ev.target.closest('.card');if(!c)return;const r=c.getBoundingClientRect();c.style.transform=`perspective(700px) rotateY(${((ev.clientX-r.left)/r.width-.5)*14}deg) rotateX(${-((ev.clientY-r.top)/r.height-.5)*14}deg) translateY(-6px)`});
stage.addEventListener('mouseout',ev=>{const c=ev.target.closest('.card');if(c)c.style.transform=''});

// ---------- partikel ----------
const cv=$('#fx'),cx=cv.getContext('2d');let P=[];
function rs(){cv.width=innerWidth;cv.height=innerHeight;P=Array.from({length:Math.min(90,innerWidth/12|0)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:Math.random()-.5,vy:Math.random()-.5,r:Math.random()*2+1}))}
addEventListener('resize',rs);rs();
(function loop(){cx.clearRect(0,0,cv.width,cv.height);P.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>cv.width)p.vx*=-1;if(p.y<0||p.y>cv.height)p.vy*=-1;cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fillStyle='rgba(255,255,255,.8)';cx.fill();for(let j=i+1;j<P.length;j++){const q=P[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<120){cx.strokeStyle=`rgba(255,255,255,${.25*(1-d/120)})`;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(q.x,q.y);cx.stroke()}}});requestAnimationFrame(loop)})();

// ---------- mulai ----------
(async()=>{
 localStorage.removeItem('owner');
 if(location.hash==='#edit-HUSEIN112233'){localStorage.setItem('owner2','1');history.replaceState(null,'',location.pathname+location.search)}
 if(localStorage.getItem('owner2')==='1')document.body.classList.add('owner');
 S=await DB.get('s');
 if(!S){try{const r=await fetch('data.json');if(r.ok)S=await r.json()}catch{}}
 if(!S?.slides)S=def();
 render();
})();
