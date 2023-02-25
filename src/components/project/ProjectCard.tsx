import React from "react";
import type { Project } from "@prisma/client";
import Image from "next/image";
import Github from "../../../public/icons/github.svg";
import Web from "../../../public/icons/web.svg";
import Modal from "../UI/Modal/Modal";
import DeleteIcon from "../../../public/icons/delete.svg";
import previewImage from "../../../public/images/project_preview.webp";

type Props = {
  project: Project;
  deleteProjectById: (id: string) => void;
  isDeleting: boolean;
};

const ProjectCard = (props: Props) => {
  const [showModal, setShowModal] = React.useState(false);

  const { project, deleteProjectById, isDeleting } = props;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    //prevent concurrent deletion
    if (!isDeleting) deleteProjectById(project.id);
  };

  const imageSrc =
    project.imageUrl && project.imageUrl.length > 0
      ? project.imageUrl
      : previewImage;

  const ImageComponent = (
    <Image
      src={imageSrc}
      width={1920}
      height={1080}
      priority={imageSrc === previewImage}
      alt="project preview"
      className={`pointer-events-none ${
        !showModal ? "md:pointer-events-auto" : "pointer-events-none"
      } cursor-pointer rounded-md shadow-lg transition-all duration-300 hover:scale-102`}
      onClick={() => setShowModal(true)}
    />
  );

  return (
    <div className="relative flex flex-col gap-4 rounded-xl border border-slate-400 bg-[#170a37] p-5 text-center sm:p-8">
      <Image
        src={DeleteIcon}
        alt="Delete Icon"
        className="absolute right-6 top-6 h-5 w-5 cursor-pointer transition-all duration-300 hover:scale-105"
        onClick={handleDelete}
      />
      <h3 className="text-xl font-bold uppercase text-purple-400 sm:text-2xl">
        {project.title}
      </h3>
      <p className="mx-auto text-sm font-bold text-slate-300 sm:px-6 sm:text-base lg:w-4/5">
        {project.description}
      </p>
      <p className="text-sm font-bold text-slate-300 sm:text-base">
        Date:{" "}
        {project.startDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>{ImageComponent}</Modal>
      )}

      {ImageComponent}

      <div className="mt-4 flex items-center justify-center gap-4 bg-transparent">
        <a
          href={`${project.repo}`}
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-purple-400 bg-slate-900 py-2 px-3 text-sm transition-colors duration-300 hover:bg-slate-800 sm:px-4 sm:text-lg"
        >
          Github
          <Image src={Github} alt="Github logo" width={20} height={20} />
        </a>
        <a
          href={`${project.url}`}
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-purple-400 bg-slate-900 py-2 px-3 text-sm transition-colors duration-300 hover:bg-slate-800 sm:px-4 sm:text-lg"
        >
          Demo
          <Image src={Web} alt="Github logo" width={20} height={20} />
        </a>
      </div>
    </div>
  );
};

export default ProjectCard;
