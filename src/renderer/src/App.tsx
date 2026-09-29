import * as React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/shared/AppLayout'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import DashboardRoute from '@/routes/dashboard.route'
import EditorRoute from '@/routes/editor.route'
import PreviewRoute from '@/routes/preview.route'

function ShellRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardRoute />} />
        <Route path="/editor/:id" element={<EditorRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          {/* Standalone, chrome-free route used for viewing and PDF export */}
          <Route path="/preview/:projectId" element={<PreviewRoute />} />
          <Route path="/*" element={<ShellRoutes />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
