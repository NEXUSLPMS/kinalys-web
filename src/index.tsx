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
      domain={process.env.REACT_APP_AUTH0_DOMAIN!}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE!,
      }}
    >
      <KinalysThemeProvider defaultTheme="light">
        <App />
      </KinalysThemeProvider>
    </Auth0Provider>
  </React.StrictMode>
)