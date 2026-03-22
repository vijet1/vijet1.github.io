import { useState } from 'react'
import { useEffect, useRef } from "react"
import p5 from "p5"
import './index.css'
import GearWidget from './GearWidget'

function setTabHeader(iconLink, title){
  if (iconLink){
    const favicon = document.querySelector("link[rel='icon']");
    favicon.href = iconLink;
  }
  if (title){
    document.title = title;
  }
}
setTabHeader("/rose.png", "Ultra-Clock");



function App() {
  

  return (
    <>
      <div className="ScrollCenter">
        <p>Gears</p>
        <GearWidget/>
      </div>
      
    </>
  );
}

export default App;