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
  return pointDist / r;
}

const METAL_PRESETS = [
  (p) => [p.random(360),   p.random(0, 15),   p.random(60, 80)],
  (p) => [p.random(35, 50),  p.random(50, 70),  p.random(70, 80)],
  (p) => [p.random(15, 25),  p.random(60, 80),  p.random(60, 70)],
  (p) => [p.random(20, 35),  p.random(40, 60),  p.random(50, 60)],
];
const GEM_PRESETS = [
  (p) => [p.random(340, 360), p.random(90, 100), p.random(50, 80)],
  (p) => [p.random(130, 150), p.random(85, 100), p.random(40, 70)],
  (p) => [p.random(210, 240), p.random(85, 100), p.random(50, 80)],
  (p) => [p.random(270, 290), p.random(80, 100), p.random(50, 75)],
  (p) => [p.random(40, 55),   p.random(85, 100), p.random(80, 100)],
  (p) => [p.random(170, 190), p.random(70, 90),  p.random(70, 90)],
  (p) => [p.random(280, 310), p.random(60, 80),  p.random(50, 80)],
  (p) => [p.random(350, 10),  p.random(50, 70),  p.random(80, 100)],
];

function randomMetallicColor(p) {
  return METAL_PRESETS[Math.floor(p.random(METAL_PRESETS.length))](p);
}
function randomGemstoneColor(p) {
  return GEM_PRESETS[Math.floor(p.random(GEM_PRESETS.length))](p);
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
    if (Math.abs(r1 - r2) < r1 / 10) r2 = 0;
    this.innerSolidRadius  = r1;
    this.bridgesRadius     = r1 + r2;
    this.teethSolidRadius  = r1 + r2 + r3;
    this.teethRadius       = r1 + r2 + r3 + r4;
    this._hasBridgeRing    = this.bridgesRadius !== this.innerSolidRadius;
    return this;
  }

  bridge(num, curve, w1, w2){
    this.bridges       = Math.floor(num);
    this.bridgesCurve  = curve;
    this.bridgesW1     = w1;
    this.bridgesW2     = w2;
    return this;
  }

  teeth(width, pinchWidth){
    pinchWidth = Math.min(width, pinchWidth);
    if (width - pinchWidth > 10) pinchWidth += 5;
    this.teethWidth  = width;
    this.teethsPinch = pinchWidth;
    return this;
  }

  /**
   * Draw the gear ONCE into an offscreen p5.Graphics buffer.
   * Every subsequent frame is just one image blit + rotate transform.
   */
  preRender(){
    const p    = this.p;
    const pad  = 2;
    const size = Math.ceil(this.teethRadius * 2) + pad * 2;
    const cx   = size / 2;

    const pg = p.createGraphics(size, size);
    pg.colorMode(p.HSB, 360, 100, 100, 100);
    pg.bezierOrder(2);
    pg.fill(this.color);
    pg.noStroke();
    pg.translate(cx, cx);

    // ── Bridges ────────────────────────────────────────────────────────
    if (this._hasBridgeRing) {
      const TWO_PI = Math.PI * 2;
      for (let i = 0; i < this.bridges; i++) {
        const angle       = (i / this.bridges) * TWO_PI;
        const widthAngle  = getAngleDistForPointDist(this.bridgesW1 / 2, this.innerSolidRadius);
        const width2Angle = getAngleDistForPointDist(this.bridgesW2 / 2, this.bridgesRadius);
        const extra       = this.bridgesRadius * (1 - Math.cos(width2Angle));
        const R           = this.bridgesRadius + extra;

        const [aw1x, aw1y] = pointOnCircle(angle + widthAngle,                      this.innerSolidRadius);
        const [bw1x, bw1y] = pointOnCircle(angle - widthAngle,                      this.innerSolidRadius);
        const [aw2x, aw2y] = pointOnCircle(angle + width2Angle - this.bridgesCurve, R);
        const [bw2x, bw2y] = pointOnCircle(angle - width2Angle - this.bridgesCurve, R);
        const [cw2x, cw2y] = pointOnCircle(angle,                                   R);

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
    const TWO_PI   = Math.PI * 2;
    const spacing  = this.teethWidth + this.teethsPinch;
    const numTeeth = Math.floor(this.teethSolidRadius * TWO_PI / spacing);

    for (let i = 0; i < numTeeth; i++) {
      const angle       = (i / numTeeth) * TWO_PI;
      const widthAngle  = getAngleDistForPointDist(this.teethWidth  / 2, this.teethSolidRadius);
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
    pg.strokeWeight(teethSolidWeight + 2);
    pg.circle(0, 0, this.teethSolidRadius * 2 - teethSolidWeight - 1);

    // ── Gem ────────────────────────────────────────────────────────────
    if (this.Gem) {
      pg.noStroke();
      pg.fill(this.Gem);
      pg.circle(0, 0, this.innerSolidRadius / 5);
    }

    this._pg     = pg;
    this._pgHalf = cx;
  }

  /** Hot path: just angle update + one image blit. */
  draw(deltaTime){
    this.angle += this.turnRate * deltaTime;
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.image(this._pg, -this._pgHalf, -this._pgHalf);
    p.pop();
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


function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    const sketch = (p) => {
      const gears = [[], [], []];

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.HSB, 360, 100, 100, 100);

        const scale = Math.min(p.width, p.height) / 600;
        const halfW = (p.width  / 2) / scale;
        const halfH = (p.height / 2) / scale;

        for (let i = 0; i < 60; i++) {
          let lvl = Math.floor(p.random(1, 10));
          let div;
          if      (lvl <= 5) { lvl = 0; div = 1; }
          else if (lvl <= 8) { lvl = 1; div = 3; }
          else               { lvl = 2; div = 7; }

          const mColor = randomMetallicColor(p);
          mColor[2] /= div;
          let turnRate = p.random(0.1, 1);
          if (p.random() < 0.5){
            turnRate *= -1
          }

          const idx  = gears[lvl].length;
          const gear = new Gear(p, p.random(-halfW, halfW), p.random(-halfH, halfH), turnRate, 0, p.color(...mColor))
            .radii(p.random(2, 40), p.random(10, 30), p.random(2, 7), p.random(2, 8))
            .bridge(p.random(3, 9), p.random(-0.4, 0.4), p.random(3, 14), p.random(2, 10))
            .teeth(p.random(3, 20), p.random(0.01, 10));

          if (Math.round(p.random()) === 1) {
            const gColor = randomGemstoneColor(p);
            gColor[2] /= div;
            gear.Gem = p.color(...gColor);
          }

          gear.preRender();
          gears[lvl][idx] = gear;
        }
      };

      p.draw = () => {
        p.clear();
        p.push();
        p.translate(p.width / 2, p.height / 2);
        p.scale(Math.min(p.width, p.height) / 600);

        const dt = p.deltaTime / 1000;
        for (let lvl = gears.length - 1; lvl >= 0; lvl--) {
          for (const gear of gears[lvl]) {
            gear.draw(dt);
          }
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
      <div ref={containerRef} style={{ background: "transparent" }} />
    </>
  );
}

export default App;