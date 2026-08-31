import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@styles/tailwind.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './features/auth/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AppToaster } from './components/common/AppToaster';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <ThemeProvider>
                <CurrencyProvider>
                    <AuthProvider>
                        <App />
                        <AppToaster />
                    </AuthProvider>
                </CurrencyProvider>
            </ThemeProvider>
        </GoogleOAuthProvider>
    </StrictMode>,
);

