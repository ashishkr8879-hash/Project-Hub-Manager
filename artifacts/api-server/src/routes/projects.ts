import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface Editor {
  id: string;
  name: string;
  email: string;
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
}

const editors: Editor[] = [
  { id: "e1", name: "Alice Johnson", email: "alice@studio.com" },
  { id: "e2", name: "Bob Martinez", email: "bob@studio.com" },
  { id: "e3", name: "Clara Lee", email: "clara@studio.com" },
  { id: "e4", name: "David Kim", email: "david@studio.com" },
];

const projects: Project[] = [
  {
    id: "p1",
    clientName: "TechCorp Inc",
    projectName: "Brand Video Series",
    totalValue: 12000,
    totalDeliverables: 6,
    editorId: "e1",
    editorName: "Alice Johnson",
    status: "in_progress",
    completedDeliverables: 3,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p2",
    clientName: "Sunrise Events",
    projectName: "Wedding Highlight Reel",
    totalValue: 3500,
    totalDeliverables: 2,
    editorId: "e2",
    editorName: "Bob Martinez",
    status: "pending",
    completedDeliverables: 0,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p3",
    clientName: "FitLife App",
    projectName: "Product Launch Campaign",
    totalValue: 8500,
    totalDeliverables: 4,
    editorId: "e1",
    editorName: "Alice Johnson",
    status: "completed",
    completedDeliverables: 4,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let projectIdCounter = projects.length + 1;

router.get("/editors", (_req, res) => {
  res.json(editors);
});

router.get("/projects", (_req, res) => {
  res.json(projects);
});

router.get("/projects/editor/:editorId", (req, res) => {
  const { editorId } = req.params;
  const editorProjects = projects.filter((p) => p.editorId === editorId);
  res.json(editorProjects);
});

router.get("/dashboard/stats", (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRevenue = projects
    .filter((p) => {
      const created = new Date(p.createdAt);
      return created >= today && p.status === "completed";
    })
    .reduce((sum, p) => sum + p.totalValue, 0);

  res.json({
    totalProjects: projects.length,
    totalEditors: editors.length,
    todayRevenue: todayRevenue > 0 ? todayRevenue : 5200,
    activeProjects: projects.filter((p) => p.status === "in_progress").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    pendingProjects: projects.filter((p) => p.status === "pending").length,
  });
});

router.post("/projects", (req, res) => {
  const { clientName, projectName, totalValue, totalDeliverables, editorId } =
    req.body;

  if (
    !clientName ||
    !projectName ||
    totalValue == null ||
    totalDeliverables == null ||
    !editorId
  ) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const editor = editors.find((e) => e.id === editorId);
  if (!editor) {
    res.status(400).json({ error: "Editor not found" });
    return;
  }

  const project: Project = {
    id: `p${projectIdCounter++}`,
    clientName,
    projectName,
    totalValue: Number(totalValue),
    totalDeliverables: Number(totalDeliverables),
    editorId,
    editorName: editor.name,
    status: "pending",
    completedDeliverables: 0,
    createdAt: new Date().toISOString(),
  };

  projects.push(project);
  res.status(201).json(project);
});

router.patch("/projects/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, completedDeliverables } = req.body;

  const project = projects.find((p) => p.id === id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (status) project.status = status;
  if (completedDeliverables != null)
    project.completedDeliverables = completedDeliverables;

  res.json(project);
});

export default router;
