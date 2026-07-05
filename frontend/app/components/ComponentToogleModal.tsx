"use client";

import { useState } from "react";
import AddVioleta from "./icons/AddVioleta";
import ModalOptions from "./ModalOptions";

type Option = {
    id: string;
    label: string;
};

type ComponentToggleModalProps = {
    value: string;
    placeholder: string;
    options: Option[];
    onSelect: (value: string) => void;
};


export default function PlaceInput({
    value = "",
    placeholder = "Lugares de carga",
    options,
    onSelect,
}: ComponentToggleModalProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [tempSelected, setTempSelected] = useState<string[]>([]);

    const handleOpen = () => {
        const initialSelected = value
            ? value.split(",").map((id) => id.trim()).filter(Boolean)
            : [];
        setTempSelected(initialSelected);
        setOpen(true);
    };

    const handleToggle = (id: string) => {
        setTempSelected((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const handleConfirm = () => {
        onSelect(tempSelected.length > 0 ? tempSelected.join(", ") : "");
        setOpen(false);
    };

    const handleCancel = () => {
        setOpen(false);
    };

    // Mapea los IDs seleccionados a sus etiquetas legibles para mostrarlos en el input
    const displayValue = value
        ? value
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
            .map((id) => options.find((opt) => opt.id === id)?.label || id)
            .join(", ")
        : placeholder;

    return (
        <>
            <div className="relative flex py-4 w-full items-center rounded-md border border-zinc-300 bg-zinc-100 px-3 pr-10 shadow-md">
                <span className={"text-zinc-500 truncate"}>
                    {displayValue}
                </span>

                <button
                    type="button"
                    onClick={handleOpen}
                    className="absolute right-3 flex items-center justify-center text-black"
                    aria-label="Abrir modal"
                >
                    <AddVioleta />
                </button>
            </div>

            {open && (
                <ModalOptions
                    isOpen={open}
                    onCancel={handleCancel}
                    onConfirmed={handleConfirm}
                >
                    <div className="space-y-2">
                        {options.map((option) => (
                            <div key={option.id} className="flex items-center justify-between gap-3">
                                <label htmlFor={option.id} className="text-lg text-white font-medium cursor-pointer">
                                    {option.label}
                                </label>
                                <input
                                    className="w-5 h-5 cursor-pointer"
                                    type="checkbox"
                                    checked={tempSelected.includes(option.id)}
                                    onChange={() => handleToggle(option.id)}
                                    name="lugares_carga"
                                    id={option.id}
                                />
                            </div>
                        ))}
                    </div>
                </ModalOptions>
            )}
        </>
    );
}