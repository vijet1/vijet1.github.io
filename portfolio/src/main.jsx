import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import './index.css'
import GearPage from './GearPages/GearPage.jsx'
import Footers from './Footers.jsx'
import Home from './Home.jsx'

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sltbqxokaucpjwncljnn.supabase.co";
const supabaseKey = "sb_publishable_CLoGq_H1q-UKbcHqJKUMAQ_yKBUdEVw";

export const supabase = createClient(supabaseUrl, supabaseKey);

createRoot(document.getElementById('root')).render(
  //index path="contact" element={<Contact />}}
  //<StrictMode>
    <BrowserRouter>
      <Routes>
        {/* <Route element={<Footers />}>
          <Route path="home" element={<Home />} />
          <Route index element={<Navigate to="/home" replace />} />
        </Route> */}
        <Route path="Time-Machine" element={<GearPage />} />
        <Route index element={<Navigate to="/time-machine" replace />} />
        <Route path="*" element={<Navigate to="/time-machine" replace />} />
      </Routes>
    </BrowserRouter>
  //</StrictMode>,
)
