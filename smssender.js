let axios = require('axios');


module.exports = {
    SendSms(to, text) {
        to = '995' + to;
        let httpParams = {
            to: to,
            text: text
        };

        return axios.get('http://172.16.30.52:3535', {params: httpParams});
    }
};
