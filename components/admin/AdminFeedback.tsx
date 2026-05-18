"use client";

import { Star } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface AdminFeedbackProps {
  feedbacks: any[] | undefined;
  loadingFeedback: boolean;
}

export function AdminFeedback({ feedbacks, loadingFeedback }: AdminFeedbackProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-bold text-2xl">Platform Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">What users are saying about {APP_NAME}</p>
      </div>

      <div className="rounded-[28px] border border-border bg-card shadow-sm p-6">
        {loadingFeedback ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : feedbacks?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No feedback received yet.</div>
        ) : (
          <div className="space-y-4">
            {feedbacks?.map((feedback: any) => (
              <div key={feedback._id} className="p-4 rounded-2xl border border-border bg-muted/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`size-4 ${feedback.rating >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                </div>
                {feedback.comments && <p className="text-sm text-foreground leading-relaxed">{feedback.comments}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {feedback.orderId && <span>Order: <span className="font-mono text-primary">{feedback.orderId}</span></span>}
                  {feedback.vendorId && <span>· Vendor: <span className="font-mono">{feedback.vendorId}</span></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
