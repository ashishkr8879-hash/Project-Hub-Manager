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

interface Project {
  id: string;
  clientName: string;
  projectName: string;
  totalValue: number;
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
  userId: string; // editorId OR "admin"
  type: "project_assigned" | "video_submitted" | "video_approved" | "video_rejected";
  title: string;
  message: string;
  projectId?: string;
  videoId?: string;
  read: boolean;
  createdAt: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ADMIN_CREDS = { username: "admin", password: "admin123", id: "admin", name: "Sarah Admin", role: "admin" as const };

const editors: Editor[] = [
  { id: "e1", name: "Alice Johnson", email: "alice@studio.com", password: "alice123", phone: "+91 98100 11111", specialization: "Wedding & Events", joinedAt: "2023-01-15" },
  { id: "e2", name: "Bob Martinez", email: "bob@studio.com",   password: "bob123",   phone: "+91 98100 22222", specialization: "Brand Commercials",  joinedAt: "2023-03-20" },
  { id: "e3", name: "Clara Lee",    email: "clara@studio.com", password: "clara123", phone: "+91 98100 33333", specialization: "Social Media Reels",  joinedAt: "2023-06-01" },
  { id: "e4", name: "David Kim",    email: "david@studio.com", password: "david123", phone: "+91 98100 44444", specialization: "Corporate Films",     joinedAt: "2024-01-10" },
];

const projects: Project[] = [
  { id: "p1", clientName: "TechCorp Inc",   projectName: "Brand Video Series",       totalValue: 12000, totalDeliverables: 6, editorId: "e1", editorName: "Alice Johnson", status: "in_progress", completedDeliverables: 3, createdAt: new Date(Date.now() - 7  * 86400000).toISOString(), deadline: new Date(Date.now() + 14 * 86400000).toISOString(), notes: "Focus on product close-ups. Color grade warm." },
  { id: "p2", clientName: "Sunrise Events", projectName: "Wedding Highlight Reel",   totalValue: 3500,  totalDeliverables: 2, editorId: "e2", editorName: "Bob Martinez",  status: "pending",     completedDeliverables: 0, createdAt: new Date(Date.now() - 2  * 86400000).toISOString(), deadline: new Date(Date.now() + 7  * 86400000).toISOString(), notes: "Cinematic style. Use provided music track." },
  { id: "p3", clientName: "FitLife App",    projectName: "Product Launch Campaign",  totalValue: 8500,  totalDeliverables: 4, editorId: "e1", editorName: "Alice Johnson", status: "completed",   completedDeliverables: 4, createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), notes: "All deliverables submitted and approved." },
  { id: "p4", clientName: "ArtHouse Films", projectName: "Short Film Edit",          totalValue: 6000,  totalDeliverables: 3, editorId: "e3", editorName: "Clara Lee",    status: "in_progress", completedDeliverables: 1, createdAt: new Date(Date.now() - 5  * 86400000).toISOString(), deadline: new Date(Date.now() + 10 * 86400000).toISOString() },
  { id: "p5", clientName: "StyleBrand",     projectName: "Instagram Reel Pack",      totalValue: 2000,  totalDeliverables: 5, editorId: "e4", editorName: "David Kim",    status: "pending",     completedDeliverables: 0, createdAt: new Date(Date.now() - 1  * 86400000).toISOString(), deadline: new Date(Date.now() + 5  * 86400000).toISOString() },
];

let projectIdCounter = projects.length + 1;

const videoSubmissions: VideoSubmission[] = [
  { id: "v1", projectId: "p1", editorId: "e1", editorName: "Alice Johnson", fileName: "brand_intro_v1.mp4", fileSize: "248 MB", deliverableIndex: 1, submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(), status: "approved", reviewedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "v2", projectId: "p1", editorId: "e1", editorName: "Alice Johnson", fileName: "brand_section2_v1.mp4", fileSize: "310 MB", deliverableIndex: 2, submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(), status: "rejected", reviewNote: "Color grading needs to be warmer. Re-check the ending cut.", reviewedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "v3", projectId: "p4", editorId: "e3", editorName: "Clara Lee",    fileName: "shortfilm_act1_v2.mp4", fileSize: "520 MB", deliverableIndex: 1, submittedAt: new Date(Date.now() - 6 * 3600000).toISOString(),  status: "pending_review" },
];

let videoIdCounter = videoSubmissions.length + 1;

const notifications: Notification[] = [
  { id: "n1", userId: "e1", type: "project_assigned", title: "New Project Assigned", message: "You have been assigned: Brand Video Series by TechCorp Inc", projectId: "p1", read: true,  createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "n2", userId: "e1", type: "video_rejected",   title: "Video Rejected",        message: "brand_section2_v1.mp4 was rejected. Reason: Color grading needs to be warmer.", projectId: "p1", videoId: "v2", read: false, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "n3", userId: "e1", type: "video_approved",   title: "Video Approved ✓",      message: "brand_intro_v1.mp4 has been approved by admin!", projectId: "p1", videoId: "v1", read: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "n4", userId: "admin", type: "video_submitted", title: "New Video Uploaded", message: "Alice Johnson uploaded brand_section2_v1.mp4 for Brand Video Series", projectId: "p1", videoId: "v2", read: true, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "n5", userId: "admin", type: "video_submitted", title: "New Video Uploaded", message: "Clara Lee uploaded shortfilm_act1_v2.mp4 for Short Film Edit", projectId: "p4", videoId: "v3", read: false, createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
];

let notifIdCounter = notifications.length + 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pushNotif(data: Omit<Notification, "id" | "read" | "createdAt">) {
  notifications.push({ ...data, id: `n${notifIdCounter++}`, read: false, createdAt: new Date().toISOString() });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) { res.status(400).json({ error: "Username and password required" }); return; }

  if (username === ADMIN_CREDS.username && password === ADMIN_CREDS.password) {
    res.json({ id: ADMIN_CREDS.id, name: ADMIN_CREDS.name, role: ADMIN_CREDS.role });
    return;
  }

  const editor = editors.find((e) => e.email.split("@")[0] === username && e.password === password);
  if (editor) {
    res.json({ id: editor.id, name: editor.name, role: "editor", editorId: editor.id });
    return;
  }

  res.status(401).json({ error: "Invalid username or password" });
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
    id:             editor.id,
    name:           editor.name,
    email:          editor.email,
    phone:          editor.phone,
    specialization: editor.specialization,
    joinedAt:       editor.joinedAt,
    stats: {
      totalProjects:     editorProjects.length,
      completedProjects: editorProjects.filter((p) => p.status === "completed").length,
      inProgressProjects:editorProjects.filter((p) => p.status === "in_progress").length,
      pendingProjects:   editorProjects.filter((p) => p.status === "pending").length,
      totalVideosUploaded:  editorVideos.length,
      approvedVideos:       editorVideos.filter((v) => v.status === "approved").length,
      rejectedVideos:       editorVideos.filter((v) => v.status === "rejected").length,
      pendingReviewVideos:  editorVideos.filter((v) => v.status === "pending_review").length,
      totalEarnings:        editorProjects.filter((p) => p.status === "completed").reduce((s, p) => s + p.totalValue, 0),
    },
    recentProjects: editorProjects.slice(-5).reverse(),
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
    totalProjects:     projects.length,
    totalEditors:      editors.length,
    todayRevenue:      todayRevenue > 0 ? todayRevenue : 5200,
    activeProjects:    projects.filter((p) => p.status === "in_progress").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    pendingProjects:   projects.filter((p) => p.status === "pending").length,
    pendingReviews:    videoSubmissions.filter((v) => v.status === "pending_review").length,
  });
});

router.post("/projects", (req, res) => {
  const { clientName, projectName, totalValue, totalDeliverables, editorId, deadline, notes } = req.body;
  if (!clientName || !projectName || totalValue == null || totalDeliverables == null || !editorId) {
    res.status(400).json({ error: "All fields are required" }); return;
  }
  const editor = editors.find((e) => e.id === editorId);
  if (!editor) { res.status(400).json({ error: "Editor not found" }); return; }

  const project: Project = {
    id: `p${projectIdCounter++}`, clientName, projectName,
    totalValue: Number(totalValue), totalDeliverables: Number(totalDeliverables),
    editorId, editorName: editor.name, status: "pending", completedDeliverables: 0,
    createdAt: new Date().toISOString(), deadline, notes,
  };
  projects.push(project);

  // Notify the editor
  pushNotif({ userId: editorId, type: "project_assigned", title: "New Project Assigned",
    message: `You have been assigned: ${projectName} by ${clientName}`, projectId: project.id });

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
    editorName: editor.name, fileName, fileSize: fileSize ?? "Unknown",
    deliverableIndex: Number(deliverableIndex) || 1,
    submittedAt: new Date().toISOString(), status: "pending_review",
  };
  videoSubmissions.push(video);

  // Notify admin
  pushNotif({ userId: "admin", type: "video_submitted", title: "New Video Uploaded",
    message: `${editor.name} uploaded ${fileName} for ${project.projectName}`,
    projectId: project.id, videoId: video.id });

  res.status(201).json(video);
});

router.patch("/videos/:videoId/review", (req, res) => {
  const video = videoSubmissions.find((v) => v.id === req.params.videoId);
  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  const { action, note } = req.body; // action: "approve" | "reject"
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
