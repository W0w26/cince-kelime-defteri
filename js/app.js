const DATA = window.KELIME_VERISI;
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const TONES={1:"āēīōūǖĀĒĪŌŪ",2:"áéíóúǘÁÉÍÓÚ",3:"ǎěǐǒǔǚǍĚǏǑǓ",4:"àèìòùǜÀÈÌÒÙ"};
function toneOf(syl){for(const t of [1,2,3,4])for(const c of TONES[t])if(syl.includes(c))return t;return 5}
const SYL=/[bpmfdtnlgkhjqxzcsrwy]?h?[aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+(?:ng|n(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|r(?![aeiouāáǎàēéěèīíǐìōóǒòūúǔù]))?/gi;
function colorPin(p){
  return esc(p).replace(/Güneş|[A-Za-züÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ]+/g,w=>{
    if(["Mert","IK","Starbucks","Güneş","Gün","eş"].includes(w))return w;
    return w.replace(SYL,s=>`<span class="t${toneOf(s)}">${s}</span>`);
  });
}
const L=DATA.dersler;
// sesli okuma: önce Google çevrimiçi Çince ses, olmazsa tarayıcının kendi sesi
const TTS="speechSynthesis" in window;
let audio=null;
function sayBrowser(t){if(!TTS)return;const u=new SpeechSynthesisUtterance(t);u.lang="zh-CN";u.rate=.8;
  const v=speechSynthesis.getVoices().find(v=>/^zh(-|_)?(CN|Hans)?/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}
function say(text){
  const t=text.replace(/Mert|IK|Starbucks|Güneş/g,"").trim();if(!t)return;
  if(audio)audio.pause();if(TTS)speechSynthesis.cancel();
  const a=new Audio();audio=a;a.referrerPolicy="no-referrer";a.defaultPlaybackRate=a.playbackRate=.9;
  let fell=false;const fall=()=>{if(fell||audio!==a)return;fell=true;sayBrowser(t)};
  a.onerror=fall;
  a.src="https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q="+encodeURIComponent(t);
  a.play().catch(fall);
}
const sayBtn=t=>`<button class="say" type="button" data-say="${esc(t)}" aria-label="Sesli oku" title="Sesli oku">🔊</button>`;
document.addEventListener("click",e=>{const b=e.target.closest(".say");if(!b)return;e.stopPropagation();e.preventDefault();say(b.dataset.say)},true);
// arama
const plain=s=>String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ü/g,"u").replace(/[\s'’·.,!?？。，！…/-]/g,"");
const lowTr=s=>String(s).toLocaleLowerCase("tr");
let query="";
function hit(o){if(!query)return true;const q=lowTr(query),qp=plain(query);
  return [o.h,o.tr,o.not||"",o.ornek?o.ornek.h+" "+o.ornek.tr:""].some(x=>lowTr(x).includes(q))||(qp&&(plain(o.p).includes(qp)||(o.ornek&&plain(o.ornek.p).includes(qp))))}
function hl(s){const e=esc(s);if(!query)return e;const q=esc(query).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return e.replace(new RegExp(q,"gi"),m=>`<mark>${m}</mark>`)}
const words=[],sents=[];
L.forEach(l=>{l.kelimeler.forEach(w=>words.push({...w,ders:l.no}));l.cumleler.forEach(s=>sents.push({...s,ders:l.no}))});
let sel=store.get("zh-lessons",L.map(l=>l.no));
let known=new Set(store.get("zh-known",[]));
function inSel(x){return sel.includes(x.ders)}

// lesson filter
const lb=document.getElementById("lessons");
function drawLessons(){
  lb.innerHTML=`<button data-all="1" aria-pressed="${sel.length===L.length}">Hepsi</button>`+L.map(l=>`<button data-l="${l.no}" aria-pressed="${sel.includes(l.no)}" title="${esc(l.baslik)}">Ders ${l.no}</button>`).join("");
}
lb.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.all){sel=L.map(l=>l.no)}else{const n=+b.dataset.l;
    if(sel.length===L.length)sel=[n];else if(sel.includes(n)){sel=sel.filter(x=>x!==n);if(!sel.length)sel=L.map(l=>l.no)}else sel=[...sel,n].sort()}
  store.set("zh-lessons",sel);drawLessons();drawList();resetCards();newQ();});

// list
function drawList(){
  let n=0;
  const html=L.filter(l=>sel.includes(l.no)).map(l=>({...l,kelimeler:l.kelimeler.filter(hit),cumleler:l.cumleler.filter(hit)})).filter(l=>!query||l.kelimeler.length||l.cumleler.length).map(l=>{n+=l.kelimeler.length;return `
  <section class="lesson"><h2>Ders ${l.no}<span>${esc(l.baslik)}</span></h2>
  ${!query&&l.notlar&&l.notlar.length?`<div class="notes"><ul>${l.notlar.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div>`:""}
  <div class="tbl"><table><thead><tr><th>Hanzi</th><th>Pinyin</th><th>Türkçe</th><th>Örnek cümle</th></tr></thead><tbody>
  ${l.kelimeler.map(w=>`<tr><td class="h">${hl(w.h)}${sayBtn(w.h)}</td><td class="p">${colorPin(w.p)}${w.tahta?`<span class="fix" style="display:block">tahtada: <s>${esc(w.tahta)}</s></span>`:""}</td><td>${hl(w.tr)}${w.not?`<span class="note">${esc(w.not)}</span>`:""}</td><td class="ex">${w.ornek?`<span class="exh">${esc(w.ornek.h)}${sayBtn(w.ornek.h)}</span><span class="exp">${colorPin(w.ornek.p)}</span><span class="note">${esc(w.ornek.tr)}</span>`:"—"}</td></tr>`).join("")}
  </tbody></table></div>
  ${l.cumleler.length?`<p class="sub">Örnek cümleler</p>`:""}
  <div class="sents">${l.cumleler.map(s=>`<div class="sent"><span class="h">${hl(s.h)}${sayBtn(s.h)}</span><span class="p">${colorPin(s.p)}</span><span class="tr">${hl(s.tr)}</span>${s.not?`<span class="note">${esc(s.not)}</span>`:""}</div>`).join("")}</div>
  </section>`}).join("");
  document.getElementById("liste").innerHTML=html||`<p class="empty">“${esc(query)}” için sonuç yok.</p>`;
  const tot=words.filter(inSel).length;
  document.getElementById("qcount").textContent=query?`${n} kelime bulundu`:`${tot} kelime`;
}
document.getElementById("q").addEventListener("input",e=>{query=e.target.value.trim();drawList()});

// cards
let deck=[],ci=0;
const card=document.getElementById("card"),cf=document.getElementById("cf"),cb=document.getElementById("cb");
function resetCards(shuffle){
  deck=words.filter(inSel).filter(w=>!(document.getElementById("khide").checked&&known.has(w.h)));
  if(shuffle)deck=shuf(deck);ci=0;drawCard();
}
function faceHTML(w,part){
  if(part==="h")return `<div class="big">${esc(w.h)}</div><div>${sayBtn(w.h)}</div>`;
  if(part==="p")return `<div class="pin">${colorPin(w.p)}</div>`;
  return `<div class="mean">${esc(w.tr)}</div>`;
}
function drawCard(){
  card.classList.remove("flip");
  const m=document.getElementById("kmeta");
  if(!deck.length){cf.innerHTML=`<div class="mean">Bu derslerde gösterilecek kart kalmadı.</div><div class="small">“Bildiklerimi gizle” işaretini kaldırabilirsin.</div>`;cb.innerHTML="";m.textContent="";return}
  const w=deck[ci],f=document.getElementById("kdir").value;
  cf.innerHTML=faceHTML(w,f)+`<div class="small">Ders ${w.ders}</div>`;
  const rest=["h","p","tr"].filter(x=>x!==f);
  cb.innerHTML=rest.map(r=>faceHTML(w,r)).join("")+(w.ornek?`<div class="small" style="margin-top:6px">${esc(w.ornek.h)} · ${esc(w.ornek.tr)}</div>`:"")+(w.not?`<div class="small">${esc(w.not)}</div>`:"");
  m.textContent=`${ci+1} / ${deck.length}`+(known.has(w.h)?" · biliyorum ✓":"");
}
card.addEventListener("click",()=>card.classList.toggle("flip"));
document.getElementById("knext").onclick=()=>{if(deck.length){ci=(ci+1)%deck.length;drawCard()}};
document.getElementById("kprev").onclick=()=>{if(deck.length){ci=(ci-1+deck.length)%deck.length;drawCard()}};
document.getElementById("kshuf").onclick=()=>resetCards(true);
document.getElementById("kdir").onchange=drawCard;
document.getElementById("khide").onchange=()=>resetCards();
document.getElementById("kknow").onclick=()=>{if(!deck.length)return;const w=deck[ci];
  if(known.has(w.h))known.delete(w.h);else known.add(w.h);store.set("zh-known",[...known]);
  if(document.getElementById("khide").checked){resetCards()}else{ci=(ci+1)%deck.length;drawCard()}};
document.addEventListener("keydown",e=>{if(document.getElementById("kart").hidden||e.target.closest("select"))return;
  if(e.key===" "){e.preventDefault();card.classList.toggle("flip")}
  if(e.key==="ArrowRight")document.getElementById("knext").click();
  if(e.key==="ArrowLeft")document.getElementById("kprev").click();});

// quiz
function shuf(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
let score=store.get("zh-score",{r:0,t:0}),answered=false;
function pickDistinct(pool,correct,key,n){const seen=new Set([correct[key]]);const out=[];for(const x of shuf(pool)){if(!seen.has(x[key])){seen.add(x[key]);out.push(x)}if(out.length>=n)break}return out}
function fakeTones(p){ // same syllables, different tones
  const vow={a:"āáǎàa",e:"ēéěèe",i:"īíǐìi",o:"ōóǒòo",u:"ūúǔùu",ü:"ǖǘǚǜü"};
  const base=c=>{for(const k in vow)if(vow[k].includes(c))return k;return null};
  const out=new Set();let guard=0;
  while(out.size<3&&guard++<60){
    const r=p.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g,c=>{const b=base(c);return vow[b][Math.floor(Math.random()*4)]});
    if(r!==p)out.add(r);
  }
  return [...out];
}
function newQ(){
  answered=false;document.getElementById("qfb").textContent="";
  let mode=document.getElementById("qmode").value;
  if(mode==="mix")mode=["h-tr","tr-h","h-p","s-tr"][Math.floor(Math.random()*4)];
  const qp=document.getElementById("qp"),qc=document.getElementById("qc"),qk=document.getElementById("qkind");
  const pool=mode==="s-tr"?sents.filter(inSel):words.filter(inSel);
  const all=mode==="s-tr"?sents:words;
  const c=pool[Math.floor(Math.random()*pool.length)];
  let opts,key,show,cls="";
  if(mode==="h-tr"){qk.textContent="Bu kelimenin anlamı ne?";qp.className="qprompt han";qp.innerHTML=esc(c.h);key="tr";opts=[c,...pickDistinct(all,c,"tr",3)];show=o=>esc(o.tr)}
  if(mode==="tr-h"){qk.textContent="Hangisi bu anlama gelir?";qp.className="qprompt";qp.innerHTML=esc(c.tr);key="h";cls="han";opts=[c,...pickDistinct(all,c,"h",3)];show=o=>esc(o.h)}
  if(mode==="s-tr"){qk.textContent="Bu cümle ne demek?";qp.className="qprompt han";qp.style.fontSize="clamp(26px,7vw,36px)";qp.innerHTML=esc(c.h)+`<div style="font-family:var(--body);font-size:15px;margin-top:6px">${colorPin(c.p)}</div>`;key="tr";opts=[c,...pickDistinct(all,c,"tr",3)];show=o=>esc(o.tr)}
  else qp.style.fontSize="";
  if(mode==="h-p"){qk.textContent="Doğru pinyin ve ton hangisi?";qp.className="qprompt han";qp.innerHTML=esc(c.h);key="p";
    let f=fakeTones(c.p).map(p=>({p}));if(f.length<3)f=f.concat(pickDistinct(all,c,"p",3-f.length));opts=[c,...f];show=o=>esc(o.p)}
  opts=shuf(opts);
  qc.innerHTML=opts.map((o,i)=>`<button class="choice ${cls}" data-i="${i}">${show(o)}</button>`).join("");
  qc.onclick=e=>{const b=e.target.closest(".choice");if(!b||answered)return;answered=true;
    const o=opts[+b.dataset.i],ok=o[key]===c[key];score.t++;if(ok)score.r++;store.set("zh-score",score);
    [...qc.children].forEach((btn,i)=>{if(opts[i][key]===c[key])btn.classList.add("right")});
    if(!ok)b.classList.add("wrong");
    document.getElementById("qfb").innerHTML=(ok?"Doğru! ":"Yanlış. ")+`${esc(c.h)} · ${colorPin(c.p)} · ${esc(c.tr)}`;
    drawScore()};
  drawScore();
}
function drawScore(){document.getElementById("qs").textContent=`Skor: ${score.r} / ${score.t}`}
document.getElementById("qn").onclick=newQ;
document.getElementById("qmode").onchange=newQ;
document.getElementById("qr").onclick=()=>{score={r:0,t:0};store.set("zh-score",score);drawScore()};

// tabs
document.querySelector(".tabs").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  document.querySelectorAll(".tabs button").forEach(x=>x.setAttribute("aria-selected",x===b));
  ["liste","kart","sina"].forEach(id=>document.getElementById(id==="liste"?"liste-wrap":id).hidden=id!==b.dataset.tab);
  store.set("zh-tab",b.dataset.tab)});
drawLessons();drawList();resetCards();newQ();
const t=store.get("zh-tab","liste");const tb=document.querySelector(`.tabs [data-tab="${t}"]`);if(tb)tb.click();

// tema
(function(){const b=document.getElementById("theme"),names={auto:"otomatik",light:"açık",dark:"koyu"};
  let t=store.get("zh-theme","auto");
  function apply(){if(t==="auto")delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t;b.textContent="Tema: "+names[t]}
  b.onclick=()=>{t={auto:"light",light:"dark",dark:"auto"}[t];store.set("zh-theme",t);apply()};apply();})();
if(TTS)speechSynthesis.getVoices();
