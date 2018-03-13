const express = require('express');
const Notes = require('../models/notes');
const ApiResponse = require('../models/api-response');
const ApiMessages = require('../models/api-messages');

const router = express.Router();

router.route('/tags/create')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        if (result) {
          const tags = result.tags;
          tags.push(req.body.tag);
          Notes.update({ email: req.session.userProfileModel.email }, { tags }, (error) => {
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

router.route('/tags/get')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        res.send(new ApiResponse({ success: true, extras: { tags: result.tags } }));
      });
    }
  });

router.route('/tags/edit')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        const tags = result.tags;
        if (req.body.index >= tags.length || req.body.index < 0) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.INVALID_IND } }));
        } else {
          tags[req.body.index] = req.body.newTag;
          Notes.update({ email: req.session.userProfileModel.email }, { tags }, (error) => {
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

router.route('/tags/delete')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        const tags = result.tags;
        if (req.body.index >= tags.length || req.body.index < 0) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.INVALID_IND } }));
        } else {
          tags.splice(req.body.index, 1);
          Notes.update({ email: req.session.userProfileModel.email }, { tags }, (error) => {
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
