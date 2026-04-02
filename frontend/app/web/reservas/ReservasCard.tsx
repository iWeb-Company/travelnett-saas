"use client";
import Delete from "@/app/components/icons/salidas/Delete";
import Update from "@/app/components/icons/salidas/Update";
import { useEffect, useRef, useState } from "react";

export default function ReservasCard({ reserva }: { reserva: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  return (
    <div className="flex flex-col">
      {/* ===== DESKTOP LAYOUT (md+) ===== */}
      <section className="hidden md:flex gap-3 text-white justify-between items-center">
        <div className="bg-primary justify-between items-center rounded-md px-5 py-2 flex flex-1">
          <div className="flex gap-5 items-center">
            <p className="font-semibold">{reserva.numero}</p>
            <div className="flex flex-col flex-1 justify-between items-start">
              <div className="flex gap-10 justify-between items-center">
                <p>Destino: {reserva.destino}</p>
                <p>Cliente: {reserva.cliente}</p>
              </div>
              <p className="font-semibold">
                Titulo de la reserva: {reserva.titulo}
              </p>
            </div>
          </div>
          <p className="font-semibold">{reserva.fecha}</p>
        </div>
        <div className="text-black items-center gap-2 flex">
          <div className="flex flex-col">
            {/* Email */}
            <button className="flex items-center gap-2">
              <svg
                width="25"
                height="25"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.5 27.5C4.74375 27.5 4.09658 27.231 3.5585 26.6929C3.02042 26.1548 2.75092 25.5072 2.75 24.75V8.25C2.75 7.49375 3.0195 6.84658 3.5585 6.3085C4.0975 5.77042 4.74467 5.50092 5.5 5.5H27.5C28.2563 5.5 28.9039 5.7695 29.4429 6.3085C29.9819 6.8475 30.2509 7.49467 30.25 8.25V24.75C30.25 25.5063 29.981 26.1539 29.4429 26.6929C28.9048 27.2319 28.2572 27.5009 27.5 27.5H5.5ZM16.5 17.6344C16.6146 17.6344 16.7351 17.617 16.8616 17.5821C16.9881 17.5473 17.1082 17.496 17.2219 17.4281L26.95 11.3438C27.1333 11.2292 27.2708 11.0862 27.3625 10.9148C27.4542 10.7433 27.5 10.554 27.5 10.3469C27.5 9.88854 27.3052 9.54479 26.9156 9.31563C26.526 9.08646 26.125 9.09792 25.7125 9.35L16.5 15.125L7.2875 9.35C6.875 9.09792 6.47396 9.09242 6.08438 9.3335C5.69479 9.57458 5.5 9.91237 5.5 10.3469C5.5 10.576 5.54583 10.7768 5.6375 10.9491C5.72917 11.1215 5.86667 11.253 6.05 11.3438L15.7781 17.4281C15.8927 17.4969 16.0133 17.5487 16.1398 17.5835C16.2663 17.6183 16.3863 17.6353 16.5 17.6344Z"
                  fill="black"
                />
              </svg>
            </button>
            {/* Print */}
            <button>
              <svg
                width="25"
                height="25"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24.75 9.625H8.25V4.125H24.75V9.625ZM24.75 17.1875C25.1396 17.1875 25.4664 17.0555 25.7304 16.7915C25.9944 16.5275 26.1259 16.2012 26.125 15.8125C26.1241 15.4238 25.9921 15.0975 25.729 14.8335C25.4659 14.5695 25.1396 14.4375 24.75 14.4375C24.3604 14.4375 24.0341 14.5695 23.771 14.8335C23.5079 15.0975 23.3759 15.4238 23.375 15.8125C23.3741 16.2012 23.5061 16.528 23.771 16.7929C24.0359 17.0578 24.3622 17.1893 24.75 17.1875ZM22 26.125V20.625H11V26.125H22ZM24.75 28.875H8.25V23.375H2.75V15.125C2.75 13.9563 3.15104 12.9768 3.95312 12.1866C4.75521 11.3965 5.72917 11.0009 6.875 11H26.125C27.2938 11 28.2737 11.3955 29.0648 12.1866C29.8558 12.9777 30.2509 13.9572 30.25 15.125V23.375H24.75V28.875Z"
                  fill="black"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 33 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M11.5488 5.77505C11.5488 5.11864 11.8096 4.48911 12.2737 4.02496C12.7379 3.56081 13.3674 3.30005 14.0238 3.30005H20.4242C21.0804 3.30063 21.7095 3.56176 22.1732 4.02605L27.3245 9.17405C27.5545 9.40418 27.7368 9.6774 27.8611 9.97808C27.9854 10.2788 28.0492 10.601 28.0488 10.9263V20.625C28.0488 21.2815 27.7881 21.911 27.3239 22.3751C26.8598 22.8393 26.2302 23.1 25.5738 23.1H23.9238V17.5247C23.9235 16.212 23.4018 14.9531 22.4735 14.025L17.3238 8.8754C16.3957 7.94703 15.1369 7.42533 13.8242 7.42505H11.5488V5.77505Z"
                    fill="black"
                  />
                  <path
                    d="M7.42422 9.90003C6.76781 9.90003 6.13828 10.1608 5.67413 10.6249C5.20998 11.0891 4.94922 11.7186 4.94922 12.375V27.225C4.94922 27.8814 5.20998 28.511 5.67413 28.9751C6.13828 29.4393 6.76781 29.7 7.42422 29.7H18.9742C19.6306 29.7 20.2602 29.4393 20.7243 28.9751C21.1885 28.511 21.4492 27.8814 21.4492 27.225V17.5247C21.4486 16.8685 21.1875 16.2394 20.7232 15.7757L15.5752 10.6244C15.3451 10.3944 15.0719 10.212 14.7712 10.0877C14.4705 9.96345 14.1483 9.89966 13.8229 9.90003H7.42422Z"
                    fill="black"
                  />
                </svg>
              </button>
              <p>Duplicar</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1">
                <Update id={1} />
              </button>
              <p>Modificar</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1">
                <Delete id={1} />
              </button>
              <p>Eliminar</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MOBILE LAYOUT (< md) ===== */}
      <section className="md:hidden flex flex-col">
        <div className="flex items-center gap-1">
          {/* Blue compact bar */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`bg-primary text-white justify-between items-center px-3 py-2 flex flex-1 cursor-pointer select-none transition-all duration-300 text-sm ${
              isOpen ? "rounded-t-md" : "rounded-md"
            }`}>
            <p className="font-semibold">{reserva.numero}</p>
            <p>{reserva.destino}</p>
            <p className="font-semibold">{reserva.fecha}</p>
          </div>
          {/* Action icons inline */}
          <div className="flex items-center gap-1 text-black">
            <button>
              <svg
                width="18"
                height="18"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.5488 5.77505C11.5488 5.11864 11.8096 4.48911 12.2737 4.02496C12.7379 3.56081 13.3674 3.30005 14.0238 3.30005H20.4242C21.0804 3.30063 21.7095 3.56176 22.1732 4.02605L27.3245 9.17405C27.5545 9.40418 27.7368 9.6774 27.8611 9.97808C27.9854 10.2788 28.0492 10.601 28.0488 10.9263V20.625C28.0488 21.2815 27.7881 21.911 27.3239 22.3751C26.8598 22.8393 26.2302 23.1 25.5738 23.1H23.9238V17.5247C23.9235 16.212 23.4018 14.9531 22.4735 14.025L17.3238 8.8754C16.3957 7.94703 15.1369 7.42533 13.8242 7.42505H11.5488V5.77505Z"
                  fill="black"
                />
                <path
                  d="M7.42422 9.90003C6.76781 9.90003 6.13828 10.1608 5.67413 10.6249C5.20998 11.0891 4.94922 11.7186 4.94922 12.375V27.225C4.94922 27.8814 5.20998 28.511 5.67413 28.9751C6.13828 29.4393 6.76781 29.7 7.42422 29.7H18.9742C19.6306 29.7 20.2602 29.4393 20.7243 28.9751C21.1885 28.511 21.4492 27.8814 21.4492 27.225V17.5247C21.4486 16.8685 21.1875 16.2394 20.7232 15.7757L15.5752 10.6244C15.3451 10.3944 15.0719 10.212 14.7712 10.0877C14.4705 9.96345 14.1483 9.89966 13.8229 9.90003H7.42422Z"
                  fill="black"
                />
              </svg>
            </button>
            <button>
              <Update id={1} />
            </button>
            <button>
              <Delete id={1} />
            </button>
          </div>
        </div>

        {/* Dropdown animado - mobile only */}
        <div
          ref={contentRef}
          style={{
            maxHeight: isOpen ? `${contentHeight + 20}px` : "0px",
          }}
          className="overflow-hidden transition-all duration-500 ease-in-out">
          <div className="bg-secondary shadow-lg shadow-black/30 text-white rounded-b-lg py-3 px-4 flex gap-4 items-start">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-white/70">Cliente</p>
              <p className="font-bold text-sm">{reserva.cliente}</p>
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <p className="text-xs text-white/70">Título de reserva</p>
              <p className="font-bold text-sm">{reserva.titulo}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              {/* Print */}
              <button>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 33 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M24.75 9.625H8.25V4.125H24.75V9.625ZM24.75 17.1875C25.1396 17.1875 25.4664 17.0555 25.7304 16.7915C25.9944 16.5275 26.1259 16.2012 26.125 15.8125C26.1241 15.4238 25.9921 15.0975 25.729 14.8335C25.4659 14.5695 25.1396 14.4375 24.75 14.4375C24.3604 14.4375 24.0341 14.5695 23.771 14.8335C23.5079 15.0975 23.3759 15.4238 23.375 15.8125C23.3741 16.2012 23.5061 16.528 23.771 16.7929C24.0359 17.0578 24.3622 17.1893 24.75 17.1875ZM22 26.125V20.625H11V26.125H22ZM24.75 28.875H8.25V23.375H2.75V15.125C2.75 13.9563 3.15104 12.9768 3.95312 12.1866C4.75521 11.3965 5.72917 11.0009 6.875 11H26.125C27.2938 11 28.2737 11.3955 29.0648 12.1866C29.8558 12.9777 30.2509 13.9572 30.25 15.125V23.375H24.75V28.875Z"
                    fill="white"
                  />
                </svg>
              </button>
              {/* Email */}
              <button>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 33 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5.5 27.5C4.74375 27.5 4.09658 27.231 3.5585 26.6929C3.02042 26.1548 2.75092 25.5072 2.75 24.75V8.25C2.75 7.49375 3.0195 6.84658 3.5585 6.3085C4.0975 5.77042 4.74467 5.50092 5.5 5.5H27.5C28.2563 5.5 28.9039 5.7695 29.4429 6.3085C29.9819 6.8475 30.2509 7.49467 30.25 8.25V24.75C30.25 25.5063 29.981 26.1539 29.4429 26.6929C28.9048 27.2319 28.2572 27.5009 27.5 27.5H5.5ZM16.5 17.6344C16.6146 17.6344 16.7351 17.617 16.8616 17.5821C16.9881 17.5473 17.1082 17.496 17.2219 17.4281L26.95 11.3438C27.1333 11.2292 27.2708 11.0862 27.3625 10.9148C27.4542 10.7433 27.5 10.554 27.5 10.3469C27.5 9.88854 27.3052 9.54479 26.9156 9.31563C26.526 9.08646 26.125 9.09792 25.7125 9.35L16.5 15.125L7.2875 9.35C6.875 9.09792 6.47396 9.09242 6.08438 9.3335C5.69479 9.57458 5.5 9.91237 5.5 10.3469C5.5 10.576 5.54583 10.7768 5.6375 10.9491C5.72917 11.1215 5.86667 11.253 6.05 11.3438L15.7781 17.4281C15.8927 17.4969 16.0133 17.5487 16.1398 17.5835C16.2663 17.6183 16.3863 17.6353 16.5 17.6344Z"
                    fill="white"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
