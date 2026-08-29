'use client'
import { useRef } from "react";
import { Calendar } from "lucide-react";
import { formatDateDDMMYY } from "@/lib/formatDate";

export default function DateInput({
    value = "",
    onChange = () => { },
    placeholder = "Fecha de salida",
    name = "date",
}: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    name?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const openPicker = () => {
        const input = inputRef.current;

        if (input?.showPicker) {
            input.showPicker();
        } else {
            input?.focus();
            input?.click();
        }
    };

    const formattedDate = value ? formatDateDDMMYY(value) : "";

    return (
        <div
            onClick={openPicker}
            className="
        relative flex py-3 w-full cursor-pointer items-center
        rounded-md border font-medium border-zinc-300 bg-zinc-100 px-3 pr-10
         transition
        hover:bg-zinc-200
        focus-within:border-zinc-400
      "
        >
            <span
                className={value ? "text-zinc-900" : "text-zinc-500"}
            >
                {formattedDate || placeholder}
            </span>

            <Calendar
                size={18}
                className="pointer-events-none absolute right-3 text-zinc-600"
            />

            <input
                ref={inputRef}
                type="date"
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none"
            />
        </div>
    );
}