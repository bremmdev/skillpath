import React from "react";
import AddIcon from "../../../public/icons/add.svg";
import Image from "next/image";
import Modal from "../UI/Modal/Modal";
import { trpc } from "../../utils/trpc";
import Alert from "../UI/Alert";
import FeatureList from "./FeatureList";
import type { Feature, Tech } from "@prisma/client";
import AddFeatureForm from "./AddFeatureForm";

type Props = {
  features: Array<Feature & { Tech: Pick<Tech, "name"> }>;
};

const FeatureSection = ({ features }: Props) => {
  const [showAddForm, setSHowAddForm] = React.useState(false);
  const [createSuccess, setCreateSuccess] = React.useState(false);

  const utils = trpc.useContext();

  const {
    mutate: deleteFeatureById,
    isLoading: isDeleting,
    error: deletionError,
    isSuccess: deleteSuccess,
  } = trpc.feature.deleteById.useMutation({
    onSuccess: () => {
      utils.feature.invalidate();
    },
  });

  const handleAddFeature = () => {
    toggleShowAddForm();
    setCreateSuccess(true);
  };

  const toggleShowAddForm = () => {
    setSHowAddForm((prevState) => !prevState);
    setCreateSuccess(false);
  };

  const alertMessages = (
    <>
      {isDeleting && <Alert message="Deleting feature..." type="loading" />}
      {deletionError && <Alert message={deletionError.message} type="error" />}
      {deleteSuccess && (
        <Alert message="Feature successfully deleted" type="success" />
      )}
      {createSuccess && (
        <Alert message="Feature successfully added" type="success" />
      )}
    </>
  );

  return (
    <section
      id="features"
      className="mb-4 w-full text-lg text-slate-300 sm:mb-8"
    >
      {alertMessages}
      <h2 className="mb-6 text-3xl font-extrabold text-white sm:mb-8 md:text-4xl lg:text-6xl">
        Features
      </h2>
      <p className="text-base sm:text-lg">
        I have recently learned these features:
      </p>
      <div className="mt-6 sm:mt-12 sm:gap-8">
        <FeatureList features={features} />
      </div>

      {!showAddForm && (
        <button className="my-4">
          <Image
            src={AddIcon}
            className="h-16 w-16 cursor-pointer p-2 opacity-80 hover:opacity-100"
            alt="add feature"
            onClick={toggleShowAddForm}
          />
        </button>
      )}

      {showAddForm && (
        <Modal onClose={toggleShowAddForm}>
          <AddFeatureForm onAddFeature={handleAddFeature} />
        </Modal>
      )}
    </section>
  );
};

export default FeatureSection;
