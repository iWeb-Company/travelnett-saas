"use client";
import Wpp from "../components/icons/Wpp";
import Mail from "../components/icons/Mail";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push("/dashboard");
    console.log("submit");
  };
  return (
    <main className="login-page mx-5 h-screen max-w-3xl md:mx-auto overflow-hidden">
      <img className="mx-auto my-8" src="/logo.png" alt="Logo de TravelNett" />
      <h1 className="text-3xl font-medium text-black text-center">
        Iniciar sesión
      </h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:mx-auto gap-10 my-8"
      >
        <input
          className="shadow-md shadow-black/25 bg-[#F1F1F1] border border-black/25 rounded-lg py-2 px-4 text-black"
          placeholder="Usuario"
          type="text"
        />
        <input
          className="shadow-md shadow-black/25 bg-[#F1F1F1] border border-black/25 rounded-lg py-2 px-4 text-black"
          placeholder="Contraseña"
          type="text"
        />
        <button className="bg-primary text-md shadow-md font-medium shadow-black/50 text-white py-2 rounded-lg">
          Ingresar
        </button>
      </form>
      <ul className="flex flex-col md:items-start justify-start text-sm text-black gap-4">
        <li className="text-start flex items-center gap-1">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.8413 20.8488C14.2467 20.8488 14.5896 20.7087 14.8699 20.4284C15.1502 20.1481 15.2899 19.8056 15.2892 19.401C15.2884 18.9963 15.1486 18.6535 14.8699 18.3724C14.5911 18.0914 14.2483 17.9516 13.8413 17.9531C13.4344 17.9547 13.0919 18.0948 12.8139 18.3736C12.536 18.6523 12.3958 18.9948 12.3935 19.401C12.3912 19.8071 12.5313 20.15 12.8139 20.4295C13.0966 20.709 13.439 20.8488 13.8413 20.8488ZM12.7989 16.3895H14.9417C14.9417 15.7524 15.0143 15.2505 15.1594 14.8837C15.3046 14.5169 15.7146 14.015 16.3895 13.378C16.8914 12.8761 17.2872 12.3981 17.5767 11.944C17.8663 11.49 18.0111 10.9448 18.0111 10.3086C18.0111 9.22751 17.6154 8.39742 16.8239 7.81828C16.0324 7.23915 15.0961 6.94958 14.0151 6.94958C12.9147 6.94958 12.0221 7.23915 11.3371 7.81828C10.6522 8.39742 10.1742 9.09238 9.90321 9.90316L11.8144 10.656C11.9109 10.3086 12.1282 9.93212 12.4665 9.52673C12.8047 9.12133 13.3209 8.91864 14.0151 8.91864C14.6328 8.91864 15.0961 9.08774 15.405 9.42596C15.7139 9.76417 15.8683 10.1356 15.8683 10.5402C15.8683 10.9263 15.7525 11.2885 15.5208 11.6267C15.2892 11.9649 14.9996 12.2784 14.6521 12.5672C13.8027 13.3201 13.2815 13.8895 13.0885 14.2756C12.8954 14.6617 12.7989 15.3663 12.7989 16.3895ZM13.8992 25.4819C12.297 25.4819 10.7912 25.178 9.38199 24.5703C7.97277 23.9626 6.74693 23.1372 5.70449 22.0939C4.66205 21.0507 3.83697 19.8249 3.22927 18.4164C2.62156 17.008 2.31732 15.5022 2.31655 13.8992C2.31578 12.2961 2.62002 10.7904 3.22927 9.38194C3.83852 7.97349 4.66359 6.74765 5.70449 5.70444C6.74539 4.66123 7.97122 3.83615 9.38199 3.22922C10.7928 2.62229 12.2985 2.31805 13.8992 2.3165C15.5 2.31496 17.0057 2.6192 18.4165 3.22922C19.8273 3.83924 21.0531 4.66431 22.094 5.70444C23.1349 6.74457 23.9603 7.9704 24.5704 9.38194C25.1804 10.7935 25.4842 12.2992 25.4819 13.8992C25.4796 15.4991 25.1754 17.0049 24.5692 18.4164C23.9631 19.828 23.138 21.0538 22.094 22.0939C21.05 23.1341 19.8242 23.9595 18.4165 24.5703C17.0088 25.1811 15.5031 25.485 13.8992 25.4819Z"
              fill="#0546F7"
            />
          </svg>

          <p>Si no podes iniciar sesión comunicate con nosotros</p>
        </li>
        <Link href="" className="flex items-center justify-start gap-2">
          <Wpp />
          <p>Whatsapp</p>
        </Link>
        <Link href="" className="flex items-center justify-start gap-2">
          <Mail />
          <p>Email</p>
        </Link>
      </ul>
    </main>
  );
}
