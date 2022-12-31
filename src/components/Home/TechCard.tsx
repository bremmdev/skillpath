import type { Tech } from "@prisma/client";
import React from "react";
import Image from "next/image";
import { encode } from "../../utils/base64";

type Props = {
  tech: Tech;
};

const TechCard = ({ tech }: Props) => {
  return (
    <a
      href={tech.url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col rounded-md border border-slate-300 bg-[#00CCFF1A] text-left opacity-90 transition-all hover:border-[#00CCFF] hover:opacity-100 hover:shadow-[0_0_0_1px_rgb(0,204,255)]"
    >
      <div className="flex items-center gap-4 bg-[#00CCFF28] py-3 px-6">
        {tech.icon && (
          <Image
            width={32}
            height={32}
            src={`data:image/svg+xml;base64,${encode(tech.icon)}`}
            alt={`${tech.name} icon`}
          />
        )}
        <h3 className="text-xl font-bold text-white">{tech.name}</h3>
      </div>
      <p className="p-6 text-sm sm:text-base">{tech.description}</p>
    </a>
  );
};

export default TechCard;
