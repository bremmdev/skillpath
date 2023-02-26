import React from "react";
import type { Feature, Tech } from "@prisma/client";

type Props = {
  feature: Feature & { Tech: Pick<Tech, "name"> };
};

const FeatureItem = ({ feature }: Props) => {
  return (
    <li
      className="my-2 flex items-center gap-4 py-4 even:bg-[#00CCFF1A] sm:gap-8"
    >
      <div className="flex w-24 flex-shrink-0 items-center justify-center bg-blue-900 py-3 font-medium sm:w-28">
        {feature.dateLearned.toLocaleDateString("en-US")}
      </div>
      <div className="flex flex-col items-start gap-1 text-left">
        <div className="font-bold text-white">{`${feature.title} in ${feature.Tech.name}`}</div>
        <div>{feature.description}</div>
        <div className="text-xs italic opacity-60 sm:text-sm">
          Last reviewed on{" "}
          {feature.dateReviewed?.toLocaleDateString("en-US") ?? "N/A"}
        </div>
      </div>
    </li>
  );
};

export default FeatureItem;
