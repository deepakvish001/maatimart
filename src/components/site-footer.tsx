export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <div className="font-display text-xl italic font-bold text-accent">Maati</div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          © 2026 Maati · Farm-direct produce, India
        </p>
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Logistics</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
}
