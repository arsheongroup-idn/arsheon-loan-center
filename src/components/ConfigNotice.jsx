export default function ConfigNotice() {
  return (
    <div className="narrow" style={{ padding: '4rem 0' }}>
      <div className="card stack" role="alert">
        <h2>Firebase is not configured</h2>
        <p className="muted">
          Copy <code>.env.example</code> to <code>.env</code>, fill in your own Firebase web app
          configuration, then restart the dev server.
        </p>
      </div>
    </div>
  );
}
