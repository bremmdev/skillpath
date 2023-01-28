import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Close from "../../../../public/icons/close.svg";
import Image from "next/image";

type Props = {
  children: React.ReactNode;
  onClose: () => void;
};

const Modal = ({ children, onClose }: Props) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const childRef = React.useRef<HTMLDivElement>(null);

  //only close modal if user clicks on the backdrop
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains("fixed")) onClose();
  };

  //close modal if user presses escape key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
  };

  //autoFcous on modal when it opens, needed to be able to close it with escape key
  useEffect(() => {
    if (modalRef.current) modalRef.current.focus();
  }, []);

  const Modal = (
    <div
      className={`fixed inset-0 z-50 flex max-h-full items-center justify-center bg-black bg-opacity-50`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      ref={modalRef}
      tabIndex={0}
    >
      <div
        ref={childRef}
        className={`absolute mx-auto w-4/5 animate-fadeIn lg:w-2/3 small-height:max-h-[85%] small-height:overflow-y-auto`}
      >
          <Image
            src={Close}
            alt="close icon"
            className="absolute -bottom-16 left-1/2 h-16 w-16 -translate-x-8 cursor-pointer p-2 opacity-80 hover:opacity-100 small-height:hidden"
            onClick={onClose}
          />
        {children}
      </div>
    </div>
  );

  return createPortal(Modal, document.getElementById("modal") || document.body);
};

export default Modal;
