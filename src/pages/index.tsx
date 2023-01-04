import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import ArrowDown from "../../public/icons/arrowDown.svg";
import Bio from "../components/Home/Bio";
import Image from "next/image";
import TechCard from "../components/Home/TechCard";
import { trpc } from "../utils/trpc";
import Link from "next/link";
import ProjectCard from "../components/Home/ProjectCard";
import { appRouter } from "../server/trpc/router/_app";
import { prisma } from "../server/db/client";
import superjson from "superjson";

const Home = () => {
  //queries will be fetched instantly because of the cached response from the server
  const { data: tech } = trpc.tech.findAll.useQuery();
  const { data: projects } = trpc.project.findAll.useQuery();

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 py-20 px-4 text-center text-white sm:gap-12 sm:py-28 sm:px-8">
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

        <div className="mt-8 flex w-full justify-center gap-3 text-center tracking-tighter sm:mt-10 sm:gap-8">
          <Link
            href="#projects"
            className="flex cursor-pointer items-center rounded-xl border-2 border-purple-400 bg-slate-900 py-3 px-4 text-base transition-colors duration-300 hover:bg-slate-800 sm:py-4 sm:px-6 sm:text-xl"
          >
            projects &nbsp;
            <Image src={ArrowDown} alt="Arrow icon" width={20} height={20} />
          </Link>
          <Link
            href="#tech"
            className="flex cursor-pointer items-center rounded-xl border-2 border-[#00CCFF] bg-slate-900 py-3 px-4 text-base transition-colors duration-300 hover:bg-slate-800 sm:py-4 sm:px-6 sm:text-xl"
          >
            favorite tech &nbsp;
            <Image src={ArrowDown} alt="Arrow icon" width={20} height={20} />
          </Link>
        </div>
      </div>

      <Bio />

      <section
        id="projects"
        className="mb-4 w-full text-lg text-slate-300 sm:mb-8"
      >
        <h2 className="mb-6 text-3xl font-extrabold text-purple-400 sm:mb-8 md:text-4xl lg:text-6xl">
          Projects
        </h2>
        <p className="text-base sm:text-lg">These are some of my projects:</p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-12 md:grid-cols-2 lg:gap-8">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section id="tech" className="mb-4 w-full text-lg text-slate-300 sm:mb-8">
        <h2 className="mb-6 text-3xl font-extrabold text-[#00CCFF] sm:mb-8 md:text-4xl lg:text-6xl">
          Tech
        </h2>
        <p className="text-base sm:text-lg">
          This is the tech I use regularly:
        </p>
        <div className="grid-cols1 mt-6 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {tech?.map((tech) => (
            <TechCard key={tech.id} tech={tech} />
          ))}
        </div>
      </section>
    </div>
  );
};
export default Home;

export async function getStaticProps() {
  const ssg = await createProxySSGHelpers({
    router: appRouter,
    ctx: {
      prisma: prisma,
    },
    transformer: superjson,
  });

  //prefetch data for ssg
  await ssg.project.findAll.fetch();
  await ssg.tech.findAll.fetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 10,
  };
}
