'use client'
import { RouteError } from '@/components/ui/route-error'
export default function Error(props: { error: Error; reset: () => void }) {
  return <RouteError {...props} routeName="Registro" />
}
