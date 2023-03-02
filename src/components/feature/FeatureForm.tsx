import React from "react";
import {
  featureInputSchema,
  type FeatureInput,
} from "../../schema/feature.schema";
import { trpc } from "../../utils/trpc";
import Spinner from "../UI/Spinner";
import FormInput from "../UI/Form/FormInput";
import type { Feature } from "@prisma/client";

type Props = {
  onAddFeature: () => void;
  feature?: Feature;
  type?: "add" | "edit";
};

const FeatureForm = ({ onAddFeature, feature, type = "add" }: Props) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({}); //errors for the form

  //needed for invalidating the query
  const utils = trpc.useContext();

  const { data: tech, error: techError } = trpc.tech.findAll.useQuery();

  const {
    mutate: createFeature,
    error: createFeatureError,
    isLoading: isAdding,
  } = trpc.feature.create.useMutation({
    onSuccess: () => {
      onAddFeature();
      utils.feature.invalidate();
    },
  });

  const {
    mutate: updateFeature,
    error: updateFeatureError,
    isLoading: isUpdating,
  } = trpc.feature.update.useMutation({
    onSuccess: () => {
      onAddFeature();
      utils.feature.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = Object.fromEntries(new FormData(form).entries());

    //convert formData to the correct shape
    const input = {
      ...formData,
      dateLearned: new Date(formData.dateLearned as string),
      dateReviewed:
        (formData.dateReviewed as string).length > 0
          ? new Date(formData.dateReviewed as string)
          : null,
    } as FeatureInput;

    //check if the data is valid
    const result = featureInputSchema.safeParse(input);
    setErrors({});
    const errors: Record<string, string> = {};

    if (!result.success) {
      //set the errors
      result.error.errors.forEach((error) => {
        errors[String(error.path[0])] = error.message;
      });
    }

    //set the errors
    setErrors(errors);

    if (Object.keys(errors).length > 0) return;

    //if there are no errors, create or the feature
    if (type === "edit" && feature?.id) {
      updateFeature({ id: feature.id, data: input });
      return;
    }
    createFeature(input);
  };

  const hasFormErrors = Object.keys(errors).length > 0;
  const showCreateFeatureError =
    createFeatureError && !isAdding && !hasFormErrors;
  const showUpdateFeatureError =
    updateFeatureError && !isUpdating && !hasFormErrors;

  return (
    <div className="relative mx-auto flex w-full flex-col items-center justify-center rounded-2xl bg-blue-100 p-8 text-left text-slate-900 md:p-16 2xl:px-24">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-2 text-xs sm:gap-4 md:text-sm xl:text-base"
      >
        <FormInput
          type="text"
          htmlName="title"
          label="Title"
          minLength={2}
          maxLength={50}
          required
          defaultValue={feature?.title}
          error={errors.title}
        />

        <FormInput
          type="text"
          htmlName="description"
          label="Description"
          minLength={10}
          maxLength={500}
          required
          defaultValue={feature?.description}
          error={errors.description}
        />

        <FormInput
          type="date"
          htmlName="dateLearned"
          label="Date learned"
          required
          defaultValue={
            (feature?.dateLearned ?? new Date()).toISOString().split("T")[0]
          }
          error={errors.dateLearned}
        />

        <FormInput
          type="date"
          htmlName="dateReviewed"
          label="Date reviewed"
          defaultValue={
            feature?.dateReviewed
              ? feature.dateReviewed.toISOString().split("T")[0]
              : ""
          }
          error={errors.dateReviewed}
        />

        {/*TECH SELECT*/}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
          <label
            htmlFor="tech"
            className="basis-1/4 font-semibold  after:ml-1 after:text-red-500 after:content-['*']"
          >
            Tech
          </label>
          <select
            name="techId"
            className="w-full rounded-md border border-slate-400 px-4 py-2 outline-none focus:border-blue-500 invalid-unfocused:border-pink-600 invalid-unfocused:text-pink-600
      sm:basis-3/4"
            defaultValue={feature?.techId}
          >
            {tech?.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
        </div>
        {techError && (
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
            <div className="basis-1/4"></div>
            <p className="w-full font-semibold text-red-500 sm:basis-3/4">
              {techError.message}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="mx-auto mt-4 block cursor-pointer rounded-lg bg-blue-600 py-3 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500 md:text-base"
          disabled={isAdding || isUpdating}
        >
          {isAdding || isUpdating ? (
            <span className="flex items-center gap-2">
              <Spinner inverted={true} />
              {type === "edit" ? "Updating Feature..." : "Adding Feature..."}
            </span>
          ) : (
            <span>{type === "edit" ? "Update Feature" : "Add Feature"}</span>
          )}
        </button>
      </form>
      {showCreateFeatureError && (
        <p className="mt-6 text-center text-xs font-bold text-red-500 md:text-sm xl:text-base">
          {createFeatureError.message}
        </p>
      )}
      {showUpdateFeatureError && (
        <p className="mt-6 text-center text-xs font-bold text-red-500 md:text-sm xl:text-base">
          {updateFeatureError.message}
        </p>
      )}
    </div>
  );
};

export default FeatureForm;
