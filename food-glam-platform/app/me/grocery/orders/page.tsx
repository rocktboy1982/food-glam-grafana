import type { Metadata } from 'next'
import GroceryOrdersClient from '@/components/pages/grocery-orders-client'

export const metadata: Metadata = {
  title: 'Order History | Food Glam',
}

export default function GroceryOrdersPage() {
  return <GroceryOrdersClient />
}
