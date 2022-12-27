import { type NextPage } from "next";
import ArrowDown from "../components/UI/icons/ArrowDown";
import Bio from "../components/Home/Bio";

import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { isLoading, data } = trpc.tech.findAll.useQuery();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  console.log(data);

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 py-28 px-4 text-center text-white">
      <header className="flex flex-col gap-8 text-center tracking-tighter">
        <h1 className="bg-gradient-to-b from-[#00CCFF] via-blue-200 to-purple-400 bg-clip-text text-5xl font-extrabold text-transparent md:text-6xl lg:text-8xl">
          skillpath
        </h1>
        <p className="max-w-lg text-3xl font-bold leading-10 md:max-w-xl md:text-4xl lg:max-w-3xl lg:text-6xl">
          My <span className="text-[#00CCFF]">path</span> to becoming a
          <span className="text-purple-400"> skilled</span> software developer
        </p>
      </header>
      <div className="font-bold">
        <p className="text-lg sm:text-2xl">Have a look at my:</p>

        <div className="my-10 flex w-full justify-center gap-3 text-center tracking-tighter sm:gap-8">
          <a
            href="#tech"
            className="flex cursor-pointer items-center rounded-xl border-2 border-[#00CCFF] bg-slate-900 py-3 px-4 text-base transition-colors duration-300 hover:bg-[#18212f] sm:py-4 sm:px-6 sm:text-xl"
          >
            favorite tech &nbsp;
            <ArrowDown />
          </a>

          <a
            href="#projects"
            className="flex cursor-pointer items-center rounded-xl border-2 border-purple-400 bg-slate-900 py-3 px-4 text-base transition-colors duration-300 hover:bg-[#18212f] sm:py-4 sm:px-6 sm:text-xl"
          >
            projects &nbsp;
            <ArrowDown />
          </a>
        </div>
      </div>

      <Bio />

      <section id="tech-section" className="w-full">
        <h2 className="text-3xl font-extrabold text-[#00CCFF] sm:text-4xl">
          Tech
        </h2>
      </section>
    </div>
  );
};
export default Home;
