import Image from "next/image";
import React from "react";
import Github from "../../../public/icons/github.svg"

const Bio = () => {
  return (
    <section className="text-lg text-slate-300 my-4 sm:my-8">
      <h2 className="mb-8 bg-gradient-to-b from-[#00CCFF] via-blue-200 to-purple-400 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl lg:text-6xl">
        Hi, I am Matt!
      </h2>
      <p className="max-w-5xl font-medium text-base sm:text-lg">
        I am a software developer from the Netherlands. I love trying new things
        and experimenting with new technologies. While my initial focus was on
        front-end development using React, I am expanding my skillset towards
        fullstack development, slowly becoming proficient in both front-end and
        back-end development by learning about fullstack frameworks like Next.js
        and Remix. I am characterized by my enthusiasm and drive for continuous
        learning, always looking for new opportunities to learn.
      </p>
      <div className="mt-6 flex flex-col gap-6 items-center">
        <p className="font-extrabold text-xl">Find me on</p>
        <a href="https://github.com/bremmdev" target="_blank" rel="noreferrer">
          <Image src={Github} alt="Github logo" width={50} height={50} className="transition-all duration-300 opacity-75 hover:opacity-100 hover:scale-105"/>
        </a>
      </div>
    </section>
  );
};

export default Bio;
