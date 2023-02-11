import type { Tech } from "@prisma/client";
import Spinner from "../../UI/Spinner";

type Props = {
  tech: Array<Tech> | undefined;
  error: string | undefined;
  isLoading: boolean;
};

const TechSelection = (props: Props) => {
  const { tech, error, isLoading } = props;

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
    <div className="flex w-full flex-wrap gap-3 sm:basis-3/4">
      {tech &&
        tech.map((tech) => (
          <div className="flex gap-1" key={tech.id}>
            <input
              type="checkbox"
              name="tech"
              value={tech.id}
              id={`tech_${tech.name}`}
            />
            <label htmlFor={`tech_${tech.name}`}>{tech.name}</label>
          </div>
        ))}
    </div>
  );
};

export default TechSelection;
