export type ImageMode = 'original' | 'grayscale' | 'contrast' | 'binary';

export interface PreparedImage {
  canvas: HTMLCanvasElement;
  objectUrl: string;
  width: number;
  height: number;
}

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 1800;

function canvasToObjectUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('無法建立處理後的圖片。')), 'image/jpeg', 0.88));
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('不支援此圖片格式。請選擇 JPG、PNG 或 WebP。');
  if (file.size > MAX_FILE_BYTES) throw new Error('圖片超過 15 MB，請先縮小檔案後再上傳。');
  const source: ImageBitmap | HTMLImageElement = 'createImageBitmap' in window
    ? await createImageBitmap(file)
    : await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);
        image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('瀏覽器無法解碼這張圖片。')); };
        image.src = url;
      });
  const sourceWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sourceHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('瀏覽器無法啟用圖片處理功能。');
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ('close' in source) source.close();
  return { canvas, objectUrl: await canvasToObjectUrl(canvas), width: canvas.width, height: canvas.height };
}

export async function applyImageMode(source: HTMLCanvasElement, mode: ImageMode): Promise<PreparedImage> {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('瀏覽器無法啟用圖片處理功能。');
  context.drawImage(source, 0, 0);
  if (mode !== 'original') {
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const gray = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
      const next = mode === 'binary' ? (gray > 150 ? 255 : 0) : mode === 'contrast' ? Math.max(0, Math.min(255, (gray - 128) * 1.8 + 128)) : gray;
      image.data[index] = image.data[index + 1] = image.data[index + 2] = next;
    }
    context.putImageData(image, 0, 0);
  }
  return { canvas, objectUrl: await canvasToObjectUrl(canvas), width: canvas.width, height: canvas.height };
}

export async function rotateCanvas(source: HTMLCanvasElement): Promise<PreparedImage> {
  const canvas = document.createElement('canvas');
  canvas.width = source.height;
  canvas.height = source.width;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('瀏覽器無法旋轉圖片。');
  context.translate(canvas.width, 0);
  context.rotate(Math.PI / 2);
  context.drawImage(source, 0, 0);
  return { canvas, objectUrl: await canvasToObjectUrl(canvas), width: canvas.width, height: canvas.height };
}

export async function centerCropCanvas(source: HTMLCanvasElement): Promise<PreparedImage> {
  const marginX = Math.round(source.width * 0.05);
  const marginY = Math.round(source.height * 0.05);
  const canvas = document.createElement('canvas');
  canvas.width = source.width - marginX * 2;
  canvas.height = source.height - marginY * 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('瀏覽器無法裁切圖片。');
  context.drawImage(source, marginX, marginY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return { canvas, objectUrl: await canvasToObjectUrl(canvas), width: canvas.width, height: canvas.height };
}
