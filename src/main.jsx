import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import {Provider} from 'react-redux';
import {store} from './store/store';
import  ThemeContext  from "./context/ThemeContext"; 
import { HotelProvider } from "./context/HotelContext";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store = {store}>
      <BrowserRouter basename='/'>
        <ThemeContext>
          <HotelProvider>
            <App />
          </HotelProvider>
        </ThemeContext>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
