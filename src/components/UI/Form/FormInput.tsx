import React from "react";

type Props = React.ComponentPropsWithoutRef<"input"> & {
  htmlName: string;
  label: string;
  error: string | undefined;
};

const FormInput = (props: Props) => {
  const { htmlName, label, error, required, ...remainingProps } = props;

  const requiredClassNames = required
    ? "after:content-['*'] after:text-red-500 after:ml-1"
    : "";

  return (
    <React.Fragment>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
        <label htmlFor={htmlName} className="basis-1/4 font-semibold">
          <span className={requiredClassNames}>{label}</span>
        </label>
        <input
          name={htmlName}
          placeholder=" "
          className="w-full rounded-md border border-slate-400 px-4 py-2 outline-none focus:border-blue-500 invalid-unfocused:border-pink-600 invalid-unfocused:text-pink-600
      sm:basis-3/4"
          {...remainingProps}
        />
      </div>
      {error && (
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center md:gap-6">
          <div className="basis-1/4"></div>
          <p className="w-full font-semibold text-red-500 sm:basis-3/4">
            {error}
          </p>
        </div>
      )}
    </React.Fragment>
  );
};

export default FormInput;
