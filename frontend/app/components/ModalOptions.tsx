import React from 'react'

interface ModalOptionsProps {
    children: React.ReactNode;
    isOpen: boolean;
    onCancel: () => void;
    onConfirmed: () => void;
}

export default function ModalOptions({ children, isOpen, onCancel, onConfirmed }: ModalOptionsProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className={`flex min-w-0 flex-col gap-3 sm:gap-6 w-full max-w-2xl max-h-[90dvh]`}>
                {/* Recuadro azul con título e inputs */}
                <div className={`bg-skyblue min-w-0 rounded-2xl py-5 px-3 sm:py-8 sm:px-6 shadow-lg overflow-y-auto`}>
                    <div className="flex flex-col gap-4">{children}</div>
                </div>

                {/* Botones flotantes debajo */}
                <div className="flex gap-3 sm:gap-5 justify-between px-1 sm:px-2 shrink-0">
                    <button
                        onClick={onCancel}
                        className="flex-1 sm:flex-none bg-white text-black rounded-full px-4 sm:px-8 py-3 font-semibold hover:bg-gray-100">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirmed}
                        className="flex-1 sm:flex-none bg-primary text-white rounded-full px-4 sm:px-8 py-3 font-semibold hover:bg-blue-700">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}
