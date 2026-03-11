"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function SalidasIDPage() {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };
  return (
    <Container>
      <ToggleSalidas />

      <section className="flex flex-col gap-3">
        <Link
          href={"/dashboard"}
          className="flex items-center justify-start gap-3">
          <ArrowLeft />
          <h1 className="font-bold">Volver al menú</h1>
        </Link>
        <button
          onClick={handleBack}
          className="flex items-center cursor-pointer justify-start gap-3">
          <ArrowLeft color="#6005F7" />
          <h1 className="font-semibold text-secondary">Volver a Salidas</h1>
        </button>
      </section>
    </Container>
  );
}
