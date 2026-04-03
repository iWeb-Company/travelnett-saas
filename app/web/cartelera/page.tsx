'use client'
import Container from '@/app/components/Container'
import ArrowLeft from '@/app/components/icons/ArrowLeft'
import ToggleSalidas from '@/app/components/ToggleSalidas'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CarteleraPage() {
    const r = useRouter()
  return (
    <Container>
          <ToggleSalidas />
          <Link href="/dashboard" className="flex items-center justify-start gap-3">
            <ArrowLeft />
            <h1 className="font-bold">Volver al menú</h1>
          </Link>
          <button
            onClick={() => r.push("/web")}
            className="flex items-center my-3 justify-start gap-3"
          >
            <ArrowLeft color="#6005F7" />
            <h2 className="font-semibold text-secondary hover:underline">
              Volver al Panel
            </h2>
          </button>
          </Container>
  )
}
