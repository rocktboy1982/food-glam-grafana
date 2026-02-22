"use client"

import React from 'react'
import { ToastProvider } from './toast'

export default function ToastClient({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
