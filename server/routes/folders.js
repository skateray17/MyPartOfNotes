const express = require('express');
const Notes = require('../models/notes');
const ApiResponse = require('../models/api-response');
const ApiMessages = require('../models/api-messages');

const router = express.Router();

router.route('/folders/create')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        if (result) {
          const folders = result.folders;
          folders.unshift(req.body.folder);
          Notes.update({ email: req.session.userProfileModel.email }, { folders }, (error) => {
            if (error) {
              res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
            } else {
              res.send(new ApiResponse({ success: true }));
            }
          });
        } else {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
      });
    }
  });

router.route('/folders/get')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        res.send(new ApiResponse({ success: true, extras: { folders: result.folders } }));
      });
    }
  });
  
router.route('/folders/delete')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        const folders = result.folders;
        if (req.body.index === undefined || req.body.index >= folders.length ||
                                                            req.body.index < 0) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.INVALID_IND } }));
        } else {
          folders.splice(req.body.index, 1);
          Notes.update({ email: req.session.userProfileModel.email }, { folders }, (error) => {
            if (error) {
              res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
            } else {
              res.send(new ApiResponse({ success: true }));
            }
          });
        }
      });
    }
  });

module.exports = router;
