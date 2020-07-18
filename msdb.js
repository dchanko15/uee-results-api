let mssql = require("mssql");


let mssqlConnection = 'mssql://dch:M10yl@172.16.20.10/ueedb_15';


module.exports = {
    async connect() {
        let conn = process.env.UEEDB_2_CONN ? process.env.UEEDB_2_CONN : mssqlConnection;
        let cc = new mssql.ConnectionPool(conn);
        await cc.connect();
        return cc;
    },
    close(c) {
        if (c) {
            c.close();
            mssql.close();
        }
    },
    async execQuery(cc, sql, params) {
        try {

            sql =sql.replace(/:/g,'@');

            let request = new mssql.Request(cc);
            if (params) {
                let keys = Object.keys(params);

                keys.forEach(key => {
                    request.input(key,  params[key])
                })
            }

            let result = await request.query(sql);
            return result.recordsets[0];
        }
        catch (err) {
            console.error(err);
            throw err;

        }
    }
};
/*

let sql = "selct * from tcandidates where email= ? and phone = ? and idnum= ?   ";


(function transformQuery(sql, params) {
    let sqlparts = sql.split('?');
    let final= sqlparts[0];
    params.forEach((p, ind) => {
        final += ('@p'+ ind)+ sqlparts[ind+1] ;
    });


})(sql,['email','phone', 'idnum', ]);
*/
