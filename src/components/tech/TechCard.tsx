import type { Tech } from "@prisma/client";
import Image from "next/image";
import { encode } from "../../utils/base64";
import DeleteIcon from "../../../public/icons/delete.svg";
import { trpc } from "../../utils/trpc";

type Props = {
  tech: Tech;
};

const TechCard = ({ tech }: Props) => {
  const utils = trpc.useContext();

  const { mutate: deleteTech } = trpc.tech.deleteById.useMutation({
    onSuccess: () => {
      utils.tech.invalidate();
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    deleteTech(tech.id);
  };

  return (
    <a
      href={tech.url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col rounded-md border border-slate-300 bg-[#00CCFF1A] text-left opacity-90 transition-all hover:border-[#00CCFF] hover:opacity-100 hover:shadow-[0_0_0_1px_rgb(0,204,255)]"
    >
      <div className="flex items-center justify-between bg-[#00CCFF28] py-3 px-6">
        <div className="flex items-center gap-3">
          {tech.icon && (
            <Image
              width={32}
              height={32}
              src={`data:image/svg+xml;base64,${encode(tech.icon)}`}
              alt={`${tech.name} icon`}
            />
          )}
          <h3 className="text-lg font-bold text-white md:text-xl">
            {tech.name}
          </h3>
        </div>
        <Image
          src={DeleteIcon}
          alt="Delete Icon"
          className="h-5 w-5 cursor-pointer transition-all duration-300 hover:scale-105"
          onClick={handleDelete}
        />
      </div>
      <p className="p-6 text-sm sm:text-base">{tech.description}</p>
    </a>
  );
};

export default TechCard;
