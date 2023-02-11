import React from "react";
import type { ProjectStatus } from "@prisma/client";
import Spinner from "../../UI/Spinner";

type Props = {
  status: Array<ProjectStatus> | undefined;
  error: string | undefined;
  isLoading: boolean;
};

const ProjectStatusSelect = (props: Props) => {
  const { status, error, isLoading } = props;

  if (isLoading) {
    return (
      <div className="flex w-full justify-center sm:basis-3/4">
        <Spinner inverted={false} />
      </div>
    );
  }

  if (error) {
    return (
      <p className="w-full font-semibold text-red-500 sm:basis-3/4">{error}</p>
    );
  }

  return (
    <select
      name="statusId"
      id="statusId"
      className="w-full rounded-md border border-slate-400 px-4 py-2 outline-none focus:border-blue-500 invalid-unfocused:border-pink-600 invalid-unfocused:text-pink-600
sm:basis-3/4"
      required
    >
      {status &&
        status.map((status) => (
          <option key={status.id} value={status.id}>
            {status.status}
          </option>
        ))}
    </select>
  );
};

export default ProjectStatusSelect;
