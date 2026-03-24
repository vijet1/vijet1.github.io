import { useState } from 'react'
import { useEffect, useRef } from "react"
import p5 from "p5"
import './index.css'
import {NavLink, Outlet} from "react-router";


export default function Home(){
    return (<NavLink to="/time-machine">GEARS</NavLink>)
}