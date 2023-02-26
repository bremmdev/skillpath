import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import Bio from "../components/Bio/Bio";
import TechSection from "../components/tech/TechSection";
import { trpc } from "../utils/trpc";
import { appRouter } from "../server/trpc/router/_app";
import superjson from "superjson";
import ProjectSection from "../components/project/ProjectSection";
import FeatureSection from "../components/feature/FeatureSection";
import Header from "../components/Layout/Header";
import QuickLinks from "../components/Layout/QuickLinks";
import { createContextInner } from "../server/trpc/context";

const Home = () => {
  //queries will be fetched instantly because of the cached response from the server
  const { data: tech } = trpc.tech.findAll.useQuery();
  const { data: projects } = trpc.project.findAll.useQuery();
  const { data: features } = trpc.feature.findAll.useQuery();

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 py-20 px-4 text-center text-white sm:gap-12 sm:py-28 sm:px-8">
      <Header />
      <QuickLinks />
      <Bio />
      {projects && <ProjectSection projects={projects} />}
      {tech && <TechSection tech={tech} />}
      {features && <FeatureSection features={features}/>}
    </div>
  );
};
export default Home;

export async function getStaticProps() {
  const ssg = await createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({}),
    transformer: superjson,
  });

  //prefetch data for ssg
  await ssg.project.findAll.prefetch();
  await ssg.tech.findAll.prefetch();
  await ssg.feature.findAll.prefetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 10,
  };
}
