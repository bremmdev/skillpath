import React from "react";
import type { Project } from "@prisma/client";
import Image from "next/image";
import Github from "../../assets/icons/github.svg";
import Web from '../../assets/icons/web.svg'

type Props = {
  project: Project;
};

const ProjectCard = ({ project }: Props) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl p-5 sm:p-8 border border-slate-400 text-center bg-[#170a37]">
      <h3 className="text-xl sm:text-2xl font-bold uppercase text-purple-400">
        {project.title}
      </h3>
      <p className="sm:px-6 text-sm sm:text-base font-bold text-slate-300 lg:w-4/5 mx-auto">{project.description}</p>
      <p className="text-slate-300 text-sm sm:text-base font-bold">Date: {project.startDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</p>

      <Image
        src={project.imageUrl ?? ""}
        width={1920}
        height={1080}
        alt="project preview"
        className="rounded-md shadow-lg"
      />
      <div className="flex items-center justify-center gap-4 mt-4 bg-transparent">
        <a
          href={`${project.repo}`}
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-purple-400 bg-slate-900 py-2 px-3 sm:px-4 text-sm transition-colors duration-300 hover:bg-slate-800 sm:text-lg"
        >
          Github
          <Image
            src={Github}
            alt="Github logo"
            width={20}
            height={20}
          />
        </a>
        <a
          href={`${project.url}`}
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-purple-400 bg-slate-900 py-2 px-3 sm:px-4 text-sm transition-colors duration-300 hover:bg-slate-800 sm:text-lg"
        >
          Demo
          <Image
            src={Web}
            alt="Github logo"
            width={20}
            height={20}
          />
        </a>
      </div>
    </div>
  );
};

export default ProjectCard;
