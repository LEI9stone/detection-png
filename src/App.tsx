/* eslint-disable @typescript-eslint/no-explicit-any */
import { CSSProperties, useState } from "react";
import { uploadImageAuto, UploadScene } from "./upload";
import "./App.css";
// import tongyong from "./通用龙.json";
const modules = import.meta.glob<boolean, string, { default: string }>(
  "./loong/*/*/yj.png"
);
const modules_1 = import.meta.glob<boolean, string, { default: string }>(
  "./loong/*/*/彩-有眼.png"
);
const modules_2 = import.meta.glob<boolean, string, { default: string }>(
  "./loong/*/*/灰-无眼.png"
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
        if (rgba[i] !== 0 && rgba[i + 1] !== 0 && rgba[i + 2] !== 0) {
          areaArr.push({ x, y });
        }
      }
      const firstPoint = areaArr[0];
      const lastPoint = areaArr[areaArr.length - 1];
      if (!firstPoint || !lastPoint) {
        reject({
          firstPoint,
          lastPoint,
          width,
          height,
          areaArr,
          rgba: [rgba[0], rgba[1], rgba[2], rgba[3]],
        });
        return;
      }
      resolve({
        x: firstPoint.x / width,
        y: firstPoint.y / height,
        w: (lastPoint.x - firstPoint.x + 1) / width,
        h: (lastPoint.y - firstPoint.y + 1) / height,
      });
    };
    image.onerror = reject;
  });
}

function getImgBlob(url: string) {
  return new Promise<Blob>((resolve) => {
    fetch(url).then((res) => {
      res.blob().then((blob) => {
        resolve(blob);
      });
    });
  });
}

async function init() {
  const pathKeys = Object.keys(modules);
  const errMap: Record<string, any> = {};
  const eyeBlob = await initLoongBlob(modules_1);
  const grayBlob = await initLoongBlob(modules_2);
  const arr_财富龙: any[] = [];
  const arr_安康龙: any[] = [];
  const arr_事业龙: any[] = [];
  const arr_通用龙: any[] = [];
  const arr_学业龙: any[] = [];
  const arr_姻缘龙: any[] = [];

  // console.log("eyeBlob", eyeBlob, grayBlob);
  Promise.all(
    pathKeys.map(async (pathKey) => {
      const urlObj = await modules[pathKey]();
      const result = await getAreaPos(urlObj.default).catch((err) => {
        errMap[urlObj.default] = err;
        return null;
      });
      if (result) {
        const areaUrl = urlObj.default.split("?")[0];
        const dir = areaUrl.replace(/yj.png/, '');
        const data = {
          "idx": dir,
          "area": result,
          "gray": {
            "width": 3000,
            "height": 3000,
            "url": grayBlob[`${dir}灰-无眼.png`],
          },
          "eye": {
            "width": 3000,
            "height": 3000,
            "url": eyeBlob[`${dir}彩-有眼.png`],
          }
        }
        if (dir.includes('财富龙')) {
          arr_财富龙.push(data)
        }
        if (dir.includes('安康龙')) {
          arr_安康龙.push(data)
        }
        if (dir.includes('事业龙')) {
          arr_事业龙.push(data)
        }
        if (dir.includes('通用龙')) {
          arr_通用龙.push(data)
        }
        if (dir.includes('学业龙')) {
          arr_学业龙.push(data)
        }
        if (dir.includes('姻缘龙')) {
          arr_姻缘龙.push(data)
        }
      }
    })
  ).finally(() => {
    console.log("arr_财富龙", arr_财富龙);
    console.log("arr_安康龙", arr_安康龙);
    console.log("arr_事业龙", arr_事业龙);
    console.log("arr_通用龙", arr_通用龙);
    console.log("arr_学业龙", arr_学业龙);
    console.log("arr_姻缘龙", arr_姻缘龙);
  });
}

function initLoongBlob(obj: any) {
  return new Promise<Record<string, string>>((resolve) => {
    const pathKeys = Object.keys(obj);
    const loongEyeMap: Record<string, string> = {};
    const errMap: Record<string, any> = {};
    Promise.all(
      pathKeys.map(async (pathKey) => {
        const urlObj = await obj[pathKey]();
        const result = await getImgBlob(urlObj.default).catch((err) => {
          errMap[urlObj.default] = err;
          return null;
        });
        const imgUrl = await uploadImageAuto(result as Blob, UploadScene.Rouzao_resource, 1);
        console.log('img', imgUrl);
        if (result) {
          loongEyeMap[urlObj.default.split("?")[0]] = imgUrl;
        }
      })
    ).finally(() => {
      resolve(loongEyeMap);
    });
  });
}

init();

function App() {
  const [style] = useState<CSSProperties>({});

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
