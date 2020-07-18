!function (n, e) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (n.__vee_validate_locale__ka = n.__vee_validate_locale__ka || {}, n.__vee_validate_locale__ka.js = e())
}(this, function () {
    "use strict";
    var n, e = { 
        name: "ka", messages: {
            after: function (n, e) {
                return n + " უნდა იყოს " + e[0] + "(ი)ს შემდეგ."
            }, alpha_dash: function (n) {
                return n + " უნდა შეიცავდეს ციფრებს, ასოებს და პუნქტუაციის ნიშნებს."
            }, alpha_num: function (n) {
                return n + " უნდა შეიცავდეს მხოლოდ ციფრებს."
            }, alpha_spaces: function (n) {
                return n + " უნდა შეიცავდეს მხოლოდ ასოებსა და ცარიელ სივრცეებს."
            }, alpha: function (n) {
                return n + " უნდა შეიცავდეს მხოლოდ ასოებს."
            }, before: function (n, e) {
                return n + " უნდა იყოს " + e[0] + "მდე."
            }, between: function (n, e) {
                return n + " უნდა იყოს " + e[0] + " და " + e[1] + "ს შორის."
            }, confirmed: function (n, e) {
                return n + " არ ემთხვევა " + e[0] + "(ი)ს."
            }, date_between: function (n, e) {
                return n + " უნდა უნდა იყოს " + e[0] + " და " + e[1] + "-ს შორის."
            }, date_format: function (n, e) {
                return n + " უნდა იყოს " + e[0] + " ფორმატში."
            }, decimal: function (n, e) {
                void 0 === e && (e = []);
                var t = e[0];
                return void 0 === t && (t = "*"), n + " უნდა შეიცავდეს ციფრებსა და " + ("*" === t ? "" : t) + " მთელ რიცხვებს."
            }, digits: function (n, e) {
                return n + " უნდა შეიცავდეს ციფრებს და უნდა იყოს ზუსტად " + e[0] + "-ნიშნა."
            }, dimensions: function (n, e) {
                return n + " უნდა იყოს " + e[0] + "x" + e[1] + " ზომის (pixel)."
            }, email: function (n) {
                return n + "-ს უნდა ჰქონდეს ელ-ფოსტის სწორი ფორმატი."
            }, ext: function (n) {
                return n + " უნდა იყოს ფაილი."
            }, image: function (n) {
                return n + " უნდა იყოს სურათი."
            }, included: function (n) {
                return n + " უნდა იყოს სწორი მნიშვნელობა."
            }, ip: function (n) {
                return n + " უნდა იყოს სწორი ip მისამართი."
            }, max: function (n, e) {
                return n + " არ უნდა იყოს " + e[0] + " სიმბოლოზე მეტი."
            }, max_value: function (n, e) {
                return n + " უნდა შეიცავდეს " + e[0] + " სიმბოლოს ან ნაკლებს."
            }, mimes: function (n) {
                return n + "ს უნდა ჰქონდეს სწორი ფაილის ფორმატი."
            }, min: function (n, e) {
                return n + " უნდა შეიცავდეს მინიმუმ " + e[0] + " სიმბოლოს."
            }, min_value: function (n, e) {
                return n + " უნდა შეიცავდეს " + e[0] + " ან მეტ სიმბოლოს."
            }, excluded: function (n) {
                return n + " უნდა იყოს სწორი მნიშვნელობა."
            }, numeric: function (n) {
                return n + " უნდა შეიცავდეს ციფრებს."
            }, regex: function (n) {
                return n + "-(ი)ს ფორმატი არასწორია."
            }, required: function (n) {
                return n + " აუცილებლად უნდა შეავსოთ."
            }, size: function (n, e) {
                var t, r, u, i = e[0];
                return n + " უნდა იყოს " + (t = i, r = 1024, u = 0 == (t = Number(t) * r) ? 0 : Math.floor(Math.log(t) / Math.log(r)), 1 * (t / Math.pow(r, u)).toFixed(2) + " " + ["Byte", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][u]) + "-ზე ნაკლები."
            }, url: function (n) {
                return n + "-(ი)ს არ აქვს სწორი მისამართის ფორმატი"
            }
        }, attributes: {}
    };
    return "undefined" != typeof VeeValidate && VeeValidate.Validator.localize(((n = {})[e.name] = e, n)), e
});
