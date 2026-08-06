export default function Navbar() {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <a href="#hero" className="navbar-logo">
        <img src="/icon.png" alt="Quick Pill" style={{ width: 22, height: 22, borderRadius: 5 }} />
        Quick Pill
      </a>
      <ul className="navbar-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#how-it-works">How it works</a></li>
        <li><a href="#download">Download</a></li>
        <li>
          <a
            href="https://github.com/nabil24024004/Quick-Pill"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
        </li>
      </ul>
    </nav>
  );
}
