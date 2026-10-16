const links = [
  { href: "#team", label: "Team" },
  { href: "#coaches", label: "Coaches" },
  { href: "#week", label: "The week" },
  { href: "#onebridge", label: "OneBridge" },
  { href: "#photos", label: "Photos" },
];

/** Transparent over the hero, solid once the hero has scrolled away. */
export function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a href="#top" className="brand">
          <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true" focusable="false">
            <rect width="64" height="64" rx="14" fill="#ffb81c" />
            <path d="M14 44 C 22 22, 42 22, 50 44" fill="none" stroke="#14120e" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <span>Southwestern University</span>
        </a>
        <nav aria-label="Sections" className="header-nav">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
