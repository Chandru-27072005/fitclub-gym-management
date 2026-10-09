import { useEffect, useMemo, useState } from "react";



import {



  Activity, Bell, CalendarDays, Check, ChevronDown, ChevronRight,



  CircleDollarSign, CreditCard, Dumbbell, Edit2, LayoutDashboard,



  Menu, Plus, Search, Settings, ShieldCheck, Trash2, TrendingUp,



  Users, X, Zap, RefreshCw, BarChart3, UserRound,



} from "lucide-react";



import {



  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,



} from "recharts";



import "./App.css";







const API = `${import.meta.env.VITE_API_URL}/api/members`;

const ATTENDANCE_API = `${import.meta.env.VITE_API_URL}/api/attendance`;
const PAYMENT_API = `${import.meta.env.VITE_API_URL}/api/payments`;

// Attach the current admin JWT to authenticated API requests.
async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem("fitclub_token");
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}







const navItems = [



  { name: "Dashboard", icon: LayoutDashboard },



  { name: "Members", icon: Users },



  { name: "Membership Plans", icon: CreditCard },



  { name: "Attendance", icon: CalendarDays },

  { name: "Payments", icon: CircleDollarSign },



  { name: "Trainers & Workouts", icon: Dumbbell },



  { name: "Reports", icon: BarChart3 },



  { name: "Settings", icon: Settings },



];







const plans = [



  { name: "Basic", price: 999, color: "#28bd85", desc: "For getting started" },



  { name: "Standard", price: 1999, color: "#4b9cff", desc: "For everyday fitness" },



  { name: "Premium", price: 3999, color: "#bc80ff", desc: "For serious training" },



];







const revenueData = [



  { month: "May", amount: 18000 },



  { month: "Jun", amount: 24000 },



  { month: "Jul", amount: 27000 },



  { month: "Aug", amount: 22000 },



  { month: "Sep", amount: 35000 },



  { month: "Oct", amount: 42800 },



];







function unwrapList(payload) {



  if (Array.isArray(payload)) return payload;



  if (Array.isArray(payload?.data)) return payload.data;



  if (Array.isArray(payload?.members)) return payload.members;



  return [];



}







function memberId(member) {



  return member?._id ?? member?.id;



}







function initials(name = "Member") {



  return name.trim().split(/\s+/).slice(0, 2)



    .map((word) => word[0]?.toUpperCase()).join("");



}







function dateLabel(value) {



  if (!value) return "—";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) return "—";



  return date.toLocaleDateString("en-IN", {



    day: "2-digit", month: "short", year: "numeric",



  });



}







function App() {



  const [isLoggedIn, setIsLoggedIn] = useState(

    () => Boolean(sessionStorage.getItem("fitclub_token"))

  );

  const [loginEmail, setLoginEmail] = useState("");

  const [loginPassword, setLoginPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);

  const [loginError, setLoginError] = useState("");

  const [adminUser, setAdminUser] = useState(() => {

    try {

      return JSON.parse(sessionStorage.getItem("fitclub_admin") || "null");

    } catch {

      return null;

    }

  });



  const [page, setPage] = useState("Dashboard");



  const [members, setMembers] = useState([]);



  const [loading, setLoading] = useState(true);



  const [saving, setSaving] = useState(false);



  const [error, setError] = useState("");



  const [notice, setNotice] = useState("");



  const [search, setSearch] = useState("");



  const [planFilter, setPlanFilter] = useState("All Plans");



  const [mobileMenu, setMobileMenu] = useState(false);



  const [modalOpen, setModalOpen] = useState(false);



  const [editingMember, setEditingMember] = useState(null);



  const emptyForm = { name: "", email: "", phone: "", plan: "Standard" };



  const [form, setForm] = useState(emptyForm);

  const [attendance, setAttendance] = useState([]);

  const [attendanceSummary, setAttendanceSummary] = useState({ total: 0, checkedIn: 0, completed: 0 });

  const [attendanceDate, setAttendanceDate] = useState(() => {

    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  });

  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [attendanceSaving, setAttendanceSaving] = useState(false);

  const [payments, setPayments] = useState([]);

  const [paymentSummary, setPaymentSummary] = useState({ totalPayments: 0, totalCollected: 0, pendingAmount: 0, failedPayments: 0 });

  const [paymentLoading, setPaymentLoading] = useState(false);

  const [paymentSaving, setPaymentSaving] = useState(false);

  const [paymentForm, setPaymentForm] = useState({ memberId: "", amount: "", method: "UPI", status: "Paid", transactionId: "", notes: "" });







  async function loadMembers(showLoader = true) {



    try {



      if (showLoader) setLoading(true);



      setError("");



      const response = await apiFetch(API);



      const payload = await response.json();



      if (!response.ok) throw new Error(payload.message || "Unable to load members.");



      setMembers(unwrapList(payload));



    } catch (err) {



      console.error("Load members:", err);



      setError("Backend connection failed. Check the server and MongoDB connection.");



    } finally {



      setLoading(false);



    }



  }







  async function loadAttendance(date = attendanceDate) {

    try {

      setAttendanceLoading(true);

      const [listResponse, summaryResponse] = await Promise.all([

        apiFetch(`${ATTENDANCE_API}?date=${encodeURIComponent(date)}`),

        apiFetch(`${ATTENDANCE_API}/summary/today`),

      ]);

      const listPayload = await listResponse.json();

      const summaryPayload = await summaryResponse.json();

      if (!listResponse.ok) throw new Error(listPayload.message || "Unable to load attendance.");

      if (!summaryResponse.ok) throw new Error(summaryPayload.message || "Unable to load today's summary.");

      setAttendance(unwrapList(listPayload));

      setAttendanceSummary({

        total: Number(summaryPayload.total || 0),

        checkedIn: Number(summaryPayload.checkedIn || 0),

        completed: Number(summaryPayload.completed || 0),

      });

    } catch (err) {

      console.error("Load attendance:", err);

      setError(err.message || "Unable to load attendance records.");

    } finally {

      setAttendanceLoading(false);

    }

  }



  async function checkInMember(event) {

    event.preventDefault();

    if (!selectedMemberId) {

      setError("Please select a member to check in.");

      return;

    }

    try {

      setAttendanceSaving(true);

      setError("");

      setNotice("");

      const response = await apiFetch(`${ATTENDANCE_API}/check-in`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ memberId: selectedMemberId }),

      });

      const payload = await response.json();

      if (!response.ok) throw new Error(payload.message || "Check-in failed.");

      setNotice(`${payload.data?.member?.name || "Member"} checked in successfully.`);

      setSelectedMemberId("");

      await loadAttendance();

    } catch (err) {

      setError(err.message || "Unable to check in member.");

    } finally {

      setAttendanceSaving(false);

    }

  }



  async function checkOutMember(record) {

    const id = record?._id ?? record?.id;

    if (!id) {

      setError("Attendance record ID is missing.");

      return;

    }

    try {

      setAttendanceSaving(true);

      setError("");

      setNotice("");

      const response = await apiFetch(`${ATTENDANCE_API}/${encodeURIComponent(id)}/check-out`, { method: "PATCH" });

      const payload = await response.json();

      if (!response.ok) throw new Error(payload.message || "Check-out failed.");

      setNotice(`${record.member?.name || "Member"} checked out successfully.`);

      await loadAttendance();

    } catch (err) {

      setError(err.message || "Unable to check out member.");

    } finally {

      setAttendanceSaving(false);

    }

  }



  useEffect(() => { if (isLoggedIn) loadMembers(); }, [isLoggedIn]);

  useEffect(() => {

    if (page === "Attendance") loadAttendance();

  }, [page, attendanceDate]);

  useEffect(() => {

    if (page === "Payments") loadPayments();

  }, [page]);



  async function loadPayments() {

    try {

      setPaymentLoading(true);

      const [listResponse, summaryResponse] = await Promise.all([

        apiFetch(PAYMENT_API),

        apiFetch(`${PAYMENT_API}/summary`),

      ]);

      const listPayload = await listResponse.json();

      const summaryPayload = await summaryResponse.json();

      if (!listResponse.ok) throw new Error(listPayload.message || "Unable to load payments.");

      if (!summaryResponse.ok) throw new Error(summaryPayload.message || "Unable to load payment summary.");

      setPayments(unwrapList(listPayload));

      setPaymentSummary(summaryPayload.data || { totalPayments: 0, totalCollected: 0, pendingAmount: 0, failedPayments: 0 });

    } catch (err) {

      console.error("Load payments:", err);

      setError(err.message || "Unable to load payments.");

    } finally {

      setPaymentLoading(false);

    }

  }



  async function savePayment(event) {

    event.preventDefault();

    setError("");

    setNotice("");

    if (!paymentForm.memberId || !paymentForm.amount || Number(paymentForm.amount) < 1) {

      setError("Select a member and enter an amount greater than zero.");

      return;

    }

    try {

      setPaymentSaving(true);

      const response = await apiFetch(PAYMENT_API, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          memberId: paymentForm.memberId,

          amount: Number(paymentForm.amount),

          method: paymentForm.method,

          status: paymentForm.status,

          transactionId: paymentForm.transactionId.trim(),

          notes: paymentForm.notes.trim(),

        }),

      });

      const payload = await response.json();

      if (!response.ok) throw new Error(payload.message || "Unable to record payment.");

      setPaymentForm({ memberId: "", amount: "", method: "UPI", status: "Paid", transactionId: "", notes: "" });

      setNotice(`Payment recorded. Receipt: ${payload.data?.receiptNumber || "created"}`);

      await loadPayments();

    } catch (err) {

      console.error("Save payment:", err);

      setError(err.message || "Unable to record payment.");

    } finally {

      setPaymentSaving(false);

    }

  }



  function printReceipt(payment) {

    const person = payment.member || {};

    const receiptWindow = window.open("", "_blank", "width=700,height=800");

    if (!receiptWindow) {

      setError("Receipt popup blocked. Allow popups for this site and try again.");

      return;

    }

    const safe = (value) => String(value ?? "—").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));

    receiptWindow.document.write(`<!doctype html><html><head><title>FITCLUB Receipt</title><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#222;padding:36px;max-width:620px;margin:auto}h1{margin-bottom:4px;color:#f28c00}small{color:#666}.line{border-top:1px solid #ddd;margin:24px 0}.row{display:flex;justify-content:space-between;gap:20px;padding:10px 0;border-bottom:1px solid #eee}.total{font-size:22px;font-weight:bold;margin-top:20px;text-align:right}.foot{margin-top:36px;color:#666;font-size:12px;text-align:center}@media print{button{display:none}}</style></head><body><h1>FITCLUB</h1><small>GYM MEMBERSHIP PAYMENT RECEIPT</small><div class="line"></div><div class="row"><b>Receipt number</b><span>${safe(payment.receiptNumber)}</span></div><div class="row"><b>Date</b><span>${safe(dateLabel(payment.paymentDate))}</span></div><div class="row"><b>Member</b><span>${safe(person.name)}</span></div><div class="row"><b>Email</b><span>${safe(person.email)}</span></div><div class="row"><b>Membership plan</b><span>${safe(person.plan)}</span></div><div class="row"><b>Payment method</b><span>${safe(payment.method)}</span></div><div class="row"><b>Status</b><span>${safe(payment.status)}</span></div>${payment.transactionId ? `<div class="row"><b>Transaction ID</b><span>${safe(payment.transactionId)}</span></div>` : ""}<div class="total">Amount: ₹${Number(payment.amount || 0).toLocaleString("en-IN")}</div>${payment.notes ? `<p><b>Notes:</b> ${safe(payment.notes)}</p>` : ""}<div class="foot">Thank you for choosing FITCLUB. This receipt records a payment entered in the gym management system.</div><p style="text-align:center"><button onclick="window.print()">Print receipt</button></p></body></html>`);

    receiptWindow.document.close();

    receiptWindow.focus();

  }







  const filteredMembers = useMemo(() => {



    const query = search.trim().toLowerCase();



    return members.filter((member) => {



      const matchesSearch = [



        member.name, member.email, member.phone, member.plan, member.status,



      ].filter(Boolean).join(" ").toLowerCase().includes(query);



      const matchesPlan = planFilter === "All Plans" || member.plan === planFilter;



      return matchesSearch && matchesPlan;



    });



  }, [members, search, planFilter]);







  const activeCount = members.filter((m) => m.status === "Active").length;



  const pendingCount = members.filter((m) => m.status === "Pending").length;



  const expiredCount = members.filter((m) => m.status === "Expired").length;

  const expiringSoonCount = members.filter((member) => {

    if (!member.membershipEndDate) return false;

    const endDate = new Date(member.membershipEndDate);

    const today = new Date();

    endDate.setHours(0, 0, 0, 0);

    today.setHours(0, 0, 0, 0);

    const daysLeft = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return daysLeft >= 0 && daysLeft <= 7;

  }).length;

  const premiumCount = members.filter((m) => m.plan === "Premium").length;







  function openAddModal() {



    setEditingMember(null);



    setForm(emptyForm);



    setError("");



    setNotice("");



    setModalOpen(true);



  }







  function openEditModal(member) {



    setEditingMember(member);



    setForm({



      name: member.name || "",



      email: member.email || "",



      phone: member.phone || "",



      plan: member.plan || "Standard",



    });



    setError("");



    setNotice("");



    setModalOpen(true);



  }







  async function saveMember(event) {



    event.preventDefault();



    setError("");



    setNotice("");



    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {



      setError("Please fill in the name, email, and phone number.");



      return;



    }



    if (!["Basic", "Standard", "Premium"].includes(form.plan)) {



      setError("Please select a valid membership plan.");



      return;



    }







    try {



      setSaving(true);



      const isEditing = Boolean(editingMember);



      const url = isEditing



        ? `${API}/${encodeURIComponent(memberId(editingMember))}`



        : API;



      const response = await apiFetch(url, {



        method: isEditing ? "PUT" : "POST",



        headers: { "Content-Type": "application/json" },



        body: JSON.stringify({



          name: form.name.trim(),



          email: form.email.trim(),



          phone: form.phone.trim(),



          plan: form.plan,



        }),



      });



      const payload = await response.json();



      if (!response.ok) throw new Error(payload.message || "Could not save member.");



      await loadMembers(false);



      setModalOpen(false);



      setEditingMember(null);



      setForm(emptyForm);



      setPage("Members");



      setNotice(isEditing ? "Member updated successfully." : "New member added successfully.");



    } catch (err) {



      console.error("Save member:", err);



      setError(err.message || "Unable to save member.");



    } finally {



      setSaving(false);



    }



  }







  async function renewMembership(member, durationMonths) {

    const id = memberId(member);

    if (!id) {

      setError("Member ID is missing. Cannot renew membership.");

      return;

    }



    try {

      setError("");

      setNotice("");

      setSaving(true);



      const response = await apiFetch(`${API}/${encodeURIComponent(id)}/renew`, {

        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ durationMonths }),

      });

      const payload = await response.json();

      if (!response.ok) {

        throw new Error(payload.message || "Membership renewal failed.");

      }



      await loadMembers(false);

      setNotice(`${member.name}'s membership renewed successfully.`);

    } catch (err) {

      console.error("Renew membership:", err);

      setError(err.message || "Unable to renew membership.");

    } finally {

      setSaving(false);

    }

  }





  async function deleteMember(member) {



    const id = memberId(member);



    if (!id) {



      setError("Member ID is missing. Cannot delete this record.");



      return;



    }



    if (!window.confirm(`Delete ${member.name} permanently?`)) return;



    try {



      setError("");



      setNotice("");



      const response = await apiFetch(`${API}/${encodeURIComponent(id)}`, { method: "DELETE" });



      const payload = await response.json();



      if (!response.ok) throw new Error(payload.message || "Delete failed.");



      await loadMembers(false);



      setNotice("Member deleted successfully.");



    } catch (err) {



      console.error("Delete member:", err);



      setError(err.message || "Unable to delete member.");



    }



  }







  async function handleLogin(event) {

    event.preventDefault();

    setLoginLoading(true);

    setLoginError("");



    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),

      });

      const result = await response.json();



      if (!response.ok || !result.success) {

        throw new Error(result.message || "Login failed.");

      }



      sessionStorage.setItem("fitclub_token", result.token);

      sessionStorage.setItem("fitclub_admin", JSON.stringify(result.data));

      setAdminUser(result.data);

      setIsLoggedIn(true);

      setLoginPassword("");

      setPage("Dashboard");

    } catch (err) {

      setLoginError(err.message || "Unable to connect to the server.");

    } finally {

      setLoginLoading(false);

    }

  }



  function handleLogout() {

    sessionStorage.removeItem("fitclub_token");

    sessionStorage.removeItem("fitclub_admin");

    setAdminUser(null);

    setIsLoggedIn(false);

    setLoginPassword("");

    setLoginError("");

    setPage("Dashboard");

    setNotice("");

    setError("");

  }



  const descriptions = {



    Dashboard: "Your gym performance, at a glance.",



    Members: "Build your community. Manage every member.",



    "Membership Plans": "Membership options for every fitness goal.",



    Attendance: "Your member activity workspace.",

    Payments: "Record payments, track collections and manage receipts.",



    "Trainers & Workouts": "Training and coaching workspace.",



    Reports: "A quick view of your gym records.",



    Settings: "Manage your workspace.",



  };







  if (!isLoggedIn) {

    return (

      <div className="login-screen">

        <form className="login-card" onSubmit={handleLogin}>

          <div className="brand-name">FIT<span>CLUB</span></div>

          <div className="login-heading">

            <h1>Admin Login</h1>

            <p>Sign in to manage your gym.</p>

          </div>



          {loginError && <div className="error-box" role="alert">{loginError}</div>}



          <label className="field">

            <span>Email address</span>

            <input

              type="email"

              autoComplete="username"

              value={loginEmail}

              onChange={(event) => setLoginEmail(event.target.value)}

              placeholder="Enter admin email"

              required

            />

          </label>



          <label className="field">

            <span>Password</span>

            <input

              type="password"

              autoComplete="current-password"

              value={loginPassword}

              onChange={(event) => setLoginPassword(event.target.value)}

              placeholder="Enter password"

              required

            />

          </label>



          <button className="btn-primary login-submit" type="submit" disabled={loginLoading}>

            {loginLoading ? "Signing in..." : "Login"}

          </button>

          <p className="login-footnote">Authorized administrators only.</p>

        </form>

      </div>

    );

  }



  return (



    <div className="fit-app">



      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>



        <div className="brand">



          <div className="brand-mark"><Dumbbell size={23} /></div>



          <div>



            <div className="brand-name">FIT<span>CLUB</span></div>



            <div className="brand-caption">STRONGER TOGETHER</div>



          </div>



        </div>



        <div className="nav-heading">WORKSPACE</div>



        <nav className="nav-list">



          {navItems.map(({ name, icon: Icon }) => (



            <button key={name} className={`nav-item ${page === name ? "active" : ""}`}



              onClick={() => { setPage(name); setMobileMenu(false); setNotice(""); setError(""); }}>



              <Icon size={17} /><span>{name}</span>



              {page === name && <ChevronRight size={14} className="nav-chevron" />}



            </button>



          ))}



        </nav>



        <div className="side-bottom">



          <div className="motto">



            <div className="eyebrow"><Zap size={12} /> YOUR NEXT LEVEL</div>



            <strong>DISCIPLINE<br />BUILDS <span>FREEDOM.</span></strong>



            <p>Show up. Train hard. Get stronger.</p>



          </div>



          <div className="side-version">FITCLUB MANAGEMENT · v2.0</div>



        </div>



      </aside>







      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}







      <main className="main">



        <header className="topbar">



          <div className="topbar-left">



            <button className="icon-btn mobile-toggle" aria-label="Toggle navigation" onClick={() => setMobileMenu(!mobileMenu)}>



              {mobileMenu ? <X size={17} /> : <Menu size={17} />}



            </button>



            <div className="crumb">FITCLUB <span>/</span> <strong>{page}</strong></div>



          </div>



          <div className="top-right">



            <label className="top-search">



              <Search size={15} />



              <input value={search} onChange={(event) => { setSearch(event.target.value); if (page !== "Members") setPage("Members"); }} placeholder="Search members..." />



            </label>



            <button className="icon-btn" title="Refresh database" aria-label="Refresh database" onClick={() => loadMembers()}><RefreshCw size={15} /></button>



            <button className="icon-btn" title="Notifications" aria-label="Notifications" onClick={() => setNotice("You're all caught up!")}><Bell size={16} /></button>



            <div className="admin">



              <div className="admin-avatar">AD</div>



              <div><div className="admin-name">{adminUser?.name || "Admin"}</div><div className="admin-sub">{adminUser?.email || "Fitness Center"}</div></div>



              <button className="btn-secondary logout-button" onClick={handleLogout}>Logout</button>



            </div>



          </div>



        </header>







        <div className="content">



          {page === "Dashboard" && (



            <section className="hero">



              <div className="hero-copy">



                <div className="eyebrow"><Activity size={13} /> WELCOME BACK, ADMIN</div>



                <h1>Build A<br /><span>Stronger You.</span></h1>



                <p>Manage your gym members, memberships and fitness community in one powerful workspace.</p>



              </div>



              <div className="hero-stamp"><Dumbbell size={25} /><span>FITNESS<br /><b>IS A LIFESTYLE</b><small>NOT A DESTINATION</small></span></div>



            </section>



          )}







          <div className="page-head">



            <div><h2>{page === "Dashboard" ? "Performance Overview" : page}</h2><p>{descriptions[page]}</p></div>



            {page === "Members" && <button className="btn-primary" onClick={openAddModal}><Plus size={15} /> Add Member</button>}



          </div>







          {notice && <div className="success-box"><Check size={16} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={14} /></button></div>}



          {error && <div className="error-box"><Activity size={16} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={14} /></button></div>}







          {(page === "Dashboard" || page === "Reports") && <>



            <div className="stats">



              <Stat icon={Users} label="Total Members" value={members.length} note="Database records" color="#ff9c27" />



              <Stat icon={Activity} label="Active Members" value={activeCount} note="Currently active" color="#2cc58a" />



              <Stat icon={ShieldCheck} label="Premium Members" value={premiumCount} note="Premium plan" color="#c58bff" />



              <Stat icon={ShieldCheck} label="Expired Members" value={expiredCount} note="Membership ended" color="#ff6262" />

              <Stat icon={CalendarDays} label="Expiring Soon" value={expiringSoonCount} note="Within 7 days" color="#ffb547" />



            </div>



            <div className="grid-main">



              <div className="panel panel-pad">



                <div className="panel-heading">



                  <div><div className="panel-title">Revenue Overview</div><div className="panel-subtitle">Illustrative monthly revenue · payment API not connected</div></div>



                  <TrendingUp size={18} color="#ff9a1b" />



                </div>



                <div className="chart">



                  <ResponsiveContainer width="100%" height="100%">



                    <AreaChart data={revenueData} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>



                      <defs><linearGradient id="fitRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff8a00" stopOpacity={0.3} /><stop offset="100%" stopColor="#ff8a00" stopOpacity={0.01} /></linearGradient></defs>



                      <CartesianGrid stroke="#252b30" strokeDasharray="4 4" vertical={false} />



                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#879099", fontSize: 10 }} />



                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#879099", fontSize: 9 }} tickFormatter={(v) => `₹${v / 1000}k`} />



                      <Tooltip contentStyle={{ background: "#171c20", border: "1px solid #353b41", borderRadius: 9, fontSize: 11 }} formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />



                      <Area type="monotone" dataKey="amount" stroke="#ff8a00" strokeWidth={2.5} fill="url(#fitRevenue)" />



                    </AreaChart>



                  </ResponsiveContainer>



                </div>



              </div>



              <div className="panel panel-pad">



                <div className="panel-heading"><div><div className="panel-title">Membership Breakdown</div><div className="panel-subtitle">Live counts from MongoDB</div></div><CreditCard size={17} color="#ff9a1b" /></div>



                {plans.map((plan) => {



                  const count = members.filter((m) => m.plan === plan.name).length;



                  const percent = members.length ? (count / members.length) * 100 : 0;



                  return <div className="plan-row" key={plan.name}>



                    <div className="plan-top"><span className="plan-dot" style={{ background: plan.color }} /><div className="plan-info"><strong>{plan.name}</strong><span>₹{plan.price.toLocaleString("en-IN")} · {plan.desc}</span></div><span className="plan-count">{count}</span></div>



                    <div className="progress"><div className="progress-fill" style={{ width: `${percent}%`, background: plan.color }} /></div>



                  </div>;



                })}



                <button className="btn-secondary full-button" onClick={() => setPage("Membership Plans")}>Explore plans <ChevronRight size={14} /></button>



              </div>



            </div>



          </>}







          {(page === "Dashboard" || page === "Members") && (



            <div className="table-panel">



              <div className="table-head">



                <div><div className="panel-title"><Users size={15} className="inline-icon" />{page === "Dashboard" ? "Recent Gym Members" : "Member Directory"}</div><div className="panel-subtitle">{members.length} total member records · connected to MongoDB</div></div>



                <div className="table-controls">



                  {page === "Members" && <>



                    <label className="table-search"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." /></label>



                    <select className="filter" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}><option>All Plans</option><option>Basic</option><option>Standard</option><option>Premium</option></select>



                  </>}



                  <button className="icon-btn" title="Reload members" aria-label="Reload members" onClick={() => loadMembers()}><RefreshCw size={14} /></button>



                </div>



              </div>



              {loading ? <div className="empty">Loading member records...</div> :



                (page === "Dashboard" ? members.slice(0, 5) : filteredMembers).length === 0 ?



                  <div className="empty">{search ? "No members match your search." : "No members found. Click Add Member to create one."}</div> :



                  <div className="table-wrap"><table>



                    <thead><tr><th>MEMBER</th><th>PHONE</th><th>PLAN</th><th>JOIN DATE</th><th>EXPIRY DATE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>



                    <tbody>{(page === "Dashboard" ? members.slice(0, 5) : filteredMembers).map((member) => (



                      <tr key={memberId(member) || member.email}>



                        <td><div className="person"><div className="person-avatar">{initials(member.name)}</div><div><div className="person-name">{member.name}</div><div className="person-email">{member.email}</div></div></div></td>



                        <td>{member.phone || "—"}</td>



                        <td><span className={`badge badge-${(member.plan || "Basic").toLowerCase()}`}>{member.plan || "Basic"}</span></td>



                        <td>{dateLabel(member.joinDate || member.createdAt)}</td>



                        <td>{(() => {

                          if (!member.membershipEndDate) return "Not set";

                          const endDate = new Date(member.membershipEndDate);

                          const today = new Date();

                          endDate.setHours(0, 0, 0, 0);

                          today.setHours(0, 0, 0, 0);

                          const daysLeft = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                          return <div><div>{dateLabel(member.membershipEndDate)}</div>{daysLeft < 0 ? <small className="expiry-expired">Expired</small> : daysLeft <= 7 ? <small className="expiry-warning">{daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft} days`}</small> : null}</div>;

                        })()}</td>



                        <td><span className={`status status-${member.status || "Active"}`}><span className="status-dot" />{member.status || "Active"}</span></td>



                        <td><div className="actions">

                          <button className="edit-btn" onClick={() => openEditModal(member)}><Edit2 size={11} /> Edit</button>

                          <select className="filter" defaultValue="" disabled={saving} aria-label={`Renew ${member.name}'s membership`} onChange={(event) => { const months = event.target.value; if (months) renewMembership(member, Number(months)); event.target.value = ""; }}>

                            <option value="">Renew...</option><option value="1">1 month</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option>

                          </select>

                          <button className="btn-danger" title="Delete member" aria-label={`Delete ${member.name}`} onClick={() => deleteMember(member)}><Trash2 size={13} /></button>

                        </div></td>



                      </tr>



                    ))}</tbody>



                  </table></div>}



              {page === "Dashboard" && <div className="table-foot"><button className="btn-secondary" onClick={() => setPage("Members")}>View all members <ChevronRight size={13} /></button></div>}



            </div>



          )}







          {page === "Membership Plans" && <div className="plan-cards">{plans.map((plan) => (



            <div className="plan-card" key={plan.name}><div className="stat-icon" style={{ background: `${plan.color}19`, color: plan.color }}><CreditCard size={19} /></div><h3>{plan.name} Plan</h3><div className="plan-price">₹{plan.price.toLocaleString("en-IN")}</div><p>{plan.desc}. Membership pricing is illustrative; configure your actual rates before client handover.</p><div className="plan-current">Current members</div><div className="plan-total">{members.filter((m) => m.plan === plan.name).length}</div></div>



          ))}</div>}







          {page === "Attendance" && <section className="attendance-workspace">

            <div className="stats attendance-stats">

              <Stat icon={Users} label="Today's Records" value={attendanceSummary.total} note="Attendance records" color="#ff9c27" />

              <Stat icon={Activity} label="Currently In" value={attendanceSummary.checkedIn} note="Not checked out" color="#2cc58a" />

              <Stat icon={Check} label="Checked Out" value={attendanceSummary.completed} note="Completed visits" color="#55a6ff" />

            </div>

            <div className="panel panel-pad attendance-checkin-panel">

              <div className="panel-heading"><div><div className="panel-title">Member Check-in</div><div className="panel-subtitle">Select an active member to record today's attendance</div></div><CalendarDays size={18} color="#ff9a1b" /></div>

              <form className="attendance-checkin-form" onSubmit={checkInMember}>

                <label className="field"><span>Active member</span><select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} required><option value="">Select a member...</option>{members.filter((member) => member.status === "Active").map((member) => <option key={memberId(member)} value={memberId(member)}>{member.name} — {member.phone}</option>)}</select></label>

                <button className="btn-primary" type="submit" disabled={attendanceSaving || !members.some((member) => member.status === "Active")}>{attendanceSaving ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}{attendanceSaving ? "Please wait..." : "Check In"}</button>

              </form>

              {!members.some((member) => member.status === "Active") && <p className="panel-subtitle">No active members available. Add a member or change a member's status to Active first.</p>}

            </div>

            <div className="table-panel attendance-table-panel">

              <div className="table-head"><div><div className="panel-title"><CalendarDays size={15} className="inline-icon" />Attendance Records</div><div className="panel-subtitle">Live records from the attendance API</div></div><div className="table-controls"><label className="field attendance-date-field"><span>Attendance date</span><input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} /></label><button className="icon-btn" title="Refresh attendance" aria-label="Refresh attendance" onClick={() => loadAttendance()}><RefreshCw size={14} /></button></div></div>

              {attendanceLoading ? <div className="empty">Loading attendance records...</div> : attendance.length === 0 ? <div className="empty">No attendance records for {dateLabel(attendanceDate)}. Check in a member to get started.</div> : <div className="table-wrap"><table><thead><tr><th>MEMBER</th><th>PLAN</th><th>CHECK-IN</th><th>CHECK-OUT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{attendance.map((record) => { const person = record.member || {}; const checkedOut = record.status === "Completed" || Boolean(record.checkOut); return <tr key={record._id || record.id}><td><div className="person"><div className="person-avatar">{initials(person.name)}</div><div><div className="person-name">{person.name || "Unknown member"}</div><div className="person-email">{person.email || ""}</div></div></div></td><td>{person.plan || "—"}</td><td>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td><td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td><td><span className={`status ${checkedOut ? "status-Active" : "status-Pending"}`}><span className="status-dot" />{checkedOut ? "Completed" : "Present"}</span></td><td>{checkedOut ? <span className="panel-subtitle">Visit completed</span> : <button className="btn-secondary" disabled={attendanceSaving} onClick={() => checkOutMember(record)}>Check Out</button>}</td></tr>; })}</tbody></table></div>}

            </div>

          </section>}



          {page === "Payments" && <section className="payment-workspace">

            <div className="stats payment-stats">

              <Stat icon={CreditCard} label="Payment Records" value={paymentSummary.totalPayments || 0} note="All recorded payments" color="#ff9c27" />

              <Stat icon={CircleDollarSign} label="Total Collected" value={`₹${Number(paymentSummary.totalCollected || 0).toLocaleString("en-IN")}`} note="Paid records only" color="#2cc58a" />

              <Stat icon={CalendarDays} label="Pending Amount" value={`₹${Number(paymentSummary.pendingAmount || 0).toLocaleString("en-IN")}`} note="Awaiting payment" color="#ffb547" />

              <Stat icon={Activity} label="Failed Payments" value={paymentSummary.failedPayments || 0} note="Failed records" color="#ff6262" />

            </div>

            <div className="panel panel-pad payment-form-panel">

              <div className="panel-heading"><div><div className="panel-title">Record a Payment</div><div className="panel-subtitle">Manually record a payment in the gym system. This does not transfer money.</div></div><CircleDollarSign size={18} color="#ff9a1b" /></div>

              <form className="payment-form" onSubmit={savePayment}>

                <label className="field"><span>Member *</span><select required value={paymentForm.memberId} onChange={(event) => setPaymentForm({ ...paymentForm, memberId: event.target.value })}><option value="">Select member...</option>{members.map((member) => <option key={memberId(member)} value={memberId(member)}>{member.name} — {member.plan || "No plan"}</option>)}</select></label>

                <label className="field"><span>Amount (₹) *</span><input required min="1" step="0.01" type="number" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} placeholder="Enter amount" /></label>

                <label className="field"><span>Payment method *</span><select value={paymentForm.method} onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })}><option>UPI</option><option>Cash</option><option>Card</option><option>Bank Transfer</option></select></label>

                <label className="field"><span>Status *</span><select value={paymentForm.status} onChange={(event) => setPaymentForm({ ...paymentForm, status: event.target.value })}><option>Paid</option><option>Pending</option><option>Failed</option></select></label>

                <label className="field"><span>Transaction ID (optional)</span><input value={paymentForm.transactionId} onChange={(event) => setPaymentForm({ ...paymentForm, transactionId: event.target.value })} placeholder="UPI / bank reference" /></label>

                <label className="field"><span>Notes (optional)</span><input maxLength={500} value={paymentForm.notes} onChange={(event) => setPaymentForm({ ...paymentForm, notes: event.target.value })} placeholder="Payment notes" /></label>

                <button className="btn-primary" type="submit" disabled={paymentSaving || members.length === 0}>{paymentSaving ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}{paymentSaving ? "Saving payment..." : "Record Payment"}</button>

              </form>

              {members.length === 0 && <p className="panel-subtitle">Add a member before recording a payment.</p>}

            </div>

            <div className="table-panel payment-history-panel">

              <div className="table-head"><div><div className="panel-title"><CreditCard size={15} className="inline-icon" />Payment History</div><div className="panel-subtitle">Saved payment records from MongoDB</div></div><div className="table-controls"><button className="icon-btn" title="Refresh payments" aria-label="Refresh payments" onClick={loadPayments}><RefreshCw size={14} /></button></div></div>

              {paymentLoading ? <div className="empty">Loading payment history...</div> : payments.length === 0 ? <div className="empty">No payment records yet. Record the first payment above.</div> : <div className="table-wrap"><table><thead><tr><th>RECEIPT</th><th>MEMBER</th><th>DATE</th><th>METHOD</th><th>AMOUNT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment._id || payment.receiptNumber}><td>{payment.receiptNumber || "—"}</td><td><div className="person"><div className="person-avatar">{initials(payment.member?.name)}</div><div><div className="person-name">{payment.member?.name || "Unknown member"}</div><div className="person-email">{payment.member?.email || ""}</div></div></div></td><td>{dateLabel(payment.paymentDate)}</td><td>{payment.method || "—"}</td><td>₹{Number(payment.amount || 0).toLocaleString("en-IN")}</td><td><span className={`status ${payment.status === "Paid" ? "status-Active" : payment.status === "Pending" ? "status-Pending" : "status-Expired"}`}><span className="status-dot" />{payment.status || "—"}</span></td><td><button className="btn-secondary" onClick={() => printReceipt(payment)}>Print receipt</button></td></tr>)}</tbody></table></div>}

            </div>

          </section>}



          {page === "Trainers & Workouts" && <div className="placeholder"><Dumbbell size={26} color="#ff9a1b" /><h3>Training workspace</h3><p>Trainer profiles, workout programs and assignments need backend models and APIs. Member management is connected to MongoDB.</p><button className="btn-secondary" onClick={() => setPage("Members")}>Manage members <ChevronRight size={13} /></button></div>}



          {page === "Reports" && <div className="placeholder"><BarChart3 size={26} color="#ff9a1b" /><h3>Member report</h3><p>Member counts are based on loaded records. Revenue chart values are demo data, not actual payment transactions.</p><button className="btn-secondary" onClick={() => setPage("Members")}>Open member directory <ChevronRight size={13} /></button></div>}



          {page === "Settings" && <div className="placeholder"><Settings size={26} color="#ff9a1b" /><h3>Workspace settings</h3><p>Application: FITCLUB Gym Management</p><p>API endpoint: {API}</p><p>Connection state: {loading ? "Loading..." : error ? "Check backend connection" : "Member API responded"}</p><button className="btn-secondary" onClick={() => loadMembers()}><RefreshCw size={13} /> Test connection</button><p>Signed in as {adminUser?.email || "Admin"}. Backend API authorization must also be enabled before production use.</p></div>}







          <footer className="app-footer">FITCLUB © {new Date().getFullYear()} · TRAIN HARDER. LIVE STRONGER.</footer>



        </div>



      </main>







      {modalOpen && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>



        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="member-modal-title">



          <div className="modal-head"><div><div className="eyebrow"><UserRound size={13} /> MEMBER MANAGEMENT</div><h3 id="member-modal-title">{editingMember ? "Edit Member" : "Add New Member"}</h3><p>Enter the member information below.</p></div><button className="icon-btn" disabled={saving} onClick={() => setModalOpen(false)} aria-label="Close dialog"><X size={16} /></button></div>



          <form className="modal-body" onSubmit={saveMember}>



            {error && <div className="error-box"><Activity size={14} />{error}</div>}



            <div className="form-grid">



              <div className="field full"><label htmlFor="fit-name">Full name *</label><input id="fit-name" maxLength={100} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" /></div>



              <div className="field full"><label htmlFor="fit-email">Email address *</label><input id="fit-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="member@example.com" /></div>



              <div className="field full"><label htmlFor="fit-phone">Phone number *</label><input id="fit-phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone number" /></div>



              <div className="field full"><label htmlFor="fit-plan">Membership plan *</label><select id="fit-plan" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}><option value="Basic">Basic</option><option value="Standard">Standard</option><option value="Premium">Premium</option></select></div>



            </div>



            <div className="modal-actions"><button type="button" className="btn-secondary" disabled={saving} onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}{saving ? "Saving..." : editingMember ? "Update Member" : "Save Member"}</button></div>



          </form>



        </div>



      </div>}



    </div>



  );



}







function Stat({ icon: Icon, label, value, note, color }) {



  return <div className="stat"><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon" style={{ background: `${color}19`, color }}><Icon size={18} /></span></div><div className="stat-number">{value}</div><div className="stat-foot"><TrendingUp size={11} />{note}</div></div>;



}







export default App;
