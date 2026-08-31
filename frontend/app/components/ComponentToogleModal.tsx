"use client";

import { useState } from "react";
import AddVioleta from "./icons/AddVioleta";
import ModalOptions from "./ModalOptions";

type Option = {
    id: string;
    label: string;
    essential?: boolean;
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
            .map((id) => {
                const option = options.find((opt) => opt.id === id);
                if (!option) return id;
                return `${option.essential ? "★ " : ""}${option.label}`;
            })
            .join(", ")
        : placeholder;

    return (
        <>
            <div className="relative flex py-4 w-full shadow-gray-500 font-semibold border border-gray-300 items-center rounded-md bg-white px-3 pr-10 shadow-md">
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
                            <div
                                key={option.id}
                                className={`flex items-center justify-between gap-3 rounded px-2 py-1 ${
                                    option.essential
                                        ? "border border-amber-300 bg-amber-400/15"
                                        : ""
                                }`}>
                                <label htmlFor={option.id} className="flex items-center gap-2 text-lg text-white font-medium cursor-pointer">
                                    <span>{option.label}</span>
                                    {option.essential && (
                                        <span className="rounded bg-amber-300 px-2 py-0.5 text-xs font-bold text-black">
                                            Esencial
                                        </span>
                                    )}
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
