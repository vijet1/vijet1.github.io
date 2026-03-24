import { useState } from 'react'
import { useEffect, useRef } from "react"
import p5 from "p5"
import './GearPage.css'

export default function Canvas(ref, designSize, buildGears){
  return function(p){
    let gears = [];
    let mult = 1;

    p.setup = () => {
      const { offsetWidth, offsetHeight } = ref.current;
      //console.log(offsetWidth, offsetHeight)
      const s  = Math.min(offsetWidth, offsetHeight) / designSize;
      p.createCanvas(offsetWidth, offsetHeight);
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.textFont('Georgia');
      p.textAlign(p.CENTER, p.CENTER);
      //console.log(s)
      //console.log("START")
      setTimeout(buildGears, 0, gears, p, offsetWidth/s, offsetHeight/s);
      //console.log("Fin")
    }

    p.draw = () => {
      //console.log("DRAW")
      p.clear();
      p.push();
      p.translate(p.width / 2, p.height / 2);

      const s = Math.min(p.width, p.height) / designSize;
      p.scale(s);

      const mx = (p.mouseX - p.width  / 2) / s;
      const my = (p.mouseY - p.height / 2) / s;

      const dt = p.deltaTime / 1000;
      for (let i = 0; i < gears.length; i++) {
        let g = gears[i]
        if (!g._pg){
          g.preRender();
        }

        const dist = Math.sqrt((mx - g.x) ** 2 + (my - g.y) ** 2);
        const hovered = dist - 15 < g.teethRadius;
        gears[i].scale = hovered ? p.lerp(gears[i].scale, 1.5, 0.2) : p.lerp(gears[i].scale, 1, 0.05);

        gears[i].draw(mult);
      }

      let drawTime = (i, text) => {
        p.push();

        let w = 20, h = 30;
        let x = i * (w+5), y = (p.height/2/s - h - 10)
        p.fill(p.color(90))
        p.noStroke()
        p.rect(x, y, w, h)
        //console.log(x, y, w, h)
        p.textSize(20)
        p.fill(p.color(0))
        p.text(text, x + w/2, y + h/2)

        p.pop();
      }

      function mod(n, m) {
        return ((n % m) + m) % m;
      }

      let times = [];
      for (let i = 0; i < gears.length; i++) {
        let g = gears[i]
        gears[i].drawText(mult);
        let marker = gears[i]._TMark;


        if (marker){
          let angle = g._lastAngle + marker[1]
          //console.log(angle, marker[1])
          if (marker[0] == "H"){
            times[0] = Math.floor(mod(angle, p.TWO_PI) / p.TWO_PI * 12)
            if (times[0] == 0) times[0] = 12;
            times[0] = times[0].toString();
            if (times[0].length == 1) times[0] = "0" + times[0]
            times[0] += ":"
          }else if (marker[0] == "M"){
            times[1] = Math.floor(mod(angle, p.TWO_PI) / p.TWO_PI * 60)
            times[1] = times[1].toString();
            if (times[1].length == 1) times[1] = "0" + times[1]
            times[1] += ":"
          }else if (marker[0] == "S"){
            times[2] = Math.floor(mod(angle, p.TWO_PI) / p.TWO_PI * 60)
            times[2] = times[2].toString();
            if (times[2].length == 1) times[2] = "0" + times[2]
            times[2] += "."
          }else if (marker[0] == "MS"){
            times[3] = Math.floor(mod(angle, p.TWO_PI) / p.TWO_PI * (1000))
            times[3] = times[3].toString();
            //console.log(times[3])
            times[3] = "0".repeat(3 - times[3].length) + times[3]
          }
        }
      }
      //console.log(gears)

      let rs = 0
      for (let i = 0; i < times.length; i++){
        //console.log(times)
        rs+=times[i].length;
      }
      let ri=0;
      for (let i = 0; i < times.length; i++){
        for (let ii = 0; ii < times[i].length; ii++){
          drawTime(p.map(ri, 0, rs, -rs/2, rs/2), times[i][ii])
          ri++;
        }
      }
          

      p.pop();
    };

    p.mouseWheel = (event) => {
      mult += event.delta * -0.00005
      mult = Math.max(-20, Math.min(20, mult))
      return false;
    };

    p.windowResized = () => {
      const { offsetWidth, offsetHeight } = ref.current;
      p.resizeCanvas(offsetWidth, offsetHeight);
    }
  }
  
}