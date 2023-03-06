import Image from "next/image";
import Loading from "../../../public/icons//loading.svg";

const Spinner = ({ inverted }: { inverted: boolean }) => {
  //spinner class is need to prevent the modal from closing while performing an action
  const classNames = inverted ? "animate-spin invert spinner" : "animate-spin spinner";

  return (
    <Image src={Loading} className={classNames} width={24} height={24} alt="" />
  );
};

export default Spinner;
