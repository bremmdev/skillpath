import Link from "next/link";
import Image from "next/image";
import ArrowIcon from "../../../public/icons/arrowDown.svg";

const QuickLinks = () => {
  return (
    <div className="font-bold">
      <p className="text-lg sm:text-2xl">Have a look at my:</p>

      <div className="mt-8 flex w-full justify-center gap-3 text-center tracking-tighter sm:mt-10 sm:gap-8">
        <Link
          href="#projects"
          className="flex cursor-pointer items-center rounded-xl border-2 border-purple-400 bg-slate-900 py-3 px-4 text-base transition-colors duration-300 hover:bg-slate-800 sm:py-4 sm:px-6 sm:text-xl"
        >
          projects &nbsp;
          <Image src={ArrowIcon} alt="Arrow icon" width={20} height={20} />
        </Link>
        <Link
          href="#tech"
          className="flex cursor-pointer items-center rounded-xl border-2 border-[#00CCFF] bg-slate-900 py-3 px-4 text-base transition-colors duration-300 hover:bg-slate-800 sm:py-4 sm:px-6 sm:text-xl"
        >
          favorite tech &nbsp;
          <Image src={ArrowIcon} alt="Arrow icon" width={20} height={20} />
        </Link>
      </div>
    </div>
  );
};

export default QuickLinks;
