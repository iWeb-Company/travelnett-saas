interface AscensoAsignButtonProps {
  selectedCount: number;
  onClick: () => void;
  disabled?: boolean;
  isVisible: boolean;
}

export default function AscensoAsignButton({
  selectedCount,
  onClick,
  disabled = false,
  isVisible,
}: AscensoAsignButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || selectedCount === 0}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      aria-label={`Asignar lugar de ascenso y/o N° de Bus a ${selectedCount} pasajeros`}
      className={`fixed bottom-2 left-0 right-0 w-max font-medium hover:bg-primary hover:text-white transition-transform duration-300 ease-out flex items-center justify-center text-black bg-primary/30 px-5 rounded-lg py-2 mx-auto transform-gpu motion-reduce:transition-none ${
        isVisible
          ? "translate-y-0"
          : "pointer-events-none translate-y-full"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <p>Asignar lugar de ascenso y/o N° de Bus ({selectedCount})</p>
    </button>
  );
}
