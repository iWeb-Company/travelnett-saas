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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={`flex flex-col gap-6 w-full max-w-2xl max-h-[70vh]`}>
                {/* Recuadro azul con título e inputs */}
                <div className={`bg-skyblue rounded-2xl py-8 px-6 shadow-lg overflow-y-auto`}>
                    <div className="flex flex-col gap-4">{children}</div>
                </div>

                {/* Botones flotantes debajo */}
                <div className="flex gap-5 justify-between px-2 shrink-0">
                    <button
                        onClick={onCancel}
                        className="bg-white text-black rounded-full px-8 py-3 font-semibold hover:bg-gray-100">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirmed}
                        className="bg-primary text-white rounded-full px-8 py-3 font-semibold hover:bg-blue-700">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}
