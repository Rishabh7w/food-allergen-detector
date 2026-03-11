import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-foreground text-primary-foreground border-t border-primary-foreground/10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            <span className="font-display font-semibold">Food Allergen Detection</span>
          </div>
          <div className="text-sm text-primary-foreground/50 text-center">
            <p>Final Year Major Project — CSE, VIII Semester</p>
            <p className="mt-1">By Ikraj Khan & Rishabh Singh</p>
          </div>
          <div className="text-xs text-primary-foreground/40">
            © 2026 All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
