/**
 * Created by DCH on 04/06/16.
 */
let crypto = require("crypto");


let algorithm = 'aes192',
    password = '23F5C5310a1D4E1dB91627548Ed2091';


module.exports = {
    encrypt: function (buffer) {
        let cipher = crypto.createCipheriv(algorithm, password,null)
        let crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        return crypted;
    },

    decrypt: function (buffer) {
        let decipher = crypto.createDecipheriv(algorithm, password,null)
        let dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
        return dec;
    },
    hash: function (tohash) {
        let algorithm = 'sha1',
        key = password.substring(3,16);

        let hash = crypto.createHmac(algorithm, key).update(tohash).digest('hex');
        return hash;
    }
}
