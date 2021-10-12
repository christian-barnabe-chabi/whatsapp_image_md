const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const parseXlsx = require('excel').default;
const axios = require('axios').default;
const wooc = require('./woocommerce');
const buildCanvas = require('./buildCanvas');
const Queue = require('better-queue');
const dirTree = require('directory-tree');
const { resolve } = require('path');

const queue = new Queue(processQueue);
queue.on("task_finish", (taskId, result) => {
  console.log(chalk.green("Success:"+ result));
})
queue.on("task_failed", (taskId, error) => {
  console.log(chalk.red("Failed: "+ error));
})


async function uploadProductSheet(req, res) {


  if(!req.file) {
    res.json({error: true, message: "file not found"});
    return 0;
  }

  const output = path.join(__dirname, "../", "upload", req.file.originalname.replace(/\s/g, '-'));

  const filePath = req.file.path;

  const regex = /spreadsheet/;
  if(!regex.test(req.file.mimetype)) {
    fs.rmSync(filePath);
    res.json({error: true, message: "file format error"});
    return 0;
  }

  fs.renameSync(filePath, output);

  const rows = await getProductData(output);

  const skus = [];

  for(let i = 0; i < rows.length; i++) {
    // get sku xxx-xxx format
    if(rows[i][8] && /\w*-\w*/.test(rows[i][8]) ) {
      skus.push(rows[i][8].trim());
    }
  }

  const responseData = [];
  for(sku of skus) {
    queue.push(sku);
  }

  res.send(responseData);
}

function uploadForm(req, res) {
  res.render('form');
}

function getProductData(filePath) {
  console.log(chalk.bgGreen("================== PARSING =================="));
  console.log(filePath);
  return parseXlsx(filePath).then((rows) => {
    return rows;
  }).catch(error => {
    console.log("================== ERROR ==================");
    console.log(error);
    console.log(chalk.yellow(filePath));
    console.log("================== ERROR ==================");
  })
}

function getImages(sku) {
  console.log(process.env.IMAGE_SOURCE_FOLDER);
  // console.log(sku);

  const regex = /(\w*)-(\w*)/gi;

  const [fullSku, category, serie] = regex.exec(sku);

  // TODO check path

  const skuPath = path.join(process.env.IMAGE_SOURCE_FOLDER, category, fullSku);
  const imagePaths = getPaths(dirTree(skuPath));

  return new Promise((resolve, reject) => {

    if(imagePaths !=  null) {
      resolve({imageSet: imagePaths, sku: sku})
    } else {
      reject("Cant find images for "+ sku);
    }

  });
}

function getPaths(pathObject) {
  const paths = [];
  function recurse(pathObject) {
    if(!pathObject) return;

    if (
      pathObject.hasOwnProperty("children") &&
      pathObject.children.length > 0
    ) {
      pathObject.children.forEach((child) => {
        return recurse(child);
      });
    } else {
      if (pathObject.hasOwnProperty("path")) {
        pathObject.image = pathObject.path;
        const shortPath = pathObject.path.replace(process.env.IMAGE_SOURCE_FOLDER, "").replace(/(\\|\/)/gi, "/").replace(/^(\\|\/)/gi, "");
        const [category, sku, color, imageName] =shortPath.split("/");
        pathObject.sku = sku;
        pathObject.color = color;
        delete pathObject.path;
        delete pathObject.name;

        
        paths.push(pathObject);
      }
    }
  }

  recurse(pathObject);
  return paths;
}

function processQueue(sku, cb) {
  getImages(sku).then(data => {

    // console.log(data);
    // cb(null, "Complete");
    // return 0;

    let images = [];
    const usedColors = [];

    for(imageData of data.imageSet) {

      if(usedColors.includes(imageData.color)) {
        continue;
      }

      if(/cover/.test(imageData.image)) {
        images.unshift(imageData.image);
      } else {
        images.push(imageData.image);
      }
      usedColors.push(imageData.color);
    }

    if(images.length < 3) {
      for(imageData of data.imageSet) {

        if(images.includes(imageData.image)) {
          continue;
        }
        images.push(imageData.image);
      }
    }

    images.splice(3, );

    wooc(data.sku, (productData) => {
      if(process.env.DEBUG === "true")
      console.log(chalk.bgRed(" ++++ Product ++++ "+data.sku));

      if(productData.error) {
        cb(productData.message);
        return;
      }

      const canvasData = {
        price: productData.price +" CFA",
        images: images,
        sku: data.sku,
      }

      buildCanvas(canvasData);
      cb(null, data.sku);
    });

  })
}


module.exports = {uploadProductSheet, uploadForm};