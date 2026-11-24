const $ = id => document.getElementById(id);
const KEY = "lumi-events-v1";
let events = JSON.parse(localStorage.getItem(KEY) || "[]");
let supabase = null;
if (window.LUMI_CONFIG?.supabaseUrl?.includes("YOUR_PROJECT") === false &&
    window.LUMI_CONFIG?.supabaseAnonKey?.includes("YOUR_") === false) {
  import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm").then(({createClient}) => {
    supabase = createClient(window.LUMI_CONFIG.supabaseUrl, window.LUMI_CONFIG.supabaseAnonKey);
  }).catch(() => message("Não foi possível carregar o serviço de conta."));
}
function message(text){ $("message").textContent = text; }
function save(){ localStorage.setItem(KEY, JSON.stringify(events)); render(); }
function add(type){ events.push({id:crypto.randomUUID(),type,occurredAt:new Date().toISOString(),updatedAt:new Date().toISOString(),note:""}); save(); }
$("wearBtn").onclick=()=>add("wear_started");
$("breakBtn").onclick=()=>add("break_started");
$("saveNote").onclick=()=>{const last=events.at(-1);if(last){last.note=$("note").value;last.updatedAt=new Date().toISOString();save();}else message("Faça um registro antes de adicionar uma observação.");};
function summary(){
  const start=new Date();start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);
  let wear=0,off=0,pauses=0;const sorted=[...events].sort((a,b)=>new Date(a.occurredAt)-new Date(b.occurredAt));
  sorted.forEach((e,i)=>{const a=new Date(e.occurredAt),b=i+1<sorted.length?new Date(sorted[i+1].occurredAt):new Date();
    const s=Math.max(a,start),t=Math.min(b,end);if(t<=s)return;
    if(e.type==="wear_started")wear+=t-s;else{off+=t-s;if(a>=start&&a<end)pauses++;}
  });return {wear,off,pauses};
}
function fmt(ms){let m=Math.max(0,Math.floor(ms/60000));return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;}
function render(){const s=summary();$("wear").textContent=fmt(s.wear);$("off").textContent=fmt(s.off);$("pauses").textContent=s.pauses;
 $("history").innerHTML=events.slice().reverse().map(e=>`<li>${e.type==="wear_started"?"Colocou colete":"Retirou colete"} — ${new Date(e.occurredAt).toLocaleString("pt-BR")}</li>`).join("");}
$("signup").onclick=async()=>{if(!supabase)return message("Configure o Supabase primeiro.");const {error}=await supabase.auth.signUp({email:$("email").value,password:$("password").value});message(error?.message||"Confira seu e-mail para confirmar a conta.");};
$("signin").onclick=async()=>{if(!supabase)return message("Configure o Supabase primeiro.");const {error}=await supabase.auth.signInWithPassword({email:$("email").value,password:$("password").value});message(error?.message||"Login realizado.");};
$("signout").onclick=async()=>{if(!supabase)return;const {error}=await supabase.auth.signOut();message(error?.message||"Você saiu da conta.");};
render();
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
