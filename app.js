/* ============================================================
   Jo Academy demo — Amplitude wiring
   Event + property names match the approved taxonomy EXACTLY.
   ============================================================ */

/* ---------- Amplitude init (exact lessons-A shape) ---------- */
(function () {
  const KEY = "joacademy_device_id";
  let id; try { id = localStorage.getItem(KEY); } catch (e) {}
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : "dev_" + Math.random().toString(36).slice(2));
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }
  // graceful guard: if the SDK script hasn't loaded (e.g. local preview before
  // the real key is swapped in), skip init so the page still renders + clicks.
  if (!window.amplitude || !window.amplitude.add || !window.sessionReplay) {
    console.warn("[Amplitude] SDK not loaded — running in preview mode (no events sent).");
    return;
  }
  window.amplitude.add(window.sessionReplay.plugin({ sampleRate: 1 }));
  window.amplitude.init("eb773c457a4b5fa697ae4508bac2799d", {
    deviceId: id,
    fetchRemoteConfig: true,
    autocapture: {
      sessions: true, attribution: true, pageViews: false, formInteractions: false,
      fileDownloads: false, elementInteractions: false, networkTracking: false,
      webVitals: false, frustrationInteractions: false
    }
  });
})();

/* ---------- tiny helpers ---------- */
function track(name, props) {
  try { window.amplitude.track(name, props || {}); } catch (e) {}
  console.log("[event]", name, props || {});
}
function ident(props) {
  try {
    const i = new window.amplitude.Identify();
    Object.entries(props).forEach(([k, v]) => i.set(k, v));
    window.amplitude.identify(i);
  } catch (e) {}
  console.log("[identify]", props);
}
function qp(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ---------- state ---------- */
const STATE = {
  track: "Tawjihi Scientific",
  plan: { name: "Premium — Monthly", price: 19.99, key: "premium" },
  returning: false,
  localPay: false,
  user: null
};

const TRACKS = [
  { ic: "🔬", name: "Tawjihi Scientific", desc: "Physics, Chemistry, Math & Biology" },
  { ic: "📖", name: "Tawjihi Literary", desc: "Arabic, History, Geography & more" },
  { ic: "📐", name: "Grade 11", desc: "New curriculum, all subjects" },
  { ic: "🎓", name: "Grade 12", desc: "Full-year prep & past papers" },
  { ic: "🏛️", name: "University Prep", desc: "Foundation & first-year courses" },
  { ic: "✏️", name: "Intermediate", desc: "Grades 7–10 core subjects" }
];

const COURSES = [
  { id: "PHY-204", title: "Tawjihi Physics — Full Course", track: "Tawjihi Scientific", teacher: "Dr. Sami", rating: 4.8 },
  { id: "MAT-118", title: "Calculus Made Simple", track: "Tawjihi Scientific", teacher: "Ms. Rana", rating: 4.9 },
  { id: "ARB-090", title: "Arabic Grammar Mastery", track: "Tawjihi Literary", teacher: "Mr. Khalil", rating: 4.7 },
  { id: "CHE-211", title: "Organic Chemistry Crash Course", track: "Tawjihi Scientific", teacher: "Dr. Lina", rating: 4.6 },
  { id: "ENG-150", title: "English for Tawjihi", track: "Tawjihi Literary", teacher: "Ms. Dana", rating: 4.8 },
  { id: "UNI-301", title: "University Math Foundations", track: "University Prep", teacher: "Dr. Omar", rating: 4.5 }
];

const PLANS = [
  { key: "basic",   name: "Basic — Monthly",   price: 9.99,   tag: "1 subject",  sub: "/month" },
  { key: "premium", name: "Premium — Monthly", price: 19.99,  tag: "Most popular", sub: "/month" },
  { key: "annual",  name: "Annual — All access", price: 149.99, tag: "Best value", sub: "/year" }
];

/* ---------- navigation ---------- */
const views = ["landing", "catalog", "login", "signup", "plan", "checkout", "success"];
function show(view) {
  views.forEach(v => {
    const el = document.getElementById("view-" + v);
    if (el) el.hidden = (v !== view);
  });
  window.scrollTo(0, 0);
  if (view === "landing")  track("Landing Page Viewed", marketingProps());
  if (view === "signup")   track("Sign Up Started", { grade_track: STATE.track });
  if (view === "plan")     onPlanView();
}

/* ---------- marketing attribution (from URL or default) ---------- */
function marketingProps() {
  const src = qp("utm_source"); const med = qp("utm_medium");
  const camp = qp("utm_campaign"); const chan = qp("marketing_channel");
  const p = {
    utm_source: src || "direct",
    utm_medium: med || "direct",
    utm_campaign: camp || "none",
    marketing_channel: chan || "Direct",
    referrer_source: chan || (src || "Direct"),
    is_return_visit: STATE.returning
  };
  return p;
}

/* ---------- render ---------- */
function renderTracks() {
  const g = document.getElementById("trackGrid");
  g.innerHTML = "";
  TRACKS.forEach(t => {
    const c = document.createElement("div");
    c.className = "track-card";
    c.innerHTML = `<div class="t-ic">${t.ic}</div><h3>${t.name}</h3><p>${t.desc}</p>`;
    c.setAttribute("aria-label", t.name);
    c.onclick = () => {
      STATE.track = t.name;
      track("Subject Browsed", { grade_track: t.name, courses_visible: COURSES.length });
      show("catalog");
    };
    g.appendChild(c);
  });
  const sel = document.getElementById("suTrack");
  sel.innerHTML = TRACKS.map(t => `<option>${t.name}</option>`).join("");
}

function renderCourses(list) {
  const g = document.getElementById("courseGrid");
  g.innerHTML = "";
  (list || COURSES).forEach(co => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `
      <div class="course-thumb"><span class="tag">${co.track}</span></div>
      <div class="course-body">
        <h3>${co.title}</h3>
        <div class="course-meta"><span>👨‍🏫 ${co.teacher}</span><span>★ ${co.rating}</span></div>
        <div class="course-actions">
          <button class="btn btn-primary btn-sm" aria-label="Subscribe to ${co.title}">Subscribe</button>
          <button class="save-btn" aria-label="Save ${co.title}">♡ Save</button>
        </div>
      </div>`;
    const [subBtn, saveBtn] = card.querySelectorAll("button");
    subBtn.onclick = () => {
      track("Course Review Read", { course_id: co.id, grade_track: co.track, teacher_rating: co.rating });
      STATE.track = co.track;
      // logged-in returning user -> straight to paywall (saved card); else sign up first
      show(STATE.user ? "plan" : "signup");
    };
    saveBtn.onclick = () => {
      saveBtn.classList.toggle("saved");
      track("Course Saved", { course_id: co.id, grade_track: co.track });
    };
    g.appendChild(card);
  });
}

/* ---------- plan / paywall (FRICTION) ---------- */
function renderPlans() {
  const g = document.getElementById("planGrid");
  g.innerHTML = "";
  PLANS.forEach(p => {
    const el = document.createElement("div");
    el.className = "plan" + (p.key === STATE.plan.key ? " selected" : "");
    el.innerHTML = `<span class="p-tag">${p.tag}</span><div class="p-name">${p.name.split(" — ")[0]}</div>
      <div class="p-price">${p.price.toFixed(2)}<small> JOD${p.sub}</small></div>`;
    el.setAttribute("aria-label", p.name);
    el.onclick = () => {
      STATE.plan = { name: p.name, price: p.price, key: p.key };
      renderPlans();
    };
    g.appendChild(el);
  });
}

function onPlanView() {
  renderPlans();
  applyLocalPay();   // reflects ?treatment=1 backstage control (default: card-only friction)
  // FRICTION EVENT — fires on Account Created -> Checkout Started transition
  track("Plan & Payment Viewed", {
    plan_price: STATE.plan.price,
    total_amount: STATE.plan.price,
    trial_offer_eligible: STATE.localPay,
    payment_method_saved: STATE.returning,
    grade_track: STATE.track
  });
}

function applyLocalPay() {
  const wrap = document.getElementById("payMethods");
  const note = document.getElementById("cardOnlyNote");

  // Returning / logged-in user: saved card on file -> NO friction
  if (STATE.returning) {
    wrap.innerHTML = `<div class="pay-method selected"><span class="pm-ic">💳</span> Saved card •••• 4242</div>`;
    note.textContent = "✓ Welcome back — your saved card is ready. One click to subscribe.";
    note.style.background = "#E8F7EE"; note.style.color = "#16803C";
    return;
  }

  // New user: card always shown
  wrap.innerHTML = `<div class="pay-method selected"><span class="pm-ic">💳</span> Visa / Mastercard</div>`;
  if (STATE.localPay) {
    wrap.innerHTML += `
      <div class="pay-method local"><span class="pm-ic">🔁</span> CliQ</div>
      <div class="pay-method local"><span class="pm-ic">🧾</span> eFAWATEERcom</div>
      <div class="pay-method local"><span class="pm-ic">💵</span> Cash at agent</div>`;
    note.textContent = "✓ Local payment options enabled — pay with CliQ, eFAWATEERcom or cash. Start a 7-day free trial.";
    note.style.background = "#E8F7EE"; note.style.color = "#16803C";
  } else {
    note.textContent = "⚠️ A credit / debit card is required to continue. Local options (CliQ, eFAWATEERcom, cash) are not available.";
    note.style.background = ""; note.style.color = "";
  }
}

/* ---------- wire up ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderTracks();
  renderCourses();
  renderPlans();

  // SE backstage controls via URL params (invisible to prospects):
  //   ?returning=1  -> returning-user segment
  //   ?treatment=1  (or ?localpay=1) -> show the local-payment "fix" at the paywall
  STATE.returning = (qp("returning") === "1");
  STATE.localPay  = (qp("treatment") === "1" || qp("localpay") === "1");

  // capture marketing attribution + segment as user properties at first load
  ident({
    utm_source: qp("utm_source") || "direct",
    utm_medium: qp("utm_medium") || "direct",
    utm_campaign: qp("utm_campaign") || "none",
    marketing_channel: qp("marketing_channel") || "Direct",
    is_returning_user: STATE.returning,
    payment_method_saved: STATE.returning
  });

  // fire landing + promo banner view
  track("Landing Page Viewed", marketingProps());
  track("Promo Banner Viewed", { promo_type: "free_first_lesson" });

  // nav buttons (data-nav)
  document.querySelectorAll("[data-nav]").forEach(b => {
    b.addEventListener("click", e => { e.preventDefault(); show(b.getAttribute("data-nav")); });
  });

  // search
  const doSearch = () => {
    const q = (document.getElementById("searchInput").value || "").trim();
    const list = q ? COURSES.filter(c => (c.title + c.track).toLowerCase().includes(q.toLowerCase())) : COURSES;
    track("Course Searched", { search_term: q || "(all)", results_count: list.length });
    renderCourses(list);
  };
  document.getElementById("searchBtn").onclick = doSearch;
  document.getElementById("searchInput").addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });

  // create account
  document.getElementById("createAccountBtn").onclick = () => {
    const email = (document.getElementById("suEmail").value || "").trim() || ("student_" + Date.now() + "@joacademy.demo");
    const track_ = document.getElementById("suTrack").value || STATE.track;
    STATE.track = track_;
    STATE.returning = false;            // create-account = NEW user -> hits the paywall friction
    STATE.user = email;
    try { window.amplitude.setUserId(email); } catch (e) {}
    ident({
      is_returning_user: false,
      membership_tier: "free",
      grade_track: track_,
      payment_method_saved: false,
      account_age_days: 0,
      device_type: window.innerWidth <= 760 ? "mobile" : "desktop"
    });
    track("Account Created", { grade_track: track_, is_first_subscription: true });
    updateBadge();
    show("plan");
  };

  // log in -> RETURNING user with a saved card (smooth, no friction)
  document.getElementById("loginBtn").onclick = () => {
    const email = (document.getElementById("liEmail").value || "").trim() || ("member_" + Date.now() + "@joacademy.demo");
    STATE.returning = true;
    STATE.user = email;
    try { window.amplitude.setUserId(email); } catch (e) {}
    ident({
      is_returning_user: true,
      payment_method_saved: true,
      membership_tier: "premium",
      account_age_days: 180,
      device_type: window.innerWidth <= 760 ? "mobile" : "desktop"
    });
    updateBadge();
    show("catalog");
  };

  // continue -> checkout
  document.getElementById("continuePayBtn").onclick = () => {
    track("Checkout Started", {
      plan_price: STATE.plan.price, total_amount: STATE.plan.price,
      payment_method_saved: STATE.returning, trial_offer_eligible: STATE.localPay,
      grade_track: STATE.track
    });
    document.getElementById("coPlanName").textContent = STATE.plan.name;
    document.getElementById("coTotal").textContent = STATE.plan.price.toFixed(2) + " JOD";
    show("checkout");
  };

  // abandon at paywall
  document.getElementById("abandonBtn").onclick = () => {
    track("Signup Abandoned", { abandonment_trigger: "pricing_screen", plan_price_total: STATE.plan.price, promo_attempted: false });
    show("landing");
  };

  // promo code
  document.getElementById("applyPromoBtn").onclick = () => {
    const code = (document.getElementById("coPromo").value || "").trim().toUpperCase();
    const valid = code === "TAWJIHI10";
    track("Promo Code Entered", { code_entered: code || "(empty)", code_valid: valid, discount_value: valid ? +(STATE.plan.price * 0.1).toFixed(2) : 0 });
  };

  // pay & activate
  document.getElementById("payActivateBtn").onclick = () => {
    const subId = "SUB-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    ident({ membership_tier: STATE.plan.key === "annual" ? "premium" : STATE.plan.key });
    track("Subscription Activated", {
      subscription_id: subId, grade_track: STATE.track,
      plan_price: STATE.plan.price, total_amount: STATE.plan.price,
      is_first_subscription: !STATE.returning, promo_applied: false
    });
    document.getElementById("successSubId").textContent = subId;
    show("success");
  };

  document.getElementById("cancelCheckoutBtn").onclick = () => {
    track("Signup Abandoned", { abandonment_trigger: "checkout", plan_price_total: STATE.plan.price, promo_attempted: false });
    show("landing");
  };

  // logout (keeps stable deviceId — never reset())
  document.getElementById("logoutBtn").onclick = () => {
    try { window.amplitude.setUserId(undefined); } catch (e) {}
    STATE.user = null; STATE.returning = false; updateBadge();
    show("landing");
  };

  // flush replay on unload
  window.addEventListener("beforeunload", () => track("Session Ended", {}));
});

function updateBadge() {
  const badge = document.getElementById("userBadge");
  const logout = document.getElementById("logoutBtn");
  const loginH = document.getElementById("loginBtnHeader");
  const startH = document.getElementById("startBtnHeader");
  if (STATE.user) {
    badge.hidden = false; logout.hidden = false;
    if (loginH) loginH.hidden = true;
    if (startH) startH.hidden = true;
    badge.textContent = "👤 " + STATE.user.split("@")[0];
  } else {
    badge.hidden = true; logout.hidden = true;
    if (loginH) loginH.hidden = false;
    if (startH) startH.hidden = false;
  }
}
