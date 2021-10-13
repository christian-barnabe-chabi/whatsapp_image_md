const fs = require('fs');
const path = require('path');

function settings(req, res) {

  const config = require("../config/folders.json");

  if(req.body.outputFolder != undefined) {

    if(fs.existsSync(req.body.outputFolder) == false) {
      return res.json({error: true, message: "Folder not exists"});
    }
    
    const stats = fs.statSync(req.body.outputFolder);
    if(stats.isDirectory() ==  false) {
      return res.json({error: true, message: "Not a folder"});
    }

    config.outFolder = req.body.outputFolder;
  }

  if(req.body.sourceFolder != undefined) {

    if(fs.existsSync(req.body.sourceFolder) == false) {
      return res.json({error: true, message: "Folder not exists"});
    }
    
    const stats = fs.statSync(req.body.sourceFolder);
    if(stats.isDirectory() ==  false) {
      return res.json({error: true, message: "Not a folder"});
    }

    config.sourceFolder = req.body.sourceFolder;
  }

  fs.writeSync(fs.openSync(path.join(__dirname, "../", "config", "folders.json"), "w"), JSON.stringify(config));

  res.json({success: true});
}

module.exports = settings;