import { useState } from 'react'
import { useEffect, useRef } from "react"
import p5 from "p5"
import './index.css'
import Canvas, { Gear } from './Canvas'

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

function GenerateLayer(p, sets, num, tries, affector){
  let gears = [];
  let i = 0;
  do{
    let existingGear = gears[i];
    if (existingGear){
      if (existingGear.x < -300 || existingGear.x > 300 || existingGear.y < -300 || existingGear.y > 300){
        i++
        continue;
      }

      existingGear._tries ??= 0;
      existingGear._tries++;

      let tryGear = p.random(sets).clone();
      let angle = p.random() * p.TWO_PI;
      let r = tryGear.jointRadius(existingGear);
      let x = existingGear.x + Math.cos(angle) * r, y = existingGear.y + Math.sin(angle) * r
      tryGear.x = x;
      tryGear.y = y;

      if (tryGear.makeValid(gears)){
        affector(tryGear)
        gears.push(tryGear);
      }

      if (existingGear._tries > tries){
        i++;
      }
    }else{
      let gear = p.random(sets).clone();
      affector(gear)
      gears.push(gear)
    }
  } while (i < gears.length && gears.length < num)
  return gears;
}

function App() {
  let ref = useRef(null);
  let designSize = 600;

  useEffect(() => {
    let style = getComputedStyle(document.documentElement)
    let gold = style.getPropertyValue("--gold").trim(),
      silver = style.getPropertyValue("--silver").trim(),
      emerald = style.getPropertyValue("--emerald").trim(),
      saphire = style.getPropertyValue("--saphire").trim(),
      brass = style.getPropertyValue("--brass").trim(),
      pewter = style.getPropertyValue("--pewter").trim(),
      jade = style.getPropertyValue("--jade").trim(),
      rose = style.getPropertyValue("--rose").trim()


    
    function buildGears(p){
      let sets = [
        new Gear(p, 0, 0, 1.5, 0, p.color(gold)).radii(7,14,1,4).bridge(3,-0.3,3,2).teeth(3,0).gem(p.color(emerald)),
        new Gear(p, 0, 0, 2.7, 0, p.color(gold)).radii(4,6,1,4).bridge(5,0,3,2).teeth(3,0).gem(p.color(emerald)),
        new Gear(p, 0, 0, 3.5, 0, p.color(gold)).radii(8,0,1,4).bridge(0,0,0,0).teeth(3,0).gem(p.color(silver)),

        new Gear(p, 0, 0, 1.5, 0, p.color(silver)).radii(9,19,3,4).bridge(7,-0.3,5,3).teeth(3,0).gem(p.color(saphire)),
        new Gear(p, 0, 0, 1.3, 0, p.color(silver)).radii(15,28,1,4).bridge(3,0,4,3).teeth(3,0).gem(p.color(saphire)),
        new Gear(p, 0, 0, 1.5, 0, p.color(silver)).radii(1,5,0.5,4).bridge(4,0,2,2).teeth(3,0),

        new Gear(p, 0, 0, 2.25, 0, brass).radii(20, 26, 2, 5).bridge(9, -0.3, 6, 4).teeth(3, 0).gem(p.color(jade)),

        new Gear(p, 0, 0, 1.65, 0, brass).radii(9, 11, 1, 4).bridge(6, 0.4, 4, 3).teeth(3, 0).gem(p.color(jade)),
        new Gear(p, 0, 0, 2.4, 0, brass).radii(12, 0, 1, 5).bridge(0, 0, 0, 0).teeth(3,0),

        new Gear(p, 0, 0, 1.35, 0, pewter).radii(16, 24, 3, 5).bridge(7, 0, 5, 4).teeth(3, 0).gem(p.color(rose)),

        new Gear(p, 0, 0, 1.55, 0, pewter).radii(11, 13, 1, 4).bridge(3, -0.5, 5, 3).teeth(3, 0).gem(p.color(rose)),
        new Gear(p, 0, 0, 12.0, 0, brass).radii(1, 3, 0.5, 3).bridge(10, 0, 2, 2).teeth(3, 0),
      ]

      let gears = [];
      
      let l1 = GenerateLayer(p, sets, 100, 60, (gear) => {

      })
      let l2 = GenerateLayer(p, sets, 100, 60, (gear) => {
        gear.color = p.color(p.hue(gear.color), p.saturation(gear.color), p.brightness(gear.color) * 0.3)
        if (gear.gemColor){
          gear.gemColor = p.color(p.hue(gear.gemColor), p.saturation(gear.gemColor), p.brightness(gear.gemColor) * 0.3)
        }
      })
      let l3 = GenerateLayer(p, sets, 100, 60, (gear) => {
        gear.color = p.color(p.hue(gear.color), p.saturation(gear.color) * 0.7, p.brightness(gear.color) * 0.1)
        if (gear.gemColor){
          gear.gemColor = p.color(p.hue(gear.gemColor), p.saturation(gear.gemColor) * 0.7, p.brightness(gear.gemColor) * 0.1)
        }
      })

      return gears.concat(l1, l2, l3);
    }

    const p = new p5(Canvas(ref, designSize, buildGears), ref.current);
    return () => p.remove();
  }, []);

  /* <div className='TIME'>
      <Clock />
    </div> */

  return (
  <div className="gears">
    <div ref={ref} className="gearsClip" >
    </div>
  </div>
  );
}

export default App;