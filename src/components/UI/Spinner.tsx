import Image from "next/image";
import Loading from "../../../public/icons//loading.svg";

const Spinner = ({ inverted }: { inverted: boolean }) => {
  const classNames = inverted ? "animate-spin invert" : "animate-spin";

  return (
    <Image src={Loading} className={classNames} width={24} height={24} alt="" />
  );
};

export default Spinner;
