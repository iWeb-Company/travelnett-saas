export default function ToggleActiveFilters({ color = "text-black" }) {
  return (
    <label className="inline-flex gap-2 my-2 items-center cursor-pointer">
      <input type="checkbox" value="" className="sr-only peer" />
      <div className="relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-primary"></div>
      <span className={`${color} font-medium`}>Activo</span>
    </label>
  );
}
