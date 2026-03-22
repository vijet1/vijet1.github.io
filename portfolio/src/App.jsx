import { useState } from 'react'
import { useEffect, useRef } from "react"
import p5 from "p5"
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
setTabHeader("/rose.png", "Ultra-Clock");

function pointOnCircle(radians, r){
  return [Math.cos(radians) * r, Math.sin(radians) * r];
}
function getAngleDistForPointDist(pointDist, r){
  return pointDist / r
}


class Gear {
  constructor(p, x, y, turn, angle, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.turnRate = turn;
    this.angle = angle;
    
    this.color = color;
  }
  radii(r1, r2, r3, r4){
    if (Math.abs(r1 - r2) < r1 / 10){
      r2 = 0
    }

    this.innerSolidRadius = r1;
    this.bridgesRadius = r1 + r2;
    this.teethSolidRadius = r1 + r2 + r3;
    this.teethRadius = r1 + r2 + r3 + r4;
    return this;
  }
  bridge(num, curve, w1, w2){
    this.bridges = Math.floor(num);
    this.bridgesCurve = curve;
    this.bridgesW1 = w1;
    this.bridgesW2 = w2;
    return this;
  }
  teeth(width, pinchWidth){
    pinchWidth = Math.min(width, pinchWidth)
    if (width - pinchWidth > 10){
      pinchWidth += 5
    }

    this.teethWidth = width;
    this.teethsPinch = pinchWidth;
    return this;
  }

  draw(deltaTime) {
    this.angle += this.turnRate * deltaTime;
    let p = this.p;
    p.push();
    p.fill(this.color)
    p.noStroke()
    p.translate(this.x, this.y);
    p.rotate(this.angle);

    p.bezierOrder(2);

    if (this.bridgesRadius != this.innerSolidRadius){
      for (let i = 0; i < this.bridges; i ++){
        let angle = (i / this.bridges) * p.TWO_PI;
        let widthAngle = getAngleDistForPointDist(this.bridgesW1/2, this.innerSolidRadius);
        let width2Angle = getAngleDistForPointDist(this.bridgesW2/2, this.bridgesRadius);
        let [aw1x, aw1y] = pointOnCircle(angle + widthAngle, this.innerSolidRadius);
        let [bw1x, bw1y] = pointOnCircle(angle - widthAngle, this.innerSolidRadius);
        let extra = this.bridgesRadius * (1 - Math.cos(width2Angle));
        let [aw2x, aw2y] = pointOnCircle(angle + width2Angle - this.bridgesCurve, this.bridgesRadius + extra);
        let [bw2x, bw2y] = pointOnCircle(angle - width2Angle - this.bridgesCurve, this.bridgesRadius + extra);
        let [cw2x, cw2y] = pointOnCircle(angle, this.bridgesRadius + extra);
        p.beginShape();

        p.vertex(aw1x, aw1y);
        p.bezierVertex(cw2x, cw2y);
        p.bezierVertex(aw2x, aw2y);
        p.vertex(bw2x, bw2y);
        p.bezierVertex(cw2x, cw2y);
        p.bezierVertex(bw1x, bw1y);

        p.endShape(p.CLOSE);
      }
    }

    p.circle(0, 0, this.innerSolidRadius * 2)

    let spacing = this.teethWidth + this.teethsPinch
    let numTeeth = Math.floor(this.teethSolidRadius * p.TWO_PI / spacing)

    for (let i = 0; i < numTeeth; i ++){
      let angle = (i / numTeeth) * p.TWO_PI;
      let widthAngle = getAngleDistForPointDist(this.teethWidth/2, this.teethSolidRadius);
      let widthAngle2 = getAngleDistForPointDist(this.teethsPinch/2, this.teethRadius);
      let [aw1x, aw1y] = pointOnCircle(angle + widthAngle, this.teethSolidRadius);
      let [bw1x, bw1y] = pointOnCircle(angle - widthAngle, this.teethSolidRadius);
      let [aw2x, aw2y] = pointOnCircle(angle + widthAngle2, this.teethRadius);
      let [bw2x, bw2y] = pointOnCircle(angle - widthAngle2, this.teethRadius);

      p.quad(aw1x, aw1y, bw1x, bw1y, bw2x, bw2y, aw2x, aw2y)
    }

    p.noFill();
    p.stroke(this.color)
    let teethSolidWeight = this.teethSolidRadius - this.bridgesRadius
    p.strokeWeight(teethSolidWeight + 2)
    p.circle(0, 0, this.teethSolidRadius * 2 - teethSolidWeight - 1)

    p.rotate(-this.angle)

    let r = this.teethRadius;

    p.noStroke();
    if (this.Gem){
      p.fill(this.Gem)
      p.circle(0,0, this.innerSolidRadius / 5)
    }

    p.pop()
  }
}

function randomMetallicColor(p) {
  const metals = [
    () => [p.random(360), p.random(0, 15),  p.random(60, 80)],   // silver/gunmetal
    () => [p.random(35, 50), p.random(50, 70), p.random(70, 80)], // gold
    () => [p.random(15, 25), p.random(60, 80), p.random(60, 70)], // copper
    () => [p.random(20, 35), p.random(40, 60), p.random(50, 60)], // bronze
  ];
  return p.random(metals)();
}

function randomGemstoneColor(p) {
  const gems = [
    () => [p.random(340, 360), p.random(90, 100), p.random(50, 80)],  // ruby
    () => [p.random(130, 150), p.random(85, 100), p.random(40, 70)],  // emerald
    () => [p.random(210, 240), p.random(85, 100), p.random(50, 80)],  // sapphire
    () => [p.random(270, 290), p.random(80, 100), p.random(50, 75)],  // amethyst
    () => [p.random(40, 55),   p.random(85, 100), p.random(80, 100)], // topaz
    () => [p.random(170, 190), p.random(70, 90),  p.random(70, 90)],  // aquamarine
    () => [p.random(280, 310), p.random(60, 80),  p.random(50, 80)],  // tanzanite
    () => [p.random(350, 10),  p.random(50, 70),  p.random(80, 100)], // rose quartz
  ];
  return p.random(gems)();
}

function Clock() {
  const [time, setTime] = useState(new Date());
  const ref = useRef(null)

  useEffect(() => {
    let timeout;
    const tick = () => {
      let d = new Date()
      setTime(d);
      timeout = setTimeout(tick, 1000 - d.getMilliseconds() % 1000);
    };
    tick();
    return () => clearTimeout(timeout);
  }, []);

  return <>
    <span className="TFont1">{time.toLocaleTimeString().split(" ")[0]}</span>
    <span className="TFont1">{time.toLocaleTimeString().split(" ")[1]}</span>
  </>;
}


function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    const sketch = (p) => {
      const gears = [];
      
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.HSB, 360, 100, 100, 100);

        const scale = Math.min(p.width, p.height) / 600; // same scale used in draw
        const halfW = (p.width / 2) / scale;
        const halfH = (p.height / 2) / scale;

        for (let i = 0; i < 50; i++){
          gears[i] = new Gear(p, p.random(-halfW, halfW), p.random(-halfH, halfH), p.random(-1, 1), 0, p.color(...randomMetallicColor(p)))
            .radii(p.random(2, 40), p.random(10,30), p.random(2, 7), p.random(2, 8))
            .bridge(p.random(3, 9), p.random(-0.4, 0.4), p.random(3, 14), p.random(2, 10))
            .teeth(p.random(3, 20), p.random(0.01, 10));

          if (Math.round(p.random()) == 1){
            gears[i].Gem = p.color(...randomGemstoneColor(p))
          }
        }
      };

      let date = new Date();

      p.draw = () => {
        p.clear();
        p.push();
        p.translate(p.width / 2, p.height / 2);
        p.scale(Math.min(p.width, p.height) / 600);

        let dt = p.deltaTime / 1000

        for (let i = 0; i < gears.length; i++){
          gears[i].bridge
          gears[i].draw(dt)
        }
        
        p.pop();
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    const p5Instance = new p5(sketch, containerRef.current);
    return () => p5Instance.remove();
  }, []);

  return (
    <>
      <div className='TIME'>
        <Clock />
      </div>
      <div ref={containerRef} style={{background: "transparent"}} />
    </>
  );
}

export default App
