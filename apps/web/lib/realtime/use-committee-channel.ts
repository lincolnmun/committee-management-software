"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// One Realtime channel per committee (Section 8) — any change to that
// committee's speakers_list or sessions rows triggers a server refetch so
// every connected client (chair or delegate) converges on the same state.
// Postgres RLS still filters what each client's own read queries can see,
// so a client in a different committee never receives this committee's
// data even though the channel name itself isn't secret.
export function useCommitteeChannel(committeeId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`committee:${committeeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "speakers_list", filter: `committee_id=eq.${committeeId}` },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `committee_id=eq.${committeeId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [committeeId, router]);
}
