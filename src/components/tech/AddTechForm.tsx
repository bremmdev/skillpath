import React from "react";
import ClearIcon from "../../../public/icons/clear.svg";
import Image from "next/image";
import { techInputSchema, type TechInput } from "../../schema/tech.schema";
import { trpc } from "../../utils/trpc";
import Spinner from "../UI/Spinner";
import FormInput from "../UI/Form/FormInput";

const isFile = (icon: unknown): icon is File => {
  return icon instanceof File;
};

const AddTechForm = ({ onAddTech }: { onAddTech: () => void }) => {
  const [uploadText, setUploadText] = React.useState<string>("");
  const uploadBtnRef = React.useRef<HTMLInputElement>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({}); //errors for the form

  //needed for invalidating the query
  const utils = trpc.useContext();

  const {
    mutate: createTech,
    error: createTechError,
    isLoading: isAdding,
  } = trpc.tech.create.useMutation({
    onSuccess: () => {
      onAddTech();
      utils.tech.invalidate();
    },
  });

  const handleChooseFileClick = () => {
    uploadBtnRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadText(file.name);
    }
  };

  const handleClear = () => {
    setUploadText("");
    //clear file input
    if (uploadBtnRef.current) {
      uploadBtnRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = Object.fromEntries(new FormData(form).entries());
    setErrors({});
    const errors: Record<string, string> = {};

    //check if icon is a file
    if (!isFile(formData.icon)) {
      return;
    }

    //wrong file type
    if (formData.icon.size > 0 && formData.icon.type !== "image/svg+xml") {
      errors.icon = "File must be an svg";
    }

    //there is either no file, or it is an svg
    const inputData =
      formData.icon.size === 0 || formData.icon.type !== "image/svg+xml"
        ? ({ ...formData, icon: null } as TechInput)
        : ({ ...formData, icon: await formData.icon.text() } as TechInput);

    //check if the data is valid
    const result = techInputSchema.safeParse(inputData);
    if (!result.success) {
      //set the errors
      result.error.errors.forEach((error) => {
        errors[String(error.path[0])] = error.message;
      });
    }
    //set the errors here because we need to set the icon error if needed
    setErrors(errors);

    if (Object.keys(errors).length > 0) return;

    //if there are no errors, create the tech
    createTech(inputData);
  };

  const hasFormErrors = Object.keys(errors).length > 0;
  const showCreateTechError = createTechError && !isAdding && !hasFormErrors;

  return (
    <div className="relative mx-auto flex w-full flex-col items-center justify-center rounded-2xl bg-blue-100 p-8 text-left text-slate-900 md:p-16 2xl:px-24">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-2 text-xs sm:gap-4 md:text-sm xl:text-base"
      >
        <FormInput
          type="text"
          htmlName="name"
          label="Name"
          minLength={2}
          maxLength={50}
          required
          error={errors.name}
        />

        <FormInput
          type="text" 
          htmlName="description"
          label="Description"
          minLength={10}
          maxLength={500}
          required
          error={errors.description}
        />

        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
          <label htmlFor="icon" className="basis-1/4 font-semibold">
            Icon
          </label>
          <div className="flex w-full flex-col items-start gap-2 sm:basis-3/4">
            <input
              type="file"
              name="icon"
              hidden={true}
              accept="image/svg+xml"
              title="Must be an svg file"
              ref={uploadBtnRef}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="block cursor-pointer rounded-lg border border-slate-400 bg-white py-2 px-4 font-semibold text-slate-900 transition-all duration-300 hover:bg-amber-100 sm:px-6"
              onClick={handleChooseFileClick}
            >
              Choose a file
            </button>
            <div className="flex items-center">
              <span>{uploadText}</span>
              {uploadText ? (
                <Image
                  src={ClearIcon}
                  alt="Clear Icon"
                  className="h-6 w-6 cursor-pointer"
                  onClick={handleClear}
                />
              ) : (
                <p>No file chosen</p>
              )}
            </div>
          </div>
        </div>
        {errors.icon && (
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
            <div className="basis-1/4"></div>
            <p className="w-full font-semibold text-red-500 sm:basis-3/4">
              {errors.icon}
            </p>
          </div>
        )}

        <FormInput
          type="text"
          htmlName="url"
          label="URL"
          title="Must be a valid url"
          pattern="[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)"
          required
          error={errors.url}
        />

        <button
          type="submit"
          className="mx-auto mt-4 block cursor-pointer rounded-lg bg-blue-600 py-3 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500 md:text-base"
          disabled={isAdding}
        >
          {isAdding ? (
            <span className="flex items-center gap-2">
              <Spinner inverted={true} />
              Adding Tech...
            </span>
          ) : (
            "Add Tech"
          )}
        </button>
      </form>
      {showCreateTechError && (
        <p className="mt-6 text-center text-xs font-bold text-red-500 md:text-sm xl:text-base">
          {createTechError.message}
        </p>
      )}
    </div>
  );
};

export default AddTechForm;
