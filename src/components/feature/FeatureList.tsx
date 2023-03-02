import React from "react";
import type { Feature, Tech } from "@prisma/client";
import FeatureItem from "./FeatureItem";

type Props = {
  features: Array<Feature & { Tech: Pick<Tech, "name" | "icon"> }>;
  deleteFeatureById: (id: string) => void;
  isDeleting: boolean;
};

const FeatureList = ({ features, deleteFeatureById, isDeleting }: Props) => {
  return (
    <React.Fragment>
      <ul className="text-sm sm:text-base">
        {features.map((feature) => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            deleteFeatureById={deleteFeatureById}
            isDeleting={isDeleting}
          />
        ))}
      </ul>
    </React.Fragment>
  );
};

export default FeatureList;
