import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CalendarDays, Clock, Scissors, UserRound, Phone, CheckCircle2, ChevronLeft, ChevronRight, LayoutDashboard, Settings, Trash2, LogOut } from "lucide-react";
import "./style.css";
import { supabaseKey } from "./supabaseKey";
import { supabaseUrl } from "./supabaseUrl";

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type Service = { id:string; name:string; price:number; duration:number; active?:boolean };
type Barber = { id:string; name:string; active?:boolean };
type Appointment = { id:string; customer_name:string; customer_phone:string; service_id:string; barber_id:string; appointment_date:string; appointment_time:string; status:string; services?:Service; barbers?:Barber };

const demoServices: Service[] = [
  {id:"1",name:"Corte",price:30,duration:30},
  {id:"2",name:"Barba",price:20,duration:30},
  {id:"3",name:"Corte + Barba",price:45,duration:60},
];
const demoBarbers: Barber[] = [{id:"1",name:"João"},{id:"2",name:"Carlos"}];

const pad=(n:number)=>String(n).padStart(2,"0");
const dateKey=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const formatDate=(d:string)=>new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});
const slots=()=>{ const a:string[]=[]; for(let h=9;h<19;h++) for(const m of [0,30]) a.push(`${pad(h)}:${pad(m)}`); return a; };

export default function App(){
  const [page,setPage]=useState<"home"|"booking"|"success"|"admin">("home");
  const [step,setStep]=useState(1);
  const [services,setServices]=useState<Service[]>(demoServices);
  const [barbers,setBarbers]=useState<Barber[]>(demoBarbers);
  const [appointments,setAppointments]=useState<Appointment[]>([]);
  const [selectedService,setSelectedService]=useState<Service|null>(null);
  const [selectedBarber,setSelectedBarber]=useState<Barber|null>(null);
  const [selectedDate,setSelectedDate]=useState(new Date());
  const [selectedTime,setSelectedTime]=useState("");
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [loading,setLoading]=useState(false);

  const load=async()=>{
    if(!supabase) return;
    const [s,b,a]=await Promise.all([
      supabase.from("services").select("*").eq("active",true).order("name"),
      supabase.from("barbers").select("*").eq("active",true).order("name"),
      supabase.from("appointments").select("*").neq("status","cancelled")
    ]);
    if(!s.error && s.data) setServices(s.data);
    if(!b.error && b.data) setBarbers(b.data);
    if(!a.error && a.data) setAppointments(a.data);
  };
  useEffect(()=>{load()},[]);

  const occupied=useMemo(()=>appointments.filter(a=>a.appointment_date===dateKey(selectedDate)&&a.barber_id===selectedBarber?.id&&a.status!=="cancelled").map(a=>a.appointment_time),[appointments,selectedDate,selectedBarber]);

  const reset=()=>{setStep(1);setSelectedService(null);setSelectedBarber(null);setSelectedDate(new Date());setSelectedTime("");setName("");setPhone("");};

  const saveAppointment=async()=>{
    if(!selectedService||!selectedBarber||!selectedTime||!name.trim()||!phone.trim()) return;
    setLoading(true);
    const payload={customer_name:name.trim(),customer_phone:phone.trim(),service_id:selectedService.id,barber_id:selectedBarber.id,appointment_date:dateKey(selectedDate),appointment_time:selectedTime,status:"confirmed"};
    if(supabase){
      const {error}=await supabase.from("appointments").insert(payload);
      if(error){alert(error.message.includes("duplicate")?"Esse horário acabou de ser reservado. Escolha outro.":error.message); await load(); setLoading(false); return;}
      await load();
    } else {
      if(occupied.includes(selectedTime)){alert("Esse horário acabou de ser reservado.");setLoading(false);return;}
      setAppointments(prev=>[...prev,{id:crypto.randomUUID(),...payload}]);
    }
    setLoading(false);setPage("success");
  };

  const cancelAppointment=async(id:string)=>{
    if(!confirm("Cancelar este agendamento?")) return;
    if(supabase){await supabase.from("appointments").update({status:"cancelled"}).eq("id",id); await load();}
    else setAppointments(prev=>prev.map(a=>a.id===id?{...a,status:"cancelled"}:a));
  };

  const today=dateKey(new Date());
  const todayAppointments=appointments.filter(a=>a.appointment_date===today&&a.status!=="cancelled");

  if(page==="admin") return <Admin appointments={todayAppointments} services={services} barbers={barbers} onBack={()=>setPage("home")} onCancel={cancelAppointment}/>;

  return <main className="app">
    <header><div className="brand"><Scissors size={25}/><div><b>BARBER</b><span>PRO</span></div></div><button className="adminBtn" onClick={()=>setPage("admin")}><LayoutDashboard size={18}/></button></header>

    {page==="home" && <section className="home">
      <div className="heroIcon"><Scissors size={48}/></div>
      <p className="eyebrow">BEM-VINDO À</p><h1>Barbearia<br/><em>Premium.</em></h1>
      <p className="subtitle">Seu estilo merece um horário reservado especialmente para você.</p>
      <button className="primary" onClick={()=>{reset();setPage("booking")}}>AGENDAR HORÁRIO <ChevronRight size={20}/></button>
      <div className="miniCards"><div><Clock/> <span>Atendimento<br/><b>09h às 19h</b></span></div><div><CalendarDays/> <span>Agendamento<br/><b>Online</b></span></div></div>
    </section>}

    {page==="booking" && <section className="booking">
      <button className="back" onClick={()=>step===1?(setPage("home"),reset()):setStep(step-1)}><ChevronLeft/> Voltar</button>
      <div className="progress"><i className={step>=1?"on":""}/><i className={step>=2?"on":""}/><i className={step>=3?"on":""}/><i className={step>=4?"on":""}/></div>

      {step===1 && <><p className="eyebrow">PASSO 1 DE 4</p><h2>Escolha o serviço</h2><div className="cards">{services.map(s=><button className={"choice "+(selectedService?.id===s.id?"selected":"")} key={s.id} onClick={()=>setSelectedService(s)}><Scissors/><div><b>{s.name}</b><small>{s.duration} minutos</small></div><strong>R$ {Number(s.price).toFixed(2)}</strong></button>)}</div><button disabled={!selectedService} className="primary bottom" onClick={()=>setStep(2)}>CONTINUAR</button></>}

      {step===2 && <><p className="eyebrow">PASSO 2 DE 4</p><h2>Escolha o barbeiro</h2><div className="cards">{barbers.map(b=><button className={"choice "+(selectedBarber?.id===b.id?"selected":"")} key={b.id} onClick={()=>setSelectedBarber(b)}><UserRound/><div><b>{b.name}</b><small>Profissional</small></div></button>)}</div><button disabled={!selectedBarber} className="primary bottom" onClick={()=>setStep(3)}>CONTINUAR</button></>}

      {step===3 && <><p className="eyebrow">PASSO 3 DE 4</p><h2>Escolha data e horário</h2><input className="dateInput" type="date" min={today} value={dateKey(selectedDate)} onChange={e=>setSelectedDate(new Date(e.target.value+"T12:00:00"))}/><h3>{formatDate(dateKey(selectedDate))}</h3><div className="times">{slots().map(t=>{const busy=occupied.includes(t);return <button disabled={busy} className={selectedTime===t?"selected":""} key={t} onClick={()=>setSelectedTime(t)}>{busy?"Ocupado":t}</button>})}</div><button disabled={!selectedTime} className="primary bottom" onClick={()=>setStep(4)}>CONTINUAR</button></>}

      {step===4 && <><p className="eyebrow">PASSO 4 DE 4</p><h2>Confirme seus dados</h2><div className="summary"><b>{selectedService?.name}</b><span>{selectedBarber?.name}</span><span>{new Date(dateKey(selectedDate)+"T12:00:00").toLocaleDateString("pt-BR")} às {selectedTime}</span></div><label>Seu nome<input value={name} onChange={e=>setName(e.target.value)} placeholder="Digite seu nome"/></label><label>WhatsApp<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(00) 00000-0000"/></label><button disabled={loading||!name||!phone} className="primary bottom" onClick={saveAppointment}>{loading?"RESERVANDO...":"CONFIRMAR AGENDAMENTO"}</button></>}
    </section>}

    {page==="success" && <section className="success"><CheckCircle2 size={82}/><p className="eyebrow">TUDO CERTO!</p><h1>Horário<br/><em>confirmado.</em></h1><div className="receipt"><b>{selectedService?.name}</b><span>💈 {selectedBarber?.name}</span><span>📅 {new Date(dateKey(selectedDate)+"T12:00:00").toLocaleDateString("pt-BR")}</span><span>🕒 {selectedTime}</span></div><button className="primary" onClick={()=>{reset();setPage("home")}}>VOLTAR AO INÍCIO</button></section>}
  </main>
}

function Admin({appointments,services,barbers,onBack,onCancel}:{appointments:Appointment[];services:Service[];barbers:Barber[];onBack:()=>void;onCancel:(id:string)=>void}){
 return <main className="app admin"><header><button className="back" onClick={onBack}><ChevronLeft/> Voltar</button><div className="brand"><Scissors size={22}/><b>PAINEL</b></div></header><section><p className="eyebrow">ADMINISTRAÇÃO</p><h2>Agenda de hoje</h2><div className="stats"><div><b>{appointments.length}</b><span>Agendamentos</span></div><div><b>R$ {appointments.reduce((sum,a)=>sum+(services.find(s=>s.id===a.service_id)?.price||0),0)}</b><span>Previsão</span></div></div><div className="agenda">{appointments.length===0?<p className="empty">Nenhum agendamento hoje.</p>:appointments.sort((a,b)=>a.appointment_time.localeCompare(b.appointment_time)).map(a=>{const s=services.find(x=>x.id===a.service_id);const b=barbers.find(x=>x.id===a.barber_id);return <article key={a.id}><div className="time">{a.appointment_time}</div><div><b>{a.customer_name}</b><span>{s?.name||"Serviço"} • {b?.name||"Barbeiro"}</span><small><Phone size={12}/>{a.customer_phone}</small></div><button onClick={()=>onCancel(a.id)}><Trash2 size={18}/></button></article>})}</div><p className="demoNote">⚠️ Para produção, conecte o Supabase usando o arquivo .env.</p></section></main>
}