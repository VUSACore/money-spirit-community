import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag, CheckCircle } from "lucide-react";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment_or_bullying", label: "Harassment or bullying" },
  { value: "misinformation", label: "Misinformation" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "other", label: "Other" },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: "post" | "thread" | "thread_reply" | "comment";
  contentId: string;
};

const ReportDialog = ({ open, onOpenChange, contentType, contentId }: Props) => {
  const [reason, setReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to report content", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Check for existing pending report from this user on this content
    const { data: existing } = await supabase
      .from("content_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("resolved", false)
      .limit(1);

    if (existing && existing.length > 0) {
      setSubmitted(true);
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("content_reports").insert({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      reason,
    });

    if (error) {
      toast({ title: "Unable to submit report", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setReason(null);
      setSubmitted(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md"
        style={{
          background: "rgba(12, 18, 33, 0.95)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
        }}
      >
        {submitted ? (
          <div className="flex flex-col items-center py-6 gap-4 text-center">
            <CheckCircle size={40} style={{ color: "var(--gold-base)" }} />
            <DialogHeader>
              <DialogTitle
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 400,
                  color: "var(--text-1)",
                }}
              >
                Report received
              </DialogTitle>
              <DialogDescription
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "var(--text-3)",
                  marginTop: 4,
                }}
              >
                Thank you. Our team will review this and take appropriate action.
              </DialogDescription>
            </DialogHeader>
            <Button variant="ghost" onClick={handleClose} className="mt-2" style={{ color: "var(--text-2)" }}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle
                className="flex items-center gap-2"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 400,
                  color: "var(--text-1)",
                }}
              >
                <Flag size={18} style={{ color: "var(--gold-base)" }} />
                Report content
              </DialogTitle>
              <DialogDescription
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--text-3)",
                }}
              >
                Select the reason this content should be reviewed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 mt-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className="w-full text-left transition-colors"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: reason === r.value ? "var(--gold-bright)" : "var(--text-2)",
                    background:
                      reason === r.value
                        ? "rgba(201, 148, 30, 0.12)"
                        : "rgba(255,255,255,0.03)",
                    border:
                      reason === r.value
                        ? "1px solid rgba(201, 148, 30, 0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={handleClose} style={{ color: "var(--text-3)" }}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="btn-gold"
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
