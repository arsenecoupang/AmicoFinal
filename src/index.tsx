import React from 'react';
import ReactDOM from 'react-dom/client';
import {RouterProvider} from 'react-router-dom';
import router from "./Router";
import GlobalStyle from "./components/GlobalStyle";
import {ThemeProvider} from "styled-components";
import { lightTheme } from "./theme";
import { AuthProvider } from "./AuthContext";
import { StoreProvider } from "./Store";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <StoreProvider>
      <AuthProvider>
        <ThemeProvider theme={lightTheme}>
          <GlobalStyle />
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </StoreProvider>
  </React.StrictMode>
);
