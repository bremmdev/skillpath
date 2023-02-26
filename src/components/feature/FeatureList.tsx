import React from "react";
import type { Feature, Tech } from "@prisma/client";
import FeatureItem from "./FeatureItem";

type Props = {
  features: Array<Feature & { Tech: Pick<Tech, "name"> }>;
};

const FeatureList = ({ features }: Props) => {
  return (
    <ul className="text-sm sm:text-base">
      {features.map((feature) => (
        <FeatureItem key={feature.id} feature={feature} />
      ))}
    </ul>
  );
};

export default FeatureList;
