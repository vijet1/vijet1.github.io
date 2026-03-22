import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sltbqxokaucpjwncljnn.supabase.co";
const supabaseKey = "sb_publishable_CLoGq_H1q-UKbcHqJKUMAQ_yKBUdEVw";

export const supabase = createClient(supabaseUrl, supabaseKey);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
