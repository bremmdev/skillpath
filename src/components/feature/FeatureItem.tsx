import React, { useEffect } from "react";
import type { Feature, Tech } from "@prisma/client";
import Image from "next/image";
import { encode } from "../../utils/base64";
import DeleteIcon from "../../../public/icons/delete.svg";
import EditIcon from "../../../public/icons/edit.svg";
import FeatureForm from "./FeatureForm";
import Modal from "../UI/Modal/Modal";
import Alert from "../UI/Alert";

type Props = {
  feature: Feature & { Tech: Pick<Tech, "name" | "icon"> };
  deleteFeatureById: (id: string) => void;
  isDeleting: boolean;
};

const FeatureItem = ({ feature, deleteFeatureById, isDeleting }: Props) => {
  const [showUpdateForm, setShowUpdateForm] = React.useState(false);
  const [updateSuccess, setUpdateSuccess] = React.useState(false);

  const handleUpdateFeature = () => {
    toggleUpdateForm();
    setUpdateSuccess(true);
  };

  const toggleUpdateForm = () => {
    setShowUpdateForm((prevState) => !prevState);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    //prevent concurrent deletion
    if (!isDeleting) deleteFeatureById(feature.id);
  };

  //clear update success message after 2.5s or when update form is shown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!showUpdateForm) {
      timer = setTimeout(() => {
        setUpdateSuccess(false);
      }, 2500);
      return;
    }
    setUpdateSuccess(false);

    return () => {
      clearTimeout(timer);
    };
  }, [showUpdateForm, setUpdateSuccess]);

  const alertMessages = (
    <>
      {updateSuccess && (
        <Alert message="Feature successfully updated" type="success" />
      )}
    </>
  );

  return (
    <React.Fragment>
      {alertMessages}
      <li className="my-2 flex items-center gap-1 py-4 pr-2 even:bg-[#00CCFF1A] sm:gap-8">
        <div className="flex w-28 flex-shrink-0 items-center lg:w-44 lg:flex-row lg:gap-8">
          <div className="flex w-24 flex-shrink-0 items-center justify-center bg-blue-900 py-3 font-medium sm:w-28">
            {feature.dateLearned.toLocaleDateString("en-US")}
          </div>
          {feature.Tech.icon ? (
            <Image
              width={32}
              height={32}
              src={`data:image/svg+xml;base64,${encode(feature.Tech.icon)}`}
              alt={`${feature.Tech.name} icon`}
              className="hidden lg:block"
            />
          ) : null}
        </div>

        <div className="mr-2 flex flex-col items-start gap-1 text-left">
          <div className="font-bold text-white">{`${feature.title} in ${feature.Tech.name}`}</div>
          <div>{feature.description}</div>
          <div className="text-xs italic opacity-60 sm:text-sm">
            <span>
              Last reviewed on{" "}
              {feature.dateReviewed?.toLocaleDateString("en-US") ?? "N/A"}
              <Image
                src={EditIcon}
                alt="edit"
                className="ml-2 inline h-5 w-5 cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={() => {
                  setShowUpdateForm(true);
                }}
              />
            </span>
          </div>
        </div>
        <Image
          src={DeleteIcon}
          alt="delete"
          className="ml-auto h-5 w-5 cursor-pointer transition-all duration-300 hover:scale-105"
          onClick={handleDelete}
        />
      </li>
      {showUpdateForm && (
        <Modal onClose={toggleUpdateForm}>
          <FeatureForm
            onAddFeature={handleUpdateFeature}
            feature={feature}
            type="edit"
          />
        </Modal>
      )}
    </React.Fragment>
  );
};

export default FeatureItem;
