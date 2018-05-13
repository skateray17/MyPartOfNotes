const express = require('express');
const Notes = require('../models/notes');
const ApiResponse = require('../models/api-response');
const ApiMessages = require('../models/api-messages');
const mailer = require('../models/mailer');

const router = express.Router();

router.route('/notes/create')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        if (result) {
          const notes = result.notes;
          notes.unshift(JSON.parse(req.body.note));
          Notes.update({ email: req.session.userProfileModel.email }, { notes }, (error) => {
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

router.route('/notes/get')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        res.send(new ApiResponse({ success: true, extras: { notes: result.notes } }));
      });
    }
  });

router.route('/notes/edit')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        if (req.body.index >= result.notes.length || req.body.index < 0) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.INVALID_IND } }));
        } else {
          result.notes.splice(req.body.index, 1);
          result.notes.unshift(JSON.parse(req.body.newNote));
          Notes.update({ email: req.session.userProfileModel.email }, result, (error) => {
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

router.route('/notes/delete')
  .post((req, res) => {
    if (!req.session.userProfileModel) {
      res.status(401).send('unauthorized');
    } else {
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        const notes = result.notes;
        if (req.body.index >= notes.length || req.body.index < 0) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.INVALID_IND } }));
        } else {
          notes.splice(req.body.index, 1);
          Notes.update({ email: req.session.userProfileModel.email }, { notes }, (error) => {
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

  router.route('/notes/report')
    .post((req, res) => {
      const ind = req.body.index;
      const email = req.body.email;
      Notes.findOne({ email: req.session.userProfileModel.email }, (err, result) => {
        if (err) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.DB_ERROR } }));
        }
        if (ind >= result.notes.length || req.body.index < 0) {
          res.send(new ApiResponse({ success: false, extras: { msg: ApiMessages.INVALID_IND } }));
        } else {
          mailer.sendNoteReport(email, result.notes[ind], (a, b) => res.send(b));
        }
      });
    });

  router.route('/notes/test')
  .post((req, res) => {
    console.log(typeof (JSON.parse(req.body.test)));
    res.send('');
  });
module.exports = router;
