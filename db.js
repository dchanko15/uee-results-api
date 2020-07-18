const mariadb = require('mariadb');


//const defConn = {'host': '172.16.20.32', 'user': 'uee_f', 'password': 'Qwe123', 'database': 'uee_f' };
//const defConn = {'host': 'localhost', 'user': 'dch', 'password': 'Qwe123', 'database': 'uee_f' , 'namedPlaceholders': 'false'};
const defConn = {
    host: "localhost",
    user: "uee_f",
    password: "Qwe123",
    database: "uniTest",
    namedPlaceholders: true
};


module.exports = {
    async connect() {
        let conn = process.env.UEE_F_DB ? {...JSON.parse(process.env.UEE_F_DB),  namedPlaceholders: true} : defConn;
        let pool = await mariadb.createPool(conn);
        return pool;
    },
    async close(pool) {
        if (pool)
            await pool.end();
    },
    async execQuery(pool, sql, params) {
        let conn;
        let rows;
        try {
            conn = await pool.getConnection();
            rows = await conn.query(sql, params);
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            if (conn)
                await conn.end();
        }
        return rows;
    }
};
