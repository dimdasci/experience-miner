const DesktopFooter = () => {
  return (
    <footer className="border-t bg-background px-6 py-4 mt-8">
      <div className="flex justify-center space-x-6 text-sm text-gray-600">
        <a href="/terms" className="hover:text-gray-900">Terms of Service</a>
        <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
      </div>
    </footer>
  );
};

export default DesktopFooter;