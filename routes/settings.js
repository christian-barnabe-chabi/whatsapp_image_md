const {settings, openOutputFolder, openSourceFolder} = require('../helpers/settings');
const router = require('express').Router();

router.post("/", settings);
router.post("/source", openSourceFolder);
router.post("/output", openOutputFolder);

module.exports = router;