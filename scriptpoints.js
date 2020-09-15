/**
 * Created by DCH on 18/10/2016.
 */


const {validationResult, body} = require('express-validator/check');
let sqlEngine = require("mssql"),
    path = require("path"),
    memcached = require("./memcachPromise"),
    db = require("./msdb");
let sms = require('./smssender');


let _loginSchema = [
    body('user').exists(),
    body('password').exists(),
];


async function getScriptRawPoints(entrantID, ueedb_2) {
    let ueedb_2_request = new sqlEngine.Request(ueedb_2);
    ueedb_2_request.input("EntrantID", sqlEngine.Int, entrantID);
    let response = await ueedb_2_request.query(
        "SELECT BarcodeID, IsGat, Name, OriginBarcodeID, RawPoints, RawPointsMargin, ScaledPoints, SubjectGroupID, SubjectID, Variant, WorkRawPoints, 2-IsGat ScriptPages " +
        "FROM tScripts_Published_1 " +
        "WHERE (EntrantID = @EntrantID)\n" +
        "order by Orderby");
    return response.recordset;
}

async function getScriptTemplates(subjectID, ueedb_2) {
    let ueedb_2_request = new sqlEngine.Request(ueedb_2);
    ueedb_2_request.input("SubjectID", sqlEngine.Int, subjectID)
    let response = await ueedb_2_request.query(
        "SELECT [ID] TemplateID\
             ,[PageNum]\
             ,[TaskNum]\
             ,[ItemNum] DisplayName\
             ,[ItemOrder]\
         FROM [tScriptTaskTemplates]\
         WHERE SubjectID=@SubjectID and variant =1   \
         ORDER BY ItemOrder, TemplateID"
    );
    return response.recordset;
}

async function getItemPoints(barcodeID, multiplier, ueedb_1) {
    let ueedb_1_request = new sqlEngine.Request(ueedb_1);
    ueedb_1_request.input("BarcodeID", sqlEngine.Int, barcodeID);
    ueedb_1_request.input("Multiplier", sqlEngine.Decimal(18, 2), multiplier);
    let response = await ueedb_1_request.query("SELECT t1.ID\
        ,t1.[PageNum]\
        ,t1.[ItemNum]\
        ,t1.[Points]*@Multiplier Points\
        ,isnull(t2.Points*@Multiplier,-1) AppealPoints\
    FROM [tScriptPoints] t1\
    left join [dbo].[tScriptAppealPoints_publish] t2 on t1.BarcodeID = t2.BarcodeID and t1.ItemNum=t2.ItemNum and t1.PageNum =t2.PageNum\
    WHERE t1.[BarcodeID] = @BarcodeID"
    );
    return response.recordset;
}

async function getImage(barcodeID, page, ueedb_1) {
    let ueedb_1_request = new sqlEngine.Request(ueedb_1);
    ueedb_1_request.input("barcodeID", sqlEngine.Int, barcodeID);
    ueedb_1_request.input("page", sqlEngine.Int, page);
    let response = await ueedb_1_request.query("SELECT t1.[ID]\
        ,[PageNum]\
        ,[BarcodeID]\
        ,[ImagePath]\
        ,t2.Image\
    FROM [dbo].[tScriptImages1] t1 join [dbo].[tScriptImages2] t2 on t1.ID = t2.ImageID\
    where t1.BarcodeID = @barcodeID and t1.PageNum = @page"
    );
    return response.recordset;
}


async function getAdmission(entrantID, ueedb_2) {
    let ueedb_2_request = new sqlEngine.Request(ueedb_2);
    ueedb_2_request.input("EntrantID", sqlEngine.Int, entrantID);
    let response = await ueedb_2_request.query(
        "SELECT     tUniversities.Code AS univCode, tUniversities.Name AS univName, left(tSpecialities.Code,7) AS specCode, tSpecialities.Code Code, tSpecialities.Name AS specName, \n" +
        "                      tAdmissions.Score, tAdmissions.Choice/10 Choice, isnull(isnull(tGrants.RatingNum, tGrantsProf.RatingNum),tGrantsProf2.RatingNum) AS RatingNum, isnull(isnull(tGrants.Amount, tGrantsProf.Amount),tGrantsProf2.Amount) AS GrantAmount\n" +
        "FROM         tAdmissions INNER JOIN\n" +
        "                     tSpecialities ON tAdmissions.SpecialityID = tSpecialities.ID left  JOIN\n" +
        "                      tUniversities ON tSpecialities.FacultyID = tUniversities.ID left JOIN\n" +
        "                      tGrants ON tAdmissions.EntrantID = tGrants.EntrantID and amount is not null left JOIN\n" +
        "                      tGrantsProf ON tAdmissions.EntrantID = tGrantsProf.EntrantID left JOIN\n" +
        "                      tGrantsProf2 ON tAdmissions.EntrantID = tGrantsProf2.EntrantID\n" +
        "WHERE     (tAdmissions.EntrantID = @EntrantID)");
    return response.recordset;
}


async function getSubjectPoints(ueedb_1, ueedb_2, entrantId, subject) {
    let cacheName = 'ueeres-sp-' + entrantId.toString() + '-' + subject.SubjectID;
    let cachedData = await memcached.get(cacheName);
    if (!cachedData) {
        let [itemPoints, scriptTemplates] = await Promise.all(
            [getItemPoints(subject.BarcodeID, subject.RawPointsMultiplier || 1, ueedb_1),
                getScriptTemplates(subject.SubjectID, ueedb_2)]);

        subject.ItemPoints = scriptTemplates.map(function (st) {
            return Object.assign(st, itemPoints.find((sp) => {
                return sp.PageNum === st.PageNum && st.TaskNum === sp.ItemNum
            }));
        });
        await memcached.set(cacheName, subject, 60 * 24 * 10);
    } else
        subject = cachedData;
    return (subject);
}

async function getGrantSubjectAmounts(ueedb_2) {
    let ueedb_2_request = new sqlEngine.Request(ueedb_2);
    let response = await ueedb_2_request.query(
        "SELECT [SubjectGroupID]\n" +
        "      ,EntrantCnt as [Cnt]\n" +
        "      ,[cAmount] Amount\n" +
        "      ,1 [GrantGroup]\n" +
        "  FROM [dbo].[tGrantSubjectAmounts]\n" +
        "  where Step =1"
    );
    return response.recordset;
}

async function getGrantMinScores(ueedb_2) {
    let ueedb_2_request = new sqlEngine.Request(ueedb_2);
    let response = await ueedb_2_request.query(
        "SELECT \n" +
        "\tt1.SubjectGroupID \n" +
        "\t,RatingNum\n" +
        "\t,min(grantScore)/10.0 MinGrantScore\n" +
        "FROM [dbo].[tGrants] t1\n" +
        "  join tSubjectGroups t2 on t1.SubjectGroupID = t2.ID\n" +
        "  where Amount is not null\n" +
        "  group by [GrantGroup],t1.SubjectGroupID ,RatingNum\n" +
        "  order by [GrantGroup],t1.SubjectGroupID ,RatingNum desc"
    );
    return response.recordset;
}

async function getEntrantGrantScores(ueedb_2, entrantId) {
    let ueedb_2_request = new sqlEngine.Request(ueedb_2);
    ueedb_2_request.input("EntrantID", entrantId);
    let response = await ueedb_2_request.query(
        "WITH _scripts AS (\n" +
        "SELECT t1.EntrantID, t2.SubjectGroupId, t3.Name SubjectGroupName, t1.ScaledPoints/10.0 ScaledPoints\n" +
        "FROM tScripts t1\n" +
        "JOIN tSubjects t2 ON t1.SubjectID = t2.ID\n" +
        "JOIN tSubjectGroups t3 ON t2.SubjectGroupId = t3.ID\n" +
        "WHERE EntrantID = @EntrantID\n" +
        "),\n" +
        "_grants AS (\n" +
        "SELECT *  FROM tGrants \n" +
        "WHERE EntrantID = @EntrantID\n" +
        ")\n" +
        "SELECT t0.EntrantID, t0.SubjectGroupID, t4.SubjectGroupName, t0.Granted, t0.GrantScore/10.0 GrantScore, t0.Amount, t0.RatingNum, " +
        "t1.ScaledPoints Geo,0 Gat,t3.ScaledPoints [Foreign],t4.ScaledPoints Alt\n" +
        "FROM _grants t0\n" +
        "JOIN _scripts t1 ON t1.SubjectGroupId = 1 --AND t1.EntrantID = t0.EntrantID\n" +

        "JOIN _scripts t3 ON t3.SubjectGroupId = 3 --AND t3.EntrantID = t0.EntrantID\n" +
        "JOIN _scripts t4 ON t4.SubjectGroupId = t0.SubjectGroupId\n" +
        "ORDER BY Granted desc, SubjectGroupID"
    );
    return response.recordset;
}

module.exports = {
    get loginSchema() {
        return _loginSchema
    },
    async login(req, res, next) {
        let pool;
        let EntrantId = 0;
        let props;

        let err = "";
        try {
            /*   if (req.session.entrantId) {
                   err = "სისტემური შეცდომაა(code: 21). დახურეთ ბრაუზერი და თავიდან სცადეთ.";
                   res.json({err});
                   return;
               }*/

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.error(errors.array());
                err = 'შეცდომაა მონაცემების დამუშავების დროს.';
            } else {
                let {user, password} = req.body;
                // password = crypto.hash(password);
                pool = await db.connect();

                let rows = await db.execQuery(pool,

                    "select ID EntrantID, IDNum, t2.Password \n" +
                    "from tEntrants t1\n" +
                    "join CredentialsDB.dbo.tCredentials t2 on t1.IDNum = t2.Email\n" +
                    "where t1.EntrantTypeID = 1 and t1.IDNum = :user and t2.Password =:password", {user, password});

                if (rows.length === 1) {
                    EntrantId = +rows[0].EntrantID;
                    req.session.entrantId = +EntrantId;

                    // let stageData = await db.execQuery(pool,"")

                } else
                    err = 'აპლიკანის პირადი ნომერი ან პაროლი არასწორია!';
            }
            if (!err) {
                res.json({EntrantId});
            } else
                res.json({err});

        } catch (err) {
            console.error(err);
            next(err);
        } finally {
            await db.close(pool);
        }

    },
    async newPassword(req, res, next) {
        let pool;
        let IDNum = "";
        let err = "";

        try {
            IDNum = req.body.IDNum;

            pool = await db.connect();

            let rows = await db.execQuery(pool,
                "select ContactPhone from tEntrants\n" +
                "where IDNum = :IDNum and EntrantTypeID = 1", {IDNum});

            if (rows.length === 1) {
                let contacPhone = rows[0].ContactPhone;
                let np = Math.floor(Math.random() * 100000);

                await db.execQuery(pool,
                    "UPDATE [CredentialsDB].[dbo].[tCredentials]\n" +
                    "SET [Password] = :np\n" +
                    "WHERE [Email] = :IDNum", {IDNum, np});

                sms.SendSms(contacPhone, "sistemaSi Sesasvlelad gamoiyenet paroli: " + np);

            } else
                err = 'სისტემური შეცდომაა(code: 22). დახურეთ ბრაუზერი და თავიდან სცადეთ.';
            res.send("ok");


        } catch (err) {
            console.error(err);
            next(err);
        } finally {
            await db.close(pool);
        }


    },
    async getScriptPoionts(req, res, next) {
        let entrantId = -1;
        let err = "";
        let ueedb_1, ueedb_2;
        try {
            let entrantId = +req.body.entrantId;

            if (req.session && req.session.entrantId !== entrantId) {
                err = "სისტემური შეცდომაა(code: 21). დახურეთ ბრაუზერი და თავიდან სცადეთ.";
                res.json({err});
                return;
            }

            entrantId = req.session.entrantId;

            let ueedb_1_conn = req.app.get("ueedb_1_conn"),
                ueedb_2_conn = req.app.get("ueedb_2_conn");


            ueedb_1 = new sqlEngine.ConnectionPool(ueedb_1_conn);
            ueedb_2 = new sqlEngine.ConnectionPool(ueedb_2_conn);
            await Promise.all([ueedb_1.connect(), ueedb_2.connect()]);
            let scriptPoints = await getScriptRawPoints(entrantId, ueedb_2);
            req.session.barcodes = scriptPoints.map(function (item) {
                return {subjectID: +item.SubjectID, barcodeID: +item.BarcodeID}
            });
            let scripts = [];
            let subject;

            let len = scriptPoints.length;
            for (let i = 0; i < len; i++) {

                subject = scriptPoints[i];

                // new Version
                // subject = await getSubjectPoints(ueedb_1, ueedb_2, entrantId, scriptPoints[i]);

                // old Version
                // let cacheName = 'ueeres-sp-' + entrantId.toString() + '-' + scriptPoints[i].SubjectID;
                // let cachedData = await memcached.get(cacheName);
                // if (!cachedData) {
                //     subject = scriptPoints[i];
                //     let [itemPoints, scriptTemplates] = await Promise.all(
                //         [getItemPoints(subject.BarcodeID, subject.RawPointsMultiplier || 1, ueedb_1),
                //             getScriptTemplates(subject.SubjectID, ueedb_2)]);
                //
                //     subject.ItemPoints = scriptTemplates.map(function (st) {
                //         return Object.assign(st, itemPoints.find((sp) => {
                //             return sp.PageNum === st.PageNum && st.TaskNum === sp.ItemNum
                //         }));
                //     });
                //
                //
                //     await memcached.set(cacheName, subject, 60 * 24 * 10);
                // } else
                //     subject = cachedData;
                scripts.push(subject);
            }

            res.json({scripts})


        } catch
            (err) {
            console.log(err);
            next(err);
        } finally {
            if (ueedb_2)
                ueedb_2.close();
            if (ueedb_1)
                ueedb_1.close();
        }
    },
    async getScriptImage(req, res, next) {
        let barcodes;
        let ueedb_1, ueedb_2;

        let entrantId = +req.query.id;

        if (req.session && req.session.entrantId !== entrantId) {

            res.status(404).send("<strong style='color: maroon'>სისტემური შეცდომაა(code: 21). დახურეთ ბრაუზერი და თავიდან სცადეთ.</strong>");
            return;
        }


        if (req.session && req.session.barcodes)
            barcodes = req.session.barcodes;
        else {
            res.status(404).send("<strong>ნაშრომის დასკანირებული ფაილი არ მოიძებნა</strong>");
            return;
        }


        let subjectID = req.query.s;
        let page = req.query.p;
        let subjectBarcode = barcodes.find(function (item) {
            return item.subjectID === +subjectID
        });

        if (subjectBarcode) {
            let imageKey = "ueeres_image_" + subjectBarcode.barcodeID.toString() + "_" + page.toString();

            /*   let cachedData = await memcached.get(imageKey);
               if (cachedData && 0) {
                   res.set('Content-Type', 'image/tiff');
                   res.set('Content-Disposition', 'filename=script' + subjectID + '_' + (parseInt(page) + 1) + '.tiff');
                   res.send(cachedData);
               } else */
            {
                try {
                    let ueedb_1_conn = req.app.get("ueedb_1_conn");
                    ueedb_1 = new sqlEngine.ConnectionPool(ueedb_1_conn);
                    await ueedb_1.connect();
                    let scriptImage = await getImage(subjectBarcode.barcodeID, page, ueedb_1);
                    if (scriptImage.length > 0) {
                        // memcached.set(imageKey, scriptImage[0].Image, 3600);
                        res.set('Content-Type', 'image/tiff');
                        res.set('Content-Disposition', 'filename=script' + subjectID + '_' + (parseInt(page) + 1) + '.tiff');
                        res.send(scriptImage[0].Image);

                    } else {
                        res.status(404).send("<strong>ნაშრომის დასკანირებული ფაილი არ მოიძებნა</strong>");
                    }
                } catch (err) {
                    console.log(err)
                    next(err);
                } finally {
                    if (ueedb_1)
                        ueedb_1.close()
                }

            }
        } else
            res.status(404).send("<strong>ნაშრომის დასკანირებული ფაილი არ მოიძებნა</strong>");
    },

    getTestImage: function (req, res) {
        let subjectID = req.params.subjectID;
        let attName = 's' + subjectID.toString();

        attName = attName + '.pdf';

        res.attachment(attName);
        let fileName = path.join(__dirname, '../tests', 's' + subjectID.toString() + '.pdf');
        res.sendFile(fileName);
    },

    async getAdmission(req, res, next) {
        if (!req.session.entrantId) {
            let err = "სისტემური შეცდომაა(code: 21). დახურეთ ბრაუზერი და თავიდან სცადეთ.";
            res.json({err});
            return;
        }
        let entrantId = req.session.entrantId;
        let ueedb_2;
        let admission;

        try {
            let cacheName = 'ueeres-adm-' + entrantId.toString();
            let cachedData = await memcached.get(cacheName);
            if (!cachedData) {

                let ueedb_2_conn = req.app.get("ueedb_2_conn");
                ueedb_2 = new sqlEngine.ConnectionPool(ueedb_2_conn);
                await ueedb_2.connect();

                admission = await getAdmission(entrantId, ueedb_2);
                await memcached.set(cacheName, admission, 60 * 24 * 10);
            } else
                admission = cachedData;

            res.json({admission});
        } catch (err) {
            console.log(err);
            next(err);
        } finally {
            if (ueedb_2)
                ueedb_2.close();
        }
    },
    async getScores(req, res, next) {
        let pool;
        let Scores;
        try {
            if (!req.session.entrantId) {
                let err = "სისტემური შეცდომაა(code: 21). დახურეთ ბრაუზერი და თავიდან სცადეთ.";
                res.json({err});
                return;
            }

            let entrantId = req.session.entrantId;
            let cacheName = 'ueeres-sc-' + entrantId.toString();
            let cachedData = await memcached.get(cacheName);
            if (!cachedData) {
                let entrantId = req.session.entrantId;
                pool = await db.connect();

                Scores = await db.execQuery(pool,
                    "EXEC [dbo].[sp08_EntrantScores]  :entrantId", {entrantId});
                await memcached.set(cacheName, Scores, 60 * 24 * 10);
            } else
                Scores = cachedData;

            res.json({Scores})

        } catch (err) {
            console.error(err);
            next(err);
        } finally {
            await db.close(pool);
        }
    },
    async clearCache(req, res) {
        try {
            await memcached.flush();
            res.send("Cache cleared");
        } catch (e) {
            res.send(e);
        }

    },

    async removeOneFromCache(req, res) {
        try {
            let key = req.query.id;
            await memcached.remove(key);
            res.send("Cache cleared for: " + key);
        } catch (e) {
            res.send(e);
        }
    },

    async getSubjectItemPints(req, res, next) {
        let entrantId = -1;
        let err = "";
        let ueedb_1, ueedb_2;


        if (!req.session.entrantId) {
            err = "სისტემური შეცდომაა(code: 21). დახურეთ ბრაუზერი და თავიდან სცადეთ.";
            res.json({err});
            return;
        }
        entrantId = req.session.entrantId;
        let barcodes = req.session.barcodes;

        let subjectId = req.body.subjectId;
        let subjectBarcode = barcodes.find(function (item) {
            return item.subjectID === +subjectId
        });

        let barcodeId = subjectBarcode.barcodeID;


        let ueedb_1_conn = req.app.get("ueedb_1_conn"),
            ueedb_2_conn = req.app.get("ueedb_2_conn");


        try {
            ueedb_1 = new sqlEngine.ConnectionPool(ueedb_1_conn);
            ueedb_2 = new sqlEngine.ConnectionPool(ueedb_2_conn);
            await Promise.all([ueedb_1.connect(), ueedb_2.connect()]);

            let subject = {};
            subject.SubjectID = subjectId;
            subject.BarcodeID = barcodeId;

            subject = await getSubjectPoints(ueedb_1, ueedb_2, entrantId, subject);
            res.json({subject});

        } catch
            (err) {
            console.log(err);
            next(err);
        } finally {
            if (ueedb_2)
                ueedb_2.close();
            if (ueedb_1)
                ueedb_1.close();
        }
    },
    async getAllSubjectItemPints(req, res, next) {
        let entrantId = -1;
        let err = "";
        let ueedb_1, ueedb_2;
        try {
            entrantId = +req.body.entrantId;
            if (req.session && req.session.entrantId !== entrantId) {
                err = "სისტემური შეცდომაა(code: 21). დახურეთ ბრაუზერი და თავიდან სცადეთ.";
                res.json({err});
                return;
            }
            entrantId = req.session.entrantId;
            let barcodes = req.session.barcodes;

            let ueedb_1_conn = req.app.get("ueedb_1_conn"),
                ueedb_2_conn = req.app.get("ueedb_2_conn");


            ueedb_1 = new sqlEngine.ConnectionPool(ueedb_1_conn);
            ueedb_2 = new sqlEngine.ConnectionPool(ueedb_2_conn);
            await Promise.all([ueedb_1.connect(), ueedb_2.connect()]);


            let allScriptsPoints = [];
            if (barcodes && barcodes.length > 0)
                for (let i = 0; i < barcodes.length; i++) {
                    let subject = {};
                    subject.SubjectID = barcodes[i].subjectID;
                    subject.BarcodeID = barcodes[i].barcodeID;

                    subject = await getSubjectPoints(ueedb_1, ueedb_2, entrantId, subject);
                    allScriptsPoints.push(subject);
                }

            res.json({allScriptsPoints});

        } catch
            (err) {

            console.log(err);
            next(err);
        } finally {
            if (ueedb_2)
                ueedb_2.close();
            if (ueedb_1)
                ueedb_1.close();
        }
    },
    async getGrants(req, res, next) {
        let entrantId = -1;
        let err = "";


        if (!req.session.entrantId) {
            err = "სისტემური შეცდომაა(code: 21). დახურეთ ბრაუზერი და თავიდან სცადეთ.";
            res.json({err});
            return;
        }
        entrantId = req.session.entrantId;

        let ueedb_2_conn = req.app.get("ueedb_2_conn");
        let ueedb_2;
        try {
            ueedb_2 = new sqlEngine.ConnectionPool(ueedb_2_conn);
            await ueedb_2.connect();

            let [grantSubjectAmounts, grantMinScores, grantEntrantScores] = await Promise.all(
                [getGrantSubjectAmounts(ueedb_2),
                    getGrantMinScores(ueedb_2),
                    getEntrantGrantScores(ueedb_2, entrantId)]);
            let grantData = {};
            grantData.subjectAmounts = grantSubjectAmounts;
            grantData.minScores = grantMinScores;
            grantData.grantScores = grantEntrantScores;
            res.json({grantData});

        } catch (err) {

            console.log(err);
            next(err);
        } finally {
            if (ueedb_2)
                ueedb_2.close();

        }
    }

};
