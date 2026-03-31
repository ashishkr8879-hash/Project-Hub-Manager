import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ─── Types ───────────────────────────────────────────────────────────────────

interface Editor {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  specialization: string;
  joinedAt: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessType: string;
  city: string;
  createdAt: string;
}

interface ProjectReference {
  id: string;
  projectId: string;
  title: string;
  url?: string;
  note: string;
  addedAt: string;
}

type ProjectType = "ugc" | "branded" | "corporate" | "wedding" | "social_media" | "other";

interface Project {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  projectName: string;
  projectType: ProjectType;
  totalValue: number;
  modelCost: number;       // for UGC: model fee deducted from totalValue
  totalDeliverables: number;
  editorId: string;
  editorName: string;
  status: "pending" | "in_progress" | "completed";
  completedDeliverables: number;
  createdAt: string;
  deadline?: string;
  notes?: string;
}

interface VideoSubmission {
  id: string;
  projectId: string;
  editorId: string;
  editorName: string;
  fileName: string;
  fileSize: string;
  deliverableIndex: number;
  submittedAt: string;
  status: "pending_review" | "approved" | "rejected";
  reviewNote?: string;
  reviewedAt?: string;
}

interface Notification {
  id: string;
  userId: string;
  type: "project_assigned" | "video_submitted" | "video_approved" | "video_rejected";
  title: string;
  message: string;
  projectId?: string;
  videoId?: string;
  read: boolean;
  createdAt: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ADMIN = {
  username: "admin", password: "admin123", id: "admin",
  name: "Divyashakti Admin", businessName: "Divyashakti Productions",
  email: "admin@divyashakti.com", phone: "+91 98765 00001",
  role: "admin" as const,
};

const editors: Editor[] = [
  { id: "e1", name: "Alice Johnson", email: "alice@divyashakti.com",  password: "alice123",  phone: "+91 98100 11111", specialization: "Wedding & Events",  joinedAt: "2023-01-15" },
  { id: "e2", name: "Bob Martinez",  email: "bob@divyashakti.com",    password: "bob123",    phone: "+91 98100 22222", specialization: "Brand Commercials", joinedAt: "2023-03-20" },
  { id: "e3", name: "Clara Lee",     email: "clara@divyashakti.com",  password: "clara123",  phone: "+91 98100 33333", specialization: "Social Media Reels", joinedAt: "2023-06-01" },
  { id: "e4", name: "David Kim",     email: "david@divyashakti.com",  password: "david123",  phone: "+91 98100 44444", specialization: "Corporate Films",   joinedAt: "2024-01-10" },
];

const clients: Client[] = [
  { id: "c1", name: "TechCorp Inc",   phone: "+91 99001 11111", email: "contact@techcorp.in",   businessType: "Technology",   city: "Mumbai",    createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "c2", name: "Sunrise Events", phone: "+91 99001 22222", email: "hello@sunriseevents.in", businessType: "Events",       city: "Delhi",     createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: "c3", name: "FitLife App",    phone: "+91 99001 33333", email: "brand@fitlife.in",       businessType: "Health & Fitness", city: "Bangalore", createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: "c4", name: "ArtHouse Films", phone: "+91 99001 44444", email: "info@arthouse.in",       businessType: "Entertainment", city: "Pune",     createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "c5", name: "StyleBrand",     phone: "+91 99001 55555", email: "collab@stylebrand.in",   businessType: "Fashion",       city: "Hyderabad", createdAt: new Date(Date.now() - 5  * 86400000).toISOString() },
];
let clientIdCounter = clients.length + 1;

const projects: Project[] = [
  { id: "p1", clientId: "c1", clientName: "TechCorp Inc",   clientPhone: "+91 99001 11111", clientEmail: "contact@techcorp.in",   projectName: "Brand Video Series",      projectType: "branded",      totalValue: 12000, modelCost: 0,    totalDeliverables: 6, editorId: "e1", editorName: "Alice Johnson", status: "in_progress", completedDeliverables: 3, createdAt: new Date(Date.now() - 7  * 86400000).toISOString(), deadline: new Date(Date.now() + 14 * 86400000).toISOString(), notes: "Focus on product close-ups. Color grade warm." },
  { id: "p2", clientId: "c2", clientName: "Sunrise Events", clientPhone: "+91 99001 22222", clientEmail: "hello@sunriseevents.in", projectName: "Wedding Highlight Reel",  projectType: "wedding",      totalValue: 3500,  modelCost: 0,    totalDeliverables: 2, editorId: "e2", editorName: "Bob Martinez",  status: "pending",     completedDeliverables: 0, createdAt: new Date(Date.now() - 2  * 86400000).toISOString(), deadline: new Date(Date.now() + 7  * 86400000).toISOString(), notes: "Cinematic style. Use provided music track." },
  { id: "p3", clientId: "c3", clientName: "FitLife App",    clientPhone: "+91 99001 33333", clientEmail: "brand@fitlife.in",       projectName: "UGC Product Reviews x5",  projectType: "ugc",          totalValue: 8500,  modelCost: 2500, totalDeliverables: 5, editorId: "e1", editorName: "Alice Johnson", status: "in_progress", completedDeliverables: 2, createdAt: new Date(Date.now() - 5  * 86400000).toISOString(), deadline: new Date(Date.now() + 10 * 86400000).toISOString(), notes: "Model booked. 15-30 sec each. Natural lighting." },
  { id: "p4", clientId: "c4", clientName: "ArtHouse Films", clientPhone: "+91 99001 44444", clientEmail: "info@arthouse.in",       projectName: "Short Film Edit",         projectType: "corporate",    totalValue: 6000,  modelCost: 0,    totalDeliverables: 3, editorId: "e3", editorName: "Clara Lee",    status: "in_progress", completedDeliverables: 1, createdAt: new Date(Date.now() - 5  * 86400000).toISOString(), deadline: new Date(Date.now() + 10 * 86400000).toISOString() },
  { id: "p5", clientId: "c5", clientName: "StyleBrand",     clientPhone: "+91 99001 55555", clientEmail: "collab@stylebrand.in",   projectName: "Instagram UGC Reel Pack", projectType: "ugc",          totalValue: 4500,  modelCost: 1200, totalDeliverables: 6, editorId: "e4", editorName: "David Kim",    status: "pending",     completedDeliverables: 0, createdAt: new Date(Date.now() - 1  * 86400000).toISOString(), deadline: new Date(Date.now() + 5  * 86400000).toISOString(), notes: "Model: Priya. 9:16 format only. Brand kit shared." },
];
let projectIdCounter = projects.length + 1;

const references: ProjectReference[] = [
  { id: "r1", projectId: "p1", title: "Brand Guidelines PDF", url: "https://drive.google.com/brand-kit", note: "Use brand colors only — blue #0057FF and white", addedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: "r2", projectId: "p1", title: "Reference Video", url: "https://youtube.com/watch?v=example", note: "Match this color grade and pacing", addedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "r3", projectId: "p3", title: "UGC Brief Doc", url: "https://docs.google.com/ugc-brief", note: "Model to use all 5 products. Unboxing style.", addedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: "r4", projectId: "p5", title: "Moodboard", url: "https://pinterest.com/stylebrand-refs", note: "Soft pastels, aesthetic flat lay style", addedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
];
let refIdCounter = references.length + 1;

const videoSubmissions: VideoSubmission[] = [
  { id: "v1", projectId: "p1", editorId: "e1", editorName: "Alice Johnson", fileName: "brand_intro_v1.mp4",     fileSize: "248 MB", deliverableIndex: 1, submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(), status: "approved",        reviewedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "v2", projectId: "p1", editorId: "e1", editorName: "Alice Johnson", fileName: "brand_section2_v1.mp4", fileSize: "310 MB", deliverableIndex: 2, submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(), status: "rejected",        reviewNote: "Color grading needs to be warmer. Re-check the ending cut.", reviewedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "v3", projectId: "p4", editorId: "e3", editorName: "Clara Lee",    fileName: "shortfilm_act1_v2.mp4", fileSize: "520 MB", deliverableIndex: 1, submittedAt: new Date(Date.now() - 6  * 3600000).toISOString(), status: "pending_review" },
];
let videoIdCounter = videoSubmissions.length + 1;

const notifications: Notification[] = [
  { id: "n1", userId: "e1",    type: "project_assigned", title: "New Project Assigned", message: "You have been assigned: Brand Video Series by TechCorp Inc",              projectId: "p1", read: true,  createdAt: new Date(Date.now() - 7  * 86400000).toISOString() },
  { id: "n2", userId: "e1",    type: "video_rejected",   title: "Video Rejected",       message: "brand_section2_v1.mp4 was rejected. Color grading needs to be warmer.",   projectId: "p1", videoId: "v2", read: false, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "n3", userId: "e1",    type: "video_approved",   title: "Video Approved ✓",     message: "brand_intro_v1.mp4 has been approved!",                                   projectId: "p1", videoId: "v1", read: true,  createdAt: new Date(Date.now() - 2  * 86400000).toISOString() },
  { id: "n4", userId: "admin", type: "video_submitted",  title: "New Video Uploaded",   message: "Alice Johnson uploaded brand_section2_v1.mp4 for Brand Video Series",     projectId: "p1", videoId: "v2", read: true,  createdAt: new Date(Date.now() - 1  * 86400000).toISOString() },
  { id: "n5", userId: "admin", type: "video_submitted",  title: "New Video Uploaded",   message: "Clara Lee uploaded shortfilm_act1_v2.mp4 for Short Film Edit",            projectId: "p4", videoId: "v3", read: false, createdAt: new Date(Date.now() - 6  * 3600000).toISOString() },
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
    res.json({ id: ADMIN.id, name: ADMIN.name, role: ADMIN.role });
    return;
  }

  const editor = editors.find((e) => e.email.split("@")[0] === username && e.password === password);
  if (editor) {
    res.json({ id: editor.id, name: editor.name, role: "editor", editorId: editor.id });
    return;
  }

  res.status(401).json({ error: "Invalid username or password" });
});

// ─── Admin Profile ────────────────────────────────────────────────────────────

router.get("/admin/profile", (_req, res) => {
  const totalRevenue  = projects.filter((p) => p.status === "completed").reduce((s, p) => s + p.totalValue, 0);
  const totalUgcCost  = projects.filter((p) => p.projectType === "ugc").reduce((s, p) => s + p.modelCost, 0);
  const ugcProjects   = projects.filter((p) => p.projectType === "ugc");
  const netRevenue    = totalRevenue - projects.filter((p) => p.status === "completed" && p.projectType === "ugc").reduce((s, p) => s + p.modelCost, 0);

  res.json({
    id:           ADMIN.id,
    name:         ADMIN.name,
    businessName: ADMIN.businessName,
    email:        ADMIN.email,
    phone:        ADMIN.phone,
    stats: {
      totalProjects:     projects.length,
      completedProjects: projects.filter((p) => p.status === "completed").length,
      activeProjects:    projects.filter((p) => p.status === "in_progress").length,
      totalClients:      clients.length,
      totalEditors:      editors.length,
      totalRevenue,
      netRevenue,
      totalUgcProjects:  ugcProjects.length,
      totalModelCost:    totalUgcCost,
      pendingReviews:    videoSubmissions.filter((v) => v.status === "pending_review").length,
    },
    recentClients: clients.slice(-5).reverse(),
  });
});

// ─── Clients ──────────────────────────────────────────────────────────────────

router.get("/clients", (_req, res) => res.json(clients));

router.post("/clients", (req, res) => {
  const { name, phone, email, businessType, city } = req.body;
  if (!name || !phone) { res.status(400).json({ error: "Name and phone are required" }); return; }
  const client: Client = {
    id: `c${clientIdCounter++}`, name, phone, email: email || "",
    businessType: businessType || "Other", city: city || "",
    createdAt: new Date().toISOString(),
  };
  clients.push(client);
  res.status(201).json(client);
});

router.delete("/clients/:id", (req, res) => {
  const idx = clients.findIndex((c) => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Client not found" }); return; }
  clients.splice(idx, 1);
  res.json({ success: true });
});

// ─── Editors ──────────────────────────────────────────────────────────────────

router.get("/editors", (_req, res) => {
  res.json(editors.map(({ password: _p, ...e }) => e));
});

router.get("/editors/:editorId/profile", (req, res) => {
  const editor = editors.find((e) => e.id === req.params.editorId);
  if (!editor) { res.status(404).json({ error: "Editor not found" }); return; }

  const editorProjects = projects.filter((p) => p.editorId === editor.id);
  const editorVideos   = videoSubmissions.filter((v) => v.editorId === editor.id);

  res.json({
    id: editor.id, name: editor.name, email: editor.email, phone: editor.phone,
    specialization: editor.specialization, joinedAt: editor.joinedAt,
    stats: {
      totalProjects:       editorProjects.length,
      completedProjects:   editorProjects.filter((p) => p.status === "completed").length,
      inProgressProjects:  editorProjects.filter((p) => p.status === "in_progress").length,
      pendingProjects:     editorProjects.filter((p) => p.status === "pending").length,
      totalVideosUploaded: editorVideos.length,
      approvedVideos:      editorVideos.filter((v) => v.status === "approved").length,
      rejectedVideos:      editorVideos.filter((v) => v.status === "rejected").length,
      pendingReviewVideos: editorVideos.filter((v) => v.status === "pending_review").length,
      totalEarnings:       editorProjects.filter((p) => p.status === "completed").reduce((s, p) => s + (p.totalValue - p.modelCost), 0),
    },
    recentProjects: editorProjects.slice(-5).reverse(),
  });
});

// ─── Projects ─────────────────────────────────────────────────────────────────

router.get("/projects", (_req, res) => res.json(projects));

router.get("/projects/editor/:editorId", (req, res) => {
  res.json(projects.filter((p) => p.editorId === req.params.editorId));
});

router.get("/projects/:id", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const projectRefs   = references.filter((r) => r.projectId === req.params.id);
  const projectVideos = videoSubmissions.filter((v) => v.projectId === req.params.id);
  res.json({ ...project, references: projectRefs, videos: projectVideos });
});

router.get("/dashboard/stats", (_req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayRevenue = projects
    .filter((p) => { const c = new Date(p.createdAt); return c >= today && p.status === "completed"; })
    .reduce((s, p) => s + p.totalValue, 0);

  res.json({
    totalProjects:     projects.length,
    totalEditors:      editors.length,
    totalClients:      clients.length,
    todayRevenue:      todayRevenue > 0 ? todayRevenue : 5200,
    activeProjects:    projects.filter((p) => p.status === "in_progress").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    pendingProjects:   projects.filter((p) => p.status === "pending").length,
    pendingReviews:    videoSubmissions.filter((v) => v.status === "pending_review").length,
  });
});

router.post("/projects", (req, res) => {
  const { clientId, clientName, clientPhone, clientEmail, projectName, projectType, totalValue, modelCost, totalDeliverables, editorId, deadline, notes } = req.body;
  if (!clientName || !projectName || totalValue == null || totalDeliverables == null || !editorId) {
    res.status(400).json({ error: "All fields are required" }); return;
  }

  const editor = editors.find((e) => e.id === editorId);
  if (!editor) { res.status(400).json({ error: "Editor not found" }); return; }

  const resolvedClientId = clientId || (clients.find((c) => c.name === clientName)?.id);

  const project: Project = {
    id: `p${projectIdCounter++}`,
    clientId: resolvedClientId, clientName, clientPhone, clientEmail,
    projectName, projectType: projectType || "other",
    totalValue: Number(totalValue), modelCost: Number(modelCost) || 0,
    totalDeliverables: Number(totalDeliverables),
    editorId, editorName: editor.name,
    status: "pending", completedDeliverables: 0,
    createdAt: new Date().toISOString(), deadline, notes,
  };
  projects.push(project);

  pushNotif({
    userId: editorId, type: "project_assigned",
    title: "New Project Assigned",
    message: `You have been assigned: ${projectName} by ${clientName}`,
    projectId: project.id,
  });

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

// ─── References ───────────────────────────────────────────────────────────────

router.get("/projects/:projectId/references", (req, res) => {
  res.json(references.filter((r) => r.projectId === req.params.projectId));
});

router.post("/projects/:projectId/references", (req, res) => {
  const project = projects.find((p) => p.id === req.params.projectId);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { title, url, note } = req.body;
  if (!title) { res.status(400).json({ error: "Title is required" }); return; }
  const ref: ProjectReference = {
    id: `r${refIdCounter++}`, projectId: req.params.projectId,
    title, url: url || undefined, note: note || "",
    addedAt: new Date().toISOString(),
  };
  references.push(ref);
  res.status(201).json(ref);
});

router.delete("/references/:id", (req, res) => {
  const idx = references.findIndex((r) => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Reference not found" }); return; }
  references.splice(idx, 1);
  res.json({ success: true });
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
    const project = projects.find((p) => p.id === v.projectId);
    return { ...v, projectName: project?.projectName, clientName: project?.clientName };
  }));
});

router.post("/projects/:projectId/videos", (req, res) => {
  const project = projects.find((p) => p.id === req.params.projectId);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { editorId, fileName, fileSize, deliverableIndex } = req.body;
  const editor = editors.find((e) => e.id === editorId);
  if (!editor) { res.status(400).json({ error: "Editor not found" }); return; }

  const video: VideoSubmission = {
    id: `v${videoIdCounter++}`, projectId: project.id, editorId,
    editorName: editor.name, fileName, fileSize: fileSize || "Unknown",
    deliverableIndex: Number(deliverableIndex) || 1,
    submittedAt: new Date().toISOString(), status: "pending_review",
  };
  videoSubmissions.push(video);

  pushNotif({
    userId: "admin", type: "video_submitted", title: "New Video Uploaded",
    message: `${editor.name} uploaded ${fileName} for ${project.projectName}`,
    projectId: project.id, videoId: video.id,
  });

  res.status(201).json(video);
});

router.patch("/videos/:videoId/review", (req, res) => {
  const video = videoSubmissions.find((v) => v.id === req.params.videoId);
  if (!video) { res.status(404).json({ error: "Video not found" }); return; }
  const { action, note } = req.body;
  if (action !== "approve" && action !== "reject") {
    res.status(400).json({ error: "action must be 'approve' or 'reject'" }); return;
  }

  video.status    = action === "approve" ? "approved" : "rejected";
  video.reviewNote = note ?? undefined;
  video.reviewedAt = new Date().toISOString();

  const project = projects.find((p) => p.id === video.projectId);
  if (action === "approve") {
    pushNotif({ userId: video.editorId, type: "video_approved", title: "Video Approved ✓",
      message: `${video.fileName} has been approved for ${project?.projectName ?? "your project"}!`,
      projectId: video.projectId, videoId: video.id });
  } else {
    pushNotif({ userId: video.editorId, type: "video_rejected", title: "Video Rejected",
      message: `${video.fileName} was rejected. ${note ? "Reason: " + note : ""}`,
      projectId: video.projectId, videoId: video.id });
  }

  res.json(video);
});

// ─── Notifications ────────────────────────────────────────────────────────────

router.get("/notifications/:userId", (req, res) => {
  const userNotifs = notifications
    .filter((n) => n.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotifs);
});

router.post("/notifications/mark-read", (req, res) => {
  const { userId, notifIds } = req.body;
  notifications.forEach((n) => {
    if (n.userId === userId && (!notifIds || notifIds.includes(n.id))) n.read = true;
  });
  res.json({ success: true });
});

export default router;
