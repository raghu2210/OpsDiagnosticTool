export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-neutral">
        <div>
          <span className="font-semibold text-ink">LongArc Labs</span> &middot; Operations Strategy for Growing
          Businesses
        </div>
        <div>
          Bengaluru, India &middot;{" "}
          <a href="mailto:contact@golongarc.com" className="font-medium text-ink hover:text-accent transition-colors">
            contact@golongarc.com
          </a>{" "}
          &middot;{" "}
          <a href="https://golongarc.com" className="font-medium text-ink hover:text-accent transition-colors">
            golongarc.com
          </a>
        </div>
      </div>
    </footer>
  );
}
