export default function ModalLayout({
  children,
  title,
  svg,
  setModalOpen,
  bg = "bg-[#5782F7]",
  titleColor = "text-white",
}: {
  children: React.ReactNode;
  title?: string;
  svg?: React.ReactNode;
  setModalOpen: void | React.Dispatch<React.SetStateAction<boolean>>;
  bg?: string;
  titleColor?: string;
}) {
  const onClose = () => {
    if (setModalOpen) {
      setModalOpen(false);
    }
  };

  const addBusEnterprise = () => {
    // LOGICA PARA AGREGAR EMPRESA DE TRANSPORTE
    console.log("hola");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex flex-col gap-6 w-full max-w-md">
        {/* Recuadro azul con título e inputs */}
        <div className={`${bg} rounded-2xl py-8 px-6 shadow-lg`}>
          <div className="font-semibold flex items-center justify-center gap-3 text-white text-center text-xl mb-6">
            <h4 className={titleColor}>{title}</h4>
            <p>{svg}</p>
          </div>
          <div className="flex flex-col gap-4">{children}</div>
        </div>

        {/* Botones flotantes debajo */}
        <div className="flex gap-5 justify-between px-2">
          <button
            onClick={onClose}
            className="bg-white text-black rounded-full px-8 py-3 font-semibold hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={addBusEnterprise}
            className="bg-primary text-white rounded-full px-8 py-3 font-semibold hover:bg-blue-700">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
