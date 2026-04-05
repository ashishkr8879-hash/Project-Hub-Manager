import { useState } from "react";
import { useListClients, useListEditors, useCreateClient, useCreateProject } from "@workspace/api-client-react";
import type { CreateProjectBody } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Check, Plus, X, User, Building2,
  Calendar, FileText, DollarSign, Film, Star,
} from "lucide-react";

type ProjectType = "ugc" | "ai_video" | "editing" | "branded" | "corporate" | "wedding" | "social_media" | "graphic_design" | "ads_setup" | "website" | "other";

const PROJECT_TYPES: { value: ProjectType; label: string; emoji: string; desc: string }[] = [
  { value: "ugc", label: "UGC", emoji: "🎬", desc: "User Generated Content" },
  { value: "ai_video", label: "AI Video", emoji: "🤖", desc: "AI-powered video creation" },
  { value: "editing", label: "Editing", emoji: "✂️", desc: "Video editing & post-production" },
  { value: "branded", label: "Branded", emoji: "💎", desc: "Brand identity content" },
  { value: "corporate", label: "Corporate", emoji: "🏢", desc: "Corporate video production" },
  { value: "wedding", label: "Wedding", emoji: "💍", desc: "Wedding films & photos" },
  { value: "social_media", label: "Social Media", emoji: "📱", desc: "Social media content" },
  { value: "graphic_design", label: "Graphic Design", emoji: "🎨", desc: "Graphics & visual design" },
  { value: "ads_setup", label: "Ads Setup", emoji: "📣", desc: "Ad campaigns & setup" },
  { value: "website", label: "Website", emoji: "🌐", desc: "Web design & development" },
  { value: "other", label: "Other", emoji: "📦", desc: "Other project types" },
];

const SPEC_COLORS: Record<string, string> = {
  "Video Editor": "#7c3aed", "Graphic Designer": "#ec4899",
  "Social Media Manager": "#0ea5e9", "Website Development": "#10b981", "Ads Setup": "#f97316",
};

const TYPE_TO_SPEC: Record<ProjectType, string | null> = {
  ugc: "Video Editor",
  ai_video: "Video Editor",
  editing: "Video Editor",
  branded: "Video Editor",
  corporate: "Video Editor",
  wedding: "Video Editor",
  social_media: "Social Media Manager",
  graphic_design: "Graphic Designer",
  ads_setup: "Ads Setup",
  website: "Website Development",
  other: null,
};

export default function Create() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: clients = [] } = useListClients();
  const { data: editors = [] } = useListEditors();
  const createProjectMut = useCreateProject();
  const createClientMut = useCreateClient();

  // Step state
  const [step, setStep] = useState<"type" | "client" | "details" | "success">("type");
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);

  // Client selection
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", businessType: "", city: "" });
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  // Project form
  const [form, setForm] = useState({
    projectName: "", totalValue: "", modelCost: "0", editorCost: "0",
    totalDeliverables: "1", editorId: "", deadline: "", notes: "", script: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdProject, setCreatedProject] = useState<any | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedEditor = editors.find((e) => e.id === form.editorId);

  const netProfit = (+(form.totalValue || 0)) - (+(form.modelCost || 0)) - (+(form.editorCost || 0));

  const requiredSpec = selectedType ? TYPE_TO_SPEC[selectedType] : null;
  const filteredEditors = requiredSpec ? editors.filter((e) => e.specialization === requiredSpec) : editors;
  const assignLabel = requiredSpec ?? "Team Member";

  const showModelEditorCost = selectedType === "ugc" || selectedType === "ai_video" || selectedType === "editing";

  async function handleClientNext() {
    setError("");
    if (clientMode === "existing") {
      if (!selectedClientId) { setError("Please select a client"); return; }
    } else {
      if (!newClient.name || !newClient.phone) { setError("Client name and phone are required"); return; }
      try {
        const created = await createClientMut.mutateAsync({ data: newClient });
        setCreatedClientId((created as any).id);
        qc.invalidateQueries({ queryKey: ["/api/clients"] });
      } catch (err: any) {
        setError(err?.message || "Failed to create client"); return;
      }
    }
    setStep("details");
  }

  async function handleSubmit() {
    setError("");
    if (!form.projectName) { setError("Project name is required"); return; }
    if (!form.totalValue || +form.totalValue <= 0) { setError("Total value is required"); return; }
    if (!form.editorId) { setError("Please assign an editor"); return; }
    setSubmitting(true);
    try {
      const clientId = clientMode === "existing" ? selectedClientId : (createdClientId ?? "");
      const clientName = clientMode === "existing" ? (selectedClient?.name ?? "") : newClient.name;
      const clientPhone = clientMode === "existing" ? (selectedClient?.phone ?? "") : newClient.phone;
      const clientEmail = clientMode === "existing" ? (selectedClient?.email ?? "") : newClient.email;
      const editor = editors.find((e) => e.id === form.editorId);
      const payload: CreateProjectBody = {
        clientId, clientName, clientPhone, clientEmail,
        projectName: form.projectName,
        projectType: selectedType!,
        totalValue: +form.totalValue,
        modelCost: +form.modelCost,
        editorCost: +form.editorCost,
        totalDeliverables: +form.totalDeliverables,
        editorId: form.editorId,
        editorName: editor?.name ?? "",
        editorPhone: editor?.phone ?? "",
        deadline: form.deadline || undefined,
        notes: form.notes || undefined,
        script: form.script || undefined,
        status: "pending",
      };
      const created = await createProjectMut.mutateAsync({ data: payload });
      qc.invalidateQueries({ queryKey: ["/api/projects"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setCreatedProject(created);
      setStep("success");
    } catch (err: any) {
      setError(err?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Project Created!</h2>
          <p className="text-sm text-zinc-400 mt-1">{createdProject?.projectName} has been created successfully</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 text-left space-y-2">
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Client</span><span className="text-white font-medium">{createdProject?.clientName}</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Editor</span><span className="text-white font-medium">{createdProject?.editorName}</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Value</span><span className="text-emerald-400 font-semibold">₹{(+form.totalValue).toLocaleString()}</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Net Profit</span><span className="text-emerald-400 font-bold">₹{netProfit.toLocaleString()}</span></div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setStep("type"); setSelectedType(null); setForm({ projectName: "", totalValue: "", modelCost: "0", editorCost: "0", totalDeliverables: "1", editorId: "", deadline: "", notes: "", script: "" }); setSelectedClientId(""); setCreatedClientId(null); }}
            className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-semibold hover:bg-zinc-700 transition-colors"
          >
            Create Another
          </button>
          <button onClick={() => setLocation("/projects")} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            View Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header with back */}
      <div className="flex items-center gap-3">
        {step !== "type" && (
          <button onClick={() => setStep(step === "details" ? "client" : "type")} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">Create Project</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {step === "type" ? "Step 1: Choose project type" : step === "client" ? "Step 2: Select client" : "Step 3: Project details"}
          </p>
        </div>
        {/* Progress dots */}
        <div className="ml-auto flex items-center gap-1.5">
          {["type", "client", "details"].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${step === s ? "w-6 bg-blue-500" : (["type", "client", "details"].indexOf(step) > ["type", "client", "details"].indexOf(s) ? "w-3 bg-blue-500/60" : "w-3 bg-zinc-700")}`} />
          ))}
        </div>
      </div>

      {/* STEP 1: Project Type */}
      {step === "type" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">Select the type of project you're creating</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROJECT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => { setSelectedType(t.value); setStep("client"); }}
                className={`p-4 rounded-2xl border text-left transition-all duration-150 ${selectedType === t.value ? "border-blue-500 bg-blue-500/10" : "border-zinc-800/60 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/40"}`}
              >
                <span className="text-2xl block mb-2">{t.emoji}</span>
                <p className="text-sm font-semibold text-white">{t.label}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Client */}
      {step === "client" && (
        <div className="space-y-4">
          {/* Selected type badge */}
          {selectedType && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 w-fit">
              <span className="text-base">{PROJECT_TYPES.find((t) => t.value === selectedType)?.emoji}</span>
              <span className="text-sm font-semibold text-blue-400">{PROJECT_TYPES.find((t) => t.value === selectedType)?.label}</span>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => setClientMode("existing")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${clientMode === "existing" ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white"}`}>
              Existing Client
            </button>
            <button onClick={() => setClientMode("new")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${clientMode === "new" ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white"}`}>
              New Client
            </button>
          </div>

          {clientMode === "existing" ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">{clients.length} clients available</p>
              {clients.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">No clients yet. Add one below.</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {clients.map((c) => {
                    const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const hue = (c.id.charCodeAt(0) * 53) % 360;
                    return (
                      <button key={c.id} onClick={() => setSelectedClientId(c.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedClientId === c.id ? "border-blue-500 bg-blue-500/10" : "border-zinc-800/60 bg-zinc-900 hover:border-zinc-700"}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: `hsl(${hue},55%,40%)` }}>{initials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                          <p className="text-xs text-zinc-500">{c.businessType} · {c.phone}</p>
                        </div>
                        {selectedClientId === c.id && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { key: "name", label: "Name *", placeholder: "Client name" },
                { key: "phone", label: "Phone *", placeholder: "+91 9999..." },
                { key: "email", label: "Email", placeholder: "client@email.com" },
                { key: "businessType", label: "Business Type", placeholder: "Fashion Brand" },
                { key: "city", label: "City", placeholder: "Mumbai" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-zinc-500 block mb-1">{label}</label>
                  <input value={(newClient as any)[key]} onChange={(e) => setNewClient(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600" />
                </div>
              ))}
            </div>
          )}

          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}
          <button onClick={handleClientNext} disabled={createClientMut.isPending} className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {createClientMut.isPending ? "Creating client..." : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}

      {/* STEP 3: Details */}
      {step === "details" && (
        <div className="space-y-4">
          {/* Client info */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2">
            <User className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-300">
              {clientMode === "existing" ? selectedClient?.name : newClient.name}
            </span>
          </div>

          {/* Project Name */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Project Name *</label>
            <input value={form.projectName} onChange={(e) => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder="e.g. Summer Collection UGC" className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600" />
          </div>

          {/* Financial */}
          {showModelEditorCost ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Total Value (₹) *</label>
                <input type="number" value={form.totalValue} onChange={(e) => setForm(f => ({ ...f, totalValue: e.target.value }))} placeholder="25000" className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Model Cost (₹)</label>
                <input type="number" value={form.modelCost} onChange={(e) => setForm(f => ({ ...f, modelCost: e.target.value }))} placeholder="0" className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Editor Cost (₹)</label>
                <input type="number" value={form.editorCost} onChange={(e) => setForm(f => ({ ...f, editorCost: e.target.value }))} placeholder="0" className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white" />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Total Value (₹) *</label>
              <input type="number" value={form.totalValue} onChange={(e) => setForm(f => ({ ...f, totalValue: e.target.value }))} placeholder="25000" className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
          )}

          {/* Net profit preview — only for UGC/AI/Editing */}
          {showModelEditorCost && form.totalValue && (
            <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-xl px-4 py-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Net Profit</span>
                <span className={`font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>₹{netProfit.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Deliverables + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Total Deliverables</label>
              <input type="number" min="1" value={form.totalDeliverables} onChange={(e) => setForm(f => ({ ...f, totalDeliverables: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
          </div>

          {/* Assign Team Member */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500">Assign {assignLabel} *</label>
              {requiredSpec && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: (SPEC_COLORS[requiredSpec] ?? "#6b7280") + "20", color: SPEC_COLORS[requiredSpec] ?? "#6b7280" }}>
                  {filteredEditors.length} available
                </span>
              )}
            </div>
            {filteredEditors.length === 0 ? (
              <div className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-3 text-center">
                No {assignLabel} found. Add team members in Settings.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {filteredEditors.map((ed) => {
                  const specColor = SPEC_COLORS[ed.specialization] ?? "#6b7280";
                  const edInitials = ed.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <button key={ed.id} onClick={() => setForm((f) => ({ ...f, editorId: ed.id }))} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${form.editorId === ed.id ? "border-blue-500 bg-blue-500/10" : "border-zinc-800/60 bg-zinc-900 hover:border-zinc-700"}`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: specColor + "25" }}>
                        <span style={{ color: specColor }}>{edInitials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{ed.name}</p>
                        <p className="text-xs font-medium" style={{ color: specColor }}>{ed.specialization}</p>
                      </div>
                      {form.editorId === ed.id && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Project notes..." className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white resize-none placeholder-zinc-600" />
          </div>

          {/* Script */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Script</label>
            <textarea value={form.script} onChange={(e) => setForm(f => ({ ...f, script: e.target.value }))} rows={3} placeholder="Script or brief..." className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white resize-none placeholder-zinc-600" />
          </div>

          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}

          <button onClick={handleSubmit} disabled={submitting} className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
            ) : (
              <><Check className="w-4 h-4" />Create Project</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
