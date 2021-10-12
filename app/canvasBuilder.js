const { createCanvas, loadImage } = require('canvas');
const fs = require("fs");
const path = require("path");

const outFolder = path.join(__dirname, "../out");
console.log(outFolder);

const canvasWidth = 800;
const canvasHeight = 1200;

const image1Width = 746;
const image1Height = 746;

const image2Width = 360;
const image2Height = 360;

const image3Width = 360;
const image3Height = 360;

const logoImageUrl = path.join(__dirname, '../public/images/logo.png');

const canvas = createCanvas(canvasWidth, canvasHeight)
const ctx = canvas.getContext('2d')

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvasWidth, canvasHeight);

function canvasBuilder(req, res) {
  const images = [
    req.protocol+"://"+req.get("host")+'/images/image-1.jpg',
    req.protocol+"://"+req.get("host")+'/images/image-2.jpg',
    req.protocol+"://"+req.get("host")+'/images/image-3.jpg'
  ]

  drawImage1(images, res);
}

function  drawImage1(images, res) {
  const image1Canvas = createCanvas(image1Width, image1Height);
  const image1Ctx = image1Canvas.getContext("2d");

  loadImage(images[0]).then(image => {
    image1Ctx.drawImage(image, 0, 0, image1Width, image1Height);

    const margin = (canvasWidth - image1Width) / 2;

    loadImage(image1Canvas.toDataURL()).then(image => {
      ctx.drawImage(image, margin, margin, image1Width, image1Height);
    }).then(() => {
      drawImage2(images, res)
    })

    return image1Canvas.toDataURL();
  })
}

function  drawImage2(images, res) {
  const image1Canvas = createCanvas(image2Width, image2Height);
  const image1Ctx = image1Canvas.getContext("2d");

  loadImage(images[1]).then(image => {
    image1Ctx.drawImage(image, 0, 0, image2Width, image2Height);

    loadImage(image1Canvas.toDataURL()).then(image => {

      const vMargin = image1Height + 60;
      const hMargin = (canvasWidth - image1Width) / 2;

      ctx.drawImage(image, hMargin, vMargin, image2Width, image2Height);
    }).then(() => {
      drawImage3(images, res);
    })

    return image1Canvas.toDataURL();
  })
}

function  drawImage3(images, res) {
  const image1Canvas = createCanvas(image3Width, image3Height);
  const image1Ctx = image1Canvas.getContext("2d");

  loadImage(images[2]).then(image => {
    image1Ctx.drawImage(image, 0, 0, image3Width, image3Height);

    loadImage(image1Canvas.toDataURL()).then(image => {

      const vMargin = image1Height + 60;
      const hMargin = image2Width + ((canvasWidth - image1Width) / 2)*2;

      ctx.drawImage(image, hMargin, vMargin, image3Width, image3Height);
    })
    .then(() => {
      drawLogoContainer();
      drawSkuContainer();
      drawLogo();
      drawLeftPrice();
      drawRightPrice();
      drawCenterPrice();
    })
    .then(() => {

      const out = fs.createWriteStream(path.join(outFolder, "image.jpeg"));

      canvas.createJPEGStream({quality: 1}).pipe(out);

      out.on("finish", () => {
        console.log("finished");
      });

      res.render("canvas", {imageSource: canvas.toDataURL()});
    })

    return image1Canvas.toDataURL();
  })
}

function drawLogoContainer(data = null) {
  ctx.beginPath();

  const width = 200;
  const height = 120;

  const hPosition = (canvasWidth - width) / 2;
  const vPosition = image1Height - (height/2) + 40;

  ctx.fillStyle = "white";
  ctx.fillRect(hPosition, vPosition, width, height);
}

function drawLogo(re) {

  const width = 157;
  const height = 21;

  const hPosition = (canvasWidth - width) / 2;
  const vPosition = image1Height - (height/2) + 40;

  loadImage(logoImageUrl).then(image => {
    ctx.drawImage(image, hPosition, vPosition, width, height);
  });
  
}

function drawSkuContainer(data = null) {

  const text = "X5-208";
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
  ctx.font = fontSize+"px Comic"
  ctx.fillText(text, textHPosition, textVPosition, width, height);
}

function drawLeftPrice(data = null) {
  ctx.beginPath();

  const text = "2500 FCFA";
  const measuredText = ctx.measureText(text);
  const width = measuredText.width;
  const height = 25;
  const fontSize = 17;

  const hPosition = -57 + (canvasWidth - width) / 2;
  const vPosition = 40 + fontSize + image1Height - (height/2) + 40;

  ctx.fillStyle = "red";
  ctx.font = fontSize+"px Comic"
  ctx.fillText(text, hPosition, vPosition, width, height);
}

function drawRightPrice(data = null) {
  ctx.beginPath();

  const text = "2500 FCFA";
  const measuredText = ctx.measureText(text);
  const width = measuredText.width;
  const height = 25;
  const fontSize = 17;

  const hPosition = 57 + (canvasWidth - width) / 2;
  const vPosition = 40 + fontSize + image1Height - (height/2) + 40;

  ctx.fillStyle = "blue";
  ctx.font = fontSize+"px Comic"
  ctx.fillText(text, hPosition, vPosition, width, height);
}

function drawCenterPrice(data = null) {
  ctx.beginPath();

  const text = "2500 FCFA";
  const measuredText = ctx.measureText(text);
  const width = measuredText.width;
  const height = 25;
  const fontSize = 17;

  const hPosition = (canvasWidth - width) / 2;
  const vPosition = -37 + fontSize + image1Height - (height/2) + 40;

  ctx.fillStyle = "green";
  ctx.font = fontSize+"px Comic"
  ctx.fillText(text, hPosition, vPosition, width, height);
}

module.exports = canvasBuilder;
