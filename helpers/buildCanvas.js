const { createCanvas, loadImage } = require("canvas");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const jimp = require("jimp");
const uuid = require("uuid").v4;

const outFolder = path.join(__dirname, "../out");
const tempFolder = path.join(__dirname, "../temp");

const canvasWidth = 800;
const canvasHeight = 1200;

const image1Width = 746;
const image1Height = 746;

const image2Width = 360;
const image2Height = 360;

const image3Width = 360;
const image3Height = 360;

const logoImageUrl = path.join(__dirname, "../public/images/logo.png");

const canvas = createCanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext("2d");

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvasWidth, canvasHeight);

function buildCanvas(canvasData) {
  drawImage1(canvasData);
}

function drawImage1(canvasData) {
  const image1Canvas = createCanvas(image1Width, image1Height);
  const image1Ctx = image1Canvas.getContext("2d");

  const ext = path.extname(canvasData.images[0]);
  let temp = path.join(tempFolder, uuid() + ext);

  jimp
    .read(canvasData.images[0])
    .then((image) => {
      image
        .cover(image1Width, image1Height)
        .quality(100)
        .write(temp, (err, jimp) => {
          console.log(chalk.yellow.bold("Save complete 1"));
          loadImage(temp).then((image) => {
            image1Ctx.drawImage(image, 0, 0, image1Width, image1Height);
            const margin = (canvasWidth - image1Width) / 2;
            loadImage(image1Canvas.toDataURL())
              .then((image) => {
                ctx.drawImage(image, margin, margin, image1Width, image1Height);
              })
              .then(() => {
                drawImage2(canvasData);
              })
              .then(() => {
                fs.rmSync(temp);
              });
            return image1Canvas.toDataURL();
          });
        });
    })
    .catch((err) => {
      console.log(chalk.red(err));
    });
}

function drawImage2(canvasData) {
  const image1Canvas = createCanvas(image2Width, image2Height);
  const image1Ctx = image1Canvas.getContext("2d");

  const ext = path.extname(canvasData.images[1]);
  let temp = path.join(tempFolder, uuid() + ext);

  jimp
    .read(canvasData.images[1])
    .then((image) => {
      image
        .cover(image2Width, image2Height)
        .quality(100)
        .write(temp, (err, jimp) => {
          console.log(chalk.yellow.bold("Save complete 2"));
          loadImage(temp).then((image) => {
            image1Ctx.drawImage(image, 0, 0, image2Width, image2Height);
            loadImage(image1Canvas.toDataURL())
              .then((image) => {
                const vMargin = image1Height + 60;
                const hMargin = (canvasWidth - image1Width) / 2;
                ctx.drawImage(
                  image,
                  hMargin,
                  vMargin,
                  image2Width,
                  image2Height
                );
              })
              .then(() => {
                drawImage3(canvasData);
              })
              .then(() => {
                fs.rmSync(temp);
              });
            return image1Canvas.toDataURL();
          });
        });
    })
    .catch((err) => {
      console.log(chalk.red(err));
    });
}

function drawImage3(canvasData) {
  const image1Canvas = createCanvas(image3Width, image3Height);
  const image1Ctx = image1Canvas.getContext("2d");

  const ext = path.extname(canvasData.images[2]);
  let temp = path.join(tempFolder, uuid() + ext);

  jimp
    .read(canvasData.images[2])
    .then((image) => {
      image
        .cover(image3Width, image3Height)
        .quality(100)
        .write(temp, (err, jimp) => {
          console.log(chalk.yellow.bold("Save complete 3"));
          loadImage(temp).then((image) => {
            image1Ctx.drawImage(image, 0, 0, image3Width, image3Height);
            loadImage(image1Canvas.toDataURL())
              .then((image) => {
                const vMargin = image1Height + 60;
                const hMargin =
                  image2Width + ((canvasWidth - image1Width) / 2) * 2;
                ctx.drawImage(
                  image,
                  hMargin,
                  vMargin,
                  image3Width,
                  image3Height
                );
              })
              .then(() => {
                drawLogoContainer();
                drawSkuContainer(canvasData.sku);
                drawLogo();
                drawLeftPrice(canvasData.price);
                drawRightPrice(canvasData.price);
                drawCenterPrice(canvasData.price);
              })
              .then(() => {
                const out = fs.createWriteStream(
                  path.join(outFolder, `${canvasData.sku}.jpeg`)
                );
                canvas.createJPEGStream({ quality: 1 }).pipe(out);
                out.on("finish", () => {
                  if (process.env.DEBUG === "true")
                    console.log(path.join(outFolder, `${canvasData.sku}.jpeg`));
                });
              })
              .then(() => {
                fs.rmSync(temp);
              });
            return image1Canvas.toDataURL();
          });
        });
    })
    .catch((err) => {
      console.log(chalk.red(err));
    });
}

function drawLogoContainer(data = null) {
  ctx.beginPath();

  const width = 220;
  const height = 120;

  const hPosition = (canvasWidth - width) / 2;
  const vPosition = image1Height - height / 2 + 40;

  ctx.fillStyle = "white";
  ctx.fillRect(hPosition, vPosition, width, height);
}

function drawLogo(re) {
  const width = 157;
  const height = 21;

  const hPosition = (canvasWidth - width) / 2;
  const vPosition = image1Height - height / 2 + 40;

  loadImage(logoImageUrl).then((image) => {
    ctx.drawImage(image, hPosition, vPosition, width, height);
  });
}

function drawSkuContainer(text) {
  const measuredText = ctx.measureText(text);
  const textWidth = measuredText.width;
  const width = 69;
  const height = 21;
  const fontSize = 17;

  const hPosition = (canvasWidth - width) / 2;
  const vPosition = canvasHeight - height - 34;

  const textHPosition = (canvasWidth - textWidth) / 2;
  const textVPosition = 17 + canvasHeight - height - 34;

  ctx.fillStyle = "white";
  ctx.fillRect(hPosition, vPosition, width, height);

  ctx.fillStyle = "grey";
  ctx.font = fontSize + "px Sans";
  ctx.fillText(text, textHPosition, textVPosition, width, height);
}

function drawLeftPrice(text) {
  const measuredText = ctx.measureText(text);
  const width = measuredText.width;
  const height = 25;
  const fontSize = 16;

  const hPosition = -57 + (canvasWidth - width) / 2;
  const vPosition = 40 + fontSize + image1Height - height / 2 + 40;

  ctx.fillStyle = "black";
  ctx.font = fontSize + "px Sans";
  ctx.fillText(text, hPosition, vPosition, width, height);
}

function drawRightPrice(text) {
  const measuredText = ctx.measureText(text);
  const width = measuredText.width;
  const height = 25;
  const fontSize = 16;

  const hPosition = 57 + (canvasWidth - width) / 2;
  const vPosition = 40 + fontSize + image1Height - height / 2 + 40;

  ctx.fillStyle = "black";
  ctx.font = fontSize + "px Sans";
  ctx.fillText(text, hPosition, vPosition, width, height);
}

function drawCenterPrice(text) {
  ctx.beginPath();

  const measuredText = ctx.measureText(text);
  const width = measuredText.width;
  const height = 25;
  const fontSize = 16;

  const hPosition = (canvasWidth - width) / 2;
  const vPosition = -37 + fontSize + image1Height - height / 2 + 40;

  ctx.fillStyle = "black";
  ctx.font = fontSize + "px Sans";
  ctx.fillText(text, hPosition, vPosition, width, height);
}

module.exports = buildCanvas;
