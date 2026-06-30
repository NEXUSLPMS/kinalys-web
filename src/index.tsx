import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { KinalysThemeProvider } from './contexts/KinalysTheme'
import './index.css'
import './styles/kinalys.css'
import App from './App'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

// W-025: fail-fast at startup. The TS non-null (!) is compile-time only and does
// nothing at runtime — an unset var reaches the SDK as undefined and renders a
// confusing normal-looking login page. Read into constants and gate the mount:
// if any Auth0 var is missing, render a visible configuration-error screen
// instead of ever constructing Auth0Provider with undefined config.
const AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN
const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID
const AUTH0_AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE

if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_AUDIENCE) {
  root.render(
    <div style={{ padding: 40, fontFamily: 'monospace', color: '#dc2626' }}>
      <h1>Configuration Error</h1>
      <p>Missing required environment variables:</p>
      <ul>
        {!AUTH0_DOMAIN && <li>REACT_APP_AUTH0_DOMAIN</li>}
        {!AUTH0_CLIENT_ID && <li>REACT_APP_AUTH0_CLIENT_ID</li>}
        {!AUTH0_AUDIENCE && <li>REACT_APP_AUTH0_AUDIENCE</li>}
      </ul>
      <p>Copy .env.example to .env and fill in the Auth0 values, then restart.</p>
    </div>
  )
} else {
  root.render(
    <React.StrictMode>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: AUTH0_AUDIENCE,
        }}
      >
        <KinalysThemeProvider defaultTheme="light">
          <App />
        </KinalysThemeProvider>
      </Auth0Provider>
    </React.StrictMode>
  )
}