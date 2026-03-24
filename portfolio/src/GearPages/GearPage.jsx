import { useState } from 'react'
import { useEffect, useRef } from "react"
import p5 from "p5"
import './GearPage.css'
import Canvas from './GearCanvas'
import Gear from './Gear'
import {NavLink, Outlet} from "react-router";



function GenerateLayer(gears, p, sets, pool, num, tries, w, h, affector, start, i, nextFunc){
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

  i ??= gears.length;
  start ??= i;

  let placed = false
  do{
    if (placed){
      setTimeout(GenerateLayer, 0, gears, p, sets, pool, num, tries, w, h, affector, start, i, nextFunc)
      return;
    }
    placed = false;

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

      if (tryGear.makeValid(start, gears)){
        
        if (tryGear.teethRadius > 20){
          genAxlePartner(tryGear)
        }
        affector(tryGear)

        gears.push(tryGear);
        placed = true;
      }

      if (existingGear._tries > tries){
        i++;
      }
    }else{
      let gear = p.random(pool).clone();
      //genAxlePartner(gear)
      affector(gear)
      gears.push(gear)
      placed = true;
    }
    //console.log(i, gears.length, num)
  } while (i < gears.length && gears.length < num)
  
  if (nextFunc){
    nextFunc()
  }
}

function markTimers(p, wi, hi, start, gears){
  let matches = [[p.TWO_PI], [p.TWO_PI / 60], [p.TWO_PI / 3600], [p.TWO_PI / 43200]]

  //console.log(start, gears.length)
  for (let i = start; i < gears.length; i++) {
    let gear = gears[i]
    if (gear.x < -wi / 2 || gear.x > wi / 2 || gear.y < -hi / 2 || gear.y > hi / 2) {
      continue;
    }
    let tr = gear.turnRate
    //console.log(tr)
    if (tr > 0){
      continue;
    }
    for (let k = 0; k < matches.length; k++) {
      let ms = Math.abs(matches[k][0] - Math.abs(tr));
      matches[k][1] ??= []
      matches[k][1].push([gear, ms])
    }
  }

  //console.log(matches)
  for (let i = 0; i < matches.length; i++) {
    matches[i][1].sort((a, b) => b[1] - a[1])
  }

  for (let i = 0; i < matches.length; i++) {
    let ii = matches[i][1].length - 1
    let f = false
    do {
      f = false
      for (let ik = 0; ik < matches.length; ik++) {
        if (ik != i && matches[ik][1][matches[ik][1].length - 1][0] === matches[i][1][ii][0]) {
          f = true; break;
        }
      }
      if (f){
        matches[i][1].pop()
        ii--;
      }
    } while (f)
  }
  
  matches[0][1][matches[0][1].length - 1][0]._TMark = ["MS"]
  matches[1][1][matches[1][1].length - 1][0]._TMark = ["S"]
  matches[2][1][matches[2][1].length - 1][0]._TMark = ["M"]
  matches[3][1][matches[3][1].length - 1][0]._TMark = ["H"]

  //console.log(matches)
}

export default function GearPage() {
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


    
    function buildGears(gears, p, w, h){
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

      let pool = [];
      for (let i = 0; i < sets.length; i++) {
        let weight = Math.floor(sets[i].teethRadius / 5); // bigger = more entries
        for (let w = 0; w < weight; w++) pool.push(sets[i]);
      }

      let layer2dark = 0.35
      GenerateLayer(gears, p, sets, pool, 800,150, w, h, (gear) => {
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
      }, null, null, () => {
        let smt = gears.length
        //console.log(smt)
        GenerateLayer(gears, p, sets, pool, 800, 150, w, h, (gear) => {
          
        }, null, null, () => {
          markTimers(p, w, h, smt, gears)
        })
      })
    }

    const p = new p5(Canvas(ref, designSize, buildGears), ref.current);
    return () => p.remove();
  }, []);

  return (
  <div className="gears">
    
    <div ref={ref} className="gearsClip" >
    </div>
  </div>
  );
}