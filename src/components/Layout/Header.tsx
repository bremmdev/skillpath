const Header = () => {
  return (
    <header className="flex flex-col gap-8 text-center tracking-tighter">
      <h1 className="bg-gradient-to-b from-[#00CCFF] via-blue-200 to-purple-400 bg-clip-text text-5xl font-extrabold text-transparent md:text-6xl lg:text-8xl">
        skillpath
      </h1>
      <p className="max-w-lg text-3xl font-bold leading-10 md:max-w-xl md:text-4xl lg:max-w-3xl lg:text-6xl">
        My <span className="text-[#00CCFF]">path</span> to becoming a
        <span className="text-purple-400"> skilled</span> software developer
      </p>
    </header>
  );
};

export default Header;
