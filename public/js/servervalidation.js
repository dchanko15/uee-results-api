var ServerValidationMixin = {
    data: function () {
        return {
            errorMessages: [],
        }
    },

    methods: {
        ServerErrors(postRes) {
            let errs = false;
            let result = postRes.data;
            this.errorMessages.length = 0;
            if (result && result.errors) {
                this.errorMessages = result.errors.reduce(function (errStr, curr, ind) {
                    errStr.push({fieldNo: ind, message: curr.msg});
                    return errStr;
                }, []);
                errs = true;
            }
            return errs;
        },
        showErrors(errMessage) {
            // if (errMessage === "" ) {
            //     this.errorMessages.length = 0;
            // }
            if (errMessage) {
                this.errorMessages.length = 0;
                this.errorMessages.push({fieldNo: -1, message: errMessage});
            }

            this.$refs['server-errors'].open();

        },


    }
}



