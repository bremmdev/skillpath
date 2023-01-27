import React from "react";
import { capitalize } from "../../utils/capitalize";
import Image from "next/image";
import Success from "../../../public/icons/success.svg";
import Error from "../../../public/icons/error.svg";
import Loading from "../../../public/icons/loading.svg";
import Close from "../../../public/icons/close-alert.svg";

type Props = {
  message: string;
  type: "success" | "error" | "loading";
};

const Alert = (props: Props) => {
  const { message, type } = props;

  const colorClassMap = {
    success: "bg-green-300",
    error: "bg-rose-300",
    loading: "bg-blue-300",
  };

  const iconMap = {
    success: Success,
    error: Error,
    loading: Loading,
  };

  return (
    <div
      className={`${colorClassMap[type]} animate-slideIn fixed top-8 left-6 right-6 z-10 mx-auto flex items-center gap-4 rounded-md py-3 px-4 text-left text-sm text-slate-900 md:max-w-xl md:px-6 md:text-base`}
    >
      <Image
        src={iconMap[type]}
        className={`${type === "loading" ? "animate-spin" : ""}`}
        alt={type}
        width={28}
        height={28}
      />
      <div>
        <h3 className="font-bold">{capitalize(type)}</h3>
        <p>{capitalize(message)}</p>
      </div>
      <Image
        className="ml-auto cursor-pointer"
        src={Close}
        alt={type}
        width={28}
        height={28}
      />
    </div>
  );
};

export default Alert;
