import { type Project } from "@prisma/client";
import ProjectCard from "./ProjectCard";
import { trpc } from "../../utils/trpc";
import Alert from "../UI/Alert";

type Props = {
  projects: Project[];
};

const ProjectSection = ({ projects }: Props) => {
  const utils = trpc.useContext();

  const {
    mutate: deleteProjectById,
    isLoading: isDeleting,
    error: deletionError,
    isSuccess: deleteSuccess,
  } = trpc.project.deleteById.useMutation({
    onSuccess: () => {
      utils.project.invalidate();
    },
  });

  const alertMessages = (
    <>
      {isDeleting && <Alert message="Deleting tech..." type="loading" />}
      {deletionError && <Alert message={deletionError.message} type="error" />}
      {deleteSuccess && (
        <Alert message="Project successfully deleted" type="success" />
      )}
      {/* {createSuccess && (
        <Alert message="Tech successfully added" type="success" />
      )} */}
    </>
  );

  return (
    <section
      id="projects"
      className="mb-4 w-full text-lg text-slate-300 sm:mb-8"
    >
      {alertMessages}
      <h2 className="mb-6 text-3xl font-extrabold text-purple-400 sm:mb-8 md:text-4xl lg:text-6xl">
        Projects
      </h2>
      <p className="text-base sm:text-lg">These are some of my projects:</p>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-12 md:grid-cols-2 lg:gap-8">
        {projects?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            deleteProjectById={deleteProjectById}
            isDeleting={isDeleting}
          />
        ))}
      </div>
    </section>
  );
};

export default ProjectSection;
