const fs = require("fs");
const path = require("path");
const open = require("open");

function settings(req, res) {
  const config = require("../config/folders.json");
  if (
    req.body.outputFolder == undefined &&
    req.body.sourceFolder == undefined
  ) {
    return res
      .status(400)
      .json({
        error: true,
        message: "Nothing to update",
        source: config.sourceFolder,
        output: config.outFolder,
      });
  }

  if (req.body.outputFolder != undefined) {
    if (fs.existsSync(req.body.outputFolder) == false) {
      return res
        .status(400)
        .json({
          error: true,
          message: "Folder not exists",
          source: config.sourceFolder,
          output: config.outFolder,
        });
    }

    const stats = fs.statSync(req.body.outputFolder);
    if (stats.isDirectory() == false) {
      return res
        .status(400)
        .json({
          error: true,
          message: "Not a folder",
          source: config.sourceFolder,
          output: config.outFolder,
        });
    }

    config.outFolder = req.body.outputFolder;
    res.json({ success: true, message: "Updated. Please launch the app again" });
    process.exit(1);
  }

  if (req.body.sourceFolder != undefined) {
    if (fs.existsSync(req.body.sourceFolder) == false) {
      return res
        .status(400)
        .json({
          error: true,
          message: "Folder not exists",
          source: config.sourceFolder,
          output: config.outFolder,
        });
    }

    const stats = fs.statSync(req.body.sourceFolder);
    if (stats.isDirectory() == false) {
      return res.json({ error: true, message: "Not a folder" });
    }

    config.sourceFolder = req.body.sourceFolder;
  }

  fs.writeSync(
    fs.openSync(path.join(__dirname, "../", "config", "folders.json"), "w"),
    JSON.stringify(config)
  );

  res.json({ success: true, message: "Updated" });
}

function openSourceFolder(req, res) {
  open(require('../config/folders.json').sourceFolder);
  res.json({success: true});
}

function openOutputFolder(req, res) {
  open(require('../config/folders.json').outFolder);
  res.json({success: true});
}

module.exports = {settings, openOutputFolder, openSourceFolder};
