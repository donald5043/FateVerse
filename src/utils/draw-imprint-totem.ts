import type { ChartFingerprint, Point } from '../engines/chart-fingerprint-engine';
import { hashString, mulberry32 } from './seeded-random';

export interface ImprintTotemOptions {
  x: number;
  y: number;
  size: number;
  motif?: CanvasImageSource;
}

const TAU = Math.PI * 2;

function polar(cx: number, cy: number, angle: number, radius: number): Point {
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function strokePath(
  context: CanvasRenderingContext2D,
  draw: () => void,
  color: string,
  width: number,
  alpha: number,
  blur: number,
) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  context.strokeStyle = color;
  context.lineWidth = width * 2.4;
  context.globalAlpha = alpha * 0.34;
  context.shadowColor = color;
  context.shadowBlur = blur;
  draw();
  context.stroke();
  context.restore();

  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.globalAlpha = alpha;
  draw();
  context.stroke();
  context.restore();
}

function smoothClosedPath(context: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 3) return;
  const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const firstMidpoint = midpoint(points[points.length - 1], points[0]);

  context.beginPath();
  context.moveTo(firstMidpoint.x, firstMidpoint.y);
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const nextMidpoint = midpoint(point, next);
    context.quadraticCurveTo(point.x, point.y, nextMidpoint.x, nextMidpoint.y);
  });
  context.closePath();
}

function drawMaterialMotif(
  context: CanvasRenderingContext2D,
  motif: CanvasImageSource,
  cx: number,
  cy: number,
  size: number,
  random: () => number,
) {
  context.save();
  context.translate(cx, cy);
  context.rotate((random() - 0.5) * 0.34);
  const scale = 1.02 + random() * 0.12;
  context.scale(scale, scale);
  context.globalCompositeOperation = 'screen';
  context.globalAlpha = 0.3;
  context.filter = 'saturate(.9) brightness(1.08)';
  context.drawImage(motif, -size / 2, -size / 2, size, size);
  context.restore();
}

function drawHalo(context: CanvasRenderingContext2D, fingerprint: ChartFingerprint, cx: number, cy: number, size: number) {
  const halo = context.createRadialGradient(cx, cy, size * 0.02, cx, cy, size * 0.36);
  halo.addColorStop(0, `${fingerprint.coreColor}72`);
  halo.addColorStop(0.38, `${fingerprint.coreColor}24`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');

  context.save();
  context.globalCompositeOperation = 'lighter';
  context.fillStyle = halo;
  context.fillRect(cx - size * 0.4, cy - size * 0.4, size * 0.8, size * 0.8);
  context.restore();
}

function drawEngravedBands(
  context: CanvasRenderingContext2D,
  fingerprint: ChartFingerprint,
  cx: number,
  cy: number,
  size: number,
  random: () => number,
) {
  const sourceScale = size / fingerprint.size;

  fingerprint.rings.forEach((ring, ringIndex) => {
    const radius = ring.radius * sourceScale;
    const segmentCount = 4 + ringIndex;
    const phase = random() * TAU;

    for (let segment = 0; segment < segmentCount; segment += 1) {
      if ((segment + ringIndex) % 3 === 1 && random() < 0.55) continue;
      const start = phase + (segment / segmentCount) * TAU;
      const span = (TAU / segmentCount) * (0.48 + random() * 0.28);
      const end = start + span;
      const startPoint = polar(cx, cy, start, radius + (random() - 0.5) * size * 0.018);
      const endPoint = polar(cx, cy, end, radius + (random() - 0.5) * size * 0.018);
      const controlAngle = start + span * 0.5;
      const controlPoint = polar(
        cx,
        cy,
        controlAngle,
        radius + (random() - 0.5) * size * 0.055,
      );

      const drawBand = () => {
        context.beginPath();
        context.moveTo(startPoint.x, startPoint.y);
        context.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
      };
      strokePath(context, drawBand, ring.color, Math.max(0.8, ring.width * sourceScale * 0.72), 0.58, size * 0.025);

      const echoRadius = radius + size * (0.008 + random() * 0.008);
      const echoStart = polar(cx, cy, start, echoRadius);
      const echoEnd = polar(cx, cy, end, echoRadius);
      const echoControl = polar(cx, cy, controlAngle, echoRadius + (random() - 0.5) * size * 0.025);
      context.save();
      context.globalAlpha = 0.18;
      context.strokeStyle = '#ead9ad';
      context.lineWidth = Math.max(0.45, sourceScale * 0.42);
      context.beginPath();
      context.moveTo(echoStart.x, echoStart.y);
      context.quadraticCurveTo(echoControl.x, echoControl.y, echoEnd.x, echoEnd.y);
      context.stroke();
      context.restore();
    }
  });
}

function drawLivingThreads(
  context: CanvasRenderingContext2D,
  fingerprint: ChartFingerprint,
  x: number,
  y: number,
  size: number,
  random: () => number,
) {
  const sourceScale = size / fingerprint.size;
  const cx = x + size / 2;
  const cy = y + size / 2;

  fingerprint.spokes.forEach((spoke, index) => {
    const start = { x: x + spoke.x1 * sourceScale, y: y + spoke.y1 * sourceScale };
    const end = { x: x + spoke.x2 * sourceScale, y: y + spoke.y2 * sourceScale };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / length, y: dx / length };
    const bend = (random() - 0.5) * size * 0.16;
    const control1 = {
      x: start.x + dx * 0.34 + normal.x * bend,
      y: start.y + dy * 0.34 + normal.y * bend,
    };
    const control2 = {
      x: start.x + dx * 0.7 - normal.x * bend * 0.55,
      y: start.y + dy * 0.7 - normal.y * bend * 0.55,
    };

    const fade = context.createLinearGradient(start.x, start.y, end.x, end.y);
    fade.addColorStop(0, `${spoke.color}d9`);
    fade.addColorStop(0.62, `${spoke.color}70`);
    fade.addColorStop(1, 'rgba(0,0,0,0)');

    context.save();
    context.globalCompositeOperation = 'lighter';
    context.strokeStyle = fade;
    context.lineWidth = Math.max(0.65, spoke.width * sourceScale * 0.75);
    context.globalAlpha = 0.5;
    context.shadowColor = spoke.color;
    context.shadowBlur = size * 0.018;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, end.x, end.y);
    context.stroke();
    context.restore();

    if (index % 3 === 0) {
      const bud = polar(cx, cy, Math.atan2(end.y - cy, end.x - cx) + 0.045, Math.hypot(end.x - cx, end.y - cy) * 0.92);
      context.save();
      context.translate(bud.x, bud.y);
      context.rotate(Math.atan2(dy, dx));
      context.fillStyle = spoke.color;
      context.globalAlpha = 0.46;
      context.beginPath();
      context.ellipse(0, 0, size * 0.012, size * 0.005, 0, 0, TAU);
      context.fill();
      context.restore();
    }
  });
}

function drawElementSeal(
  context: CanvasRenderingContext2D,
  fingerprint: ChartFingerprint,
  x: number,
  y: number,
  size: number,
) {
  const sourceCenter = fingerprint.size / 2;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const sourceMaxRadius = Math.max(
    ...fingerprint.corePolygon.map((point) => Math.hypot(point.x - sourceCenter, point.y - sourceCenter)),
    1,
  );

  const outerPoints = fingerprint.corePolygon.map((point, index) => {
    const sourceRadius = Math.hypot(point.x - sourceCenter, point.y - sourceCenter);
    const ratio = sourceRadius / sourceMaxRadius;
    const angle = -Math.PI / 2 + (index / fingerprint.corePolygon.length) * TAU;
    return polar(cx, cy, angle, size * (0.16 + ratio * 0.095));
  });
  const innerPoints = outerPoints.map((point, index) => {
    const next = outerPoints[(index + 1) % outerPoints.length];
    const angle = Math.atan2((point.y + next.y) / 2 - cy, (point.x + next.x) / 2 - cx);
    return polar(cx, cy, angle, size * 0.105);
  });
  const sealPoints = outerPoints.flatMap((point, index) => [point, innerPoints[index]]);

  const fill = context.createRadialGradient(cx, cy, size * 0.015, cx, cy, size * 0.27);
  fill.addColorStop(0, `${fingerprint.coreColor}b8`);
  fill.addColorStop(0.46, `${fingerprint.coreColor}48`);
  fill.addColorStop(1, `${fingerprint.coreColor}0a`);

  context.save();
  smoothClosedPath(context, sealPoints);
  context.fillStyle = fill;
  context.globalCompositeOperation = 'lighter';
  context.shadowColor = fingerprint.coreColor;
  context.shadowBlur = size * 0.075;
  context.fill();
  context.restore();

  for (let contour = 0; contour < 3; contour += 1) {
    const factor = 1 - contour * 0.12;
    const contourPoints = sealPoints.map((point) => ({
      x: cx + (point.x - cx) * factor,
      y: cy + (point.y - cy) * factor,
    }));
    strokePath(
      context,
      () => smoothClosedPath(context, contourPoints),
      contour === 0 ? fingerprint.coreColor : '#ead9ad',
      Math.max(0.7, size * (contour === 0 ? 0.0042 : 0.0015)),
      contour === 0 ? 0.88 : 0.34,
      size * 0.045,
    );
  }

  context.save();
  context.translate(cx, cy);
  context.strokeStyle = '#f6e8bd';
  context.globalAlpha = 0.55;
  context.lineWidth = Math.max(0.6, size * 0.0018);
  for (let index = 0; index < 5; index += 1) {
    context.rotate(TAU / 5);
    context.beginPath();
    context.moveTo(0, size * 0.026);
    context.quadraticCurveTo(size * 0.025, size * 0.075, 0, size * 0.13);
    context.stroke();
  }
  context.restore();
}

function drawStarGems(
  context: CanvasRenderingContext2D,
  fingerprint: ChartFingerprint,
  x: number,
  y: number,
  size: number,
) {
  const sourceScale = size / fingerprint.size;

  fingerprint.nodes.forEach((node, index) => {
    const nx = x + node.x * sourceScale;
    const ny = y + node.y * sourceScale;
    const radius = Math.max(size * 0.008, node.size * sourceScale * 0.72);
    const gradient = context.createRadialGradient(nx, ny, 0, nx, ny, radius * 3.6);
    gradient.addColorStop(0, '#fff9e8');
    gradient.addColorStop(0.2, node.color);
    gradient.addColorStop(0.52, `${node.color}58`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    context.save();
    context.globalCompositeOperation = 'lighter';
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(nx, ny, radius * 3.6, 0, TAU);
    context.fill();
    context.restore();

    context.save();
    context.translate(nx, ny);
    context.rotate((index * 0.73) % TAU);
    context.fillStyle = '#fff9e8';
    context.globalAlpha = 0.9;
    context.beginPath();
    for (let point = 0; point < 8; point += 1) {
      const angle = (point / 8) * TAU - Math.PI / 2;
      const pointRadius = point % 2 === 0 ? radius * 1.35 : radius * 0.32;
      const px = Math.cos(angle) * pointRadius;
      const py = Math.sin(angle) * pointRadius;
      if (point === 0) context.moveTo(px, py); else context.lineTo(px, py);
    }
    context.closePath();
    context.fill();
    context.restore();
  });
}

export function drawHexagramSeal(
  context: CanvasRenderingContext2D,
  binaryCode: string,
  x: number,
  y: number,
  width: number,
) {
  const bits = [...binaryCode].reverse();
  const lineGap = width * 0.052;

  context.save();
  context.strokeStyle = '#d8b875';
  context.lineCap = 'round';
  context.globalAlpha = 0.78;
  context.lineWidth = Math.max(1, width * 0.014);
  bits.forEach((bit, index) => {
    const lineY = y - index * lineGap;
    context.beginPath();
    if (bit === '1') {
      context.moveTo(x - width / 2, lineY);
      context.lineTo(x + width / 2, lineY);
    } else {
      context.moveTo(x - width / 2, lineY);
      context.lineTo(x - width * 0.08, lineY);
      context.moveTo(x + width * 0.08, lineY);
      context.lineTo(x + width / 2, lineY);
    }
    context.stroke();
  });
  context.restore();
}

/**
 * 以命盤資料組成有機的五行印記。AI 圖片只提供材質；位置、曲線、節點、
 * 五行比例與六爻都由 fingerprint 決定，因此同一份命盤永遠得到同一張圖。
 */
export function drawImprintTotem(
  context: CanvasRenderingContext2D,
  fingerprint: ChartFingerprint,
  options: ImprintTotemOptions,
) {
  const { x, y, size, motif } = options;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const random = mulberry32(hashString(`${fingerprint.seed}:organic-imprint-v2`));

  context.save();
  context.beginPath();
  context.rect(x, y, size, size);
  context.clip();

  if (motif) drawMaterialMotif(context, motif, cx, cy, size, random);
  drawHalo(context, fingerprint, cx, cy, size);
  drawEngravedBands(context, fingerprint, cx, cy, size, random);
  drawLivingThreads(context, fingerprint, x, y, size, random);
  drawElementSeal(context, fingerprint, x, y, size);
  drawStarGems(context, fingerprint, x, y, size);
  drawHexagramSeal(context, fingerprint.binaryCode, cx, y + size * 0.91, size * 0.12);

  context.restore();
}
