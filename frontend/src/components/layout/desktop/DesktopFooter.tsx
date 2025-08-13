const DesktopFooter = () => {
  return (
    <footer className="flex-shrink-0 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-subtle">
      <div className="flex justify-center items-center space-x-8 text-body-sm">
        <a href="/terms" className="text-secondary hover:text-primary transition-colors focus-ring">Terms of Service</a>
        <a href="/privacy" className="text-secondary hover:text-primary transition-colors focus-ring">Privacy Policy</a>
        <a href="/contacts" className="text-secondary hover:text-primary transition-colors focus-ring">Contacts</a>
      </div>
    </footer>
  );
};

export default DesktopFooter;