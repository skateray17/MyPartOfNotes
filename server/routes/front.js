const express = require('express');
const path = require('path');

const router = express.Router();

router.route('/:params*')
  .get((req, res) => res.sendFile(path.resolve(`front/${req.path}`)));

module.exports = router;
