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

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-zb6uoyfyk6iqoje2.us.auth0.com"
      clientId="2stbY7BtSqe2ml7Df5Kb6ciPTD7sot8J"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: 'https://api.kinalys.io',
      }}
    >
      <KinalysThemeProvider defaultTheme="light">
        <App />
      </KinalysThemeProvider>
    </Auth0Provider>
  </React.StrictMode>
)