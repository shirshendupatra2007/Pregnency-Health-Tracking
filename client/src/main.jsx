import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Activity, Apple, ArrowRight, Bell, CalendarDays, Check, ChevronRight, CircleHelp,
  Clock3, Droplets, FileText, Footprints, HeartPulse, Home, Info, Leaf, LogIn,
  MessageCircle, Moon, Pencil, Pill, Plus, Scale, Send, Settings2, ShieldCheck,
  Sparkles, Stethoscope, Trash2, UserRound, Utensils, Watch, Waves, X, AlertTriangle
} from "lucide-react";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function token() { return localStorage.getItem("materna_token"); }
async function api(path, options={}) {
  const headers = { "Content-Type": "application/json", ...(options.headers||{}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function saveSession(data) {
  localStorage.setItem("materna_token", data.token);
  localStorage.setItem("materna_user", JSON.stringify(data.user));
}
function userSession() { try { return JSON.parse(localStorage.getItem("materna_user")||"null"); } catch { return null; } }

function App() {
  return <Routes>
    <Route path="/" element={<Navigate to={token()?"/home":"/login"} replace/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/home" element={<Protected><HomePage/></Protected>}/>
    <Route path="/dashboard/*" element={<Protected><Dashboard/></Protected>}/>
  </Routes>
}
function Protected({children}) { return token()?children:<Navigate to="/login" replace/>; }

function Logo({light=false}) {
  return <Link to="/home" className={"logo "+(light?"logo-light":"")}>
    <span className="logo-icon"><HeartPulse size={20}/></span>
    <span><b>Materna</b><strong>AI</strong><small>pregnancy care companion</small></span>
  </Link>
}

function Login() {
  const nav = useNavigate();
  const [mode,setMode]=useState("login");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const submit=async(e)=>{
    e.preventDefault(); setBusy(true); setError("");
    try{
      const data=mode==="login"
        ? await api("/auth/login",{method:"POST",body:JSON.stringify({email,password})})
        : await api("/auth/register",{method:"POST",body:JSON.stringify({name,email,password})});
      saveSession(data); nav("/home");
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const social=async(provider)=>{
    setBusy(true); setError("");
    try{ const data=await api("/auth/social-demo",{method:"POST",body:JSON.stringify({provider})}); saveSession(data); nav("/home"); }
    catch(err){setError(err.message)}finally{setBusy(false)}
  };
  return <div className="auth-page">
    <div className="aurora a1"></div><div className="aurora a2"></div>
    <div className="auth-card glass">
      <div className="auth-left">
        <Logo/>
        <div className="eyebrow"><Sparkles size={14}/> AI-assisted pregnancy health</div>
        <h1>One gentle place for the whole pregnancy journey.</h1>
        <p className="muted big">Connect nutrition, prescribed medicines, approved movement and maternal-health trends in one personalized timeline.</p>
        <div className="benefits">
          <div><span><ShieldCheck size={17}/></span><div><b>Privacy-first</b><small>Your health data stays in your account.</small></div></div>
          <div><span><HeartPulse size={17}/></span><div><b>Connected insights</b><small>Track changes across your pregnancy journey.</small></div></div>
          <div><span><MessageCircle size={17}/></span><div><b>Two ways to share</b><small>Use guided inputs or talk naturally with AI.</small></div></div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-switch"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Log in</button><button className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>Create account</button></div>
        <h2>{mode==="login"?"Welcome back":"Create your account"}</h2>
        <p className="muted">{mode==="login"?"Continue your pregnancy health journey.":"Start a secure personal pregnancy dashboard."}</p>
        {error && <div className="alert danger"><AlertTriangle size={16}/>{error}</div>}
        <form onSubmit={submit}>
          {mode==="signup" && <Field label="Name" value={name} onChange={setName} placeholder="Your name" icon={<UserRound size={17}/>}/>}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<FileText size={17}/>}/>
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" icon={<ShieldCheck size={17}/>}/>
          <button className="primary-btn full" disabled={busy}>{busy?"Please wait…":mode==="login"?"Log in":"Create account"} <ArrowRight size={18}/></button>
        </form>
        <div className="or"><span>or continue with</span></div>
        <div className="socials">
          <button className="social-btn" onClick={()=>social("google")} disabled={busy}><span className="google-g">G</span> Google</button>
          <button className="social-btn" onClick={()=>social("apple")} disabled={busy}><Apple size={18}/> Apple</button>
        </div>
        <p className="micro-note"><Info size={14}/> Google & Apple buttons are wired as demo sign-in in this prototype. Real OAuth credentials can be added later.</p>
      </div>
    </div>
  </div>
}

function Field({label,value,onChange,placeholder,type="text",icon,children}) {
  return <label className="field"><span>{label}</span><div className="input-wrap">{icon}{children||<input type={type} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}</div></label>
}

function Header({name}) {
  const nav=useNavigate();
  const logout=()=>{localStorage.clear();nav("/login")};
  return <header className="topbar"><Logo/><div className="topbar-actions"><span className="secure"><ShieldCheck size={15}/> Private dashboard</span><button className="icon-btn" title="Notifications"><Bell size={18}/></button><div className="avatar">{(name||"A")[0]}</div><button className="text-btn" onClick={logout}>Log out</button></div></header>
}

function HomePage(){
  const nav=useNavigate(); const u=userSession();
  const [profile,setProfile]=useState(null);
  const [mode,setMode]=useState(null);
  useEffect(()=>{api("/profile").then(setProfile).catch(()=>{})},[]);
  const [form,setForm]=useState({weight:"",pregnancy_week:"",diet:"Eggetarian",allergies:"",blood_pressure:"",vitamin_d3:"",iron:"",height:""});
  const [chat,setChat]=useState([{role:"ai",text:"Hi! Tell me whatever you’re comfortable sharing. I’ll help organize it into your pregnancy health profile."}]);
  const [chatText,setChatText]=useState("");
  useEffect(()=>{if(profile){setForm({weight:profile.weight??"",pregnancy_week:profile.pregnancy_week??"",diet:profile.diet||"Eggetarian",allergies:profile.allergies||"",blood_pressure:profile.blood_pressure||"",vitamin_d3:profile.vitamin_d3??"",iron:profile.iron??"",height:profile.height??""})}},[profile]);
  const saveProfile=async()=>{try{await api("/profile",{method:"PUT",body:JSON.stringify(form)});nav("/dashboard/nutrition")}catch(e){alert(e.message)}};
  const sendChat=()=>{
    const text=chatText.trim(); if(!text)return;
    setChat(c=>[...c,{role:"user",text}]);
    setChatText("");
    const normalized=text.toLowerCase();
    let reply="Got it. I’ve captured that. You can continue with weight, pregnancy week, diet, allergies, blood pressure, vitamin D3, iron and height.";
    if(normalized.includes("week")) reply="Thanks. I’ll keep pregnancy week with your profile. You can add any other health details when you’re ready.";
    if(normalized.includes("allerg")) reply="Noted. Food allergies are important for nutrition planning. Please add the exact allergy in your profile too.";
    window.setTimeout(()=>setChat(c=>[...c,{role:"ai",text:reply}]),350);
  };
  return <div className="app-bg"><Header name={u?.name}/><main className="home-main">
    <section className="welcome-row">
      <div><div className="eyebrow"><Sparkles size={14}/> personalized intake</div><h1>Hello {u?.name||"there"}, how can I help you?</h1><p className="muted big">Choose whichever feels easier today. You can switch methods anytime.</p></div>
      <div className="preg-chip"><span>Current focus</span><b>{form.pregnancy_week?`Week ${form.pregnancy_week}`:"Pregnancy profile"}</b></div>
    </section>

    <section className="intake-grid">
      <button className={"choice-card glass "+(mode==="precise"?"selected":"")} onClick={()=>setMode("precise")}>
        <div className="choice-icon cyan"><Settings2/></div><div><span className="tag">OPTION 01</span><h3>Precise input</h3><p>Answer guided questions with clear fields and parameters.</p></div><ChevronRight/>
      </button>
      <button className={"choice-card glass "+(mode==="chat"?"selected":"")} onClick={()=>setMode("chat")}>
        <div className="choice-icon lavender"><MessageCircle/></div><div><span className="tag">OPTION 02</span><h3>Talk with AI</h3><p>Have a natural conversation, like explaining things to a doctor.</p></div><ChevronRight/>
      </button>
    </section>

    {mode==="precise" && <section className="panel glass intake-panel">
      <div className="panel-heading"><div><span className="tag">GUIDED PROFILE</span><h2>Your pregnancy inputs</h2><p className="muted">These fields are used to organize your health information and create a personalized dashboard.</p></div><div className="ai-orb"><Sparkles/></div></div>
      <div className="form-grid">
        <Field label="Weight (kg)" value={form.weight} onChange={v=>setForm({...form,weight:v})} placeholder="64"/>
        <Field label="Pregnancy week" value={form.pregnancy_week} onChange={v=>setForm({...form,pregnancy_week:v})} placeholder="24"/>
        <Field label="Height (cm)" value={form.height} onChange={v=>setForm({...form,height:v})} placeholder="164"/>
        <label className="field"><span>Diet preference</span><div className="input-wrap"><Utensils size={17}/><select value={form.diet} onChange={e=>setForm({...form,diet:e.target.value})}><option>Vegetarian</option><option>Non-vegetarian</option><option>Eggetarian</option></select></div></label>
        <Field label="Food allergy" value={form.allergies} onChange={v=>setForm({...form,allergies:v})} placeholder="None / list allergy"/>
        <Field label="Blood pressure" value={form.blood_pressure} onChange={v=>setForm({...form,blood_pressure:v})} placeholder="118/76"/>
        <Field label="Vitamin D3 level" value={form.vitamin_d3} onChange={v=>setForm({...form,vitamin_d3:v})} placeholder="31 ng/mL"/>
        <Field label="Iron / Hb" value={form.iron} onChange={v=>setForm({...form,iron:v})} placeholder="12.4"/>
      </div>
      <div className="consent"><ShieldCheck size={17}/><span>Use measurements as entered by you. Materna AI is a tracking and organization tool, not a substitute for medical care.</span></div>
      <div className="actions"><button className="ghost-btn" onClick={()=>setMode(null)}>Back</button><button className="primary-btn" onClick={saveProfile}>Analyze & open dashboard <Sparkles size={17}/></button></div>
    </section>}

    {mode==="chat" && <section className="panel glass chat-panel">
      <div className="panel-heading"><div><span className="tag">CONVERSATIONAL INTAKE</span><h2>Tell Materna AI what’s going on</h2><p className="muted">Use everyday language. You can share the same parameters as the guided form.</p></div><div className="ai-orb lavender"><MessageCircle/></div></div>
      <div className="chat-box">{chat.map((m,i)=><div key={i} className={"chat-bubble "+m.role}><span>{m.role==="ai"?"AI":"You"}</span><p>{m.text}</p></div>)}</div>
      <div className="chat-suggestions"><button onClick={()=>setChatText("I am 24 weeks pregnant, 64 kg and 164 cm tall.")}>Pregnancy details</button><button onClick={()=>setChatText("I am eggetarian and I have no food allergies.")}>Diet & allergies</button><button onClick={()=>setChatText("My blood pressure is 118/76 and vitamin D3 is 31.")}>Health levels</button></div>
      <div className="chat-input"><input value={chatText} onChange={e=>setChatText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Tell me about your pregnancy health…"/><button className="primary-btn round" onClick={sendChat}><Send size={18}/></button></div>
      <div className="actions"><button className="ghost-btn" onClick={()=>setMode(null)}>Back</button><button className="primary-btn" onClick={saveProfile}>Save profile & open dashboard <ArrowRight size={17}/></button></div>
    </section>}

    {!mode && <section className="safe-band"><div className="safe-icon"><ShieldCheck/></div><div><b>Designed around your healthcare team</b><p>Medication schedules and exercise guidance are entered according to the care plan you receive from your clinician.</p></div></section>}
  </main></div>
}

function Dashboard(){
  const u=userSession();
  const location=useLocation();
  const nav=useNavigate();
  const [profile,setProfile]=useState({});
  const [meds,setMeds]=useState([]);
  const [activity,setActivity]=useState([]);
  const [nutrition,setNutrition]=useState({});
  const [trends,setTrends]=useState({measurements:[]});
  const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{
    const [p,m,a,n,t]=await Promise.all([api("/profile"),api("/medications"),api("/activity"),api("/nutrition"),api("/trends")]);
    setProfile(p);setMeds(m);setActivity(a);setNutrition(n);setTrends(t);
  }catch(e){console.error(e)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const section=location.pathname.split("/")[2]||"nutrition";
  const setSection=s=>nav(`/dashboard/${s}`);
  return <div className="app-bg">
    <Header name={u?.name}/>
    <div className="dashboard-layout">
      <aside className="sidebar glass">
        <div className="side-title"><span className="side-ai"><Sparkles size={15}/></span><div><b>CARE HUB</b><small>Week {profile.pregnancy_week||"—"}</small></div></div>
        {[
          ["nutrition","Nutrition",Utensils],["medication","Medication Adherence",Pill],["activity","Physical Activity Tracker",Activity],["trends","Maternal Health Trends",HeartPulse]
        ].map(([key,label,Icon])=><button key={key} className={section===key?"side-link active":"side-link"} onClick={()=>setSection(key)}><Icon size={18}/><span>{label}</span><ChevronRight size={15}/></button>)}
        <div className="side-footer"><ShieldCheck size={17}/><span>Health information is private and should be reviewed with your healthcare professional.</span></div>
      </aside>
      <main className="dashboard-main">
        {loading?<div className="loading glass"><Sparkles size={20}/> Loading your health hub…</div>:<>
          {section==="nutrition"&&<NutritionTab nutrition={nutrition} setNutrition={setNutrition} reload={load} profile={profile}/>}
          {section==="medication"&&<MedicationTab meds={meds} setMeds={setMeds} reload={load}/>}
          {section==="activity"&&<ActivityTab activity={activity} setActivity={setActivity} reload={load}/>}
          {section==="trends"&&<TrendsTab profile={profile} trends={trends} meds={meds} activity={activity}/>}
        </>}
      </main>
    </div>
  </div>
}

function SectionHeader({eyebrow,title,description,icon}){
  return <div className="section-head"><div><div className="eyebrow">{icon}{eyebrow}</div><h1>{title}</h1><p className="muted big">{description}</p></div><div className="date-pill"><CalendarDays size={16}/> Today</div></div>
}

function NutritionTab({nutrition,setNutrition,reload,profile}){
  const [form,setForm]=useState({breakfast:nutrition.breakfast||"",lunch:nutrition.lunch||"",snack:nutrition.snack||"",dinner:nutrition.dinner||"",water_cups:nutrition.water_cups||0});
  useEffect(()=>setForm({breakfast:nutrition.breakfast||"",lunch:nutrition.lunch||"",snack:nutrition.snack||"",dinner:nutrition.dinner||"",water_cups:nutrition.water_cups||0}),[nutrition]);
  const save=async()=>{await api("/nutrition",{method:"PUT",body:JSON.stringify(form)});reload()};
  const nutrientScore=Math.min(100,56 + [form.breakfast,form.lunch,form.snack,form.dinner].filter(Boolean).length*8 + Math.min(12,Number(form.water_cups)*2));
  return <><SectionHeader eyebrow="NUTRITION" title="Your nutrition, in one place." description={`A simple daily food log tailored around your ${profile.diet||"chosen"} diet preference.`} icon={<Utensils size={14}/>}/>
    <div className="stats-grid">
      <StatCard icon={<Utensils/>} label="Nutrition completeness" value={`${nutrientScore}%`} note="Based on today’s logged items"/>
      <StatCard icon={<Droplets/>} label="Water logged" value={`${form.water_cups}/8 cups`} note="Personal daily log"/>
      <StatCard icon={<Leaf/>} label="Diet preference" value={profile.diet||"Not set"} note="From your profile"/>
    </div>
    <div className="content-grid two">
      <section className="panel glass">
        <div className="panel-heading"><div><span className="tag">DAILY LOG</span><h2>Meals & hydration</h2></div><div className="mini-icon"><Utensils/></div></div>
        <div className="meal-grid">
          {["breakfast","lunch","snack","dinner"].map(k=><Field key={k} label={k[0].toUpperCase()+k.slice(1)} value={form[k]} onChange={v=>setForm({...form,[k]:v})} placeholder="Add what you ate…"/>)}
          <Field label="Water cups" type="number" value={form.water_cups} onChange={v=>setForm({...form,water_cups:v})} placeholder="0"/>
        </div>
        <div className="actions"><button className="primary-btn" onClick={save}>Save nutrition log <Check size={16}/></button></div>
      </section>
      <section className="panel glass insight-panel">
        <div className="panel-heading"><div><span className="tag">AI ORGANIZER</span><h2>Nutrition snapshot</h2></div><Sparkles/></div>
        <div className="insight-card"><b>{form.breakfast||form.lunch||form.dinner?"You’ve started logging today.":"Ready to build today’s log."}</b><p>Materna AI can organize your meals and flag missing information for your own review with a clinician or dietitian.</p></div>
        <div className="list-row"><Check/><span>Diet: {profile.diet||"not provided"}</span></div>
        <div className="list-row"><Check/><span>Food allergy: {profile.allergies||"none recorded"}</span></div>
        <div className="list-row"><Check/><span>Pregnancy week: {profile.pregnancy_week||"not provided"}</span></div>
        <div className="micro-note"><Info size={14}/> The AI does not prescribe diets or supplements.</div>
      </section>
    </div>
  </>
}

function MedicationTab({meds,setMeds,reload}){
  const [form,setForm]=useState({name:"",dosage:"",time:"09:00"});
  const missed=meds.filter(m=>m.status==="missed");
  const taken=meds.filter(m=>m.status==="taken").length;
  const adherence=meds.length?Math.round((taken/meds.length)*100):0;
  const setStatus=async(id,status)=>{await api(`/medications/${id}`,{method:"PUT",body:JSON.stringify({status})});reload();};
  const add=async()=>{if(!form.name||!form.dosage)return;await api("/medications",{method:"POST",body:JSON.stringify(form)});setForm({name:"",dosage:"",time:"09:00"});reload()};
  const remove=async(id)=>{await api(`/medications/${id}`,{method:"DELETE"});reload()};
  const enable=async()=>{if("Notification" in window){const p=await Notification.requestPermission(); if(p==="granted") new Notification("Materna AI",{body:"Medication reminders are enabled for this browser."});}};
  return <><SectionHeader eyebrow="MEDICATION ADHERENCE" title="Never lose the thread of your prescription schedule." description="Log the medication plan provided by your healthcare professional, track taken or missed doses, and keep an adherence history." icon={<Pill size={14}/>}/>
    {missed.length>0 && <div className="alert warning"><Bell size={17}/><div><b>Missed dose detected</b><span>{missed[0].name} is marked missed. Please follow your prescribed plan and contact your care team when needed.</span></div><button className="text-btn" onClick={enable}>Enable browser alerts</button></div>}
    <div className="stats-grid">
      <StatCard icon={<Check/>} label="Adherence" value={`${adherence}%`} note={`${taken}/${meds.length} current items marked taken`}/>
      <StatCard icon={<Clock3/>} label="Next scheduled" value={meds[0]?.time||"—"} note={meds[0]?.name||"Add a prescription"}/>
      <StatCard icon={<Bell/>} label="Missed doses" value={String(missed.length)} note="Needs attention"/>
    </div>
    <div className="content-grid two">
      <section className="panel glass">
        <div className="panel-heading"><div><span className="tag">TODAY</span><h2>Prescription schedule</h2></div><div className="mini-icon"><Pill/></div></div>
        <div className="med-list">{meds.map(m=><div className="med-row" key={m.id}>
          <div className="med-main"><div className="med-icon"><Pill size={18}/></div><div><b>{m.name}</b><small>{m.dosage} · {m.time}</small></div></div>
          <div className="med-actions">
            <button className={m.status==="taken"?"status taken":"status"} onClick={()=>setStatus(m.id,"taken")}><Check size={15}/> Taken</button>
            <button className={m.status==="missed"?"status missed":"status"} onClick={()=>setStatus(m.id,"missed")}><X size={15}/> Missed</button>
            <button className="icon-btn subtle" onClick={()=>remove(m.id)} title="Delete"><Trash2 size={15}/></button>
          </div>
        </div>)}</div>
      </section>
      <section className="panel glass">
        <div className="panel-heading"><div><span className="tag">PRESCRIPTION</span><h2>Add a scheduled medicine</h2></div><Plus/></div>
        <div className="form-stack"><Field label="Medicine name" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Iron supplement"/><Field label="Dosage" value={form.dosage} onChange={v=>setForm({...form,dosage:v})} placeholder="e.g. 1 tablet"/><Field label="Time" type="time" value={form.time} onChange={v=>setForm({...form,time:v})}/></div>
        <div className="consent"><ShieldCheck size={17}/><span>Enter the dosage and timing exactly as prescribed by your healthcare professional.</span></div>
        <div className="actions"><button className="primary-btn" onClick={add}>Add to schedule <Plus size={16}/></button></div>
        <div className="micro-note"><Bell size={14}/> Browser notifications can be enabled for missed-dose alerts.</div>
      </section>
    </div>
  </>
}

function ActivityTab({activity,reload}){
  const [form,setForm]=useState({activity_type:"Walking",minutes:20,steps:2500,day_label:"Today"});
  const totalMinutes=activity.reduce((s,a)=>s+Number(a.minutes||0),0);
  const totalSteps=activity.reduce((s,a)=>s+Number(a.steps||0),0);
  const activeDays=activity.filter(a=>Number(a.minutes)>0).length;
  const add=async()=>{await api("/activity",{method:"POST",body:JSON.stringify(form)});reload()};
  return <><SectionHeader eyebrow="PHYSICAL ACTIVITY" title="Movement that follows your care plan." description="Track doctor-approved activities, duration, steps, rest days and weekly patterns." icon={<Activity size={14}/>}/>
    <div className="stats-grid">
      <StatCard icon={<Activity/>} label="Active days" value={`${activeDays}/7`} note="Based on logged activity"/>
      <StatCard icon={<Clock3/>} label="Activity time" value={`${totalMinutes} min`} note="This week's logged total"/>
      <StatCard icon={<Footprints/>} label="Steps" value={totalSteps.toLocaleString()} note="From your activity logs"/>
    </div>
    <div className="content-grid two">
      <section className="panel glass">
        <div className="panel-heading"><div><span className="tag">WEEKLY PATTERN</span><h2>Activity log</h2></div><Watch/></div>
        <div className="activity-bars">{activity.slice(-7).map((a,i)=><div className="bar-col" key={i}><div className="bar-track"><div className="bar-fill" style={{height:`${Math.min(100,Math.max(6,Number(a.minutes)*3))}%`}}></div></div><b>{a.minutes}</b><small>{a.day_label}</small></div>)}</div>
        <div className="legend"><span><i className="dot"></i>Activity minutes</span><span><i className="dot pale"></i>Rest day = no logged activity</span></div>
      </section>
      <section className="panel glass">
        <div className="panel-heading"><div><span className="tag">LOG ACTIVITY</span><h2>Add today's movement</h2></div><Footprints/></div>
        <div className="form-stack">
          <label className="field"><span>Activity</span><div className="input-wrap"><Activity size={17}/><select value={form.activity_type} onChange={e=>setForm({...form,activity_type:e.target.value})}><option>Walking</option><option>Doctor-approved exercise</option><option>Prenatal mobility</option><option>Rest</option></select></div></label>
          <Field label="Duration (minutes)" type="number" value={form.minutes} onChange={v=>setForm({...form,minutes:v})} placeholder="20"/>
          <Field label="Steps" type="number" value={form.steps} onChange={v=>setForm({...form,steps:v})} placeholder="2500"/>
          <Field label="Day label" value={form.day_label} onChange={v=>setForm({...form,day_label:v})} placeholder="Today"/>
        </div>
        <div className="consent"><Stethoscope size={17}/><span>Only record exercises that are appropriate for you and have been approved by your healthcare professional.</span></div>
        <div className="actions"><button className="primary-btn" onClick={add}>Save activity <Check size={16}/></button></div>
      </section>
    </div>
  </>
}

function TrendsTab({profile,trends,meds,activity}){
  const measurements=trends.measurements||[];
  const bp=measurements.filter(x=>x.measurement_type==="bp").slice(0,5).reverse();
  const weight=measurements.filter(x=>x.measurement_type==="weight").slice(0,5).reverse();
  return <><SectionHeader eyebrow="MATERNAL HEALTH TRENDS" title="See the changes, not just today's number." description="A single place to review the measurements you’ve entered over time and discuss meaningful changes with your care team." icon={<HeartPulse size={14}/>}/>
    <div className="stats-grid">
      <StatCard icon={<Scale/>} label="Current weight" value={profile.weight?`${profile.weight} kg`:"—"} note="Latest profile value"/>
      <StatCard icon={<HeartPulse/>} label="Blood pressure" value={profile.blood_pressure||"—"} note="Latest profile value"/>
      <StatCard icon={<CalendarDays/>} label="Pregnancy week" value={profile.pregnancy_week?`Week ${profile.pregnancy_week}`:"—"} note="From your profile"/>
    </div>
    <div className="content-grid two">
      <TrendCard title="Blood pressure trend" subtitle="Logged BP values" values={bp.map(x=>x.value)} labels={bp.map(x=>x.week?`W${x.week}`:"—")} empty="Enter blood pressure in your profile to build the trend."/>
      <TrendCard title="Weight trend" subtitle="Logged weight values" values={weight.map(x=>x.value)} labels={weight.map(x=>x.week?`W${x.week}`:"—")} empty="Enter weight in your profile to build the trend." numeric/>
    </div>
    <section className="panel glass">
      <div className="panel-heading"><div><span className="tag">AI SUMMARY</span><h2>What the timeline contains</h2></div><Sparkles/></div>
      <div className="timeline">
        <div><span className="timeline-dot"/><div><b>Profile</b><p>Week {profile.pregnancy_week||"—"} · {profile.diet||"diet not provided"} · allergy: {profile.allergies||"none recorded"}</p></div></div>
        <div><span className="timeline-dot"/><div><b>Medication</b><p>{meds.filter(x=>x.status==="taken").length} marked taken · {meds.filter(x=>x.status==="missed").length} marked missed in the current list.</p></div></div>
        <div><span className="timeline-dot"/><div><b>Activity</b><p>{activity.filter(x=>Number(x.minutes)>0).length} active days logged in the current activity history.</p></div></div>
      </div>
      <div className="micro-note"><Info size={14}/> Trend summaries are descriptive. They are not medical diagnoses or treatment recommendations.</div>
    </section>
  </>
}

function TrendCard({title,subtitle,values,labels,empty,numeric=false}){
  const nums=values.map(v=>numeric?Number(v):parseFloat(String(v).split("/")[0])).filter(v=>Number.isFinite(v));
  return <section className="panel glass trend-card"><div className="panel-heading"><div><span className="tag">TREND</span><h2>{title}</h2><p className="muted">{subtitle}</p></div><HeartPulse/></div>
    {values.length?<div className="line-chart"><div className="chart-y"><span>High</span><span>Mid</span><span>Low</span></div><div className="chart-area"><div className="gridline g1"/><div className="gridline g2"/><div className="gridline g3"/><svg viewBox="0 0 500 180" preserveAspectRatio="none"><polyline fill="none" stroke="currentColor" strokeWidth="3" points={nums.map((v,i)=>`${(i/(Math.max(1,nums.length-1)))*480+10},${170-((v-Math.min(...nums))/(Math.max(1,Math.max(...nums)-Math.min(...nums))))*130}`).join(" ")}/></svg>{nums.map((v,i)=><span className="chart-point" key={i} style={{left:`calc(${(i/(Math.max(1,nums.length-1)))*96}% - 4px)`,bottom:`${12+((v-Math.min(...nums))/(Math.max(1,Math.max(...nums)-Math.min(...nums))))*72}%`}}/>)}</div><div className="chart-x">{labels.map((l,i)=><span key={i}>{l}</span>)}</div></div>:<div className="empty-state"><HeartPulse size={22}/><p>{empty}</p></div>}
  </section>
}

function StatCard({icon,label,value,note}){return <div className="stat-card glass"><div className="stat-icon">{icon}</div><div><small>{label}</small><strong>{value}</strong><span>{note}</span></div></div>}

function Toast({message}){ return <div className="toast"><Check size={16}/>{message}</div> }

createRoot(document.getElementById("root")).render(<BrowserRouter><App/></BrowserRouter>);
