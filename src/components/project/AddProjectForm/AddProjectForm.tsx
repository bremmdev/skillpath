import React from "react";
import {
  projectInputSchema,
  type ProjectInput,
} from "../../../schema/project.schema";
import { trpc } from "../../../utils/trpc";
import Spinner from "../../UI/Spinner";
import TextInput from "../../UI/Form/TextInput";
import ProjectStatusSelect from "./ProjectStatusSelect";
import TechSelection from "./TechSelection";

const AddProjectForm = ({ onAddProject }: { onAddProject: () => void }) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({}); //errors for the form

  //needed for invalidating the query
  const utils = trpc.useContext();

  const {
    data: status,
    error: projectStatusError,
    isLoading: projectStatusLoading,
  } = trpc.projectStatus.findAll.useQuery();
  const {
    data: tech,
    isLoading: techLoading,
    error: techError,
  } = trpc.tech.findAll.useQuery();

  const {
    mutate: createProject,
    error: createProjectError,
    isLoading: isAdding,
  } = trpc.project.create.useMutation({
    onSuccess: () => {
      onAddProject();
      utils.project.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = Object.fromEntries(new FormData(form).entries());

    //get all the selected tech from the form
    const allTechFromForm = new FormData(form).getAll("tech");

    //convert formData to the correct shape
    const input = {
      ...formData,
      tech: allTechFromForm as string | string[],
      startDate: new Date(formData.startDate as string),
      endDate: null,
    } as ProjectInput;

    //check if the data is valid
    const result = projectInputSchema.safeParse(input);

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

    //if there are no errors, create the project
    createProject(input);
  };

  const hasFormErrors = Object.keys(errors).length > 0;
  const showCreateProjectError =
    createProjectError && !isAdding && !hasFormErrors;

  return (
    <div className="relative mx-auto flex w-full flex-col items-center justify-center rounded-2xl bg-blue-100 p-8 text-left text-slate-900 md:p-16 2xl:px-24">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-2 text-xs sm:gap-4 md:text-sm xl:text-base"
      >
        <TextInput
          htmlName="title"
          label="Title"
          minLength={2}
          maxLength={50}
          required
          error={errors.title}
        />

        <TextInput
          htmlName="description"
          label="Description"
          minLength={10}
          maxLength={500}
          required
          error={errors.description}
        />

        <TextInput
          htmlName="repo"
          label="Repo URL"
          title="Must be a valid url"
          pattern="[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)"
          required
          error={errors.repo}
        />

        <TextInput
          htmlName="url"
          label="Demo URL"
          title="Must be a valid url"
          pattern="[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)"
          required
          error={errors.url}
        />

        <TextInput
          htmlName="imageUrl"
          label="Image URL"
          title="Must be Github image url"
          pattern="(https:\/\/)?user-images.githubusercontent.com\/.+\.(png|jpg|jpeg|svg|webp|avif)"
          required
          error={errors.imageUrl}
        />

        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
          <label htmlFor="startDate" className="basis-1/4 font-semibold">
            <span className="after:ml-1 after:text-red-500 after:content-['*']">
              Start Date
            </span>
          </label>
          <input
            type="date"
            name="startDate"
            id="startDate"
            className="w-full rounded-md border border-slate-400 px-4 py-2 outline-none focus:border-blue-500 invalid-unfocused:border-pink-600 invalid-unfocused:text-pink-600
      sm:basis-3/4"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/*PROJECT STATUS SELECT*/}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
          <label htmlFor="statusId" className="basis-1/4 font-semibold">
            <span className="after:ml-1 after:text-red-500 after:content-['*']">
              Status
            </span>
          </label>
          <ProjectStatusSelect
            status={status}
            error={projectStatusError?.message}
            isLoading={projectStatusLoading}
          />
        </div>

        {/*TECH SELECT*/}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
          <label htmlFor="tech" className="basis-1/4 font-semibold">
            Tech
          </label>
          <TechSelection
            tech={tech}
            error={techError?.message}
            isLoading={techLoading}
          />
        </div>

        <button
          type="submit"
          className="mx-auto mt-4 block cursor-pointer rounded-lg bg-blue-600 py-3 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500 md:text-base"
          disabled={isAdding}
        >
          {isAdding ? (
            <span className="flex items-center gap-2">
              <Spinner inverted={true} />
              Adding Project...
            </span>
          ) : (
            "Add Project"
          )}
        </button>
      </form>
      {showCreateProjectError && (
        <p className="mt-6 text-center text-xs font-bold text-red-500 md:text-sm xl:text-base">
          {createProjectError.message}
        </p>
      )}
    </div>
  );
};

export default AddProjectForm;
