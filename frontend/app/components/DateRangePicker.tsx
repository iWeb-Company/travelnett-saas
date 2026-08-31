"use client";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import { endOfMonth, startOfMonth, subDays, subMonths } from "date-fns";

registerLocale("es", es);

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  placeholder?: string;
}

export const formatDateRangeParam = (date: Date | null) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder = "Seleccione rango de fechas",
}: DateRangePickerProps) {
  const setRange = (start: Date, end: Date) => onChange([start, end]);
  const presets = [
    {
      label: "Ayer",
      action: () => {
        const yesterday = subDays(new Date(), 1);
        setRange(yesterday, yesterday);
      },
    },
    {
      label: "Últimos 7 Días",
      action: () => setRange(subDays(new Date(), 7), new Date()),
    },
    {
      label: "Últimos 15 Días",
      action: () => setRange(subDays(new Date(), 15), new Date()),
    },
    {
      label: "Últimos 30 Días",
      action: () => setRange(subDays(new Date(), 30), new Date()),
    },
    {
      label: "Este Mes",
      action: () => setRange(startOfMonth(new Date()), endOfMonth(new Date())),
    },
    {
      label: "Mes Pasado",
      action: () => {
        const lastMonth = subMonths(new Date(), 1);
        setRange(startOfMonth(lastMonth), endOfMonth(lastMonth));
      },
    },
  ];

  return (
    <DatePicker
      selectsRange
      startDate={startDate}
      endDate={endDate}
      onChange={onChange}
      monthsShown={2}
      locale="es"
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      calendarClassName="tesoro-datepicker"
      wrapperClassName="w-full"
      isClearable
      className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary">
      <div className="flex flex-col gap-1 px-2 pb-2 border-t pt-2">
        <p className="text-xs font-semibold text-gray-500 mb-1">
          Rangos rápidos
        </p>
        <div className="flex flex-col flex-wrap gap-1">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={preset.action}
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded font-medium transition-colors">
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </DatePicker>
  );
}
