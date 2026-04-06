"use client";

import { useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import ProfilePolicyPanel from "@/components/ProfilePolicyPanel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./ProfileDock.module.css";

type ProfileDockProps = {
  session: Session | null;
  authReady: boolean;
  supabaseConfigured: boolean;
};

function getInitials(email?: string | null): string {
  if (!email) {
    return "U";
  }

  const namePart = email.split("@")[0] || "user";
  const chunks = namePart.split(/[._-]+/).filter(Boolean);

  if (chunks.length >= 2) {
    return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
  }

  return namePart.slice(0, 2).toUpperCase();
}

export default function ProfileDock({ session, authReady, supabaseConfigured }: ProfileDockProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);

  if (!authReady || !supabaseConfigured) {
    return null;
  }

  const handleSignOut = async () => {
    if (!supabase) {
      window.location.reload();
      return;
    }

    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleSignInJump = () => {
    const node = document.getElementById("account-access");
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.mount}>
      {session && open ? (
        <div className={styles.drawer}>
          <ProfilePolicyPanel user={session.user} />
        </div>
      ) : null}

      <aside className={styles.dock}>
        {session ? (
          <>
            <div className={styles.identityWrap}>
              <span className={styles.avatar}>{getInitials(session.user.email)}</span>
              <div className={styles.identityText}>
                <p className={styles.label}>Account</p>
                <p className={styles.email}>{session.user.email}</p>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setOpen((current) => !current)}
              >
                {open ? "Close settings" : "Open settings"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleSignOut}
              >
                Log out
              </button>
            </div>
          </>
        ) : (
          <div className={styles.loggedOutWrap}>
            <p className={styles.label}>Account</p>
            <button type="button" className={styles.primaryButton} onClick={handleSignInJump}>
              Log in / Sign up
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
