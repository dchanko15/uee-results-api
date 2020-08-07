const Memcached = require("memcached");

let memcachedHosts = (process.env.MEMCACHEDHOSTS && JSON.parse(process.env.MEMCACHEDHOSTS)) || ['127.0.0.1:11211'];
let _memcached = new Memcached(memcachedHosts);

module.exports = {
    get(key) {
        return new Promise((resolve, reject) => {
            _memcached.get(key, function (err, _data) {
                if (!err)
                    resolve(_data);
                else
                    reject(err);
            })
        })
    },
    set(key, value, lifeTime = 60) {
        return new Promise((resolve, reject) => {
            _memcached.set(key, value, lifeTime * 60, function (err) {
                if (!err)
                    resolve(1);
                else
                    reject(err);
            })
        })
    },
    flush() {
        return new Promise((resolve, reject) => {
            _memcached.flush(function (err) {
                if (!err)
                    resolve(1);
                else
                    reject(err);
            })
        })
    },

    remove(key) {
        return new Promise((resolve, reject) => {
            _memcached.del(key, function (err) {
                if (!err)
                    resolve(1);
                else
                    reject(err);
            })
        })
    }

};

