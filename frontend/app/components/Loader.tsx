"use client";
import Image from "next/image";

export const Loader = () => {
    return (
        <div className="flex items-center justify-center">
            <Image
                src="/logo.png"
                alt="Trannet Logo"
                width={100}
                height={100}
                className="animate-spin rounded-full"
            />
        </div>
    );
}