const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const parseXlsx = require("excel").default;
const buildCanvas = require("./buildCanvas");
const Queue = require("better-queue");
const dirTree = require("directory-tree");
const woocSenegal = require("../data/wooc-sn");
const woocGhana = require("../data/wooc-gh");
const woocGabon = require("../data/wooc-ga");
const woocIvory = require("../data/wooc-ci");

var errors = [];
const queue = new Queue(processQueue);
queue.on("task_finish", (taskId, result) => {
  const progress = Math.ceil(((result.index + 1) * 100) / result.count);

  if (process.env.DEBUG == "true") {
    console.log(
      chalk.blue.bold(`[${progress}%]`) +
        "\t" +
        chalk.green(`Complete: ${result.sku}`)
    );
  } else {
    console.log(chalk.blue.bold(`[${progress}%]`) + "\tcomplete");
  }

  if (result.last) {
    if (errors.length > 0) {
      console.log(chalk.bgRed("Task complete with error"));
      if (result.socket) {
        result.socket.emit("task_finished", {
          message: "Task complete with error",
          errors: errors,
          sku: result.sku,
          progress: progress,
        });
      }
    } else {
      console.log(chalk.bgBlue("Task complete"));
      if (result.socket) {
        result.socket.emit("task_finished", {
          message: "Task complete",
          sku: result.sku,
          progress: progress,
        });
      }
    }
    errors = [];
  } else {
    if (result.socket) {
      result.socket.emit("progress", { progress: progress, sku: result.sku });
    }
  }

  if (result.socket) {
    result.socket.emit('message', `Task progress ${progress}%`);
  }
});

queue.on("task_failed", (taskId, errorData) => {
  const progress = Math.ceil(((errorData.index + 1) * 100) / errorData.count);

  if (process.env.DEBUG == "true") {
    console.log(
      chalk.red.bold(`[${progress}%]`) +
        "\t" +
        `: ${errorData.sku} - ${errorData.error}`
    );
  } else {
    console.log(chalk.red.bold(`[${progress}%]`) + "\t" + errorData.error);
  }


  errors.push({sku: errorData.sku, message: errorData.message || `An error occurs with ${errorData}.sku`});

  if (errorData.last) {
    console.log(chalk.bgRed("Task complete with error"));
    if (errorData.socket) {
      errorData.socket.emit("task_finished", {
        message: errorData.message || "Task complete with error",
        errors: errors,
        sku: errorData.sku,
        progress: progress,
      });
    }
    errors = [];
  } else {
    if (errorData.socket) {
      errorData.socket.emit("progress", {
        progress: progress,
        sku: errorData.sku,
        error: true,
        message: errorData.error,
      });
    }
  }

  if (errorData.socket) {
    errorData.socket.emit('message', `Task progress ${progress}%`);
  }
});

function uploadForm(req, res) {
  const config = require("../config/folders.json");
  res.render("form", { config: config });
}

async function uploadProductSheet(req, res) {
  const socket = req.app.get("socketio");

  if (!req.file) {
    res.status(400).json({ error: true, message: "file not found" });

    if (socket) {
      socket.emit("notification", { message: "No file to upload", errors: [] });
    }

    return 0;
  }

  const output = path.join(
    __dirname,
    "../",
    "upload",
    req.file.originalname.replace(/\s/g, "-")
  );

  const filePath = req.file.path;

  const regex = /spreadsheet/;
  if (!regex.test(req.file.mimetype)) {
    fs.rmSync(filePath);
    res.status(400).json({ error: true, message: "file format error" });

    if (socket) {
      socket.emit("notification", { message: "File format error", errors: [] });
    }

    return 0;
  }

  fs.renameSync(filePath, output);

  const rows = await getProductData(output);

  fs.rmSync(output);

  const skus = ["X5-639", "X5-639", "X10-639", "X9-639", "X5-659", "X15-639"];

  for (let i = 0; i < rows.length; i++) {
    // get sku xxx-xxx format
    if (rows[i][8] && /\w*-\w*/.test(rows[i][8])) {
      skus.push(rows[i][8].trim());
    }
  }

  const responseData = [];
  for (sku of skus) {
    let isLast = false;

    if (sku === skus[skus.length - 1]) {
      isLast = true;
    }

    const skuData = {
      sku: sku,
      last: isLast,
      count: skus.length,
      index: skus.indexOf(sku),
      socket: socket,
    };
    queue.push(skuData);
  }

  res.send(responseData);
}

function getProductData(filePath) {
  if (process.env.DEBUG == "true") {
    console.log(chalk.bgGreen("================== PARSING =================="));
    console.log(filePath);
  }

  return parseXlsx(filePath)
    .then((rows) => {
      return rows;
    })
    .catch((error) => {
      console.log(chalk.bgRed("================== ERROR =================="));
      console.log(error);
      console.log(chalk.yellow(filePath));
      console.log(chalk.bgRed("================== ERROR =================="));
    });
}

function getImages(sku) {
  const regex = /(\w*)-(\w*)/gi;

  const [fullSku, category, serie] = regex.exec(sku);

  // TODO check path

  const { sourceFolder } = require("../config/folders.json");
  const skuPath = path.join(sourceFolder, category, fullSku);

  if(fs.existsSync(skuPath) == false) {
    return new Promise((resolve, reject) => {
      resolve({ imageSet: [], sku: sku });
    });
  }

  const imagePaths = getPaths(dirTree(skuPath));

  return new Promise((resolve, reject) => {
    if (imagePaths != null) {
      resolve({ imageSet: imagePaths, sku: sku });
    } else {
      reject("Cant find images for " + sku);
    }
  });
}

function getPaths(pathObject) {
  const paths = [];
  function recurse(pathObject) {
    if (!pathObject) return;

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
        const { sourceFolder } = require("../config/folders.json");
        const shortPath = pathObject.path
          .replace(sourceFolder, "")
          .replace(/(\\|\/)/gi, "/")
          .replace(/^(\\|\/)/gi, "");
        // const shortPath = pathObject.path.replace(process.env.IMAGE_SOURCE_FOLDER, "").replace(/(\\|\/)/gi, "/").replace(/^(\\|\/)/gi, "");
        const [category, sku, color, imageName] = shortPath.split("/");
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

function processQueue(skuData, cb) {
  getImages(skuData.sku).then((data) => {

    let images = [];
    const usedColors = [];

    for (imageData of data.imageSet) {
      if (usedColors.includes(imageData.color)) {
        continue;
      }

      if (/cover/.test(imageData.image)) {
        images.unshift(imageData.image);
      } else {
        images.push(imageData.image);
      }
      usedColors.push(imageData.color);
    }

    if(images.length == 0) {
      skuData.error = `Images not found for ${skuData.sku}`;
      cb(skuData);
      return;
    }

    if (images.length < 3) {
      for (imageData of data.imageSet) {
        if (images.includes(imageData.image) && data.imageSet.length > 2) {
          continue;
        }
        images.push(imageData.image);
      }
    }

    images.splice(3);

    function getFromSenegal(sku) {
      if (process.env.DEBUG === "true") {
        console.log(chalk.bgRed(" ++++ SN: Product ++++ " + sku));
      }
      
      woocSenegal(sku, productData => {
        if (productData.error) {
          getFromGhana(sku);
          return;
        }
        prepareBuild(productData, images, skuData, cb);
      });
    }
    
    function getFromGhana(sku) {
      if (process.env.DEBUG === "true") {
        console.log(chalk.bgRed(" ++++ GH: Product ++++ " + sku));
      }

      woocGhana(sku, productData => {
        if (productData.error) {
          getFromGabon(sku);
          return;
        }
        prepareBuild(productData, images, skuData, cb, true);
      });
    }
    
    function getFromGabon(sku) {
      if (process.env.DEBUG === "true") {
        console.log(chalk.bgRed(" ++++ GA: Product ++++ " + sku));
      }

      woocGabon(sku, productData => {
        if (productData.error) {
          getFromIvory(sku);
          return;
        }
        prepareBuild(productData, images, skuData, cb);
      });
    }
    
    function getFromIvory(sku) {
      if (process.env.DEBUG === "true") {
        console.log(chalk.bgRed(" ++++ CI: Product ++++ " + sku));
      }

      woocIvory(sku, productData => {
        if (productData.error) {
          skuData.error = productData.message;
          cb(skuData);
          return;
        }
        prepareBuild(productData, images, skuData, cb);
      });
    }

    getFromSenegal(data.sku);

  });
}

function prepareBuild(productData, images, skuData, cb, isFromGhana = false) {
  const localSenegal = "fr-FR";
  const localEnglish = "en-US";
  const currenctyFrench = "CFA";
  const currenctyGhana = "GHC";
  const productPrice = productData.price * 1;

  let productPriceSenegal = 0;
  let productPriceGhana = 0;

  if(isFromGhana) {
    productPriceSenegal = Math.ceil(productPrice * 100);
    productPriceGhana = productPrice;
  } else {
    productPriceSenegal = productPrice;
    productPriceGhana = productPrice / 100;
  }

  const canvasData = {
    price: `${productPriceSenegal.toLocaleString(
      localSenegal
    )} ${currenctyFrench}`,
    priceGhana: `${productPriceGhana.toLocaleString(
      localEnglish
    )} ${currenctyGhana}`,
    images: images,
    sku: productData.sku,
    socket: skuData.socket || undefined,
  };

  buildCanvas(canvasData);

  cb(null, skuData);
}

module.exports = { uploadProductSheet, uploadForm };
