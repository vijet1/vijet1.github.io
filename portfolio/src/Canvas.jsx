import { useState } from 'react'
import { useEffect, useRef } from "react"
import p5 from "p5"
import './index.css'

function pointOnCircle(radians, r){
  return [Math.cos(radians) * r, Math.sin(radians) * r];
}
function getAngleDistForPointDist(pointDist, r){
  return pointDist / r;
}

let stepBegin = Date.now();

export class Gear {
  constructor(p, x, y, turn, angle, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.turnRate = turn;
    this.angle = angle;
    this.color = color;
    this.scale = 1;
  }

  clone(x=this.x, y=this.y, turn=this.turnRate, angle=this.angle){
    let cl = Object.assign(new Gear(), { ...this });
    cl.x = x; cl.y = y;
    cl.turnRate = turn;
    cl.angle = angle;
    return cl;
  }

  getNumTeeth(){
    const spacing = this.teethWidth + this.teethsPinch;
    const numTeeth = Math.floor(this.teethSolidRadius * this.p.TWO_PI / spacing);
    return numTeeth;
  }
  teethJoint(og){
    return (this.teethRadius - this.teethSolidRadius + og.teethRadius - og.teethSolidRadius)/2
  }
  jointRadius(og){
    return this.teethRadius + og.teethRadius - this.teethJoint(og);
  }
  dist(og){
    return Math.sqrt(Math.pow(og.x - this.x, 2) + Math.pow(og.y - this.y, 2))
  }
  axle(partner) {
    this._axlePartner = partner;
    return this;
  }

  makeValid(gears){
    let hit = false;
    for (let i = 0; i < gears.length; i++){
      let og = gears[i];
      let dist = this.dist(og);
      let r = this.jointRadius(og);
      let tr = this.teethJoint(og);

      let bind = false;

      if (dist < r){
        if (og._axlePartner){
          og = og._axlePartner
          dist = this.dist(og);
          r = this.jointRadius(og);
          tr = this.teethJoint(og);

          if (dist < r){
            return false;
          }else if (dist < r + tr){
            bind = true;
          }else{
            return false;
          }
        }else{
          return false;
        }
      }else if (dist < r + tr){
        bind = true
      }

      if (bind){
        // adjust turnRate, bridge sign, start angle

        let ratio = og.getNumTeeth() / this.getNumTeeth();
        let turn = -og.turnRate * ratio
        
        if (hit == true && this.turnRate !== turn){
          return false;
        }

        this.turnRate = turn;
        this.bridgesCurve = Math.abs(this.bridgesCurve) * Math.sign(-turn);
        hit = true

        let T_og = this.p.TWO_PI / og.getNumTeeth();
        let T_this = this.p.TWO_PI / this.getNumTeeth();
        let contactAngle = Math.atan2(this.y - og.y, this.x - og.x);
        let phaseOg = ((contactAngle - og.angle) % T_og + T_og) % T_og;
        let desiredPhase = (((0.5 - phaseOg / T_og) * T_this) % T_this + T_this) % T_this;
        this.angle = (contactAngle + Math.PI) - desiredPhase;

      }
    }
    
    return true;
  }

  radii(r1, r2, r3, r4){
    //if (Math.abs(r1 - r2) < r1 / 10) r2 = 0;
    this.innerSolidRadius = r1;
    this.bridgesRadius = r1 + r2;
    this.teethSolidRadius = r1 + r2 + r3;
    this.teethRadius = r1 + r2 + r3 + r4;
    this._hasBridgeRing = this.bridgesRadius !== this.innerSolidRadius;
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
    pinchWidth = Math.min(width, pinchWidth);
    if (width - pinchWidth > 10) pinchWidth += 5;
    this.teethWidth = width;
    this.teethsPinch = pinchWidth;
    return this;
  }

  gem(color){
    this.gemColor = color;
    return this;
  }

  /**
   * Draw the gear ONCE into an offscreen p5.Graphics buffer.
   * Every subsequent frame is just one image blit + rotate transform.
   */
  preRender(pg){
    const p = this.p;
    if (!pg){
      const pad = 2;
      const size = Math.ceil(this.teethRadius * 2) + pad * 2;
      const cx = size / 2;

      pg = p.createGraphics(size, size);
      pg.colorMode(p.HSB, 360, 100, 100, 100);
      pg.bezierOrder(2);
      pg.translate(cx, cx);
    }

    pg.fill(this.color);
    pg.noStroke();

    // ── Bridges ────────────────────────────────────────────────────────
    if (this._hasBridgeRing) {
      for (let i = 0; i < this.bridges; i++) {
        const angle = (i / this.bridges) * p.TWO_PI;
        const widthAngle = getAngleDistForPointDist(this.bridgesW1 / 2, this.innerSolidRadius);
        const width2Angle = getAngleDistForPointDist(this.bridgesW2 / 2, this.bridgesRadius);
        const extra = this.bridgesRadius * (1 - Math.cos(width2Angle));
        const R = this.bridgesRadius + extra;

        const [aw1x, aw1y] = pointOnCircle(angle + widthAngle, this.innerSolidRadius);
        const [bw1x, bw1y] = pointOnCircle(angle - widthAngle, this.innerSolidRadius);
        const [aw2x, aw2y] = pointOnCircle(angle + width2Angle - this.bridgesCurve, R);
        const [bw2x, bw2y] = pointOnCircle(angle - width2Angle - this.bridgesCurve, R);
        const [cw2x, cw2y] = pointOnCircle(angle, R);

        pg.beginShape();
        pg.vertex(aw1x, aw1y);
        pg.bezierVertex(cw2x, cw2y);
        pg.bezierVertex(aw2x, aw2y);
        pg.vertex(bw2x, bw2y);
        pg.bezierVertex(cw2x, cw2y);
        pg.bezierVertex(bw1x, bw1y);
        pg.endShape(p.CLOSE);
      }
    }

    // ── Inner solid disc ───────────────────────────────────────────────
    pg.circle(0, 0, this.innerSolidRadius * 2);

    // ── Teeth ──────────────────────────────────────────────────────────
    let numTeeth = this.getNumTeeth();

    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * p.TWO_PI;
      const widthAngle = getAngleDistForPointDist(this.teethWidth  / 2, this.teethSolidRadius);
      const widthAngle2 = getAngleDistForPointDist(this.teethsPinch / 2, this.teethRadius);
      const [aw1x, aw1y] = pointOnCircle(angle + widthAngle,  this.teethSolidRadius);
      const [bw1x, bw1y] = pointOnCircle(angle - widthAngle,  this.teethSolidRadius);
      const [aw2x, aw2y] = pointOnCircle(angle + widthAngle2, this.teethRadius);
      const [bw2x, bw2y] = pointOnCircle(angle - widthAngle2, this.teethRadius);
      pg.quad(aw1x, aw1y, bw1x, bw1y, bw2x, bw2y, aw2x, aw2y);
    }

    // ── Teeth solid ring (stroke) ──────────────────────────────────────
    const teethSolidWeight = this.teethSolidRadius - this.bridgesRadius;
    pg.noFill();
    pg.stroke(this.color);
    pg.strokeWeight(teethSolidWeight + 0.5);
    pg.circle(0, 0, this.teethSolidRadius * 2 - teethSolidWeight);

    if (this._axlePartner){
      this._axlePartner.preRender(pg);
    }

    if (this.gemColor) {
      pg.noStroke();
      pg.fill(this.gemColor);
      pg.circle(0, 0, this.innerSolidRadius / 3);
    }

    this._pg = pg;
    this._pgHalf = pg.width/2;
  }

  /** Hot path: just angle update + one image blit. */
  draw(mult){
    let angle = this.angle + (this.turnRate * mult) * (stepBegin - Date.now())/1000;
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);

    p.scale(p.map(this.scale, 1, 1.5, 1, 0.9));
    if (this.scale > 1.25){
      p.tint(255, p.map(this.scale, 1, 1.5, 100, 90));
      p.rotate(this._lastAngle);
    }else{
      p.rotate(angle);
      this._lastAngle = angle;
    }
    p.image(this._pg, -this._pgHalf, -this._pgHalf);
    p.pop();
  }

  drawText(mult){
    
   

      /* mindpg._TMark = ["MSC", d.getMilliseconds()]
      minmsg._TMark = ["MS", d.getMilliseconds()]
      minsg._TMark = ["S", d.getSeconds()]
      minmg._TMark = ["M", d.getMinutes()]
      minhg._TMark = ["H", d.getHours()] */
    let marker = this._TMark;
    if (marker){
      let d = new Date();
      const p = this.p;
      p.push();
      p.translate(this.x, this.y);
      p.textFont('Georgia');
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();

      let hand = (color, length, width) => {
        p.noStroke();
        p.fill(color)
        p.triangle(0, -width/2, 0, width/2, length, 0)
        p.fill(this.gemColor || p.color(p.hue(this.color), p.saturation(this.color), p.brightness(this.color) * 0.8));
        p.circle(0, 0, width + 2);
      }

      let clock = (angle, addLength, c1, c2, c3, hthick, wt, textn, texti) => {
        p.noFill();
        p.stroke(c2)
        p.strokeWeight(wt)
        p.circle(0,0,(this.teethRadius+addLength/2+wt/2)*2)
        p.strokeWeight(2)
        p.stroke(c1)
        p.circle(0,0,(this.teethRadius+addLength/2+wt+1)*2)

        p.noStroke();
        p.fill(c1)
        for (let i = 1; i <= textn; i++){
          let a = i / textn * p.TWO_PI - p.HALF_PI;
          if (this.turnRate < 0) a = -a;
          let x = Math.cos(a) * (this.teethRadius + addLength/2 + wt/2);
          let y = Math.sin(a) * (this.teethRadius + addLength/2 + wt/2);
          p.text(i * texti, x, y);
        }

        p.rotate(angle)
        hand(c3, this.teethRadius + addLength, hthick)
        p.rotate(-angle)
      }
      
      if (marker[0] == "H"){
        p.textSize(10);
        marker[1] ??= (d.getHours() % 12 * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000 + d.getMilliseconds()) / 43200000 * p.TWO_PI - this._lastAngle;
        let angle = this._lastAngle + marker[1] - p.HALF_PI

        clock(angle, 6, p.color(0), p.color(100), p.color(0), 7, 10, 4, 3)
      }else if (marker[0] == "M"){
        p.textSize(5);
        marker[1] ??= (d.getMinutes() * 60000 + d.getSeconds() * 1000 + d.getMilliseconds()) / 3600000 * p.TWO_PI - this._lastAngle;
        let angle = this._lastAngle + marker[1] - p.HALF_PI

        clock(angle, 6, p.color(0), p.color(100), p.color(0), 3, 10, 4, 15)
      }else if (marker[0] == "S"){
        marker[1] ??= (d.getSeconds() * 1000 + d.getMilliseconds()) / 60000
        let angle = this._lastAngle + marker[1] - p.HALF_PI

        clock(angle, 6, p.color(0), p.color(80), p.color(360, 90, 70), 5, 3, 0, 0)
      }else if (marker[0] == "MS"){
        marker[1] ??= d.getMilliseconds() / 1000
        let angle = this._lastAngle + marker[1] - p.HALF_PI

        clock(angle, 6, p.color(360, 90, 70), p.color(80), p.color(360, 90, 70), 5, 3, 0, 0)
      }

      p.pop()
    }

  }
}


function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let timeout;
    const tick = () => {
      const d = new Date();
      setTime(d);
      timeout = setTimeout(tick, 1000 - d.getMilliseconds() % 1000);
    };
    tick();
    return () => clearTimeout(timeout);
  }, []);

  const [hhmm, ampm] = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(" ");
  return <>
    <span className="TFont1">{hhmm}</span>
    <span className="TFont1">{ampm ?? time.toLocaleTimeString().split(" ")[1]}</span>
  </>;
}

export default function Canvas(ref, designSize, buildGears){
  return function(p){
    let gears;
    let mult = 1;

    p.setup = () => {
      const { offsetWidth, offsetHeight } = ref.current;
      console.log(offsetWidth, offsetHeight)
      const s  = Math.min(offsetWidth, offsetHeight) / designSize;
      p.createCanvas(offsetWidth, offsetHeight);
      p.colorMode(p.HSB, 360, 100, 100, 100);
      console.log(s)
      gears = buildGears(p, offsetWidth/s, offsetHeight/s);
      for (let i = 0; i < gears.length; i++){
        gears[i].preRender();
      }
    }

    p.draw = () => {
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
        const dist = Math.sqrt((mx - g.x) ** 2 + (my - g.y) ** 2);
        const hovered = dist - 15 < g.teethRadius;
        gears[i].scale = hovered ? p.lerp(gears[i].scale, 1.5, 0.2) : p.lerp(gears[i].scale, 1, 0.05);

        gears[i].draw(mult);
      }

      for (let i = 0; i < gears.length; i++) {
        let g = gears[i]
        gears[i].drawText(mult);
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