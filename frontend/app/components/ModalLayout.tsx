export default function ModalLayout({
  children,
  title,
  svg,
  setModalOpen,
  bg = "bg-[#5782F7]",
  titleColor = "text-white",
  maxWidth = "max-w-md",
  onSubmit,
}: {
  children: React.ReactNode;
  title?: string;
  svg?: React.ReactNode;
  setModalOpen: void | React.Dispatch<React.SetStateAction<boolean>>;
  bg?: string;
  titleColor?: string;
  maxWidth?: string;
  onSubmit?: () => void;
}) {
  const onClose = () => {
    if (setModalOpen) {
      setModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className={`flex min-w-0 flex-col gap-3 sm:gap-6 w-full ${maxWidth} max-h-[90dvh]`}>
        {/* Recuadro azul con título e inputs */}
        <div className={`${bg} min-w-0 rounded-2xl py-5 px-3 sm:py-8 sm:px-6 shadow-lg overflow-y-auto`}>
          <div className="font-semibold flex items-center justify-center gap-2 sm:gap-3 text-white text-center text-base sm:text-xl mb-4 sm:mb-6">
            <h4 className={titleColor}>{title}</h4>
            <p>{svg}</p>
          </div>
          <div className="flex flex-col gap-4">{children}</div>
        </div>

        {/* Botones flotantes debajo */}
        <div className="flex gap-3 sm:gap-5 justify-between px-1 sm:px-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none bg-white text-black rounded-full px-4 sm:px-8 py-3 font-semibold hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 sm:flex-none bg-primary text-white rounded-full px-4 sm:px-8 py-3 font-semibold hover:bg-blue-700">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
