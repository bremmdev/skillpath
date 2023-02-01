import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import type { InferGetStaticPropsType } from "next";
import Bio from "../components/Bio/Bio";
import TechSection from "../components/tech/TechSection";
import { trpc } from "../utils/trpc";
import { appRouter } from "../server/trpc/router/_app";
import { prisma } from "../server/db/client";
import superjson from "superjson";
import ProjectSection from "../components/project/ProjectSection";
import Header from "../components/Layout/Header";
import QuickLinks from "../components/Layout/QuickLinks";
import type { Project, Tech } from "@prisma/client";

const Home = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  //queries will be fetched instantly because of the cached response from the server
  const { data: tech } = trpc.tech.findAll.useQuery();
  const { data: projects } = trpc.project.findAll.useQuery();

  const prop: { tech: Tech[], projects: Project[]} = superjson.deserialize(props.superjsonData)

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 py-20 px-4 text-center text-white sm:gap-12 sm:py-28 sm:px-8">
      <Header />
      <QuickLinks />
      <Bio />
      {prop.projects && <ProjectSection projects={prop.projects} />}
      {prop.tech && <TechSection tech={prop.tech} />}
    </div>
  );
};
export default Home;

export async function getStaticProps() {
  // const ssg = await createProxySSGHelpers({
  //   router: appRouter,
  //   ctx: {
  //     prisma: prisma,
  //   },
  //   transformer: superjson,
  // });

  // //prefetch data for ssg
  // await ssg.project.findAll.fetch();
  // await ssg.tech.findAll.fetch();

  // return {
  //   props: {
  //     trpcState: ssg.dehydrate(),
  //   },
  //   revalidate: 10,
  // };

  const caller = appRouter.createCaller({prisma})
  const projects = await caller.project.findAll()
  const tech = await caller.tech.findAll()

  const superjsonData = superjson.serialize({
    projects,
    tech
  })


  return {
    props: {
     superjsonData
    },
    revalidate: 10,
  };
}
