import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ─── Types ───────────────────────────────────────────────────────────────────

interface Editor {
  id: string; name: string; email: string; password: string; username: string;
  phone: string; specialization: string; joinedAt: string;
  bankAccount?: string; location?: string; monthlySalary: number;
}

interface Client {
  id: string; name: string; phone: string; email: string;
  businessType: string; city: string; createdAt: string;
  salesPersonId?: string; salesPersonName?: string;
}

interface SalesPerson {
  id: string; name: string; email: string; password: string; username: string;
  phone: string; joinedAt: string; monthlySalary: number; target: number;
}

interface ProjectReference {
  id: string; projectId: string; title: string;
  url?: string; fileName?: string; fileType?: string; note: string; addedAt: string;
}

interface Message {
  id: string;
  projectId: string;
  senderId: string;          // editorId or "admin"
  senderName: string;
  senderRole: "admin" | "editor";
  text: string;
  fileName?: string;         // attached file name (optional)
  fileSize?: string;
  fileType?: string;         // mime type or category
  isAudio?: boolean;         // voice message flag
  readBy: string[];          // list of userIds who have read this
  createdAt: string;
}

type ProjectType = "ugc" | "ai_video" | "editing" | "branded" | "corporate" | "wedding" | "social_media" | "other";

interface Project {
  id: string;
  clientId?: string; clientName: string; clientPhone?: string; clientEmail?: string;
  projectName: string; projectType: ProjectType;
  totalValue: number; modelCost: number; editorCost: number;
  totalDeliverables: number;
  editorId: string; editorName: string; editorPhone?: string;
  status: "pending" | "in_progress" | "completed";
  completedDeliverables: number;
  paidAmount: number;
  createdAt: string; deadline?: string; notes?: string; script?: string;
  revisionRequested: boolean;   // "customisation" flag
}

interface VideoSubmission {
  id: string; projectId: string; editorId: string; editorName: string;
  fileName: string; fileSize: string; deliverableIndex: number;
  submissionLink?: string; submissionType?: "file" | "link";
  submittedAt: string; status: "pending_review" | "approved" | "rejected";
  reviewNote?: string; reviewedAt?: string;
}

interface Notification {
  id: string; userId: string;
  type: "project_assigned" | "video_submitted" | "video_approved" | "video_rejected" | "message_received" | "revision_requested";
  title: string; message: string;
  projectId?: string; videoId?: string;
  read: boolean; createdAt: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

let ADMIN = {
  username: "admin", password: "admin123", id: "admin",
  name: "Divayshakati Admin", businessName: "Divayshakati Productions",
  email: "admin@divayshakati.com", phone: "+91 98765 00001", role: "admin" as const,
};

let editorIdCounter = 5;
const editors: Editor[] = [
  { id: "e1", name: "Alice Johnson", username: "alice", email: "alice@divayshakati.com", password: "alice123", phone: "+91 98100 11111", specialization: "Video Editor",        joinedAt: "2023-01-15", bankAccount: "SBI 1234567890",   location: "Mumbai",    monthlySalary: 25000 },
  { id: "e2", name: "Bob Martinez",  username: "bob",   email: "bob@divayshakati.com",   password: "bob123",   phone: "+91 98100 22222", specialization: "Graphic Designer",    joinedAt: "2023-03-20", bankAccount: "HDFC 9876543210",  location: "Delhi",     monthlySalary: 22000 },
  { id: "e3", name: "Clara Lee",     username: "clara", email: "clara@divayshakati.com", password: "clara123", phone: "+91 98100 33333", specialization: "Social Media Manager", joinedAt: "2023-06-01", bankAccount: "ICICI 5555666677", location: "Bangalore", monthlySalary: 28000 },
  { id: "e4", name: "David Kim",     username: "david", email: "david@divayshakati.com", password: "david123", phone: "+91 98100 44444", specialization: "Website Development",  joinedAt: "2024-01-10", bankAccount: "Axis 3344556677",  location: "Hyderabad", monthlySalary: 30000 },
];

const clients: Client[] = [
  { id: "c1", name: "TechCorp Inc",   phone: "+91 99001 11111", email: "contact@techcorp.in",   businessType: "Technology",     city: "Mumbai",    createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "c2", name: "Sunrise Events", phone: "+91 99001 22222", email: "hello@sunriseevents.in", businessType: "Events",         city: "Delhi",     createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: "c3", name: "FitLife App",    phone: "+91 99001 33333", email: "brand@fitlife.in",       businessType: "Health & Fitness",city: "Bangalore", createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: "c4", name: "ArtHouse Films", phone: "+91 99001 44444", email: "info@arthouse.in",       businessType: "Entertainment",  city: "Pune",      createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "c5", name: "StyleBrand",     phone: "+91 99001 55555", email: "collab@stylebrand.in",   businessType: "Fashion",        city: "Hyderabad", createdAt: new Date(Date.now() - 5  * 86400000).toISOString() },
];
let clientIdCounter = clients.length + 1;

let salesIdCounter = 3;
const salesTeam: SalesPerson[] = [
  { id: "s1", name: "Rahul Sharma", username: "rahul", email: "rahul@divayshakati.com", password: "rahul123", phone: "+91 98200 11111", joinedAt: "2024-01-01", monthlySalary: 20000, target: 5 },
  { id: "s2", name: "Priya Patel",  username: "priya", email: "priya@divayshakati.com",  password: "priya123",  phone: "+91 98200 22222", joinedAt: "2024-03-01", monthlySalary: 18000, target: 4 },
];
// assign some demo clients to sales team
(clients[0] as Client).salesPersonId = "s1"; (clients[0] as Client).salesPersonName = "Rahul Sharma";
(clients[1] as Client).salesPersonId = "s1"; (clients[1] as Client).salesPersonName = "Rahul Sharma";
(clients[2] as Client).salesPersonId = "s2"; (clients[2] as Client).salesPersonName = "Priya Patel";
(clients[3] as Client).salesPersonId = "s2"; (clients[3] as Client).salesPersonName = "Priya Patel";

const projects: Project[] = [
  { id: "p1", clientId: "c1", clientName: "TechCorp Inc",   clientPhone: "+91 99001 11111", clientEmail: "contact@techcorp.in",   projectName: "Brand Video Series",      projectType: "branded",      totalValue: 12000, modelCost: 0,    editorCost: 400,  totalDeliverables: 6, editorId: "e1", editorName: "Alice Johnson", editorPhone: "+91 98100 11111", status: "in_progress", completedDeliverables: 3, paidAmount: 6000,  createdAt: new Date(Date.now() - 7*86400000).toISOString(), deadline: new Date(Date.now() + 14*86400000).toISOString(), notes: "Focus on product close-ups. Color grade warm.", revisionRequested: true },
  { id: "p2", clientId: "c2", clientName: "Sunrise Events", clientPhone: "+91 99001 22222", clientEmail: "hello@sunriseevents.in", projectName: "Wedding Highlight Reel",  projectType: "wedding",      totalValue: 3500,  modelCost: 0,    editorCost: 700,  totalDeliverables: 2, editorId: "e2", editorName: "Bob Martinez",  editorPhone: "+91 98100 22222", status: "pending",     completedDeliverables: 0, paidAmount: 0,     createdAt: new Date(Date.now() - 2*86400000).toISOString(), deadline: new Date(Date.now() + 7*86400000).toISOString(), notes: "Cinematic style. Use provided music track.", revisionRequested: false },
  { id: "p3", clientId: "c3", clientName: "FitLife App",    clientPhone: "+91 99001 33333", clientEmail: "brand@fitlife.in",       projectName: "UGC Product Reviews x5",  projectType: "ugc",          totalValue: 8500,  modelCost: 2500, editorCost: 400,  totalDeliverables: 5, editorId: "e1", editorName: "Alice Johnson", editorPhone: "+91 98100 11111", status: "in_progress", completedDeliverables: 2, paidAmount: 4000,  createdAt: new Date(Date.now() - 5*86400000).toISOString(), deadline: new Date(Date.now() + 10*86400000).toISOString(), notes: "Model booked. 15-30 sec each. Natural lighting.", revisionRequested: false },
  { id: "p4", clientId: "c4", clientName: "ArtHouse Films", clientPhone: "+91 99001 44444", clientEmail: "info@arthouse.in",       projectName: "Short Film Edit",         projectType: "corporate",    totalValue: 6000,  modelCost: 0,    editorCost: 900,  totalDeliverables: 3, editorId: "e3", editorName: "Clara Lee",    editorPhone: "+91 98100 33333", status: "in_progress", completedDeliverables: 1, paidAmount: 3000,  createdAt: new Date(Date.now() - 5*86400000).toISOString(), deadline: new Date(Date.now() + 10*86400000).toISOString(), revisionRequested: false },
  { id: "p5", clientId: "c5", clientName: "StyleBrand",     clientPhone: "+91 99001 55555", clientEmail: "collab@stylebrand.in",   projectName: "Instagram UGC Reel Pack", projectType: "ugc",          totalValue: 4500,  modelCost: 1200, editorCost: 1000, totalDeliverables: 6, editorId: "e4", editorName: "David Kim",    editorPhone: "+91 98100 44444", status: "pending",     completedDeliverables: 0, paidAmount: 1500,  createdAt: new Date(Date.now() - 1*86400000).toISOString(), deadline: new Date(Date.now() + 5*86400000).toISOString(), notes: "Model: Priya. 9:16 format only. Brand kit shared.", revisionRequested: false },
];
let projectIdCounter = projects.length + 1;

const references: ProjectReference[] = [
  { id: "r1", projectId: "p1", title: "Brand Guidelines PDF", url: "https://drive.google.com/brand-kit", note: "Use brand colors only — blue #0057FF and white", addedAt: new Date(Date.now()-6*86400000).toISOString() },
  { id: "r2", projectId: "p1", title: "Reference Video",      url: "https://youtube.com/watch?v=example", note: "Match this color grade and pacing",             addedAt: new Date(Date.now()-5*86400000).toISOString() },
  { id: "r3", projectId: "p3", title: "UGC Brief Doc",        url: "https://docs.google.com/ugc-brief", note: "Model to use all 5 products. Unboxing style.",    addedAt: new Date(Date.now()-4*86400000).toISOString() },
];
let refIdCounter = references.length + 1;

const messages: Message[] = [
  { id: "m1", projectId: "p1", senderId: "admin",  senderName: "Divyashakti Admin", senderRole: "admin",  text: "Hi Alice! The client has reviewed the draft and wants the color temperature warmer in section 2. Can you revise?", readBy: ["admin", "e1"], createdAt: new Date(Date.now()-2*86400000).toISOString() },
  { id: "m2", projectId: "p1", senderId: "e1",     senderName: "Alice Johnson",     senderRole: "editor", text: "Got it! I'll work on it today. Should I change the music too or just the color grade?", readBy: ["admin", "e1"], createdAt: new Date(Date.now()-2*86400000+3600000).toISOString() },
  { id: "m3", projectId: "p1", senderId: "admin",  senderName: "Divyashakti Admin", senderRole: "admin",  text: "Just the color grade for now. Keep the music. Client loves it!", readBy: ["admin", "e1"], createdAt: new Date(Date.now()-1*86400000).toISOString() },
  { id: "m4", projectId: "p1", senderId: "e1",     senderName: "Alice Johnson",     senderRole: "editor", text: "Perfect! Uploading the revised version now.", fileName: "brand_section2_v2.mp4", fileSize: "298 MB", readBy: ["e1"], createdAt: new Date(Date.now()-3*3600000).toISOString() },
  { id: "m5", projectId: "p3", senderId: "admin",  senderName: "Divyashakti Admin", senderRole: "admin",  text: "Alice, please check the brief doc for the UGC format. All 5 videos should be under 30 seconds each.", readBy: ["admin"], createdAt: new Date(Date.now()-5*3600000).toISOString() },
];
let msgIdCounter = messages.length + 1;

const videoSubmissions: VideoSubmission[] = [
  { id: "v1", projectId: "p1", editorId: "e1", editorName: "Alice Johnson", fileName: "brand_intro_v1.mp4",     fileSize: "248 MB", deliverableIndex: 1, submittedAt: new Date(Date.now()-3*86400000).toISOString(), status: "approved",        reviewedAt: new Date(Date.now()-2*86400000).toISOString() },
  { id: "v2", projectId: "p1", editorId: "e1", editorName: "Alice Johnson", fileName: "brand_section2_v1.mp4", fileSize: "310 MB", deliverableIndex: 2, submittedAt: new Date(Date.now()-1*86400000).toISOString(), status: "rejected",        reviewNote: "Color grading needs to be warmer. Re-check the ending cut.", reviewedAt: new Date(Date.now()-12*3600000).toISOString() },
  { id: "v3", projectId: "p4", editorId: "e3", editorName: "Clara Lee",    fileName: "shortfilm_act1_v2.mp4", fileSize: "520 MB", deliverableIndex: 1, submittedAt: new Date(Date.now()-6*3600000).toISOString(),  status: "pending_review" },
];
let videoIdCounter = videoSubmissions.length + 1;

const notifications: Notification[] = [
  { id: "n1", userId: "e1",    type: "project_assigned",  title: "New Project Assigned", message: "You have been assigned: Brand Video Series by TechCorp Inc", projectId: "p1", read: true,  createdAt: new Date(Date.now()-7*86400000).toISOString() },
  { id: "n2", userId: "e1",    type: "video_rejected",    title: "Video Rejected",        message: "brand_section2_v1.mp4 was rejected. Color grading needs to be warmer.", projectId: "p1", videoId: "v2", read: false, createdAt: new Date(Date.now()-12*3600000).toISOString() },
  { id: "n3", userId: "e1",    type: "video_approved",    title: "Video Approved ✓",     message: "brand_intro_v1.mp4 has been approved!", projectId: "p1", videoId: "v1", read: true, createdAt: new Date(Date.now()-2*86400000).toISOString() },
  { id: "n4", userId: "e1",    type: "revision_requested",title: "Customisation Required",message: "Admin has requested revisions on Brand Video Series", projectId: "p1", read: false, createdAt: new Date(Date.now()-2*86400000-3600000).toISOString() },
  { id: "n5", userId: "e1",    type: "message_received",  title: "New Message",           message: "Admin: The client wants color temperature warmer in section 2", projectId: "p1", read: false, createdAt: new Date(Date.now()-2*86400000).toISOString() },
  { id: "n6", userId: "admin", type: "video_submitted",   title: "New Video Uploaded",    message: "Alice Johnson uploaded brand_section2_v1.mp4 for Brand Video Series", projectId: "p1", videoId: "v2", read: true, createdAt: new Date(Date.now()-1*86400000).toISOString() },
  { id: "n7", userId: "admin", type: "video_submitted",   title: "New Video Uploaded",    message: "Clara Lee uploaded shortfilm_act1_v2.mp4 for Short Film Edit", projectId: "p4", videoId: "v3", read: false, createdAt: new Date(Date.now()-6*3600000).toISOString() },
  { id: "n8", userId: "admin", type: "message_received",  title: "New Message",           message: "Alice: Should I change the music too or just the color grade?", projectId: "p1", read: true, createdAt: new Date(Date.now()-2*86400000+3600000).toISOString() },
  { id: "n9", userId: "admin", type: "message_received",  title: "New Message",           message: "Alice: Perfect! Uploading the revised version now.", projectId: "p1", read: false, createdAt: new Date(Date.now()-3*3600000).toISOString() },
];
let notifIdCounter = notifications.length + 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pushNotif(data: Omit<Notification, "id" | "read" | "createdAt">) {
  notifications.push({ ...data, id: `n${notifIdCounter++}`, read: false, createdAt: new Date().toISOString() });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) { res.status(400).json({ error: "Username and password required" }); return; }
  if (username === ADMIN.username && password === ADMIN.password) {
    res.json({ id: ADMIN.id, name: ADMIN.name, role: ADMIN.role }); return;
  }
  const editor = editors.find((e) => (e.username === username || e.email.split("@")[0] === username) && e.password === password);
  if (editor) { res.json({ id: editor.id, name: editor.name, role: "editor", editorId: editor.id, specialization: editor.specialization }); return; }
  const sales = salesTeam.find((s) => (s.username === username || s.email.split("@")[0] === username) && s.password === password);
  if (sales) { res.json({ id: sales.id, name: sales.name, role: "sales", salesId: sales.id }); return; }
  res.status(401).json({ error: "Invalid username or password" });
});

// ─── Admin Profile ────────────────────────────────────────────────────────────

router.get("/admin/profile", (_req, res) => {
  const completed  = projects.filter((p) => p.status === "completed");
  const totalRevenue = completed.reduce((s, p) => s + p.totalValue, 0);
  const totalUgcCost = projects.filter((p) => p.projectType === "ugc").reduce((s, p) => s + p.modelCost, 0);
  const netRevenue   = totalRevenue - completed.filter((p) => p.projectType === "ugc").reduce((s, p) => s + p.modelCost, 0);
  res.json({
    id: ADMIN.id, name: ADMIN.name, businessName: ADMIN.businessName, email: ADMIN.email, phone: ADMIN.phone,
    stats: {
      totalProjects: projects.length, completedProjects: completed.length,
      activeProjects: projects.filter((p) => p.status === "in_progress").length,
      customisationProjects: projects.filter((p) => p.revisionRequested).length,
      totalClients: clients.length, totalEditors: editors.length,
      totalRevenue, netRevenue,
      totalUgcProjects: projects.filter((p) => p.projectType === "ugc").length, totalModelCost: totalUgcCost,
      pendingReviews: videoSubmissions.filter((v) => v.status === "pending_review").length,
    },
    recentClients: clients.slice(-5).reverse(),
  });
});

router.patch("/admin/profile", (req, res) => {
  const { name, businessName, email, phone, username, password } = req.body;
  if (name !== undefined) ADMIN = { ...ADMIN, name };
  if (businessName !== undefined) ADMIN = { ...ADMIN, businessName };
  if (email !== undefined) ADMIN = { ...ADMIN, email };
  if (phone !== undefined) ADMIN = { ...ADMIN, phone };
  if (username !== undefined) ADMIN = { ...ADMIN, username };
  if (password !== undefined && password.length >= 4) ADMIN = { ...ADMIN, password };
  res.json({ id: ADMIN.id, name: ADMIN.name, businessName: ADMIN.businessName, email: ADMIN.email, phone: ADMIN.phone, username: ADMIN.username });
});

// ─── Clients ──────────────────────────────────────────────────────────────────

router.get("/clients", (_req, res) => res.json(clients));

router.get("/clients/:id/projects", (req, res) => {
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  const clientProjects = projects.filter((p) => p.clientId === req.params.id || p.clientName === client.name);
  const totalValue = clientProjects.reduce((s, p) => s + p.totalValue, 0);
  res.json({ client, projects: clientProjects, totalValue });
});
router.post("/clients", (req, res) => {
  const { name, phone, email, businessType, city } = req.body;
  if (!name || !phone) { res.status(400).json({ error: "Name and phone required" }); return; }
  const client: Client = { id: `c${clientIdCounter++}`, name, phone, email: email || "", businessType: businessType || "Other", city: city || "", createdAt: new Date().toISOString() };
  clients.push(client);
  res.status(201).json(client);
});
router.delete("/clients/:id", (req, res) => {
  const idx = clients.findIndex((c) => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Client not found" }); return; }
  clients.splice(idx, 1); res.json({ success: true });
});

// ─── Editors ──────────────────────────────────────────────────────────────────

router.get("/editors", (_req, res) => res.json(editors.map(({ password: _p, ...e }) => e)));

router.get("/editors/:id/full", (req, res) => {
  const editor = editors.find((e) => e.id === req.params.id);
  if (!editor) { res.status(404).json({ error: "Editor not found" }); return; }
  res.json(editor);
});

router.post("/editors", (req, res) => {
  const { name, username, password, email, phone, specialization, location, bankAccount } = req.body;
  if (!name || !username || !password || !phone || !specialization) {
    res.status(400).json({ error: "name, username, password, phone, specialization required" }); return;
  }
  if (editors.find((e) => e.username === username)) {
    res.status(400).json({ error: "Username already taken" }); return;
  }
  const editor: Editor = {
    id: `e${editorIdCounter++}`, name, username, password, email: email || "",
    phone, specialization, joinedAt: new Date().toISOString().split("T")[0],
    bankAccount: bankAccount || "", location: location || "",
  };
  editors.push(editor);
  res.status(201).json({ ...editor, password: undefined });
});

router.patch("/editors/:id", (req, res) => {
  const editor = editors.find((e) => e.id === req.params.id);
  if (!editor) { res.status(404).json({ error: "Editor not found" }); return; }
  const { name, username, password, email, phone, specialization, location, bankAccount } = req.body;
  if (username && username !== editor.username && editors.find((e) => e.username === username && e.id !== editor.id)) {
    res.status(400).json({ error: "Username already taken" }); return;
  }
  if (name) editor.name = name;
  if (username) editor.username = username;
  if (password) editor.password = password;
  if (email) editor.email = email;
  if (phone) editor.phone = phone;
  if (specialization) editor.specialization = specialization;
  if (location !== undefined) editor.location = location;
  if (bankAccount !== undefined) editor.bankAccount = bankAccount;
  res.json({ ...editor, password: undefined });
});

router.delete("/editors/:id", (req, res) => {
  const idx = editors.findIndex((e) => e.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Editor not found" }); return; }
  editors.splice(idx, 1); res.json({ success: true });
});

// Admin gets full editor info (including credentials)
router.get("/editors/:editorId/full", (req, res) => {
  const editor = editors.find((e) => e.id === req.params.editorId);
  if (!editor) { res.status(404).json({ error: "Editor not found" }); return; }
  res.json(editor);
});

router.get("/editors/:editorId/profile", (req, res) => {
  const editor = editors.find((e) => e.id === req.params.editorId);
  if (!editor) { res.status(404).json({ error: "Editor not found" }); return; }
  const editorProjects = projects.filter((p) => p.editorId === editor.id);
  const editorVideos   = videoSubmissions.filter((v) => v.editorId === editor.id);
  const totalRevenue = editorProjects.reduce((s, p) => s + (p.totalValue - p.modelCost), 0);
  const companyProfit = totalRevenue - editor.monthlySalary;
  // Group projects by date (newest first)
  const grouped: Record<string, typeof editorProjects> = {};
  for (const p of editorProjects) {
    const date = p.createdAt.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(p);
  }
  const projectsByDate = Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, projs]) => ({
      date,
      projects: projs.map(p => ({ ...p, companyRevenue: p.totalValue - p.modelCost })),
      dayRevenue: projs.reduce((s, p) => s + (p.totalValue - p.modelCost), 0),
    }));
  const completedProjects = editorProjects.filter((p) => p.status === "completed");
  const totalEarnings = completedProjects.reduce((s, p) => s + p.totalValue, 0);
  const sortedProjects = [...editorProjects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recentProjects = sortedProjects.slice(0, 5);
  res.json({
    id: editor.id, name: editor.name, email: editor.email, phone: editor.phone,
    specialization: editor.specialization, joinedAt: editor.joinedAt,
    bankAccount: editor.bankAccount, location: editor.location,
    monthlySalary: editor.monthlySalary,
    stats: {
      totalProjects: editorProjects.length,
      completedProjects:   completedProjects.length,
      inProgressProjects:  editorProjects.filter((p) => p.status === "in_progress").length,
      pendingProjects:     editorProjects.filter((p) => p.status === "pending").length,
      customisationProjects: editorProjects.filter((p) => p.revisionRequested).length,
      totalVideosUploaded: editorVideos.length,
      approvedVideos:      editorVideos.filter((v) => v.status === "approved").length,
      rejectedVideos:      editorVideos.filter((v) => v.status === "rejected").length,
      pendingReviewVideos: editorVideos.filter((v) => v.status === "pending_review").length,
      totalRevenue, companyProfit, totalEarnings,
    },
    recentProjects,
    allProjects: sortedProjects.map(p => ({ ...p, companyRevenue: p.totalValue - p.modelCost })),
    projectsByDate,
  });
});

// ─── Projects ─────────────────────────────────────────────────────────────────

router.get("/projects", (_req, res) => res.json(projects));
router.get("/projects/editor/:editorId", (req, res) => {
  res.json(projects.filter((p) => p.editorId === req.params.editorId));
});

router.get("/dashboard/stats", (_req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayRevenue = projects.filter((p) => { const c = new Date(p.createdAt); return c >= today && p.status === "completed"; }).reduce((s, p) => s + p.totalValue, 0);
  res.json({
    totalProjects: projects.length, totalEditors: editors.length, totalClients: clients.length,
    todayRevenue: todayRevenue > 0 ? todayRevenue : 5200,
    activeProjects: projects.filter((p) => p.status === "in_progress").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    pendingProjects: projects.filter((p) => p.status === "pending").length,
    customisationProjects: projects.filter((p) => p.revisionRequested).length,
    pendingReviews: videoSubmissions.filter((v) => v.status === "pending_review").length,
  });
});

router.post("/projects", (req, res) => {
  const { clientId, clientName, clientPhone, clientEmail, clientBusinessType, clientCity, projectName, projectType, totalValue, modelCost, editorCost, totalDeliverables, editorId, deadline, notes, script } = req.body;
  if (!clientName || !projectName || totalValue == null || totalDeliverables == null || !editorId) {
    res.status(400).json({ error: "All fields required" }); return;
  }
  const editor = editors.find((e) => e.id === editorId);
  if (!editor) { res.status(400).json({ error: "Editor not found" }); return; }

  // Auto-create client record if no clientId but we have details
  let resolvedClientId = clientId;
  if (!clientId && clientName) {
    const existing = clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase());
    if (!existing) {
      const newClient: Client = {
        id: `c${clientIdCounter++}`, name: clientName,
        phone: clientPhone || "", email: clientEmail || "",
        businessType: clientBusinessType || "Other", city: clientCity || "",
        createdAt: new Date().toISOString(),
      };
      clients.push(newClient);
      resolvedClientId = newClient.id;
    } else {
      resolvedClientId = existing.id;
    }
  }

  const project: Project = {
    id: `p${projectIdCounter++}`, clientId: resolvedClientId, clientName, clientPhone, clientEmail,
    projectName, projectType: projectType || "other",
    totalValue: Number(totalValue), modelCost: Number(modelCost) || 0, editorCost: Number(editorCost) || 0,
    totalDeliverables: Number(totalDeliverables), editorId, editorName: editor.name, editorPhone: editor.phone,
    status: "pending", completedDeliverables: 0, paidAmount: 0, createdAt: new Date().toISOString(),
    deadline, notes, script: script || undefined, revisionRequested: false,
  };
  projects.push(project);
  pushNotif({ userId: editorId, type: "project_assigned", title: "New Project Assigned", message: `You have been assigned: ${projectName} by ${clientName}`, projectId: project.id });
  res.status(201).json(project);
});

router.patch("/projects/:id/status", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { status, completedDeliverables } = req.body;
  if (status) project.status = status;
  if (completedDeliverables != null) project.completedDeliverables = completedDeliverables;
  res.json(project);
});

router.patch("/projects/:id/revision", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { revisionRequested } = req.body;
  project.revisionRequested = !!revisionRequested;
  if (revisionRequested) {
    pushNotif({ userId: project.editorId, type: "revision_requested", title: "Customisation Required", message: `Admin has requested customisation on "${project.projectName}"`, projectId: project.id });
  }
  res.json(project);
});

// ─── Full project update (edit) ──────────────────────────────────────────────
router.patch("/projects/:id", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { projectName, clientName, clientPhone, clientEmail, totalValue, modelCost, editorCost,
    totalDeliverables, editorId, deadline, notes, script, status } = req.body;
  // Reassign editor if changed
  if (editorId && editorId !== project.editorId) {
    const editor = editors.find((e) => e.id === editorId);
    if (!editor) { res.status(400).json({ error: "Editor not found" }); return; }
    const oldEditorId = project.editorId;
    project.editorId = editorId;
    project.editorName = editor.name;
    project.editorPhone = editor.phone;
    pushNotif({ userId: editorId, type: "project_assigned", title: "Project Assigned to You", message: `"${project.projectName}" has been assigned to you.`, projectId: project.id });
    // Optionally notify old editor (skip to keep it simple)
    void oldEditorId;
  }
  if (projectName)             project.projectName      = projectName;
  if (clientName)              project.clientName       = clientName;
  if (clientPhone !== undefined) project.clientPhone    = clientPhone || undefined;
  if (clientEmail !== undefined) project.clientEmail    = clientEmail || undefined;
  if (totalValue != null)      project.totalValue       = Number(totalValue);
  if (modelCost  != null)      project.modelCost        = Number(modelCost);
  if (editorCost != null)      project.editorCost       = Number(editorCost);
  if (totalDeliverables != null) project.totalDeliverables = Number(totalDeliverables);
  if (deadline !== undefined)  project.deadline         = deadline || undefined;
  if (notes    !== undefined)  project.notes            = notes    || undefined;
  if (script   !== undefined)  project.script           = script   || undefined;
  if (status)                  project.status           = status;
  res.json(project);
});

// ─── Delete project ───────────────────────────────────────────────────────────
router.delete("/projects/:id", (req, res) => {
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Project not found" }); return; }
  projects.splice(idx, 1);
  res.json({ success: true });
});

router.patch("/projects/:id/payment", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { paidAmount } = req.body;
  if (typeof paidAmount !== "number" || paidAmount < 0) {
    res.status(400).json({ error: "Valid paidAmount required" }); return;
  }
  project.paidAmount = Math.min(paidAmount, project.totalValue);
  res.json(project);
});

// ─── Calendar ─────────────────────────────────────────────────────────────────

router.get("/projects/calendar", (req, res) => {
  const month = req.query.month as string | undefined;
  const editorId = req.query.editorId as string | undefined;

  const source = editorId ? projects.filter((p) => p.editorId === editorId) : projects;
  const byDay: Record<string, { count: number; projects: { id: string; projectName: string; clientName: string; status: string; projectType: string }[] }> = {};

  source.forEach((p) => {
    const date = p.createdAt.split("T")[0];
    if (!month || date.startsWith(month)) {
      if (!byDay[date]) byDay[date] = { count: 0, projects: [] };
      byDay[date].count++;
      byDay[date].projects.push({ id: p.id, projectName: p.projectName, clientName: p.clientName, status: p.status, projectType: p.projectType });
    }
  });
  res.json(byDay);
});

// ─── References ───────────────────────────────────────────────────────────────

router.get("/projects/:projectId/references", (req, res) => {
  res.json(references.filter((r) => r.projectId === req.params.projectId));
});
router.post("/projects/:projectId/references", (req, res) => {
  const project = projects.find((p) => p.id === req.params.projectId);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { title, url, note, fileName, fileType } = req.body;
  if (!title) { res.status(400).json({ error: "Title required" }); return; }
  const ref: ProjectReference = { id: `r${refIdCounter++}`, projectId: req.params.projectId, title, url: url || undefined, fileName: fileName || undefined, fileType: fileType || undefined, note: note || "", addedAt: new Date().toISOString() };
  references.push(ref); res.status(201).json(ref);
});
router.delete("/references/:id", (req, res) => {
  const idx = references.findIndex((r) => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  references.splice(idx, 1); res.json({ success: true });
});

// ─── Messages ─────────────────────────────────────────────────────────────────

router.get("/projects/:projectId/messages", (req, res) => {
  res.json(messages.filter((m) => m.projectId === req.params.projectId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
});

router.post("/projects/:projectId/messages", (req, res) => {
  const project = projects.find((p) => p.id === req.params.projectId);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const { senderId, senderName, senderRole, text, fileName, fileSize, fileType, isAudio } = req.body;
  if (!senderId || !text) { res.status(400).json({ error: "senderId and text required" }); return; }

  const msg: Message = {
    id: `m${msgIdCounter++}`, projectId: req.params.projectId,
    senderId, senderName, senderRole,
    text, fileName: fileName || undefined, fileSize: fileSize || undefined,
    fileType: fileType || undefined, isAudio: isAudio || false,
    readBy: [senderId], createdAt: new Date().toISOString(),
  };
  messages.push(msg);

  // Notify the other party
  if (senderRole === "editor") {
    pushNotif({ userId: "admin", type: "message_received", title: "New Message", message: `${senderName}: ${text.slice(0, 60)}`, projectId: project.id });
  } else {
    pushNotif({ userId: project.editorId, type: "message_received", title: "New Message from Admin", message: `Admin: ${text.slice(0, 60)}`, projectId: project.id });
  }

  res.status(201).json(msg);
});

router.post("/projects/:projectId/messages/mark-read", (req, res) => {
  const { userId } = req.body;
  messages.filter((m) => m.projectId === req.params.projectId && !m.readBy.includes(userId))
    .forEach((m) => m.readBy.push(userId));
  res.json({ success: true });
});

router.delete("/projects/:projectId/messages/:messageId", (req, res) => {
  const { projectId, messageId } = req.params;
  const { requesterId } = req.body;
  const idx = messages.findIndex((m) => m.id === messageId && m.projectId === projectId);
  if (idx === -1) { res.status(404).json({ error: "Message not found" }); return; }
  const msg = messages[idx];
  if (msg.senderId !== requesterId) { res.status(403).json({ error: "Only the sender can delete this message" }); return; }
  messages.splice(idx, 1);
  res.json({ success: true });
});

router.get("/messages/unread-count/:userId", (req, res) => {
  const { userId } = req.params;
  const userProjectIds = userId === "admin"
    ? projects.map((p) => p.id)
    : projects.filter((p) => p.editorId === userId).map((p) => p.id);

  const unreadByProject: Record<string, number> = {};
  messages.forEach((m) => {
    if (userProjectIds.includes(m.projectId) && !m.readBy.includes(userId)) {
      unreadByProject[m.projectId] = (unreadByProject[m.projectId] || 0) + 1;
    }
  });
  res.json({ total: Object.values(unreadByProject).reduce((s, v) => s + v, 0), byProject: unreadByProject });
});

// ─── Videos ───────────────────────────────────────────────────────────────────

router.get("/projects/:projectId/videos", (req, res) => {
  res.json(videoSubmissions.filter((v) => v.projectId === req.params.projectId));
});
router.get("/videos/editor/:editorId", (req, res) => {
  res.json(videoSubmissions.filter((v) => v.editorId === req.params.editorId));
});
router.get("/videos/pending", (_req, res) => {
  res.json(videoSubmissions.filter((v) => v.status === "pending_review").map((v) => {
    const p = projects.find((proj) => proj.id === v.projectId);
    return { ...v, projectName: p?.projectName, clientName: p?.clientName };
  }));
});
router.post("/projects/:projectId/videos", (req, res) => {
  const project = projects.find((p) => p.id === req.params.projectId);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { editorId, fileName, fileSize, deliverableIndex, submissionLink, submissionType } = req.body;
  const editor = editors.find((e) => e.id === editorId);
  if (!editor) { res.status(400).json({ error: "Editor not found" }); return; }
  const video: VideoSubmission = { id: `v${videoIdCounter++}`, projectId: project.id, editorId, editorName: editor.name, fileName, fileSize: fileSize || "Unknown", deliverableIndex: Number(deliverableIndex) || 1, submissionLink: submissionLink || undefined, submissionType: submissionType || "file", submittedAt: new Date().toISOString(), status: "pending_review" };
  videoSubmissions.push(video);
  pushNotif({ userId: "admin", type: "video_submitted", title: "New Video Uploaded", message: `${editor.name} uploaded ${fileName} for ${project.projectName}`, projectId: project.id, videoId: video.id });
  res.status(201).json(video);
});
router.patch("/videos/:videoId/review", (req, res) => {
  const video = videoSubmissions.find((v) => v.id === req.params.videoId);
  if (!video) { res.status(404).json({ error: "Video not found" }); return; }
  const { action, note } = req.body;
  if (action !== "approve" && action !== "reject") { res.status(400).json({ error: "action must be approve or reject" }); return; }
  video.status = action === "approve" ? "approved" : "rejected";
  video.reviewNote = note ?? undefined; video.reviewedAt = new Date().toISOString();
  const project = projects.find((p) => p.id === video.projectId);
  if (action === "approve") {
    pushNotif({ userId: video.editorId, type: "video_approved", title: "Video Approved ✓", message: `${video.fileName} has been approved for ${project?.projectName ?? "your project"}!`, projectId: video.projectId, videoId: video.id });
  } else {
    pushNotif({ userId: video.editorId, type: "video_rejected", title: "Video Rejected", message: `${video.fileName} was rejected. ${note ? "Reason: " + note : ""}`, projectId: video.projectId, videoId: video.id });
  }
  res.json(video);
});

// ─── Sales Team ───────────────────────────────────────────────────────────────

router.get("/sales-team", (_req, res) => {
  res.json(salesTeam.map(({ password: _p, ...s }) => s));
});

router.get("/sales-team/:id", (req, res) => {
  const s = salesTeam.find((sp) => sp.id === req.params.id);
  if (!s) { res.status(404).json({ error: "Sales person not found" }); return; }
  const { password: _p, ...safe } = s;
  res.json(safe);
});

router.get("/sales-team/:id/stats", (req, res) => {
  const s = salesTeam.find((sp) => sp.id === req.params.id);
  if (!s) { res.status(404).json({ error: "Sales person not found" }); return; }
  const myClients = clients.filter((c) => c.salesPersonId === s.id);
  const clientIds = myClients.map((c) => c.id);
  const myProjects = projects.filter((p) => p.clientId && clientIds.includes(p.clientId));
  const totalRevenue = myProjects.reduce((sum, p) => sum + p.totalValue, 0);
  const closedRevenue = myProjects.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.totalValue, 0);
  const { password: _p, ...saleSafe } = s;
  res.json({
    salesperson: saleSafe,
    clientsClosed: myClients.length,
    totalRevenue,
    closedRevenue,
    activeRevenue: myProjects.filter((p) => p.status === "in_progress").reduce((sum, p) => sum + p.totalValue, 0),
    activeProjects: myProjects.filter((p) => p.status === "in_progress").length,
    completedProjects: myProjects.filter((p) => p.status === "completed").length,
    pendingProjects: myProjects.filter((p) => p.status === "pending").length,
    totalProjects: myProjects.length,
    targetAchieved: s.target > 0 ? Math.min(100, Math.round((myClients.length / s.target) * 100)) : 0,
    clients: myClients.map((c) => ({ ...c, projects: myProjects.filter((p) => p.clientId === c.id) })),
  });
});

router.post("/sales-team", (req, res) => {
  const { name, username, password, email, phone, monthlySalary, target } = req.body;
  if (!name || !username || !password || !phone) {
    res.status(400).json({ error: "name, username, password, phone required" }); return;
  }
  if (salesTeam.find((sp) => sp.username === username)) {
    res.status(400).json({ error: "Username already taken" }); return;
  }
  const s: SalesPerson = {
    id: `s${salesIdCounter++}`, name, username, password, email: email || "",
    phone, joinedAt: new Date().toISOString().split("T")[0],
    monthlySalary: monthlySalary || 0, target: target || 5,
  };
  salesTeam.push(s);
  res.status(201).json({ ...s, password: undefined });
});

router.patch("/sales-team/:id", (req, res) => {
  const s = salesTeam.find((sp) => sp.id === req.params.id);
  if (!s) { res.status(404).json({ error: "Sales person not found" }); return; }
  const { name, username, password, email, phone, monthlySalary, target } = req.body;
  if (username && username !== s.username && salesTeam.find((sp) => sp.username === username && sp.id !== s.id)) {
    res.status(400).json({ error: "Username already taken" }); return;
  }
  if (name) s.name = name;
  if (username) s.username = username;
  if (password) s.password = password;
  if (email !== undefined) s.email = email;
  if (phone) s.phone = phone;
  if (monthlySalary !== undefined) s.monthlySalary = monthlySalary;
  if (target !== undefined) s.target = target;
  res.json({ ...s, password: undefined });
});

router.delete("/sales-team/:id", (req, res) => {
  const idx = salesTeam.findIndex((s) => s.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Sales person not found" }); return; }
  salesTeam.splice(idx, 1); res.json({ success: true });
});

// Assign / unassign client to sales person
router.patch("/clients/:id/assign-sales", (req, res) => {
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  const { salesPersonId } = req.body;
  if (!salesPersonId) {
    client.salesPersonId = undefined; client.salesPersonName = undefined;
  } else {
    const s = salesTeam.find((sp) => sp.id === salesPersonId);
    if (!s) { res.status(404).json({ error: "Sales person not found" }); return; }
    client.salesPersonId = s.id; client.salesPersonName = s.name;
  }
  res.json(client);
});

// ─── Notifications ────────────────────────────────────────────────────────────

router.get("/notifications/:userId", (req, res) => {
  res.json(notifications.filter((n) => n.userId === req.params.userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});
router.post("/notifications/mark-read", (req, res) => {
  const { userId, notifIds } = req.body;
  notifications.forEach((n) => { if (n.userId === userId && (!notifIds || notifIds.includes(n.id))) n.read = true; });
  res.json({ success: true });
});

export default router;
