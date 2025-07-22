import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react"
import App from './App.tsx'
import './index.css'

// Initialize Sentry
const sentryDsn = import.meta.env.VITE_SENTRY_DSN_FRONTEND
const sentryEnvironment = import.meta.env.VITE_SENTRY_ENVIRONMENT || "development"
const sentryTracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "1.0")
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration()
    ],
    // Tracing
    tracesSampleRate: sentryTracesSampleRate,
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", new RegExp(`^${apiBaseUrl.replace(/https?:\/\//, 'https://')}`)],
    // Enable logs to be sent to Sentry
    _experiments: { enableLogs: true },
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)