import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <a href="#hero" className="footer-logo">Quick Pill</a>
            <p className="footer-tagline">Dynamic Island, but for everyone.</p>
          </div>
          <div className="footer-right">
            <div className="footer-links">
              <a
                href="https://github.com/nabil24024004/Quick-Pill"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-github"
              >
                <Github size={13} strokeWidth={1.5} />
                GitHub
              </a>
              <a
                href="https://github.com/nabil24024004/Quick-Pill/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                Releases
              </a>
              <a
                href="https://github.com/nabil24024004/Quick-Pill/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
              >
                MIT License
              </a>
            </div>
            <p className="footer-copy">
              © {new Date().getFullYear()} Abrar Nabil. Open-source under MIT License.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
