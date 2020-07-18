let express = require("express");
let apiScripts = require("../scriptpoints");

let router = express.Router();

router.post('/login', apiScripts.loginSchema, apiScripts.login);
router.get('/scripts', apiScripts.getScriptPoionts);
router.get('/scriptimage', apiScripts.getScriptImage);
router.get('/admission', apiScripts.getAdmission);
router.get('/scores', apiScripts.getScores);
router.get('/clearcache', apiScripts.clearCache);
router.post('/getsubjectitempoints', apiScripts.getSubjectItemPints);
router.post('/getallsubjectitempoints', apiScripts.getAllSubjectItemPints);
router.post('/getgrantdata', apiScripts.getGrants);


module.exports = router;
