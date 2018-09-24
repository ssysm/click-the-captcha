var express = require('express');
var router = express.Router();
var path = require('path');
var config = require('./../config');

const svgCaptcha = require('svg-captcha');
const Jimp = require('jimp');

const fs = require('fs');
const datasetConfig = JSON.parse(fs.readFileSync(path.join(__dirname + '/../datasets/datasets.json'), 'utf8'));
const collectionConfig = JSON.parse(fs.readFileSync(path.join(__dirname + '/../datasets/collections.json'), 'utf8'));
svgCaptcha.loadFont(path.join(__dirname + '/../datasets/STHeiTi.otf'));


function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;

  // compare lengths - can save a lot of time 
  if (this.length != array.length)
    return false;

  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
        return false;
    } else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}
Object.defineProperty(Array.prototype, "equals", {
  enumerable: false
});


router.get('/captcha', function (req, res, next) {
  var imgArr = shuffle(datasetConfig);
  imgArr.length = 8;
  req.session.sessionImg = imgArr;
  req.session.chanllegeIndex = Math.floor(Math.random() * imgArr.length);
  req.session.chanllegeCato = Math.floor(Math.random() * imgArr[req.session.chanllegeIndex].cato.length);
  res.send({
    requestTotal: imgArr.length,
    svg: svgCaptcha(
      collectionConfig[
        imgArr[
          req.session.chanllegeIndex
        ].cato[
          req.session.chanllegeCato
        ]
      ],config.captcha)
  });
});

router.get('/captcha/images/:id.jpg', (req, res) => {
  var {
    id
  } = req.params;
  var {
    sessionImg
  } = req.session;
  if (!id) {
    res.send({
      error: 'no query number'
    })
  } else if (id > sessionImg.length || id < -1) {
    res.send({
      error: 'incorrect query number'
    })
  } else {
    var file = path.join(__dirname + '/../datasets/' + sessionImg[id]['file']);
    res.sendFile(file);    
  }
});

router.post('/captcha/verify', (req, res) => {
  var {
    index
  } = req.body;
  var {
    chanllegeIndex,
    sessionImg,
    chanllegeCato
  } = req.session;

  var acceptableImg = [];

  console.log(req.body);
  sessionImg.map((item, index) => {
    if (item.cato.includes(sessionImg[chanllegeIndex].cato[chanllegeCato])) {
      acceptableImg.push(index);
    }
  });

  index.sort((a, b) => a - b);
  for (var i = 0; i < index.length; i++) index[i] = parseInt(index[i], 10);

  if (acceptableImg.equals(index)) {
    res.send({
      status: true
    })
  } else {
    res.send({
      status: false
    });
  }
})

module.exports = router;