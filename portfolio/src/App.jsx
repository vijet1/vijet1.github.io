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

function GenerateLayer(p, sets, num, tries, w, h, affector){
  let gears = [];
  let i = 0;

  let pool = [];
  for (let i = 0; i < sets.length; i++) {
    let weight = Math.floor(sets[i].teethRadius / 5); // bigger = more entries
    for (let w = 0; w < weight; w++) pool.push(sets[i]);
  }

  function genAxlePartner(gear){
    let newRand = [];
    for (let i = 0; i < sets.length; i++){
      if (sets[i].teethRadius < gear.teethRadius - 4){
        newRand[newRand.length] = sets[i];
      }
    }

    let axlePartner = p.random(newRand);
    if (axlePartner) {
      axlePartner = axlePartner.clone(gear.x, gear.y, gear.turnRate, gear.angle)
      gear.axle(axlePartner)
    }
  }



  do{
    let existingGear = gears[i];
    if (existingGear){
      if (existingGear.x < -w/2 || existingGear.x > w/2 || existingGear.y < -h/2 || existingGear.y > h/2){
        i++
        continue;
      }

      existingGear._tries ??= 0;
      existingGear._tries++;

      let tryGear;

      let useForMath = existingGear;
      if (existingGear._axlePartner ) {
        useForMath = existingGear._axlePartner;
        let newRand = [];
        for (let i = 0; i < sets.length; i++){
          if (sets[i].teethRadius > (existingGear.teethRadius - useForMath.teethRadius)/2 + 4){
            newRand[newRand.length] = sets[i];
          }
        }
        tryGear = p.random(newRand).clone();
      }else{
        tryGear = p.random(pool).clone();
      }

      let angle = p.random() * p.TWO_PI;
      let r = tryGear.jointRadius(useForMath);
      let x = useForMath.x + Math.cos(angle) * r, y = useForMath.y + Math.sin(angle) * r
      tryGear.x = x;
      tryGear.y = y;

      if (tryGear.makeValid(gears)){
        
        if (tryGear.teethRadius > 20){
          genAxlePartner(tryGear)
        }
        affector(tryGear)

        gears.push(tryGear);
      }

      if (existingGear._tries > tries){
        i++;
      }
    }else{
      let gear = p.random(pool).clone();
      //genAxlePartner(gear)
      affector(gear)
      gears.push(gear)
    }
  } while (i < gears.length && gears.length < num)
  return gears;
}

function markTimers(p, wi, hi, gears){
  const milliseconds = p.TWO_PI
  const seconds = p.TWO_PI / 60
  const minutes = p.TWO_PI / 3600
  const hours = p.TWO_PI / 43200

  let mindp = 1e9, mindpg;
  let minms = 1e9, minmsg;
  let mins= 1e9, minsg;
  let minm = 1e9, minmg;
  let minh = 1e9, minhg;
  
  for (let i = 0; i < gears.length; i++){
    let gear = gears[i]
    if (gear.x < -wi / 2.2 || gear.x > wi / 2.2 || gear.y < -hi / 2.2 || gear.y > hi / 2.2){
      continue;
    }
    let tr = Math.abs(gear.turnRate)
    let teethPerMs = gear.getNumTeeth() * (tr / p.TWO_PI) / milliseconds;
    let dp = Math.abs(teethPerMs - 1);
    if (dp < mindp) mindp = dp, mindpg = gear;
    let ms = Math.abs(tr - milliseconds); if (ms < minms) {minms = ms, minmsg = gear;}
    let s = Math.abs(tr - seconds); if (s < mins) {mins = s, minsg = gear;}
    let m = Math.abs(tr - minutes); if (m < minm) {minm = m, minmg = gear;}
    let h = Math.abs(tr - hours); if (h < minh) {minh = h, minhg = gear;}
  }

  mindpg._TMark = ["MSC"]
  minmsg._TMark = ["MS"]
  minsg._TMark = ["S"]
  minmg._TMark = ["M"]
  minhg._TMark = ["H"]

  console.log(mindpg, minmsg, minsg, minmg, minhg)
}



function App() {
  let ref = useRef(null);
  let designSize = 600;

  useEffect(() => {
    let style = getComputedStyle(document.documentElement)
    let gold1 = style.getPropertyValue("--gold1").trim(),
      gold2 = style.getPropertyValue("--gold2").trim(),
      gold3 = style.getPropertyValue("--gold3").trim(),
      silver1 = style.getPropertyValue("--silver1").trim(),
      silver2 = style.getPropertyValue("--silver2").trim(),
      silver3 = style.getPropertyValue("--silver3").trim(),
      emerald = style.getPropertyValue("--emerald").trim(),
      saphire = style.getPropertyValue("--saphire").trim(),
      rose = style.getPropertyValue("--rose").trim()


    
    function buildGears(p, w, h){
      let sm = 5;
      let sets = [
        new Gear(p, 0, 0, 1.5*sm, 0, p.color(gold1)).radii(7,14,1,4).bridge(3,-0.3,3,2).teeth(3,0).gem(p.color(emerald)),
        new Gear(p, 0, 0, 2.7*sm, 0, p.color(gold3)).radii(4,6,1,4).bridge(5,0,3,2).teeth(3,0).gem(p.color(emerald)),
        new Gear(p, 0, 0, 3.5*sm, 0, p.color(gold2)).radii(8,0,1,4).bridge(0,0,0,0).teeth(3,0).gem(p.color(silver1)),

        new Gear(p, 0, 0, 1.5*sm, 0, p.color(silver3)).radii(9,19,3,4).bridge(7,-0.3,5,3).teeth(3,0).gem(p.color(saphire)),
        new Gear(p, 0, 0, 1.3*sm, 0, p.color(silver1)).radii(15,28,1,4).bridge(3,0,4,3).teeth(3,0).gem(p.color(saphire)),
        new Gear(p, 0, 0, 1.5*sm, 0, p.color(silver2)).radii(1,5,0.7,4).bridge(8,0,1,1).teeth(3,0),

        new Gear(p, 0, 0, 2.25*sm, 0, gold1).radii(20, 26, 2, 4).bridge(9, -0.3, 6, 4).teeth(3, 0).gem(p.color(rose)),

        new Gear(p, 0, 0, 1.65*sm, 0, gold3).radii(9, 11, 1, 4).bridge(6, 0.4, 4, 3).teeth(3, 0).gem(p.color(saphire)),
        new Gear(p, 0, 0, 1.65*sm, 0, gold1).radii(30, 30, 10, 4).bridge(7, 0.1, 10, 20).teeth(3, 0).gem(p.color(emerald)),

        new Gear(p, 0, 0, 1.35*sm, 0, silver3).radii(16, 24, 3, 4).bridge(7, 0, 5, 4).teeth(3, 0).gem(p.color(rose)),

        new Gear(p, 0, 0, 1.55*sm, 0, silver3).radii(11, 13, 2, 4).bridge(3, -0.5, 15, 8).teeth(3, 0).gem(p.color(rose)),
      ]
      

      let gears = [];

      let layer2dark = 0.35
      let l2 = GenerateLayer(p, sets, 600,150, w, h, (gear) => {
        gear.color = p.color(p.hue(gear.color), p.saturation(gear.color), p.brightness(gear.color) * layer2dark)
        if (gear.gemColor){
          gear.gemColor = p.color(p.hue(gear.gemColor), p.saturation(gear.gemColor), p.brightness(gear.gemColor) * layer2dark)
        }
        if (gear._axlePartner){
          gear._axlePartner.color = p.color(p.hue(gear._axlePartner.color), p.saturation(gear._axlePartner.color), p.brightness(gear._axlePartner.color) * layer2dark)
          if (gear._axlePartner.gemColor){
            gear._axlePartner.gemColor = p.color(p.hue(gear._axlePartner.gemColor), p.saturation(gear._axlePartner.gemColor), p.brightness(gear._axlePartner.gemColor) * layer2dark)
          }
        }
      })

      let l1 = GenerateLayer(p, sets, 600, 150, w, h, (gear) => {
        
      })

      markTimers(p, w, h, l1)

      gears = gears.concat(l2, l1);

      

      return gears
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