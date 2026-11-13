"use client";

import { useState, useEffect, useCallback } from "react";
import { scoreParent, scoreStudent } from "@/lib/scoring";
import type { ParentResult, StudentResult } from "@/lib/scoring";

interface Submission {
  id: string;
  form: "parent" | "student";
  student_name: string | null;
  submitted_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answers: Record<string, any>;
}

interface FamilyGroup {
  studentName: string;
  parent: Submission | null;
  student: Submission | null;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async (pw: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        headers: { "x-admin-password": pw },
      });
      if (res.status === 401) {
        setError("Wrong password");
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data);
      setAuthed(true);
    } catch {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin-pw");
    if (saved) {
      setPassword(saved);
      fetchData(saved);
    }
  }, [fetchData]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("admin-pw", password);
    fetchData(password);
  }

  // Group submissions by student name
  const families: FamilyGroup[] = [];
  const grouped = new Map<string, FamilyGroup>();
  for (const sub of submissions) {
    const name = (sub.student_name || "Unknown").trim().toLowerCase();
    if (!grouped.has(name)) {
      grouped.set(name, { studentName: sub.student_name || "Unknown", parent: null, student: null });
    }
    const g = grouped.get(name)!;
    if (sub.form === "parent") {
      if (!g.parent || sub.submitted_at > g.parent.submitted_at) g.parent = sub;
    } else {
      if (!g.student || sub.submitted_at > g.student.submitted_at) g.student = sub;
    }
  }
  grouped.forEach((v) => families.push(v));
  families.sort((a, b) => {
    const aTime = Math.max(
      a.parent ? new Date(a.parent.submitted_at).getTime() : 0,
      a.student ? new Date(a.student.submitted_at).getTime() : 0
    );
    const bTime = Math.max(
      b.parent ? new Date(b.parent.submitted_at).getTime() : 0,
      b.student ? new Date(b.student.submitted_at).getTime() : 0
    );
    return bTime - aTime;
  });

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={handleLogin} style={styles.loginCard}>
          <h1 style={styles.loginTitle}>Simplifi EDU Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.btnPrimary} disabled={loading}>
            {loading ? "Checking..." : "Sign in"}
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Screener Dashboard</h1>
        <span style={styles.headerCount}>{families.length} {families.length === 1 ? "family" : "families"}</span>
        <button onClick={() => fetchData(password)} style={styles.btnSmall}>Refresh</button>
      </header>

      {families.length === 0 && (
        <p style={styles.empty}>No submissions yet. Share the screener links to get started.</p>
      )}

      {families.map((fam) => {
        const key = fam.studentName.toLowerCase();
        const isOpen = expanded === key;
        return (
          <div key={key} style={styles.familyCard}>
            <button onClick={() => setExpanded(isOpen ? null : key)} style={styles.familyHeader}>
              <div>
                <strong style={styles.familyName}>{fam.studentName}</strong>
                <span style={styles.badges}>
                  {fam.parent && <span style={styles.badgeGreen}>Parent</span>}
                  {fam.student && <span style={styles.badgeBlue}>Student</span>}
                  {!fam.parent && <span style={styles.badgeMuted}>Parent pending</span>}
                  {!fam.student && <span style={styles.badgeMuted}>Student pending</span>}
                </span>
              </div>
              <span style={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div style={styles.familyBody}>
                <div style={styles.columns}>
                  <div style={styles.col}>
                    <h3 style={styles.colTitle}>Parent Screener</h3>
                    {fam.parent ? (
                      <SubmissionDetail sub={fam.parent} />
                    ) : (
                      <p style={styles.muted}>Not yet submitted</p>
                    )}
                  </div>
                  <div style={styles.col}>
                    <h3 style={styles.colTitle}>Student Screener</h3>
                    {fam.student ? (
                      <SubmissionDetail sub={fam.student} />
                    ) : (
                      <p style={styles.muted}>Not yet submitted</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubmissionDetail({ sub }: { sub: Submission }) {
  const [showRaw, setShowRaw] = useState(false);
  const scored = sub.form === "parent"
    ? scoreParent(sub.answers) as ParentResult
    : scoreStudent(sub.answers) as StudentResult;

  const date = new Date(sub.submitted_at);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      <p style={styles.dateLine}>Submitted {dateStr}</p>

      {/* Scored report */}
      <div style={styles.reportSection}>
        <h4 style={styles.reportTitle}>Scored Report</h4>
        {scored.lead && (
          <p style={styles.leadLine}>
            Lead: <strong>{scored.lead.title}</strong> ({scored.lead.total}/{scored.lead.max})
          </p>
        )}
        <div style={styles.bars}>
          {scored.parts.map((p) => (
            <div key={p.n} style={styles.barRow}>
              <span style={styles.barLabel}>
                {p.n}. {"label" in p && p.label ? p.label : p.title}
              </span>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${p.pct * 100}%`,
                    background: p === scored.lead ? "#E8A33D" : "#2D7D8A",
                  }}
                />
              </div>
              <span style={styles.barVal}>
                {p.answered ? p.total : "–"}/{p.max}
              </span>
            </div>
          ))}
        </div>

        {"topThree" in scored && scored.topThree.length > 0 && (
          <div style={styles.flagSection}>
            <strong>Top three:</strong>
            <ol style={{ margin: "4px 0 0 18px", padding: 0 }}>
              {scored.topThree.map((t) => (
                <li key={t.id} style={styles.flagItem}>{t.id}: {t.text}</li>
              ))}
            </ol>
          </div>
        )}

        {scored.flags.length > 0 && (
          <div style={styles.flagSection}>
            <strong>Flags:</strong>
            {scored.flags.map((f, i) => (
              <div key={i} style={styles.flag}>{f}</div>
            ))}
          </div>
        )}
      </div>

      {/* Raw answers toggle */}
      <button onClick={() => setShowRaw(!showRaw)} style={styles.btnSmall}>
        {showRaw ? "Hide raw answers" : "Show raw answers"}
      </button>
      {showRaw && (
        <pre style={styles.raw}>{JSON.stringify(sub.answers, null, 2)}</pre>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loginWrap: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#EEF3F4", fontFamily: "Figtree, system-ui, sans-serif" },
  loginCard: { background: "#fff", borderRadius: 18, padding: "32px 28px", maxWidth: 360, width: "100%", boxShadow: "0 2px 12px rgba(0,0,0,.08)", display: "flex", flexDirection: "column", gap: 14 },
  loginTitle: { margin: 0, fontSize: 22, color: "#1F3B57", fontWeight: 600 },
  input: { font: "inherit", fontSize: 16, padding: "11px 12px", border: "1px solid #D5DFE4", borderRadius: 10, background: "#F3F7F8", color: "#1F3B57" },
  btnPrimary: { font: "inherit", fontWeight: 600, fontSize: 16, padding: "12px 18px", borderRadius: 12, border: "none", background: "#2D7D8A", color: "#fff", cursor: "pointer" },
  btnSmall: { font: "inherit", fontSize: 13, fontWeight: 600, color: "#2D7D8A", background: "none", border: "1px solid #D5DFE4", borderRadius: 8, padding: "6px 12px", cursor: "pointer", marginTop: 8 },
  error: { color: "#c33", fontSize: 14, margin: 0 },

  page: { maxWidth: 1100, margin: "0 auto", padding: "20px 16px 60px", fontFamily: "Figtree, system-ui, sans-serif", color: "#1F3B57" },
  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" as const },
  headerTitle: { margin: 0, fontSize: 24, fontWeight: 600 },
  headerCount: { fontSize: 14, color: "#7A8B9A", fontWeight: 500 },
  empty: { color: "#7A8B9A", fontSize: 15 },

  familyCard: { background: "#fff", border: "1px solid #D5DFE4", borderRadius: 14, marginBottom: 12, overflow: "hidden" },
  familyHeader: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", background: "none", border: "none", font: "inherit", cursor: "pointer", textAlign: "left" as const },
  familyName: { fontSize: 17, color: "#1F3B57" },
  badges: { display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" as const },
  badgeGreen: { fontSize: 12, fontWeight: 600, background: "#E3F1F2", color: "#2D7D8A", borderRadius: 6, padding: "2px 8px" },
  badgeBlue: { fontSize: 12, fontWeight: 600, background: "#E0ECFF", color: "#2D5FA0", borderRadius: 6, padding: "2px 8px" },
  badgeMuted: { fontSize: 12, fontWeight: 500, background: "#F3F7F8", color: "#7A8B9A", borderRadius: 6, padding: "2px 8px" },
  chevron: { color: "#7A8B9A", fontSize: 14 },

  familyBody: { padding: "0 18px 18px", borderTop: "1px solid #D5DFE4" },
  columns: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 },
  col: { minWidth: 0 },
  colTitle: { margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: "#2D7D8A", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  muted: { color: "#7A8B9A", fontSize: 14 },
  dateLine: { fontSize: 13, color: "#7A8B9A", margin: "0 0 10px" },

  reportSection: { marginBottom: 12 },
  reportTitle: { margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1F3B57" },
  leadLine: { fontSize: 14, margin: "0 0 10px", color: "#E8A33D" },
  bars: { display: "grid", gap: 5 },
  barRow: { display: "grid", gridTemplateColumns: "minmax(0, 200px) 1fr 44px", gap: 8, alignItems: "center", fontSize: 13 },
  barLabel: { whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" },
  barTrack: { height: 10, background: "#F3F7F8", borderRadius: 99, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 99, transition: "width .3s" },
  barVal: { textAlign: "right" as const, color: "#4E6378", fontVariantNumeric: "tabular-nums" },

  flagSection: { marginTop: 10, fontSize: 13 },
  flagItem: { marginBottom: 4, lineHeight: 1.4 },
  flag: { background: "#F3F7F8", borderRadius: 6, padding: "6px 10px", marginTop: 4, fontSize: 13 },

  raw: { background: "#F3F7F8", borderRadius: 10, padding: 14, fontSize: 12, overflow: "auto", maxHeight: 400, marginTop: 8, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const },
};
