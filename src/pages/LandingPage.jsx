import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Users,
  Calendar,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Globe2,
  ChevronDown,
  Play,
} from "lucide-react";

// Unsplash travel images — free to use
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=80";
const FEATURE_IMGS = [
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", // lake + mountains
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80", // road trip
  "https://images.unsplash.com/photo-1682687982502-1529b3b33f85?w=800&q=80", // travel group
];
const GALLERY = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=70", // beach
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=70", // mountains
  "https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=600&q=70", // city
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=70", // temple
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=70", // tuscany
  "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amFpcHVyfGVufDB8fDB8fHww", // jaipur
  "https://plus.unsplash.com/premium_photo-1661919589683-f11880119fb7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZGVsaGl8ZW58MHx8MHx8fDA%3D", // Delhi
  "https://plus.unsplash.com/premium_photo-1697729690458-2d64ca777c04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c2hpbWxhfGVufDB8fDB8fHww", // Shimla
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function FadeIn({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  {
    icon: Calendar,
    title: "Day-by-Day Itinerary",
    desc: "Build detailed day plans with drag-and-drop activities. Reorder on the fly as your trip evolves.",
    color: "#4f8ef7",
    img: FEATURE_IMGS[0],
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    desc: "Invite friends with a single code. Edit together live — everyone sees changes the moment they happen.",
    color: "#a855f7",
    img: FEATURE_IMGS[1],
  },
  {
    icon: Zap,
    title: "Budget Tracking",
    desc: "Log expenses by category, track who paid what, and see exactly where your money goes.",
    color: "#f59e0b",
    img: FEATURE_IMGS[2],
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create a Trip",
    desc: "Set your dates, destination, and budget in under a minute.",
  },
  {
    num: "02",
    title: "Invite Your Crew",
    desc: "Share a 6-digit code. Friends join instantly — no sign-up friction.",
  },
  {
    num: "03",
    title: "Plan Together",
    desc: "Add activities, vote on places, split costs, attach confirmations.",
  },
  {
    num: "04",
    title: "Travel & Track",
    desc: "Check off activities, log expenses, and keep reservations at your fingertips.",
  },
];

const TESTIMONIALS = [
  {
    name: "Poonam S.",
    location: "Bangalore",
    text: "We planned a 10-day Europe trip for 6 people. No more 200-message WhatsApp threads.",
    avatar: "P",
  },
  {
    name: "Hitesha C.",
    location: "Jaipur",
    text: "The drag-and-drop itinerary builder alone is worth it. Absolute game changer.",
    avatar: "H",
  },
  {
    name: "Amanjot K.",
    location: "New Delhi",
    text: "Budget tracking saved us from overspending. Saw category breakdowns in real time.",
    avatar: "A",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = HERO_IMAGE;
    img.onload = () => setHeroLoaded(true);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#07070f",
        color: "#f0f0f5",
        overflowX: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600&display=swap');
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d0d18; }
        ::-webkit-scrollbar-thumb { background: #3a3a5c; border-radius: 3px; }
        .playfair { font-family: 'Playfair Display', serif; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes grain { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-2%,-3%)} 50%{transform:translate(1%,2%)} 75%{transform:translate(3%,-1%)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .float-anim { animation: float 6s ease-in-out infinite; }
        .grain::after { content:''; position:fixed; inset:-50%; width:200%; height:200%; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:0.035; pointer-events:none; z-index:1000; animation: grain 8s steps(2) infinite; }
      `}</style>

      <div className="grain" />

      {/* ── NAVBAR */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(7,7,15,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-sm">✈</span>
          </div>

          <span className="text-white text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trip
            </span>
            Sync
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/login"
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#c0c0d8",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.12)")
            }
          >
            Sign in
          </Link>
          <Link
            to="/register"
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              background: "linear-gradient(135deg,#4f8ef7,#7c3aed)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(79,142,247,0.3)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── HERO */}
      <section
        style={{
          position: "relative",
          height: "100vh",
          minHeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: "scale(1.05)",
            opacity: heroLoaded ? 0.45 : 0,
            transition: "opacity 1.5s ease",
          }}
        />
        {/* Gradient overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(7,7,15,0.3) 0%, rgba(7,7,15,0.1) 50%, rgba(7,7,15,0.85) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(79,142,247,0.08), transparent)",
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            maxWidth: 820,
            padding: "0 24px",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 12,
              fontWeight: 500,
              color: "#a0b4d0",
              marginBottom: 32,
              opacity: heroLoaded ? 1 : 0,
              transition: "opacity 1s ease 0.2s",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#34d399",
                display: "inline-block",
              }}
            />
            Collaborative trip planning — built for friend groups
          </div>

          <h1
            className="playfair"
            style={{
              fontSize: "clamp(48px, 8vw, 88px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-2px",
              marginBottom: 24,
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 1s ease 0.4s, transform 1s ease 0.4s",
            }}
          >
            Plan trips
            <br />
            <em
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg,#60a5fa,#c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              together.
            </em>
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#9090b0",
              lineHeight: 1.7,
              maxWidth: 520,
              margin: "0 auto 40px",
              opacity: heroLoaded ? 1 : 0,
              transition: "opacity 1s ease 0.6s",
            }}
          >
            One place for your itinerary, budget, packing lists, and
            reservations — with your whole crew, in real time.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              opacity: heroLoaded ? 1 : 0,
              transition: "opacity 1s ease 0.8s",
            }}
          >
            <Link
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: 12,
                background: "linear-gradient(135deg,#4f8ef7,#7c3aed)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 8px 32px rgba(79,142,247,0.35)",
              }}
            >
              Start Planning Free <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#c0c0d8",
                fontSize: 15,
                fontWeight: 500,
                textDecoration: "none",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <Play size={14} fill="currentColor" /> See how it works
            </a>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: 40,
              justifyContent: "center",
              marginTop: 60,
              opacity: heroLoaded ? 1 : 0,
              transition: "opacity 1s ease 1s",
            }}
          >
            {[
              ["10k+", "Trips planned"],
              ["50k+", "Travelers"],
              ["4.9★", "Rating"],
            ].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p
                  className="playfair"
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {val}
                </p>
                <p style={{ fontSize: 12, color: "#606080", marginTop: 4 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            animation: "float 2s ease-in-out infinite",
            opacity: 0.4,
          }}
        >
          <ChevronDown size={24} color="#fff" />
        </div>
      </section>

      {/* ── GALLERY STRIP */}
      <section style={{ padding: "0 0 80px", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, padding: "0 40px" }}>
          {GALLERY.map((src, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div
                style={{
                  width: 219,
                  height: 130,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <img
                  src={src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "saturate(0.8)",
                  }}
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES */}
      <section
        id="features"
        style={{ padding: "80px 40px 100px", maxWidth: 1100, margin: "0 auto" }}
      >
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p
              style={{
                fontSize: 12,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#4f8ef7",
                marginBottom: 16,
              }}
            >
              Features
            </p>
            <h2
              className="playfair"
              style={{
                fontSize: "clamp(32px,5vw,52px)",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Everything your group
              <br />
              needs to travel better
            </h2>
          </div>
        </FadeIn>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeIn key={f.title} delay={i * 0.12}>
                <div
                  style={{
                    background: "#0f0f1a",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 20,
                    overflow: "hidden",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = f.color + "50";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.07)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      height: 180,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={f.img}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "saturate(0.7) brightness(0.6)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(to top, #0f0f1a, transparent)`,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 16,
                        left: 20,
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: f.color + "20",
                        border: `1px solid ${f.color}40`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} color={f.color} />
                    </div>
                  </div>
                  {/* Content */}
                  <div style={{ padding: "20px 24px 24px" }}>
                    <h3
                      style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}
                    >
                      {f.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "#808098",
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Extra feature pills */}
        <FadeIn delay={0.3}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              marginTop: 40,
            }}
          >
            {[
              "Drag & drop reorder",
              "File attachments",
              "Packing checklists",
              "Reservation tracking",
              "Role-based access",
              "Invite by code or email",
              "Expense splitting",
              "Live presence",
            ].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "7px 16px",
                  borderRadius: 100,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  color: "#8080a0",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── HOW IT WORKS */}
      <section
        id="how"
        style={{
          padding: "80px 40px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p
                style={{
                  fontSize: 12,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "#a855f7",
                  marginBottom: 16,
                }}
              >
                How it works
              </p>
              <h2
                className="playfair"
                style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800 }}
              >
                From idea to itinerary
                <br />
                in four steps
              </h2>
            </div>
          </FadeIn>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 32,
            }}
          >
            {STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.1}>
                <div style={{ textAlign: "center" }}>
                  <div
                    className="playfair"
                    style={{
                      fontSize: 48,
                      fontWeight: 900,
                      color: "rgba(255,255,255,0.06)",
                      lineHeight: 1,
                      marginBottom: 16,
                    }}
                  >
                    {step.num}
                  </div>
                  <div
                    style={{
                      width: 1,
                      height: 32,
                      background:
                        "linear-gradient(to bottom,rgba(79,142,247,0.5),transparent)",
                      margin: "0 auto 16px",
                    }}
                  />
                  <h3
                    style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{ fontSize: 13, color: "#606080", lineHeight: 1.7 }}
                  >
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS */}
      <section
        style={{ padding: "80px 40px", maxWidth: 1000, margin: "0 auto" }}
      >
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p
              style={{
                fontSize: 12,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#f59e0b",
                marginBottom: 16,
              }}
            >
              Loved by travelers
            </p>
            <h2
              className="playfair"
              style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800 }}
            >
              What our users say
            </h2>
          </div>
        </FadeIn>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div
                style={{
                  background: "#0f0f1a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "#b0b0c8",
                    lineHeight: 1.7,
                    marginBottom: 20,
                  }}
                >
                  "{t.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#4f8ef7,#a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#606080",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MapPin size={10} /> {t.location}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION */}
      <section
        style={{
          padding: "80px 40px 100px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <FadeIn>
          <Globe2
            size={40}
            color="#4f8ef7"
            style={{ margin: "0 auto 24px", opacity: 0.7 }}
          />
          <h2
            className="playfair"
            style={{
              fontSize: "clamp(32px,5vw,58px)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Your next adventure
            <br />
            <em style={{ fontStyle: "italic", color: "#60a5fa" }}>
              starts here.
            </em>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#707090",
              maxWidth: 440,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            Free to start. No credit card. Invite your whole crew in under 30
            seconds.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 36px",
                borderRadius: 12,
                background: "linear-gradient(135deg,#4f8ef7,#7c3aed)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 8px 40px rgba(79,142,247,0.4)",
              }}
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 36px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#c0c0d8",
                fontSize: 15,
                fontWeight: 500,
                textDecoration: "none",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              Sign In
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "32px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              background: "linear-gradient(135deg,#4f8ef7,#a855f7)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
          >
            ✈️
          </div>
          <span className="playfair" style={{ fontSize: 15, fontWeight: 700 }}>
            TripSync
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#404060" }}>
          Built with ❤️ for travelers everywhere
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          <Link
            to="/login"
            style={{ fontSize: 12, color: "#404060", textDecoration: "none" }}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            style={{ fontSize: 12, color: "#404060", textDecoration: "none" }}
          >
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
}
