const Logo = () => {
  // We'll let the CSS handle browser-specific styling
  return (
    <h1 className="text-2xl italic text-primary font-serif logo-text relative inline-flex items-baseline">
      espejo
      <sup className="ml-1 text-body-sm font-sans font-light text-accent not-italic">preview</sup>
    </h1>
  );
};

export default Logo;