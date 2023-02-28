import { type Project } from "@prisma/client";
import React from "react";
import ProjectCard from "./ProjectCard";
import { trpc } from "../../utils/trpc";
import Alert from "../UI/Alert";
import Modal from "../UI/Modal/Modal";
import AddProjectForm from "./AddProjectForm";
import Image from "next/image";
import AddIcon from "../../../public/icons/add.svg";

type Props = {
  projects: Project[];
};

const ProjectSection = ({ projects }: Props) => {
  const [showAddForm, setSHowAddForm] = React.useState(false);
  const [createSuccess, setCreateSuccess] = React.useState(false);

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

  const handleAddProject = () => {
    toggleShowAddForm();
    setCreateSuccess(true);
  };

  const toggleShowAddForm = () => {
    setSHowAddForm((prevState) => !prevState);
    setCreateSuccess(false);
  };

  const alertMessages = (
    <>
      {isDeleting && <Alert message="Deleting project..." type="loading" />}
      {deletionError && <Alert message={deletionError.message} type="error" />}
      {deleteSuccess && (
        <Alert message="Project successfully deleted" type="success" />
      )}
      {createSuccess && (
        <Alert message="Project successfully added" type="success" />
      )}
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
      {!showAddForm && (
        <button className="my-4">
          <Image
            src={AddIcon}
            className="h-16 w-16 cursor-pointer p-2 opacity-80 hover:opacity-100"
            alt="add tech"
            onClick={toggleShowAddForm}
          />
        </button>
      )}

      {showAddForm && (
        <Modal onClose={toggleShowAddForm}>
          <AddProjectForm onAddProject={handleAddProject} />
        </Modal>
      )}
    </section>
  );
};

export default ProjectSection;
