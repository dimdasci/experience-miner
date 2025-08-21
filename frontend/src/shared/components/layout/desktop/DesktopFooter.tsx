const DesktopFooter = () => {
  return (
    <footer className="flex-shrink-0 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-subtle bg-background">
      <div className="flex justify-center items-center space-x-8 text-body-sm">
        <div className="-my-1">
          <a href="/terms" className="text-secondary hover:text-primary transition-colors focus-transitional-invert">Terms of Service</a>
        </div>
        <div className="-my-1">
          <a href="/privacy" className="text-secondary hover:text-primary transition-colors focus-transitional-invert">Privacy Policy</a>
        </div>
        <div className="-my-1">
          <a href="/contacts" className="text-secondary hover:text-primary transition-colors focus-transitional-invert">Contacts</a>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;