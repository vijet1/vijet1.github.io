import { useState } from 'react'
import './index.css'

function setTabHeader(iconLink, title){
  if (iconLink){
    const favicon = document.querySelector("link[rel='icon']");
    favicon.href = iconLink;
  }

  if (title){
    document.title = title;
  }
}
setTabHeader("https://avatars.githubusercontent.com/u/69440753?v=4", "Cool Things")

function App() {
  return (
    <>
     <h1>his</h1>
    </>
  )
}

export default App
