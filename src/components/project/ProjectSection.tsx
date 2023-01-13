import { type Project } from "@prisma/client";
import ProjectCard from "./ProjectCard";

type Props = {
  projects: Project[];
};

const ProjectSection = ({ projects }: Props) => {
  return (
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
  );
};

export default ProjectSection;
