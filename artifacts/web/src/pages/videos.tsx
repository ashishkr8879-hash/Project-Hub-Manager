import { useState } from "react";
import { useListPendingVideos, useReviewVideo, getListPendingVideosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Video, User, Clock } from "lucide-react";
import type { VideoSubmission } from "@workspace/api-client-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

function ReviewModal({ video, onClose }: { video: VideoSubmission; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const review = useReviewVideo();
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    review.mutate({ videoId: video.id, data: { action, note: note || undefined } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPendingVideosQueryKey() });
        toast({ title: action === "approve" ? "Video approved" : "Video rejected" });
        onClose();
      },
      onError: () => toast({ title: "Review failed", variant: "destructive" }),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader><DialogTitle>Review Video</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
            <p className="font-medium text-white">{video.fileName}</p>
            <p className="text-sm text-zinc-400 mt-1">{video.editorName} · {video.fileSize}</p>
            {(video as any).projectName && <p className="text-sm text-zinc-500 mt-0.5">{(video as any).projectName}</p>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={action === "approve" ? "default" : "outline"} className={action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "border-zinc-700"} onClick={() => setAction("approve")} data-testid="button-approve-action">
              <CheckCircle2 className="w-4 h-4 mr-1" />Approve
            </Button>
            <Button size="sm" variant={action === "reject" ? "default" : "outline"} className={action === "reject" ? "bg-red-700 hover:bg-red-800" : "border-zinc-700"} onClick={() => setAction("reject")} data-testid="button-reject-action">
              <XCircle className="w-4 h-4 mr-1" />Reject
            </Button>
          </div>
          <div className="space-y-1">
            <Label>Note {action === "reject" ? "(explain reason)" : "(optional)"}</Label>
            <Textarea data-testid="input-review-note" className="bg-zinc-800 border-zinc-700" value={note} onChange={e => setNote(e.target.value)} placeholder={action === "reject" ? "What needs to be changed?" : "Great work! ..."} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-zinc-700" onClick={onClose}>Cancel</Button>
          <Button data-testid="button-submit-review" onClick={handleSubmit} disabled={review.isPending} className={action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-700 hover:bg-red-800"}>
            {review.isPending ? "Submitting..." : (action === "approve" ? "Approve" : "Reject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Videos() {
  const { data: videos, isLoading } = useListPendingVideos({ query: { queryKey: getListPendingVideosQueryKey() } });
  const [selected, setSelected] = useState<VideoSubmission | null>(null);
  const [search, setSearch] = useState("");

  const filtered = (videos || []).filter(v => {
    const q = search.toLowerCase();
    return !q || v.fileName.toLowerCase().includes(q) || v.editorName.toLowerCase().includes(q) || (v as any).projectName?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Queue</h2>
          <p className="text-zinc-400 text-sm mt-0.5">{videos?.length ?? 0} pending reviews</p>
        </div>
      </div>

      <div className="relative">
        <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input data-testid="input-search-videos" className="bg-zinc-900 border-zinc-800 pl-9" placeholder="Search by file, editor, project..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
          <p className="text-zinc-400 font-medium">All clear</p>
          <p className="text-zinc-600 text-sm mt-1">No pending video reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors" data-testid={`card-video-${v.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{v.fileName}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{v.editorName}</span>
                      <span>{v.fileSize}</span>
                      {(v as any).projectName && <span className="text-zinc-500">{(v as any).projectName}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">Deliverable #{v.deliverableIndex}</Badge>
                      <span className="flex items-center gap-1 text-xs text-zinc-500"><Clock className="w-3 h-3" />{timeAgo(v.submittedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setSelected(v)} data-testid={`button-review-${v.id}`}>
                    Review
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <ReviewModal video={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
