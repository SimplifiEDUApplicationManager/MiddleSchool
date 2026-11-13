export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Figtree, system-ui, sans-serif",
        background: "#EEF3F4",
        color: "#1F3B57",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 8px" }}>
        Simplifi EDU
      </h1>
      <p style={{ color: "#4E6378", margin: "0 0 28px", fontSize: 16 }}>
        Middle School Mastery Screeners
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <a
          href="/parent.html"
          style={{
            background: "#2D7D8A",
            color: "#fff",
            padding: "14px 28px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 16,
            textDecoration: "none",
          }}
        >
          Parent Screener
        </a>
        <a
          href="/student.html"
          style={{
            background: "#fff",
            color: "#1F3B57",
            padding: "14px 28px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 16,
            textDecoration: "none",
            border: "1.5px solid #D5DFE4",
          }}
        >
          Student Screener
        </a>
      </div>
    </div>
  );
}
