import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Users, Calendar, ArrowRight, Star,
  Globe2, ChevronDown, Play, MessageCircle, CheckSquare,
  Hotel, Wallet, Hash, Lock, RefreshCw, Shield,
  Upload, Smartphone, Layers, Sun, Moon, Sparkles,
} from "lucide-react";

const HERO_IMAGE = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=80";
const FEATURE_IMGS = [
  "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
  "https://images.unsplash.com/photo-1682687982502-1529b3b33f85?w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80",
];
const GALLERY = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=70",
  "https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=400&q=70",
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=70",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400&q=70",
  "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=400&q=70",
  "https://plus.unsplash.com/premium_photo-1661919589683-f11880119fb7?w=400&q=70",
  "https://plus.unsplash.com/premium_photo-1697729690458-2d64ca777c04?w=400&q=70",
];

const FEATURES = [
  { icon: Sparkles,      title: "TripSync AI",       accentKey: "skyTeal",  desc: "Describe your trip in plain language and AI instantly builds your full itinerary — activities, timings, and costs. AI also splits expenses fairly and suggests budget optimizations.", img: FEATURE_IMGS[0], tags: ["AI trip builder","Smart splits","Budget AI"] },
  { icon: Calendar,      title: "Itinerary Builder", accentKey: "deepTeal", desc: "Drag-and-drop activities across days. Set times, locations, costs. Every change syncs live to all members.", img: FEATURE_IMGS[1], tags: ["Drag & drop","Time slots","Live sync"] },
  { icon: Users,         title: "Collaboration",      accentKey: "sage",     desc: "Invite by 6-char code or email. Role-based access (owner/editor/viewer). See exactly who's online right now with live presence indicators.", img: FEATURE_IMGS[2], tags: ["Invite codes","Roles","Live presence"] },
  { icon: Wallet,        title: "Budget Tracker",     accentKey: "skyTeal",  desc: "Set a budget limit, log expenses by category, and let AI split costs fairly across members with visual breakdowns.", img: FEATURE_IMGS[3], tags: ["AI splits","Per-person","Charts"] },
  { icon: CheckSquare,   title: "Checklists",         accentKey: "sage",     desc: "Assign packing items to members. Everyone checks off their own. No duplicate packing.", img: FEATURE_IMGS[4], tags: ["Assigned items","Progress","Members"] },
  { icon: Hotel,         title: "Stays & Flights",    accentKey: "deepTeal", desc: "Attach flight details, hotel confirmations, and transfer info — all accessible by everyone.", img: FEATURE_IMGS[5], tags: ["Flights","Hotels","Transfers"] },
  { icon: MessageCircle, title: "Trip Chat",          accentKey: "skyTeal",  desc: "Built-in real-time group chat per trip. See who's online, typing indicators, full history, and instant delivery.", img: FEATURE_IMGS[6], tags: ["Real-time","Who's online","Typing"] },
];

const STEPS = [
  { num:"01", icon: Sparkles,   accentKey:"skyTeal",  title:"Describe or Create", desc:"Tell TripSync AI where you want to go — it builds the full itinerary in seconds. Or set it up manually in under 60 seconds." },
  { num:"02", icon: Hash,       accentKey:"sage",     title:"Invite Your Crew",   desc:"Share a 6-character code or send an email. Friends join instantly with their chosen role." },
  { num:"03", icon: Layers,     accentKey:"deepTeal", title:"Plan Together",      desc:"Build the itinerary, split costs with AI, attach confirmations — all live with your crew." },
  { num:"04", icon: Smartphone, accentKey:"sage",     title:"Travel & Track",     desc:"Check off activities, log expenses on the go, chat in real time, keep all reservations at your fingertips." },
];

const TESTIMONIALS = [
  { name:"Poonam S.",  location:"Bangalore", avatar:"P", accentKey:"deepTeal", text:"TripSync AI planned our entire 10-day Europe trip in seconds. No more 200-message WhatsApp threads." },
  { name:"Hitesha C.", location:"Jaipur",    avatar:"H", accentKey:"sage",     text:"The AI itinerary builder is magic. I typed 'beach trip Goa 5 days' and it had everything scheduled." },
  { name:"Amanjot K.", location:"New Delhi", avatar:"A", accentKey:"skyTeal",  text:"AI expense splitting saved us from arguments. It just figures out who owes what automatically." },
  { name:"Ritika M.",  location:"Mumbai",    avatar:"R", accentKey:"deepTeal", text:"The live presence feature is so cool — you can see exactly when your friends are planning with you." },
  { name:"Dev P.",     location:"Pune",      avatar:"D", accentKey:"sage",     text:"Real-time chat inside the trip context is a game changer. All our conversations stay right with the plan." },
  { name:"Sneha T.",   location:"Chennai",   avatar:"S", accentKey:"skyTeal",  text:"Assigned checklists means no duplicate packing. We finally stopped bringing four phone chargers." },
];

const COMPARISON = [
  { feature:"AI trip creation",           ts:true,  ss:false, wa:false },
  { feature:"AI expense splitting",       ts:true,  ss:false, wa:false },
  { feature:"Real-time collaboration",    ts:true,  ss:false, wa:false },
  { feature:"Live online presence",       ts:true,  ss:false, wa:false },
  { feature:"Drag-drop itinerary",        ts:true,  ss:false, wa:false },
  { feature:"Budget tracking per person", ts:true,  ss:true,  wa:false },
  { feature:"Built-in group chat",        ts:true,  ss:false, wa:true  },
  { feature:"Role-based access",          ts:true,  ss:false, wa:false },
  { feature:"Mobile friendly",            ts:true,  ss:false, wa:true  },
];

const SECURITY = [
  { icon: Lock,      accentKey:"deepTeal", title:"JWT Auth",           desc:"Dual-token auth with short-lived access tokens and rotating 30-day refresh tokens." },
  { icon: Shield,    accentKey:"sage",     title:"Role-based Access",  desc:"Owners, editors, and viewers each have distinct permissions within every trip." },
  { icon: RefreshCw, accentKey:"skyTeal",  title:"Auto Token Refresh", desc:"Seamless session continuity — tokens refresh silently in the background." },
  { icon: Upload,    accentKey:"sage",     title:"Cloudinary CDN",     desc:"Cover photos served from a global CDN with automatic compression and format conversion." },
];

function getTokens(dark) {
  return dark ? {
    bg:"#0d1a1c", bgAlt:"#122022", bgCard:"#182c2e", bgCardAlt:"#1e3335",
    border:"rgba(91,184,196,0.14)", borderCard:"rgba(91,184,196,0.10)",
    text:"#eef4f5", textMid:"#b0cdd0", textMuted:"#6a9496",
    navBg:"rgba(13,26,28,0.94)", footerBg:"#080f10",
    skyTeal:"#5BB8C4", deepTeal:"#3a9aa4", sage:"#7aae70",
    shadow:"rgba(0,0,0,0.40)", pill:"rgba(91,184,196,0.10)",
    pillBorder:"rgba(91,184,196,0.20)", pillText:"#5BB8C4",
    divider:"rgba(91,184,196,0.08)",
  } : {
    bg:"#F7F3EC", bgAlt:"#EEE8DB", bgCard:"#FFFFFF", bgCardAlt:"#F9F6F1",
    border:"#D4CBB8", borderCard:"#E0D8C8",
    text:"#162224", textMid:"#2E4A4C", textMuted:"#5A7678",
    navBg:"rgba(247,243,236,0.94)", footerBg:"#162224",
    skyTeal:"#3A9FAD", deepTeal:"#1C6B72", sage:"#5A8E52",
    shadow:"rgba(28,107,114,0.10)", pill:"rgba(28,107,114,0.08)",
    pillBorder:"rgba(28,107,114,0.18)", pillText:"#1C6B72",
    divider:"rgba(28,107,114,0.06)",
  };
}

function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeIn({ children, delay = 0 }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(22px)",
      transition: `opacity .6s ease ${delay}s, transform .6s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, color }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"4px 13px", borderRadius:100, background:`${color}14`, border:`1px solid ${color}30`, fontSize:10, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color, marginBottom:14 }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [dark,          setDark]          = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [heroLoaded,    setHeroLoaded]    = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const T = getTokens(dark);
  const accent = useCallback((key) => ({ skyTeal:T.skyTeal, deepTeal:T.deepTeal, sage:T.sage }[key] || T.deepTeal), [T]);

  useEffect(() => {
    let tick = false;
    const fn = () => { if (!tick) { requestAnimationFrame(() => { setScrolled(window.scrollY > 40); tick = false; }); tick = true; } };
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const img = new Image(); img.src = HERO_IMAGE;
    img.onload = () => setHeroLoaded(true);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p+1) % FEATURES.length), 4200);
    return () => clearInterval(t);
  }, []);

  const af = FEATURES[activeFeature];
  const afAccent = accent(af.accentKey);
  const card = { background:T.bgCard, border:`1px solid ${T.borderCard}`, borderRadius:16, boxShadow:`0 2px 18px ${T.shadow}` };

  const btnPrimary = {
    display:"inline-flex", alignItems:"center", gap:8, padding:"12px 24px",
    borderRadius:10, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`,
    color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none",
    border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
    boxShadow:`0 6px 22px ${T.deepTeal}40`, transition:"opacity .15s, transform .15s",
  };

  const btnGhost = {
    display:"inline-flex", alignItems:"center", gap:8, padding:"12px 24px",
    borderRadius:10, border:`1.5px solid ${T.deepTeal}`, color:T.deepTeal,
    fontSize:14, fontWeight:600, textDecoration:"none", cursor:"pointer",
    background:"transparent", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T.bg, color:T.text, overflowX:"hidden", transition:"background .3s, color .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0 }
        html { scroll-behavior:smooth }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:4px }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes shimmer { 0%{opacity:.5} 50%{opacity:1} 100%{opacity:.5} }
        @keyframes aiPulse { 0%,100%{box-shadow:0 0 0 0 rgba(91,184,196,0.45)} 60%{box-shadow:0 0 0 9px rgba(91,184,196,0)} }
        .float-anim    { animation:float 5.5s ease-in-out infinite }
        .gallery-track { display:flex; gap:10px; animation:marquee 55s linear infinite; width:max-content }
        .gallery-track:hover { animation-play-state:paused }
        .ai-dot-pulse  { animation:aiPulse 2.2s ease-in-out infinite }
        .btn-p:hover  { opacity:.88!important; transform:translateY(-2px)!important }
        .btn-g:hover  { background:${T.deepTeal}!important; color:#fff!important }
        .nav-lnk:hover { color:${T.deepTeal}!important }
        .card-hover:hover { transform:translateY(-4px)!important; box-shadow:0 16px 40px ${T.shadow}!important }
        .step-hover:hover { border-color:${T.deepTeal}40!important }
        .tr-row:hover { background:${T.bgAlt}!important }
        .feat-tab:hover { opacity:.8 }
        .mobile-menu { display:none }
        .dlinks, .nav-auth { display:flex }
        @media(max-width:900px) {
          .dlinks  { display:none!important }
          .nav-auth { display:none!important }
          .mobile-menu { display:flex!important }
          .hero-btns { flex-direction:column!important; align-items:stretch!important }
          .hero-btns a,.hero-btns button { text-align:center!important; justify-content:center!important }
          .hero-stats { gap:24px!important; flex-wrap:wrap!important; justify-content:center!important }
          .feat-tabs { grid-template-columns:repeat(4,1fr)!important }
          .feat-show { flex-direction:column!important }
          .feat-img  { width:100%!important; height:200px!important }
          .steps-grid { grid-template-columns:1fr 1fr!important }
          .test-grid  { grid-template-columns:1fr 1fr!important }
          .sec-grid   { grid-template-columns:1fr 1fr!important }
          .cmp-table  { font-size:12px!important }
          .section-pad { padding:60px 20px!important }
          .ai-banner-inner { flex-direction:column!important; text-align:center!important }
        }
        @media(max-width:520px) {
          .feat-tabs  { grid-template-columns:repeat(2,1fr)!important }
          .steps-grid { grid-template-columns:1fr!important }
          .test-grid  { grid-template-columns:1fr!important }
          .sec-grid   { grid-template-columns:1fr!important }
          .section-pad { padding:48px 16px!important }
          .hero-stats { gap:18px!important }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:scrolled?T.navBg:"transparent", backdropFilter:scrolled?"blur(20px)":"none", borderBottom:scrolled?`1px solid ${T.border}`:"none", transition:"all .3s" }}>
        <div style={{ maxWidth:1140, margin:"0 auto", padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:9, textDecoration:"none" }}>
            <div style={{ width:33, height:33, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>✈️</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:T.text, letterSpacing:"-.3px" }}>TripSync</span>
          </Link>
          <div className="dlinks" style={{ alignItems:"center", gap:30 }}>
            {[["#features","Features"],["#how","How it works"],["#compare","Compare"],["#reviews","Reviews"]].map(([h,l]) => (
              <a key={h} href={h} className="nav-lnk" style={{ fontSize:13, color:T.textMuted, textDecoration:"none", fontWeight:500, transition:"color .15s" }}>{l}</a>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={() => setDark(d => !d)} style={{ width:36, height:36, borderRadius:9, border:`1px solid ${T.border}`, background:T.bgCard, color:T.textMid, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s", flexShrink:0 }}>
              {dark ? <Sun size={15}/> : <Moon size={15}/>}
            </button>
            <button className="mobile-menu" onClick={() => setMenuOpen(p => !p)} style={{ width:36, height:36, borderRadius:9, border:`1px solid ${T.border}`, background:T.bgCard, color:T.textMid, alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <path d="M3 6h18M3 12h18M3 18h18"/>}
              </svg>
            </button>
            <div className="nav-auth" style={{ alignItems:"center", gap:8 }}>
              <Link to="/login"    className="btn-g" style={btnGhost}>Sign in</Link>
              <Link to="/register" className="btn-p" style={btnPrimary}>Get Started</Link>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div style={{ background:T.bgCard, borderTop:`1px solid ${T.border}`, padding:"10px 22px 22px" }}>
            {[["#features","Features"],["#how","How it works"],["#compare","Compare"],["#reviews","Reviews"]].map(([h,l]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)} style={{ display:"block", padding:"12px 0", fontSize:14, color:T.textMid, textDecoration:"none", borderBottom:`1px solid ${T.border}`, fontWeight:500 }}>{l}</a>
            ))}
            <div style={{ display:"flex", flexDirection:"column", gap:9, marginTop:18 }}>
              <Link to="/login"    onClick={() => setMenuOpen(false)} style={{ display:"block", padding:"12px", borderRadius:10, border:`1.5px solid ${T.deepTeal}`, color:T.deepTeal, fontSize:14, fontWeight:600, textDecoration:"none", textAlign:"center" }}>Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={{ display:"block", padding:"12px", borderRadius:10, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none", textAlign:"center" }}>Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ position:"relative", height:"100vh", minHeight:620, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`url(${HERO_IMAGE})`, backgroundSize:"cover", backgroundPosition:"center", opacity:heroLoaded?1:0, transition:"opacity 1.6s ease" }}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(10,20,22,.68) 0%, rgba(10,20,22,.28) 40%, rgba(10,20,22,.82) 100%)" }}/>
        <div style={{ position:"relative", zIndex:2, textAlign:"center", maxWidth:860, padding:"0 22px", opacity:heroLoaded?1:0, transition:"opacity 1s ease .4s" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 16px", borderRadius:100, background:"rgba(91,184,196,0.15)", border:"1px solid rgba(91,184,196,0.38)", backdropFilter:"blur(10px)", fontSize:12, color:"rgba(255,255,255,0.92)", marginBottom:28, fontWeight:600 }}>
            <Sparkles size={12} color="#5BB8C4"/>
            Now with TripSync AI — describe your trip, we'll plan it
          </div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(50px,9vw,96px)", fontWeight:700, lineHeight:1.0, letterSpacing:"-1.5px", marginBottom:20, color:"#FDFAF6" }}>
            Plan trips<br/><em style={{ fontStyle:"italic", color:"#5BB8C4" }}>together.</em>
          </h1>
          <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"rgba(253,250,246,0.72)", lineHeight:1.85, maxWidth:520, margin:"0 auto 32px", fontWeight:400 }}>
            AI-powered itineraries, smart expense splits, real-time chat and live presence — with your whole crew, all in one place.
          </p>
          <div className="hero-btns" style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:52 }}>
            <Link to="/register" className="btn-p" style={{ ...btnPrimary, padding:"13px 28px", fontSize:15, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, boxShadow:`0 8px 26px rgba(91,184,196,0.45)` }}>
              Start Planning Free <ArrowRight size={16}/>
            </Link>
            <a href="#features" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 28px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.28)", color:"rgba(255,255,255,0.88)", fontSize:15, fontWeight:600, textDecoration:"none", background:"rgba(255,255,255,0.08)", backdropFilter:"blur(8px)" }}>
              <Play size={13} fill="currentColor"/> See features
            </a>
          </div>
          <div className="hero-stats" style={{ display:"flex", gap:44, justifyContent:"center" }}>
            {[["10k+","Trips planned"],["50k+","Travelers"],["4.9★","Rating"],["AI","Powered"]].map(([v,l]) => (
              <div key={l}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,3vw,30px)", fontWeight:700, color:"#FDFAF6", lineHeight:1 }}>{v}</p>
                <p style={{ fontSize:11, color:"rgba(253,250,246,0.50)", marginTop:4 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="float-anim" style={{ position:"absolute", bottom:26, left:"50%", transform:"translateX(-50%)", opacity:0.4 }}>
          <ChevronDown size={22} color="#FDFAF6"/>
        </div>
      </section>

      {/* AI BANNER */}
      <div style={{ background:`linear-gradient(135deg,${T.deepTeal}14,${T.skyTeal}0a)`, borderTop:`1px solid ${T.deepTeal}20`, borderBottom:`1px solid ${T.deepTeal}20`, padding:"20px 32px" }}>
        <div className="ai-banner-inner" style={{ maxWidth:1020, margin:"0 auto", display:"flex", alignItems:"center", gap:18, justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div className="ai-dot-pulse" style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Sparkles size={20} color="#fff"/>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:3 }}>
                Introducing TripSync AI
                <span style={{ marginLeft:8, padding:"2px 8px", borderRadius:100, background:`${T.skyTeal}18`, border:`1px solid ${T.skyTeal}30`, fontSize:9, fontWeight:800, color:T.skyTeal, letterSpacing:1.5, textTransform:"uppercase", verticalAlign:"middle" }}>NEW</span>
              </p>
              <p style={{ fontSize:12, color:T.textMuted, lineHeight:1.6, maxWidth:520 }}>
                Just describe your dream trip — AI builds the full itinerary, splits expenses fairly, and optimizes your budget instantly.
              </p>
            </div>
          </div>
          <Link to="/register" className="btn-p" style={{ ...btnPrimary, fontSize:13, padding:"9px 18px", whiteSpace:"nowrap", flexShrink:0 }}>
            Try it free <ArrowRight size={13}/>
          </Link>
        </div>
      </div>

      {/* GALLERY MARQUEE */}
      <div style={{ background:T.bgAlt, borderBottom:`1px solid ${T.border}`, padding:"16px 0", overflow:"hidden" }}>
        <div className="gallery-track">
          {[...GALLERY,...GALLERY].map((src,i) => (
            <div key={i} style={{ width:196, height:116, borderRadius:10, overflow:"hidden", flexShrink:0, border:`1px solid ${T.border}` }}>
              <img src={src} alt="" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"saturate(0.75)" }}/>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="section-pad" style={{ padding:"88px 32px 96px", maxWidth:1140, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:50 }}>
            <SectionLabel color={T.skyTeal}>Everything included</SectionLabel>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"clamp(30px,5vw,54px)", color:T.text, lineHeight:1.08, marginBottom:14 }}>
              Seven features,<br/>one trip dashboard
            </h2>
            <p style={{ fontSize:15, color:T.textMuted, maxWidth:420, margin:"0 auto", lineHeight:1.75 }}>
              AI planning, itinerary, chat, budget, checklists, stays, live presence — all in one place.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div className="feat-tabs" style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5, marginBottom:18, background:T.bgAlt, border:`1px solid ${T.border}`, borderRadius:13, padding:5 }}>
            {FEATURES.map((f,i) => {
              const Icon = f.icon; const active = i === activeFeature; const c = accent(f.accentKey);
              return (
                <button key={i} onClick={() => setActiveFeature(i)} className="feat-tab"
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"10px 6px", borderRadius:9, border:"none", background:active?T.bgCard:"transparent", cursor:"pointer", boxShadow:active?`0 2px 12px ${T.shadow}`:"none", transition:"all .2s", position:"relative" }}>
                  {i === 0 && <span style={{ position:"absolute", top:5, right:5, width:5, height:5, borderRadius:"50%", background:T.skyTeal, boxShadow:`0 0 5px ${T.skyTeal}` }}/>}
                  <Icon size={15} color={active ? c : T.textMuted}/>
                  <span style={{ fontSize:10, fontWeight:700, color:active?c:T.textMuted, textAlign:"center", lineHeight:1.3 }}>
                    {i === 0 ? "AI" : f.title.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </FadeIn>
        <FadeIn delay={0.12}>
          <div className="feat-show card-hover" key={activeFeature} style={{ ...card, display:"flex", border:`1.5px solid ${afAccent}25`, transition:"box-shadow .2s, transform .2s", overflow:"hidden" }}>
            <div className="feat-img" style={{ width:"42%", flexShrink:0, position:"relative", minHeight:260 }}>
              <img src={af.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"saturate(0.78) brightness(0.75)" }}/>
              <div style={{ position:"absolute", inset:0, background:`linear-gradient(to right,transparent 40%,${T.bgCard})` }}/>
              <div style={{ position:"absolute", bottom:18, left:18, width:44, height:44, borderRadius:11, background:`${afAccent}18`, border:`1.5px solid ${afAccent}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <af.icon size={20} color={afAccent}/>
              </div>
            </div>
            <div style={{ flex:1, padding:"32px 28px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
              {activeFeature === 0 && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, background:`${T.skyTeal}14`, border:`1px solid ${T.skyTeal}28`, fontSize:10, fontWeight:800, color:T.skyTeal, marginBottom:10, width:"fit-content", letterSpacing:1 }}>
                  <Sparkles size={9}/> NEW FEATURE
                </span>
              )}
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:T.text, marginBottom:10, lineHeight:1.2 }}>{af.title}</h3>
              <p style={{ fontSize:14, color:T.textMid, lineHeight:1.85, marginBottom:20 }}>{af.desc}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {af.tags.map(tag => (
                  <span key={tag} style={{ padding:"4px 13px", borderRadius:100, background:`${afAccent}12`, border:`1px solid ${afAccent}28`, fontSize:11, fontWeight:700, color:afAccent }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.16}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center", marginTop:30 }}>
            {["AI trip builder","Smart expense splits","Live online presence","Real-time chat","Drag & drop reorder","Packing checklists","Reservation tracking","Role-based access","Invite by code","Google OAuth","Mobile friendly","Cover photos"].map(tag => (
              <span key={tag} style={{ padding:"5px 14px", borderRadius:100, background:T.bgCard, border:`1px solid ${T.border}`, fontSize:12, color:T.textMid, fontWeight:500 }}>{tag}</span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background:T.bgAlt, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, padding:"80px 24px" }}>
        <div style={{ maxWidth:1020, margin:"0 auto" }}>
          <FadeIn>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <SectionLabel color={T.sage}>How it works</SectionLabel>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"clamp(28px,4.5vw,50px)", color:T.text, lineHeight:1.08, marginBottom:12 }}>
                From idea to itinerary<br/>in four steps
              </h2>
              <p style={{ fontSize:14, color:T.textMuted, maxWidth:340, margin:"0 auto", lineHeight:1.75 }}>No learning curve. No credit card. Just great trips.</p>
            </div>
          </FadeIn>
          <div className="steps-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20 }}>
            {STEPS.map((s,i) => {
              const Icon = s.icon; const c = accent(s.accentKey);
              return (
                <FadeIn key={s.num} delay={i*0.09}>
                  <div className="step-hover" style={{ ...card, padding:"24px 20px", textAlign:"center", transition:"border-color .2s, transform .2s, box-shadow .2s" }}>
                    <div style={{ width:50, height:50, borderRadius:13, background:`${c}14`, border:`1.5px solid ${c}28`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                      <Icon size={22} color={c}/>
                    </div>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, fontWeight:700, color:`${T.text}10`, lineHeight:1, marginBottom:6 }}>{s.num}</p>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:700, color:T.text, marginBottom:8 }}>{s.title}</h3>
                    <p style={{ fontSize:13, color:T.textMuted, lineHeight:1.75 }}>{s.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section id="compare" className="section-pad" style={{ padding:"80px 32px", maxWidth:860, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:46 }}>
            <SectionLabel color={T.sage}>Why TripSync</SectionLabel>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"clamp(26px,4vw,48px)", color:T.text, lineHeight:1.08, marginBottom:12 }}>
              Finally built<br/>for group travel
            </h2>
            <p style={{ fontSize:14, color:T.textMuted, maxWidth:360, margin:"0 auto", lineHeight:1.75 }}>
              See how TripSync stacks up against tools people usually hack together.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div className="cmp-table" style={{ ...card, overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 110px 110px", padding:"13px 22px", background:T.bgAlt, borderBottom:`1px solid ${T.border}` }}>
              {["Feature","TripSync ✈️","Spreadsheet","WhatsApp"].map((h,i) => (
                <span key={h} style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", color:i===1?T.deepTeal:T.textMuted, textAlign:i>0?"center":"left" }}>{h}</span>
              ))}
            </div>
            {COMPARISON.map((row,i) => (
              <div key={row.feature} className="tr-row" style={{ display:"grid", gridTemplateColumns:"1fr 110px 110px 110px", padding:"12px 22px", borderBottom:i<COMPARISON.length-1?`1px solid ${T.bgAlt}`:"none", alignItems:"center", transition:"background .15s", background:i<2?`${T.skyTeal}05`:"transparent" }}>
                <span style={{ fontSize:13, color:T.textMid, fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
                  {i < 2 && <Sparkles size={10} color={T.skyTeal}/>}
                  {row.feature}
                </span>
                {[row.ts,row.ss,row.wa].map((v,j) => <span key={j} style={{ textAlign:"center", fontSize:16 }}>{v?"✅":"❌"}</span>)}
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" style={{ background:T.bgAlt, borderTop:`1px solid ${T.border}`, padding:"80px 28px" }}>
        <div style={{ maxWidth:1140, margin:"0 auto" }}>
          <FadeIn>
            <div style={{ textAlign:"center", marginBottom:46 }}>
              <SectionLabel color={T.skyTeal}>Loved by travelers</SectionLabel>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"clamp(26px,4vw,48px)", color:T.text, lineHeight:1.08 }}>
                What real groups say
              </h2>
            </div>
          </FadeIn>
          <div className="test-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {TESTIMONIALS.map((t,i) => {
              const c = accent(t.accentKey);
              return (
                <FadeIn key={t.name} delay={i*0.07}>
                  <div className="card-hover" style={{ ...card, padding:"22px 20px", transition:"transform .2s, box-shadow .2s" }}>
                    <div style={{ display:"flex", gap:3, marginBottom:14 }}>
                      {Array.from({length:5}).map((_,j) => <Star key={j} size={12} fill="#f59e0b" color="#f59e0b"/>)}
                    </div>
                    <p style={{ fontSize:13.5, color:T.textMid, lineHeight:1.8, marginBottom:18 }}>"{t.text}"</p>
                    <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:`${c}14`, border:`1.5px solid ${c}32`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:c, flexShrink:0 }}>{t.avatar}</div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:T.text }}>{t.name}</p>
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

      {/* SECURITY */}
      <section className="section-pad" style={{ padding:"80px 32px", maxWidth:1020, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:46 }}>
            <SectionLabel color={T.deepTeal}>Built right</SectionLabel>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"clamp(26px,4vw,48px)", color:T.text, lineHeight:1.08, marginBottom:12 }}>Secure by design</h2>
            <p style={{ fontSize:14, color:T.textMuted, maxWidth:360, margin:"0 auto", lineHeight:1.75 }}>Production-grade infrastructure so your trip data is always safe.</p>
          </div>
        </FadeIn>
        <div className="sec-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {SECURITY.map((s,i) => {
            const Icon = s.icon; const c = accent(s.accentKey);
            return (
              <FadeIn key={s.title} delay={i*0.07}>
                <div className="card-hover" style={{ ...card, padding:"20px 18px", transition:"transform .2s, box-shadow .2s" }}>
                  <div style={{ width:40, height:40, borderRadius:11, background:`${c}14`, border:`1.5px solid ${c}28`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                    <Icon size={18} color={c}/>
                  </div>
                  <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:700, color:T.text, marginBottom:7 }}>{s.title}</h4>
                  <p style={{ fontSize:12, color:T.textMuted, lineHeight:1.7 }}>{s.desc}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
        <FadeIn delay={0.18}>
          <div style={{ marginTop:24, padding:"14px 20px", background:T.bgAlt, border:`1px solid ${T.border}`, borderRadius:12, display:"flex", flexWrap:"wrap", gap:7, alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:10, fontWeight:800, letterSpacing:2, textTransform:"uppercase", color:T.textMuted, marginRight:4 }}>Stack</span>
            {["MongoDB","Express","React 18","Node.js","Socket.io","Redis","Cloudinary","Railway","Vercel"].map(t => (
              <span key={t} style={{ padding:"4px 12px", borderRadius:100, background:T.bgCard, border:`1px solid ${T.border}`, fontSize:11, color:T.textMid, fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* CTA */}
      <section style={{ background:`linear-gradient(140deg,${T.deepTeal} 0%,#0d5058 50%,#0a3c42 100%)`, padding:"90px 32px 100px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-10%", left:"10%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${T.skyTeal}18 0%,transparent 65%)`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"-20%", right:"5%", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,${T.sage}14 0%,transparent 70%)`, pointerEvents:"none" }}/>
        <FadeIn>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:18 }}>
            <Sparkles size={22} color="#5BB8C4" style={{ opacity:0.7 }}/>
            <Globe2 size={34} color="#5BB8C4" style={{ opacity:0.65 }}/>
            <Sparkles size={16} color="#5BB8C4" style={{ opacity:0.45 }}/>
          </div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(32px,6vw,64px)", fontWeight:700, lineHeight:1.06, marginBottom:16, color:"#FDFAF6" }}>
            Your next adventure<br/><em style={{ fontStyle:"italic", color:"#5BB8C4" }}>starts here.</em>
          </h2>
          <p style={{ fontSize:15, color:"rgba(253,250,246,0.60)", maxWidth:420, margin:"0 auto 36px", lineHeight:1.8 }}>
            Free to start. AI plans it. No credit card. Invite your whole crew in under 30 seconds.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/register" className="btn-p" style={{ ...btnPrimary, background:`linear-gradient(135deg,#5BB8C4,#7dd3d8)`, color:"#0d2224", fontSize:15, padding:"14px 30px", fontWeight:800, boxShadow:"0 8px 26px rgba(91,184,196,0.45)" }}>
              Create Free Account <ArrowRight size={16}/>
            </Link>
            <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 30px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.22)", color:"rgba(255,255,255,0.85)", fontSize:15, fontWeight:500, textDecoration:"none", background:"rgba(255,255,255,0.06)", backdropFilter:"blur(6px)" }}>
              Sign In
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer style={{ background:T.footerBg, borderTop:"1px solid rgba(255,255,255,0.05)", padding:"24px 32px" }}>
        <div style={{ maxWidth:1140, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:26, height:26, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>✈️</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontWeight:700, color:"rgba(253,250,246,0.75)" }}>TripSync</span>
          </div>
          <p style={{ fontSize:12, color:"rgba(253,250,246,0.25)" }}>Built with ❤️ for travelers everywhere</p>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[["#features","Features"],["#how","How it works"],["#compare","Compare"],["/login","Sign in"],["/register","Register"]].map(([to,lbl]) => (
              to.startsWith("#")
                ? <a key={to} href={to} style={{ fontSize:12, color:"rgba(253,250,246,0.28)", textDecoration:"none" }}>{lbl}</a>
                : <Link key={to} to={to} style={{ fontSize:12, color:"rgba(253,250,246,0.28)", textDecoration:"none" }}>{lbl}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}