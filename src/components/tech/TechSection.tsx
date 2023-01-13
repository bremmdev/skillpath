import React from "react";
import TechCard from "./TechCard";
import { type Tech } from "@prisma/client";
import AddIcon from "../../../public/icons/add.svg";
import Image from "next/image";

type Props = {
  tech: Tech[];
};

const TechSection = ({ tech }: Props) => {
  return (
    <section id="tech" className="mb-4 w-full text-lg text-slate-300 sm:mb-8">
      <h2 className="mb-6 text-3xl font-extrabold text-[#00CCFF] sm:mb-8 md:text-4xl lg:text-6xl">
        Tech
      </h2>
      <p className="text-base sm:text-lg">This is the tech I use regularly:</p>
      <div className="grid-cols1 mt-6 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        {tech?.map((tech) => (
          <TechCard key={tech.id} tech={tech} />
        ))}
      </div>
      <button
        className="mt-8"
        // onClick={() => {
        //   createTech({
        //     name: "test",
        //     description: "testert",
        //     url: "https://tweakers.net",
        //   });
        // }}
      >
        <Image
          src={AddIcon}
          className="h-16 w-16 cursor-pointer p-2 opacity-80 hover:opacity-100"
          alt="add tech"
        />
      </button>
    </section>
  );
};

export default TechSection;
