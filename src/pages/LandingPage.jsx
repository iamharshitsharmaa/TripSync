import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Users, Calendar, ArrowRight, Star,
  Globe2, ChevronDown, Play, MessageCircle, CheckSquare,
  Hotel, Wallet, Hash, Lock, RefreshCw, Shield,
  Upload, Smartphone, Layers, Sun, Moon,
} from "lucide-react";

/* ── Brand palette ─────────────────────────────────────────
   Sky teal:   #5BB8C4   Deep teal: #1C6B72
   Cream:      #F4EFE6   Cream dk:  #EDE6DA
   Sage:       #6B9E62   Silver:    #C8D0CC
   Dark:       #162224   Mid:       #3E5A5C
──────────────────────────────────────────────────────────── */

const HERO_IMAGE = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=80";

const FEATURE_IMGS = [
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
  "https://images.unsplash.com/photo-1682687982502-1529b3b33f85?w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80",
];

const GALLERY = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=60",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=60",
  "https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=400&q=60",
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=60",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400&q=60",
  "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=400&q=60",
  "https://plus.unsplash.com/premium_photo-1661919589683-f11880119fb7?w=400&q=60",
  "https://plus.unsplash.com/premium_photo-1697729690458-2d64ca777c04?w=400&q=60",
];

const FEATURES = [
  { icon: Calendar,      title: "Itinerary Builder",    accentKey: "deepTeal", desc: "Drag-and-drop activities across days. Set times, locations, costs. Every change syncs live to all members.", img: FEATURE_IMGS[0], tags: ["Drag & drop","Time slots","Live sync"] },
  { icon: Users,         title: "Collaboration",        accentKey: "sage",     desc: "Invite by 6-char code or email. Role-based access (owner/editor/viewer). See who's online in real time.",   img: FEATURE_IMGS[1], tags: ["Invite codes","Roles","Presence"] },
  { icon: Wallet,        title: "Budget Tracker",       accentKey: "skyTeal",  desc: "Set a budget limit, log expenses by category, and track per-person spend with visual breakdowns.",           img: FEATURE_IMGS[2], tags: ["Per-category","Per-person","Charts"] },
  { icon: CheckSquare,   title: "Checklists",           accentKey: "sage",     desc: "Assign packing items to specific members. Everyone checks off their own. No more duplicate packing.",        img: FEATURE_IMGS[3], tags: ["Assigned items","Progress","Member view"] },
  { icon: Hotel,         title: "Stays & Flights",      accentKey: "deepTeal", desc: "Attach flight details, hotel confirmations, and transfer info — all accessible by everyone on the trip.",    img: FEATURE_IMGS[4], tags: ["Flights","Hotels","Transfers"] },
  { icon: MessageCircle, title: "Trip Chat",            accentKey: "skyTeal",  desc: "Built-in group chat per trip. Typing indicators, full history, real-time delivery — no WhatsApp needed.",    img: FEATURE_IMGS[5], tags: ["Real-time","History","Typing"] },
];

const STEPS = [
  { num:"01", icon: Globe2,      accentKey:"deepTeal", title:"Create a Trip",    desc:"Set destination, dates, currency, and budget. Upload a cover photo. Under 60 seconds." },
  { num:"02", icon: Hash,        accentKey:"sage",     title:"Invite Your Crew", desc:"Share a 6-character code or send an email. Friends join instantly with their chosen role." },
  { num:"03", icon: Layers,      accentKey:"skyTeal",  title:"Plan Together",    desc:"Build the itinerary, split costs, attach confirmations — all live with your crew." },
  { num:"04", icon: Smartphone,  accentKey:"sage",     title:"Travel & Track",   desc:"Check off activities, log expenses on the go, keep all reservations at your fingertips." },
];

const TESTIMONIALS = [
  { name:"Poonam S.",  location:"Bangalore", avatar:"P", accentKey:"deepTeal", text:"We planned a 10-day Europe trip for 6 people. No more 200-message WhatsApp threads." },
  { name:"Hitesha C.", location:"Jaipur",    avatar:"H", accentKey:"sage",     text:"The drag-and-drop itinerary builder alone is worth it. Reshuffled our whole Thailand trip in minutes." },
  { name:"Amanjot K.", location:"New Delhi", avatar:"A", accentKey:"skyTeal",  text:"Budget tracking saved us from overspending. Category breakdowns in real time." },
  { name:"Ritika M.",  location:"Mumbai",    avatar:"R", accentKey:"deepTeal", text:"Invite code is genius. My friends joined with zero friction and we were collaborating immediately." },
  { name:"Dev P.",     location:"Pune",      avatar:"D", accentKey:"sage",     text:"Assigned checklists means no duplicate packing. We finally stopped bringing four phone chargers." },
  { name:"Sneha T.",   location:"Chennai",   avatar:"S", accentKey:"skyTeal",  text:"Trip chat keeps all travel conversation in context. No more digging through old Telegram messages." },
];

const COMPARISON = [
  { feature:"Real-time collaboration",    ts:true,  ss:false, wa:false },
  { feature:"Drag-drop itinerary",        ts:true,  ss:false, wa:false },
  { feature:"Budget tracking per person", ts:true,  ss:true,  wa:false },
  { feature:"Built-in group chat",        ts:true,  ss:false, wa:true  },
  { feature:"Reservations log",           ts:true,  ss:true,  wa:false },
  { feature:"Role-based access",          ts:true,  ss:false, wa:false },
  { feature:"Invite with code",           ts:true,  ss:false, wa:false },
  { feature:"Mobile friendly",            ts:true,  ss:false, wa:true  },
];

const SECURITY = [
  { icon: Lock,      accentKey:"deepTeal", title:"JWT Auth",          desc:"Dual-token auth with short-lived access tokens and rotating 30-day refresh tokens." },
  { icon: Shield,    accentKey:"sage",     title:"Role-based Access", desc:"Owners, editors, and viewers each have distinct permissions within every trip." },
  { icon: RefreshCw, accentKey:"skyTeal",  title:"Auto Token Refresh",desc:"Seamless session continuity — tokens refresh silently in the background." },
  { icon: Upload,    accentKey:"sage",     title:"Cloudinary CDN",    desc:"Cover photos served from a global CDN with automatic compression and format conversion." },
];

// ── Single shared IntersectionObserver via context ──────────
function useFadeIn(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible, delay];
}

function FadeIn({ children, delay = 0 }) {
  const [ref, visible] = useFadeIn(delay);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(20px)",
      transition: `opacity .55s ease ${delay}s, transform .55s ease ${delay}s`,
      willChange: "opacity, transform",
    }}>
      {children}
    </div>
  );
}

// ── Theme tokens ────────────────────────────────────────────
function getTokens(dark) {
  return {
    bg:         dark ? "#0f1a1c" : "#F4EFE6",
    bgAlt:      dark ? "#162224" : "#EDE6DA",
    bgCard:     dark ? "#1c2e30" : "#FFFFFF",
    border:     dark ? "rgba(91,184,196,0.15)" : "#C8D0CC",
    borderCard: dark ? "rgba(91,184,196,0.12)" : "#C8D0CC",
    text:       dark ? "#e8f0f1" : "#162224",
    textMuted:  dark ? "#6a9496" : "#7A9496",
    textMid:    dark ? "#a8c4c6" : "#3E5A5C",
    navBg:      dark ? "rgba(15,26,28,0.92)" : "rgba(244,239,230,0.92)",
    skyTeal:    "#5BB8C4",
    deepTeal:   "#1C6B72",
    sage:       "#6B9E62",
    shadow:     dark ? "rgba(0,0,0,0.35)" : "rgba(28,107,114,0.08)",
  };
}

export default function LandingPage() {
  const [dark,          setDark]         = useState(false);
  const [scrolled,      setScrolled]     = useState(false);
  const [heroLoaded,    setHeroLoaded]   = useState(false);
  const [menuOpen,      setMenuOpen]     = useState(false);
  const [activeFeature, setActiveFeature]= useState(0);

  const T = getTokens(dark);

  // Resolve accent color from key
  const accent = useCallback((key) => ({
    skyTeal: T.skyTeal, deepTeal: T.deepTeal, sage: T.sage
  }[key] || T.deepTeal), [T]);

  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrolled(window.scrollY > 50); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const img = new Image(); img.src = HERO_IMAGE;
    img.onload = () => setHeroLoaded(true);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const af = FEATURES[activeFeature];
  const afAccent = accent(af.accentKey);

  // ── Shared component styles ──────────────────────────────
  const card = {
    background: T.bgCard,
    border: `1px solid ${T.borderCard}`,
    borderRadius: 16,
    boxShadow: `0 2px 16px ${T.shadow}`,
  };

  const btnPrimary = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "12px 26px", borderRadius: 10,
    background: `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`,
    color: "#fff", fontSize: 14, fontWeight: 600,
    textDecoration: "none", border: "none", cursor: "pointer",
    boxShadow: `0 6px 20px ${T.deepTeal}35`,
    transition: "opacity .15s, transform .15s",
    fontFamily: "'DM Sans', sans-serif",
  };

  const btnOutline = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "12px 26px", borderRadius: 10,
    background: "transparent",
    color: T.deepTeal, fontSize: 14, fontWeight: 600,
    textDecoration: "none", cursor: "pointer",
    border: `1.5px solid ${T.deepTeal}`,
    transition: "all .15s",
    fontFamily: "'DM Sans', sans-serif",
  };

  const label = {
    fontSize: 11, letterSpacing: 3,
    textTransform: "uppercase", fontWeight: 600,
    marginBottom: 12, fontFamily: "'DM Sans', sans-serif",
  };

  const sectionTitle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 700, lineHeight: 1.1,
    color: T.text,
  };

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background: T.bg, color: T.text, overflowX:"hidden", transition:"background .3s, color .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0 }
        html { scroll-behavior:smooth }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-thumb { background:#C8D0CC; border-radius:3px }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .float-anim { animation:float 5s ease-in-out infinite }
        .gallery-track { display:flex; gap:10px; animation:marquee 50s linear infinite; width:max-content; will-change:transform }
        .gallery-track:hover { animation-play-state:paused }
        .mtoggle { display:none }
        .btn-p:hover  { opacity:.85 !important; transform:translateY(-1px) !important }
        .btn-o:hover  { background:${T.deepTeal} !important; color:#fff !important }
        .nav-a:hover  { color:${T.deepTeal} !important }
        .tab-btn:hover { opacity:.85 }
        .ch:hover { transform:translateY(-3px) !important; box-shadow:0 12px 36px rgba(28,107,114,.15) !important }
        .tr:hover { background:rgba(91,184,196,0.06) }
        @media(max-width:768px){
          .dlinks{display:none!important}
          .nav-auth{display:none!important}
          .mtoggle{display:flex!important}
          .frow{grid-template-columns:repeat(3,1fr)!important}
          .fshow{flex-direction:column!important}
          .fimg{width:100%!important;height:190px!important}
          .sgrid{grid-template-columns:1fr 1fr!important}
          .tgrid{grid-template-columns:1fr!important}
          .secgrid{grid-template-columns:1fr 1fr!important}
          .sec{padding:56px 18px!important}
          .hbtns{flex-direction:column;align-items:stretch}
          .hbtns a,.hbtns button{text-align:center;justify-content:center;width:100%}
          .hstats{gap:20px!important;flex-wrap:wrap;justify-content:center}
          .ftrinr{padding:0 12px!important}
        }
        @media(max-width:460px){
          .frow{grid-template-columns:repeat(2,1fr)!important}
          .sgrid{grid-template-columns:1fr!important}
          .secgrid{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ── NAVBAR ───────────────────────────────────────────── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background: scrolled ? T.navBg : "transparent", backdropFilter: scrolled ? "blur(18px)" : "none", borderBottom: scrolled ? `1px solid ${T.border}` : "none", transition:"all .3s" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"13px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          {/* Logo */}
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
            <div style={{ width:32, height:32, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✈️</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:T.text }}>TripSync</span>
          </Link>

          {/* Desktop links */}
          <div className="dlinks" style={{ display:"flex", alignItems:"center", gap:28 }}>
            {[["#features","Features"],["#how","How it works"],["#compare","Compare"],["#reviews","Reviews"]].map(([h,l]) => (
              <a key={h} href={h} className="nav-a" style={{ fontSize:13, color:T.textMuted, textDecoration:"none", fontWeight:500, transition:"color .15s" }}>{l}</a>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Dark mode toggle — always visible */}
            <button onClick={() => setDark(d => !d)}
              style={{ width:36, height:36, borderRadius:9, border:`1px solid ${T.border}`, background:T.bgCard, color:T.textMid, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s", flexShrink:0 }}>
              {dark ? <Sun size={15}/> : <Moon size={15}/>}
            </button>
            {/* Hamburger — CSS controls visibility, NO inline display */}
            <button className="mtoggle" onClick={() => setMenuOpen(p=>!p)}
              style={{ width:36, height:36, borderRadius:9, border:`1px solid ${T.border}`, background:T.bgCard, color:T.textMid, alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen
                  ? <path d="M18 6L6 18M6 6l12 12"/>
                  : <path d="M3 6h18M3 12h18M3 18h18"/>}
              </svg>
            </button>
            {/* Auth buttons — hidden on mobile via .nav-auth class */}
            <div className="nav-auth" style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Link to="/login" className="btn-o" style={btnOutline}>Sign in</Link>
              <Link to="/register" className="btn-p" style={btnPrimary}>Get Started</Link>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background:T.bgCard, borderTop:`1px solid ${T.border}`, padding:"8px 20px 20px" }}>
            {[["#features","Features"],["#how","How it works"],["#compare","Compare"],["#reviews","Reviews"]].map(([h,l]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)}
                style={{ display:"block", padding:"11px 0", fontSize:14, color:T.textMid, textDecoration:"none", borderBottom:`1px solid ${T.border}`, fontWeight:500 }}>{l}</a>
            ))}
            {/* Auth buttons in mobile menu */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:16 }}>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                style={{ display:"block", padding:"11px", borderRadius:10, border:`1.5px solid ${T.deepTeal}`, color:T.deepTeal, fontSize:14, fontWeight:600, textDecoration:"none", textAlign:"center", transition:"all .15s" }}>
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                style={{ display:"block", padding:"11px", borderRadius:10, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:"#fff", fontSize:14, fontWeight:600, textDecoration:"none", textAlign:"center", boxShadow:`0 4px 14px ${T.deepTeal}30` }}>
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ position:"relative", height:"100vh", minHeight:600, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`url(${HERO_IMAGE})`, backgroundSize:"cover", backgroundPosition:"center", opacity: heroLoaded ? 0.5 : 0, transition:"opacity 1.4s ease" }} />
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(to bottom,rgba(22,34,36,.55) 0%,rgba(22,34,36,.08) 45%,rgba(22,34,36,.82) 100%)` }} />

        <div style={{ position:"relative", zIndex:2, textAlign:"center", maxWidth:840, padding:"0 24px", opacity: heroLoaded ? 1 : 0, transition:"opacity .9s ease .3s" }}>
          {/* Badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 16px", borderRadius:100, background:"rgba(244,239,230,0.1)", border:"1px solid rgba(244,239,230,0.22)", backdropFilter:"blur(8px)", fontSize:12, color:"rgba(244,239,230,0.85)", marginBottom:28, fontWeight:500 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#6ee7b7", display:"inline-block", boxShadow:"0 0 8px #6ee7b7" }} />
            Collaborative trip planning — built for friend groups
          </div>

          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(48px,8.5vw,92px)", fontWeight:700, lineHeight:1.02, letterSpacing:"-1.5px", marginBottom:22, color:"#FDFAF6" }}>
            Plan trips<br />
            <em style={{ fontStyle:"italic", color:T.skyTeal }}>together.</em>
          </h1>

          <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"rgba(244,239,230,0.72)", lineHeight:1.8, maxWidth:490, margin:"0 auto 34px", fontWeight:400 }}>
            Itinerary, budget, packing lists, reservations and group chat — with your whole crew, in real time.
          </p>

          <div className="hbtns" style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:50 }}>
            <Link to="/register" className="btn-p" style={{ ...btnPrimary, padding:"13px 28px", fontSize:15, boxShadow:`0 8px 24px ${T.deepTeal}50` }}>
              Start Planning Free <ArrowRight size={16}/>
            </Link>
            <a href="#features" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 28px", borderRadius:10, border:"1.5px solid rgba(244,239,230,0.28)", color:"rgba(244,239,230,0.88)", fontSize:15, fontWeight:500, textDecoration:"none", background:"rgba(244,239,230,0.07)", backdropFilter:"blur(6px)", transition:"background .15s" }}>
              <Play size={13} fill="currentColor"/> See features
            </a>
          </div>

          <div className="hstats" style={{ display:"flex", gap:44, justifyContent:"center" }}>
            {[["10k+","Trips planned"],["50k+","Travelers"],["4.9★","Avg rating"],["6","Core features"]].map(([v,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(20px,3vw,28px)", fontWeight:700, color:"#FDFAF6", lineHeight:1 }}>{v}</p>
                <p style={{ fontSize:11, color:"rgba(244,239,230,0.5)", marginTop:4 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="float-anim" style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", opacity:0.35 }}>
          <ChevronDown size={22} color="#FDFAF6"/>
        </div>
      </section>

      {/* ── GALLERY MARQUEE ──────────────────────────────────── */}
      <div style={{ background:T.bgAlt, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, padding:"18px 0", overflow:"hidden" }}>
        <div className="gallery-track">
          {[...GALLERY,...GALLERY].map((src,i) => (
            <div key={i} style={{ width:190, height:112, borderRadius:10, overflow:"hidden", flexShrink:0, border:`1px solid ${T.border}` }}>
              <img src={src} alt="" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"saturate(0.82)" }}/>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="sec" style={{ padding:"80px 32px 90px", maxWidth:1100, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <p style={{ ...label, color:T.skyTeal }}>Everything included</p>
            <h2 style={{ ...sectionTitle, fontSize:"clamp(30px,5vw,52px)", marginBottom:12 }}>Six features,<br/>one trip dashboard</h2>
            <p style={{ fontSize:14, color:T.textMuted, maxWidth:400, margin:"0 auto", lineHeight:1.7 }}>
              Itinerary, chat, budget, checklists, stays, members — all in one place.
            </p>
          </div>
        </FadeIn>

        {/* Tab selector */}
        <FadeIn delay={0.08}>
          <div className="frow" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:5, marginBottom:20, background:T.bgAlt, border:`1px solid ${T.border}`, borderRadius:13, padding:5 }}>
            {FEATURES.map((f,i) => {
              const Icon = f.icon;
              const active = i === activeFeature;
              const c = accent(f.accentKey);
              return (
                <button key={i} onClick={() => setActiveFeature(i)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"10px 6px", borderRadius:9, border:"none", background: active ? T.bgCard : "transparent", cursor:"pointer", boxShadow: active ? `0 2px 10px ${T.shadow}` : "none", transition:"all .2s" }}>
                  <Icon size={14} color={active ? c : T.textMuted}/>
                  <span style={{ fontSize:10, fontWeight:600, color: active ? c : T.textMuted, textAlign:"center", lineHeight:1.3 }}>{f.title.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </FadeIn>

        {/* Showcase */}
        <FadeIn delay={0.12}>
          <div className="fshow ch" key={activeFeature} style={{ ...card, display:"flex", border:`1.5px solid ${afAccent}28`, transition:"box-shadow .2s, transform .2s" }}>
            <div className="fimg" style={{ width:"43%", flexShrink:0, position:"relative" }}>
              <img src={af.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"saturate(0.8) brightness(0.72)", minHeight:250 }}/>
              <div style={{ position:"absolute", inset:0, background:`linear-gradient(to right,transparent 45%,${T.bgCard})` }}/>
              <div style={{ position:"absolute", bottom:18, left:18, width:42, height:42, borderRadius:10, background:`${afAccent}18`, border:`1.5px solid ${afAccent}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <af.icon size={19} color={afAccent}/>
              </div>
            </div>
            <div style={{ flex:1, padding:"28px 24px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:T.text, marginBottom:10, lineHeight:1.2 }}>{af.title}</h3>
              <p style={{ fontSize:14, color:T.textMid, lineHeight:1.8, marginBottom:18 }}>{af.desc}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {af.tags.map(tag => (
                  <span key={tag} style={{ padding:"4px 12px", borderRadius:100, background:`${afAccent}12`, border:`1px solid ${afAccent}30`, fontSize:11, color:afAccent, fontWeight:600 }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Feature pills */}
        <FadeIn delay={0.16}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center", marginTop:28 }}>
            {["Drag & drop reorder","Packing checklists","Reservation tracking","Role-based access","Invite by code","Expense splitting","Live presence","Google OAuth","Mobile friendly","Real-time chat","Cover photos","File attachments"].map(tag => (
              <span key={tag} style={{ padding:"5px 13px", borderRadius:100, background:T.bgAlt, border:`1px solid ${T.border}`, fontSize:12, color:T.textMuted }}>{tag}</span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how" style={{ background:T.bgAlt, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, padding:"76px 20px" }}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <FadeIn>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <p style={{ ...label, color:T.sage }}>How it works</p>
              <h2 style={{ ...sectionTitle, fontSize:"clamp(26px,4vw,46px)", marginBottom:10 }}>From idea to itinerary in four steps</h2>
              <p style={{ fontSize:14, color:T.textMuted, maxWidth:340, margin:"0 auto" }}>No learning curve. No credit card. Just great trips.</p>
            </div>
          </FadeIn>
          <div className="sgrid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24 }}>
            {STEPS.map((s,i) => {
              const Icon = s.icon;
              const c = accent(s.accentKey);
              return (
                <FadeIn key={s.num} delay={i*0.08}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ width:52, height:52, borderRadius:13, background:`${c}14`, border:`1.5px solid ${c}30`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                      <Icon size={22} color={c}/>
                    </div>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:700, color:`${T.text}08`, lineHeight:1, marginBottom:8 }}>{s.num}</p>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:700, marginBottom:7, color:T.text }}>{s.title}</h3>
                    <p style={{ fontSize:13, color:T.textMuted, lineHeight:1.7 }}>{s.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ───────────────────────────────────────── */}
      <section id="compare" className="sec" style={{ padding:"76px 32px", maxWidth:900, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <p style={{ ...label, color:T.sage }}>Why TripSync</p>
            <h2 style={{ ...sectionTitle, fontSize:"clamp(26px,4vw,46px)", marginBottom:10 }}>Finally built for group travel</h2>
            <p style={{ fontSize:14, color:T.textMuted, maxWidth:360, margin:"0 auto" }}>See how TripSync stacks up against the tools people usually hack together.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div style={{ ...card, overflow:"hidden" }}>
            {/* Header */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 108px 108px 108px", padding:"12px 20px", background:T.bgAlt, borderBottom:`1px solid ${T.border}` }}>
              {["Feature", "TripSync ✈️", "Spreadsheet", "WhatsApp"].map((h,i) => (
                <span key={h} style={{ fontSize:11, fontWeight:700, color: i===1 ? T.deepTeal : T.textMuted, textAlign: i>0 ? "center" : "left", textTransform:"uppercase", letterSpacing:1 }}>{h}</span>
              ))}
            </div>
            {COMPARISON.map((row,i) => (
              <div key={row.feature} className="tr" style={{ display:"grid", gridTemplateColumns:"1fr 108px 108px 108px", padding:"11px 20px", borderBottom: i < COMPARISON.length-1 ? `1px solid ${T.bgAlt}` : "none", alignItems:"center", transition:"background .15s" }}>
                <span style={{ fontSize:13, color:T.textMid }}>{row.feature}</span>
                {[row.ts,row.ss,row.wa].map((v,j) => <span key={j} style={{ textAlign:"center", fontSize:15 }}>{v?"✅":"❌"}</span>)}
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section id="reviews" style={{ background:T.bgAlt, borderTop:`1px solid ${T.border}`, padding:"76px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <FadeIn>
            <div style={{ textAlign:"center", marginBottom:44 }}>
              <p style={{ ...label, color:T.skyTeal }}>Loved by travelers</p>
              <h2 style={{ ...sectionTitle, fontSize:"clamp(26px,4vw,46px)" }}>What real groups say</h2>
            </div>
          </FadeIn>
          <div className="tgrid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {TESTIMONIALS.map((t,i) => {
              const c = accent(t.accentKey);
              return (
                <FadeIn key={t.name} delay={i*0.07}>
                  <div className="ch" style={{ ...card, padding:"20px 18px", transition:"transform .2s, box-shadow .2s" }}>
                    <div style={{ display:"flex", gap:3, marginBottom:12 }}>
                      {Array.from({length:5}).map((_,j) => <Star key={j} size={12} fill="#f59e0b" color="#f59e0b"/>)}
                    </div>
                    <p style={{ fontSize:13, color:T.textMid, lineHeight:1.75, marginBottom:16 }}>"{t.text}"</p>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:`${c}16`, border:`1.5px solid ${c}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:c, flexShrink:0 }}>{t.avatar}</div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:600, color:T.text }}>{t.name}</p>
                        <p style={{ fontSize:11, color:T.textMuted, display:"flex", alignItems:"center", gap:3 }}><MapPin size={9}/> {t.location}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECURITY ─────────────────────────────────────────── */}
      <section className="sec" style={{ padding:"76px 32px", maxWidth:1000, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <p style={{ ...label, color:T.deepTeal }}>Built right</p>
            <h2 style={{ ...sectionTitle, fontSize:"clamp(26px,4vw,46px)", marginBottom:10 }}>Secure by design</h2>
            <p style={{ fontSize:14, color:T.textMuted, maxWidth:340, margin:"0 auto" }}>Production-grade infrastructure so your trip data is always safe.</p>
          </div>
        </FadeIn>
        <div className="secgrid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {SECURITY.map((s,i) => {
            const Icon = s.icon;
            const c = accent(s.accentKey);
            return (
              <FadeIn key={s.title} delay={i*0.07}>
                <div className="ch" style={{ ...card, padding:"18px 16px", transition:"transform .2s, box-shadow .2s" }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${c}14`, border:`1.5px solid ${c}28`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                    <Icon size={17} color={c}/>
                  </div>
                  <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontWeight:700, color:T.text, marginBottom:6 }}>{s.title}</h4>
                  <p style={{ fontSize:12, color:T.textMuted, lineHeight:1.65 }}>{s.desc}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
        {/* Tech stack */}
        <FadeIn delay={0.16}>
          <div style={{ marginTop:24, padding:"14px 20px", background:T.bgAlt, border:`1px solid ${T.border}`, borderRadius:12, display:"flex", flexWrap:"wrap", gap:7, alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:10, color:T.textMuted, marginRight:4, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>Stack</span>
            {["MongoDB","Express","React 18","Node.js","Socket.io","Redis","Cloudinary","Railway","Vercel"].map(t => (
              <span key={t} style={{ padding:"4px 11px", borderRadius:100, background:T.bgCard, border:`1px solid ${T.border}`, fontSize:11, color:T.textMid, fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background:`linear-gradient(135deg,${T.deepTeal},#0e4a50)`, padding:"80px 32px 90px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-20%", left:"50%", transform:"translateX(-50%)", width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle,${T.skyTeal}20 0%,transparent 70%)`, pointerEvents:"none" }}/>
        <FadeIn>
          <Globe2 size={34} color={T.skyTeal} style={{ margin:"0 auto 18px", opacity:0.7 }}/>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(30px,5.5vw,60px)", fontWeight:700, lineHeight:1.1, marginBottom:16, color:"#FDFAF6" }}>
            Your next adventure<br/>
            <em style={{ fontStyle:"italic", color:T.skyTeal }}>starts here.</em>
          </h2>
          <p style={{ fontSize:15, color:"rgba(244,239,230,0.62)", maxWidth:380, margin:"0 auto 32px", lineHeight:1.7 }}>
            Free to start. No credit card. Invite your whole crew in under 30 seconds.
          </p>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/register" className="btn-p" style={{ ...btnPrimary, background:`linear-gradient(135deg,${T.skyTeal},#7dd3d8)`, color:T.dark, fontSize:15, padding:"13px 30px", boxShadow:`0 8px 24px ${T.skyTeal}45` }}>
              Create Free Account <ArrowRight size={16}/>
            </Link>
            <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 30px", borderRadius:10, border:"1.5px solid rgba(244,239,230,0.25)", color:"rgba(244,239,230,0.85)", fontSize:15, fontWeight:500, textDecoration:"none", background:"rgba(244,239,230,0.07)" }}>
              Sign In
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: dark ? "#0a1214" : T.dark, borderTop:`1px solid rgba(255,255,255,0.06)`, padding:"24px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:24, height:24, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>✈️</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontWeight:700, color:"rgba(244,239,230,0.8)" }}>TripSync</span>
          </div>
          <p style={{ fontSize:12, color:"rgba(244,239,230,0.28)" }}>Built with ❤️ for travelers everywhere</p>
          <div style={{ display:"flex", gap:18 }}>
            {[["#features","Features"],["#how","How it works"],["#compare","Compare"],["/login","Sign in"],["/register","Register"]].map(([to,lbl]) => (
              to.startsWith("#")
                ? <a key={to} href={to} style={{ fontSize:12, color:"rgba(244,239,230,0.28)", textDecoration:"none" }}>{lbl}</a>
                : <Link key={to} to={to} style={{ fontSize:12, color:"rgba(244,239,230,0.28)", textDecoration:"none" }}>{lbl}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}