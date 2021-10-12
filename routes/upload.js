const multer = require('multer');
const path = require('path');
const {uploadProductSheet, uploadForm} = require('../helpers/upload');
const upload = multer({dest: path.join(__dirname ,"../", "upload")});
const router = require('express').Router();

router.post("/", upload.single('product-sheet'), uploadProductSheet);
router.get("/", upload.single('product-sheet'), uploadForm);

module.exports = router;