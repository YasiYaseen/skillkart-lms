import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@styles/tailwind.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';

console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <App />
        </GoogleOAuthProvider>
        <ToastContainer position='bottom-right' />
    </StrictMode>,
);
