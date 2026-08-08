import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-primary/30 hidden md:flex justify-between px-4">
            <section className="flex items-center gap-3">
                <img src="/logo.png" width={60} alt="Logo TravelNett" />
                <p>El sistema que te facilita la vida</p>
            </section>
            <section className="flex items-center gap-3">
                <div className="flex items-center font-semibold italic gap-3">
                    <p>Desarrollado por:</p>
                    <Link href="https://iwebtecnology.com" target="_blank" className="flex items-center">
                        iWeb Technology
                        <img src="/iweb.png" alt="iWeb" className="h-8 w-auto" />
                    </Link>
                </div>
            </section>
        </footer>
    )
}
