import { CSSProperties, useState } from "react";
import "./App.css";
const modules = import.meta.glob<boolean, string, { default: string }>(
  "./loong/*/眼睛位置.png"
);

function getAreaPos(url: string) {
  return new Promise<Record<string, number>>((resolve, reject) => {
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    const image = document.createElement("img");
    image.src = url;
    image.onload = (result) => {
      const width = (result.target as HTMLImageElement).width;
      const height = (result.target as HTMLImageElement).height;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(image, 0, 0);
      const areaArr: { x: number; y: number }[] = [];
      const rgba = ctx.getImageData(0, 0, width, height).data;
      for (let i = 0, l = rgba.length; i < l; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);
        if (rgba[i] === 255 && rgba[i + 1] === 255 && rgba[i + 2] === 255) {
          areaArr.push({ x, y });
        }
      }
      const firstPoint = areaArr[0];
      const lastPoint = areaArr[areaArr.length - 1];
      resolve({
        x: firstPoint.x / width,
        y: firstPoint.y / height,
        w: (lastPoint.x - firstPoint.x + 1)/ width,
        h: (lastPoint.y - firstPoint.y + 1) / height,
      });
    };
    image.onerror = reject;
  })
}

const pathKeys = Object.keys(modules);
pathKeys.map(async (pathKey) => {
  const urlObj = await modules[pathKey]();
  const result = await getAreaPos(urlObj.default).catch(() => ({}));
  const loongEyeMap = {
    [urlObj.default]: result,
  }
  console.log('loongEyeMap', loongEyeMap);
});

function App() {
  const [style, ] = useState<CSSProperties>({});

  return (
    <>
      <div id="canvas-wrap" style={{ position: "relative" }}>
        <canvas id="canvas" />
        <div
          style={{
            position: "absolute",
            background: `rgba(0, 0, 0, 0.5)`,
            opacity: 0.3,
            ...style,
          }}
        />
      </div>
    </>
  );
}

export default App;
