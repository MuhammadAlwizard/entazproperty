export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Memuat halaman">
      <div className="skeleton" style={{ width: 220, height: 34 }} />
      <div className="skeleton" style={{ width: '100%', height: 220, marginTop: 28 }} />
      <div className="skeleton" style={{ width: '100%', height: 120, marginTop: 16 }} />
    </div>
  );
}
