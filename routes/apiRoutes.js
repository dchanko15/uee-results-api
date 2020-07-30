let express = require("express");
let apiScripts = require("../scriptpoints");
let svgCaptcha = require('svg-captcha');

let router = express.Router();

router.post('/login', apiScripts.loginSchema, apiScripts.login);
router.post('/new-pass', apiScripts.newPassword);

router.get('/scripts', apiScripts.getScriptPoionts);
router.get('/scriptimage', apiScripts.getScriptImage);
router.get('/admission', apiScripts.getAdmission);
router.get('/scores', apiScripts.getScores);
router.get('/clear-cache', apiScripts.clearCache);
router.post('/getsubjectitempoints', apiScripts.getSubjectItemPints);
router.post('/getallsubjectitempoints', apiScripts.getAllSubjectItemPints);
router.post('/getgrantdata', apiScripts.getGrants);



router.get('/captcha',function (req, res) {
    let captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;

    res.type('svg');
    res.status(200).send(captcha.data);
});


module.exports = router;
