const settings = require('../helpers/settings');
const router = require('express').Router();

router.post("/", settings);

module.exports = router;