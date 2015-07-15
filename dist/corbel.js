(function(root, factory) {
    'use strict';
    /* jshint unused: false */

    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return factory(root);
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory.call(root, root, process || undefined);
    } else if (root !== undefined) {
        root.corbel = factory(root);
    }

})(this, function(root, process) {
    'use strict';
    /* jshint unused: false */

    /**
     * corbel namespace
     * @exports corbel
     * @namespace
     */
    var corbel = {};

    //-----------Utils and libraries (exports into corbel namespace)---------------------------

    (function() {

        /**
         * @namespace
         * @memberOf corbel
         * @param {object} config
         * @return {CorbelDriver}
         */
        function CorbelDriver(config) {
            // create instance config
            this.guid = corbel.utils.guid();
            this.config = corbel.Config.create(config);

            // create isntance modules with injected driver
            this.iam = corbel.Iam.create(this);
            this.resources = corbel.Resources.create(this);
            this.assets = corbel.Assets.create(this);
            this.oauth = corbel.Oauth.create(this);
            this.notifications = corbel.Notifications.create(this);
            this.ec = corbel.Ec.create(this);
            this.evci = corbel.Evci.create(this);
            this.borrow = corbel.Borrow.create(this);
            this.composr = corbel.CompoSR.create(this);
        }

        corbel.CorbelDriver = CorbelDriver;

        /**
         * Instanciates new corbel driver
         * @memberOf corbel
         * @param {object} config
         * @param {string} config.urlBase
         * @param {string} [config.clientId]
         * @param {string} [config.clientSecret]
         * @param {string} [config.scopes]
         * @return {corbel.CorbelDriver}
         */
        corbel.getDriver = function(config) {
            config = config || {};

            if (!config.urlBase) {
                throw new Error('error:undefined:urlbase');
            }

            return new CorbelDriver(config);
        };

    })();


    (function() {

        /**
         * A module to some library corbel.utils
         * @exports utils
         * @namespace
         * @memberof corbel
         */
        var utils = corbel.utils = {};

        /**
         * Extend a given object with all the properties in passed-in object(s).
         * @param  {Object}  obj
         * @return {Object}
         */
        utils.extend = function(obj) {
            Array.prototype.slice.call(arguments, 1).forEach(function(source) {
                if (source) {
                    for (var prop in source) {
                        obj[prop] = source[prop];
                    }
                }
            });

            return obj;
        };

        /**
         * Set up the prototype chain, for subclasses. Uses a hash of prototype properties and class properties to be extended.
         * @param  {Object} Prototype object properties
         * @param  {Object} Static object properties
         * @return {Object} Return a new object that inherit from the context object
         */
        utils.inherit = function(prototypeProperties, staticProperties) {
            var parent = this,
                child;


            if (prototypeProperties && prototypeProperties.hasOwnProperty('constructor')) {
                child = prototypeProperties.constructor;
            } else {
                child = function() {
                    return parent.apply(this, arguments);
                };
            }

            utils.extend(child, parent, staticProperties);

            var Surrogate = function() {
                this.constructor = child;
            };

            Surrogate.prototype = parent.prototype;
            child.prototype = new Surrogate; // jshint ignore:line

            if (prototypeProperties) {
                utils.extend(child.prototype, prototypeProperties);
            }

            child.__super__ = parent.prototype;

            return child;

        };


        /**
         * Generate a uniq random GUID
         */
        utils.guid = function() {

            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };

        /**
         * Reload browser
         */
        utils.reload = function() {
            if (window !== undefined) {
                window.location.reload();
            }
        };

        /**
         * Serialize a plain object to query string
         * @param  {Object} obj Plain object to serialize
         * @return {String}
         */
        utils.param = function(obj) {
            var str = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
            }
            return str.join('&');
        };


        utils.toURLEncoded = function(obj) {
            var str = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
            }
            return str.join('&');
        };

        /**
         * Translate this full exampe query to a Silkroad Compliant QueryString
         * @param {Object} params
         * @param {Object} params.aggregation
         * @param {Object} params.query
         * @param {Object} params.page
         * @param {Number} params.page.page
         * @param {Number} params.page.size
         * @param {Object} params.sort
         * @return {String}
         * @example
         * var params = {
         *     query: [
         *         { '$eq': {field: 'value'} },
         *         { '$eq': {field2: 'value2'} },
         *         { '$gt': {field: 'value'} },
         *         { '$gte': {field: 'value'} },
         *         { '$lt': {field: 'value'} },
         *         { '$lte': {field: 'value'} },
         *         { '$ne': {field: 'value'} },
         *         { '$eq': {field: 'value'} },
         *         { '$like': {field: 'value'} },
         *         { '$in': {field: ['value1', 'value2']} },
         *         { '$all': {field: ['value1', 'value2']} }
         *     ],
         *     queryDomain: 'api',  // 'api', '7digital' supported
         *     queries: [{
         *        query: [
         *           { '$eq': {field: 'value'} },
         *           { '$eq': {field2: 'value2'} },
         *           { '$gt': {field: 'value'} },
         *           { '$gte': {field: 'value'} },
         *           { '$lt': {field: 'value'} },
         *           { '$lte': {field: 'value'} },
         *           { '$ne': {field: 'value'} },
         *           { '$eq': {field: 'value'} },
         *           { '$like': {field: 'value'} },
         *           { '$in': {field: ['value1', 'value2']} },
         *           { '$all': {field: ['value1', 'value2']} }
         *       ],
         *       queryDomain: 'api',  // 'api', '7digital' supported
         *     },{
         *        query: [
         *           { '$eq': {field: 'value'} },
         *           { '$eq': {field2: 'value2'} },
         *           { '$gt': {field: 'value'} },
         *           { '$gte': {field: 'value'} },
         *           { '$lt': {field: 'value'} },
         *           { '$lte': {field: 'value'} },
         *           { '$ne': {field: 'value'} },
         *           { '$eq': {field: 'value'} },
         *           { '$like': {field: 'value'} },
         *           { '$in': {field: ['value1', 'value2']} },
         *           { '$all': {field: ['value1', 'value2']} }
         *       ],
         *       queryDomain: 'api',  // 'api', '7digital' supported
         *     }]
         *     page: { page: 0, size: 10 },
         *     sort: {field: 'asc'},
         *     aggregation: {
         *         '$count': '*'
         *     }
         * };
         */
        utils.serializeParams = function(params) {
            var result = '';

            if (params === undefined || params === null) {
                return result;
            }

            if (!(params instanceof Object)) {
                throw new Error('expected params to be an Object type, but got ' + typeof params);
            }

            if (params.aggregation) {
                result = 'api:aggregation=' + JSON.stringify(params.aggregation);
            }

            function queryObjectToString(qry) {
                var result = '';
                qry.queryDomain = qry.queryDomain || 'api';
                result += qry.queryDomain + ':query=';
                if (typeof qry.query === 'string') {
                    result += qry.query;
                } else {
                    result += JSON.stringify(qry.query);
                }

                return result;
            }

            if (params.query) {
                params.queryDomain = params.queryDomain || 'api';
                result += result ? '&' : '';
                result += queryObjectToString(params);
            }

            if (params.queries) {
                params.queries.forEach(function(query) {
                    result += result ? '&' : '';
                    result += queryObjectToString(query);
                });
            }

            if (params.search) {
                result += result ? '&' : '';
                result += 'api:search=' + JSON.stringify(params.search);
            }

            if (params.sort) {
                result += result ? '&' : '';
                result += 'api:sort=' + JSON.stringify(params.sort);
            }

            if (params.pagination) {
                if (params.pagination.page) {
                    result += result ? '&' : '';
                    result += 'api:page=' + params.pagination.page;
                }

                if (params.pagination.size) {
                    result += result ? '&' : '';
                    result += 'api:pageSize=' + params.pagination.size;
                }
            }

            return result;
        };

        utils.defaults = function(destiny, defaults) {
            Object.keys(defaults).forEach(function(key) {
                if (typeof(destiny[key]) === 'undefined') {
                    destiny[key] = defaults[key];
                }
            });

            return destiny;
        };

        utils.pick = function(object, keys) {
            var destiny = {};

            keys.forEach(function(key) {
                destiny[key] = object[key];
            });

            return destiny;
        };

        utils.clone = function(obj) {
            if (null === obj || 'object' !== typeof obj) {
                return obj;
            }
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = obj[attr];
                }
            }
            return copy;
        };

        utils.isJSON = function(string) {
            try {
                JSON.parse(string);
            } catch (e) {
                return false;
            }

            return true;
        };

        /**
         * Convert data URI to Blob.
         * Only works in browser
         * @param  {string} dataURI
         * @return {Blob}
         */
        utils.dataURItoBlob = function(dataURI) {

            var serialize;
            if (corbel.Config.isNode) {
                console.log('NODE');
                // node environment
                serialize = require('atob');
            } else {
                console.log('BROWSER');
                serialize = root.atob;
            }

            /*
             * phantom hack.
             * https://github.com/ariya/phantomjs/issues/11013
             * https://developers.google.com/web/updates/2012/06/Don-t-Build-Blobs-Construct-Them
             * https://code.google.com/p/phantomjs/issues/detail?id=1013
             * Phrantom has ton Blob() constructor support, 
             * use BlobBuilder instead.    
             */
            var BlobBuilder;
            var BlobConstructor;
            if (corbel.Config.isBrowser) {
                BlobBuilder = window.BlobBuilder = window.BlobBuilder ||
                    window.WebKitBlobBuilder ||
                    window.MozBlobBuilder ||
                    window.MSBlobBuilder;
                BlobConstructor = window.Blob;
            }

            // convert base64 to raw binary data held in a string
            var byteString = serialize(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to an ArrayBuffer
            var arrayBuffer = new ArrayBuffer(byteString.length);
            var _ia = new Uint8Array(arrayBuffer);
            for (var i = 0; i < byteString.length; i++) {
                _ia[i] = byteString.charCodeAt(i);
            }
            var blob;
            if (BlobBuilder) {
                blob = new BlobBuilder();
                blob.append(arrayBuffer);
                blob = blob.getBlob(mimeString);
            } else {
                blob = new BlobConstructor([_ia], {
                    type: mimeString
                });
            }
            return blob;
        };

        return utils;

    })();


    (function() {



        /**
         * A module to make values validation.
         * @exports validate
         * @namespace
         * @memberof app
         */
        corbel.validate = {};

        /**
         * Checks if some value is not undefined
         * @param  {Mixed}  value
         * @param  {String}  [message]
         * @throws {Error} If return value is false and message are defined
         * @return {Boolean}
         */
        corbel.validate.isDefined = function(value, message) {
            var isUndefined = value === undefined;

            if (isUndefined && message) {
                throw new Error(message);
            }
            return !isUndefined;
        };

        /**
         * Checks if some value is defined and throw error
         * @param  {Mixed}  value
         * @param  {String}  [message]
         * @throws {Error} If return value is false and message are defined
         * @return {Boolean}
         */

        corbel.validate.failIfIsDefined = function(value, message) {
            var isDefined = value !== undefined;

            if (isDefined && message) {
                throw new Error(message);
            }
            return !isDefined;
        };

        /**
         * Checks whenever value are null or not
         * @param  {Mixed}  value
         * @param  {String}  [message]
         * @throws {Error} If return value is false and message are defined
         * @return {Boolean}
         */
        corbel.validate.isNotNull = function(value, message) {
            var isNull = value === null;

            if (isNull && message) {
                throw new Error(message);
            }
            return !isNull;
        };

        /**
         * Checks whenever a value is not null and not undefined
         * @param  {Mixed}  value
         * @param  {String}  [message]
         * @throws {Error} If return value is false and message are defined
         * @return {Boolean}
         */
        corbel.validate.isValue = function(value, message) {
            return this.isDefined(value, message) && this.isNotNull(value, message);
        };

        /**
         * Checks if a variable is a type of object
         * @param  {object}  test object
         * @return {Boolean}
         */
        corbel.validate.isObject = function(obj) {
            return typeof obj === 'object';
        };

        /**
         * Checks whenever a value is greater than other
         * @param  {Mixed}  value
         * @param  {Mixed}  greaterThan
         * @param  {String}  [message]
         * @throws {Error} If return value is false and message are defined
         * @return {Boolean}
         */
        corbel.validate.isGreaterThan = function(value, greaterThan, message) {
            var gt = this.isValue(value) && value > greaterThan;

            if (!gt && message) {
                throw new Error(message);
            }
            return gt;
        };

        /**
         * Checks whenever a value is greater or equal than other
         * @param  {Mixed}  value
         * @param  {Mixed} isGreaterThanOrEqual
         * @param  {String}  [message]
         * @throws {Error} If return value is false and message are defined
         * @return {Boolean}
         */
        corbel.validate.isGreaterThanOrEqual = function(value, isGreaterThanOrEqual, message) {
            var gte = this.isValue(value) && value >= isGreaterThanOrEqual;

            if (!gte && message) {
                throw new Error(message);
            }
            return gte;
        };

    })();

    (function() {

        /**
         * Base object with
         * @class
         * @exports Object
         * @namespace
         * @memberof corbel
         */
        corbel.Object = function() {
            return this;
        };

        /**
         * Gets my user assets
         * @memberof corbel.Object
         * @see corbel.utils.inherit
         * @return {Object}
         */
        corbel.Object.inherit = corbel.utils.inherit;

        return corbel.Object;

    })();

    (function() {

        /* jshint camelcase:false */
        corbel.cryptography = (function() {
            /*
             * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
             * in FIPS 180-2
             * Version 2.2 Copyright Angel Marin, Paul Johnston 2000 - 2009.
             * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
             * Distributed under the BSD License
             * See http://pajhome.org.uk/crypt/md5 for details.
             * Also http://anmar.eu.org/projects/jssha2/
             */

            /*
             * Configurable variables. You may need to tweak these to be compatible with
             * the server-side, but the defaults work in most cases.
             */
            var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase        */
            var b64pad = ''; /* base-64 pad character. "=" for strict RFC compliance   */

            function b64_hmac_sha256(k, d) {
                return rstr2b64(rstr_hmac_sha256(str2rstr_utf8(k), str2rstr_utf8(d)));
            }

            /*
             * Calculate the HMAC-sha256 of a key and some data (raw strings)
             */
            function rstr_hmac_sha256(key, data) {
                var bkey = rstr2binb(key);
                if (bkey.length > 16) {
                    bkey = binb_sha256(bkey, key.length * 8);
                }

                var ipad = Array(16),
                    opad = Array(16);
                for (var i = 0; i < 16; i++) {
                    ipad[i] = bkey[i] ^ 0x36363636;
                    opad[i] = bkey[i] ^ 0x5C5C5C5C;
                }

                var hash = binb_sha256(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
                return binb2rstr(binb_sha256(opad.concat(hash), 512 + 256));
            }

            /*
             * Convert a raw string to a base-64 string
             */
            function rstr2b64(input) {
                try {
                    b64pad
                } catch (e) {
                    b64pad = '';
                }
                var tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var output = '';
                var len = input.length;
                for (var i = 0; i < len; i += 3) {
                    var triplet = (input.charCodeAt(i) << 16) | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0) | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
                    for (var j = 0; j < 4; j++) {
                        if (i * 8 + j * 6 > input.length * 8) output += b64pad;
                        else output += tab.charAt((triplet >>> 6 * (3 - j)) & 0x3F);
                    }
                }
                return output;
            }

            /*
             * Encode a string as utf-8.
             * For efficiency, this assumes the input is valid utf-16.
             */
            function str2rstr_utf8(input) {
                var output = '';
                var i = -1;
                var x, y;

                while (++i < input.length) {
                    /* Decode utf-16 surrogate pairs */
                    x = input.charCodeAt(i);
                    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
                    if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
                        x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
                        i++;
                    }

                    /* Encode output as utf-8 */
                    if (x <= 0x7F)
                        output += String.fromCharCode(x);
                    else if (x <= 0x7FF)
                        output += String.fromCharCode(0xC0 | ((x >>> 6) & 0x1F),
                            0x80 | (x & 0x3F));
                    else if (x <= 0xFFFF)
                        output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                            0x80 | ((x >>> 6) & 0x3F),
                            0x80 | (x & 0x3F));
                    else if (x <= 0x1FFFFF)
                        output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                            0x80 | ((x >>> 12) & 0x3F),
                            0x80 | ((x >>> 6) & 0x3F),
                            0x80 | (x & 0x3F));
                }
                return output;
            }

            /*
             * Convert a raw string to an array of big-endian words
             * Characters >255 have their high-byte silently ignored.
             */
            function rstr2binb(input) {
                var output = Array(input.length >> 2);
                for (var i = 0; i < output.length; i++)
                    output[i] = 0;
                for (var i = 0; i < input.length * 8; i += 8)
                    output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
                return output;
            }

            /*
             * Convert an array of big-endian words to a string
             */
            function binb2rstr(input) {
                var output = '';
                for (var i = 0; i < input.length * 32; i += 8)
                    output += String.fromCharCode((input[i >> 5] >>> (24 - i % 32)) & 0xFF);
                return output;
            }

            /*
             * Main sha256 function, with its support functions
             */
            function sha256_S(X, n) {
                return (X >>> n) | (X << (32 - n));
            }

            function sha256_R(X, n) {
                return (X >>> n);
            }

            function sha256_Ch(x, y, z) {
                return ((x & y) ^ ((~x) & z));
            }

            function sha256_Maj(x, y, z) {
                return ((x & y) ^ (x & z) ^ (y & z));
            }

            function sha256_Sigma0256(x) {
                return (sha256_S(x, 2) ^ sha256_S(x, 13) ^ sha256_S(x, 22));
            }

            function sha256_Sigma1256(x) {
                return (sha256_S(x, 6) ^ sha256_S(x, 11) ^ sha256_S(x, 25));
            }

            function sha256_Gamma0256(x) {
                return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ sha256_R(x, 3));
            }

            function sha256_Gamma1256(x) {
                return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ sha256_R(x, 10));
            }

            var sha256_K = new Array(
                1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993, -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
                1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
                264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
                113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
                1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885, -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
                430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
                1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872, -1866530822, -1538233109, -1090935817, -965641998
            );

            function binb_sha256(m, l) {
                var HASH = new Array(1779033703, -1150833019, 1013904242, -1521486534,
                    1359893119, -1694144372, 528734635, 1541459225);
                var W = new Array(64);
                var a, b, c, d, e, f, g, h;
                var i, j, T1, T2;

                /* append padding */
                m[l >> 5] |= 0x80 << (24 - l % 32);
                m[((l + 64 >> 9) << 4) + 15] = l;

                for (i = 0; i < m.length; i += 16) {
                    a = HASH[0];
                    b = HASH[1];
                    c = HASH[2];
                    d = HASH[3];
                    e = HASH[4];
                    f = HASH[5];
                    g = HASH[6];
                    h = HASH[7];

                    for (j = 0; j < 64; j++) {
                        if (j < 16) W[j] = m[j + i];
                        else W[j] = safe_add(safe_add(safe_add(sha256_Gamma1256(W[j - 2]), W[j - 7]),
                            sha256_Gamma0256(W[j - 15])), W[j - 16]);

                        T1 = safe_add(safe_add(safe_add(safe_add(h, sha256_Sigma1256(e)), sha256_Ch(e, f, g)),
                            sha256_K[j]), W[j]);
                        T2 = safe_add(sha256_Sigma0256(a), sha256_Maj(a, b, c));
                        h = g;
                        g = f;
                        f = e;
                        e = safe_add(d, T1);
                        d = c;
                        c = b;
                        b = a;
                        a = safe_add(T1, T2);
                    }

                    HASH[0] = safe_add(a, HASH[0]);
                    HASH[1] = safe_add(b, HASH[1]);
                    HASH[2] = safe_add(c, HASH[2]);
                    HASH[3] = safe_add(d, HASH[3]);
                    HASH[4] = safe_add(e, HASH[4]);
                    HASH[5] = safe_add(f, HASH[5]);
                    HASH[6] = safe_add(g, HASH[6]);
                    HASH[7] = safe_add(h, HASH[7]);
                }
                return HASH;
            }

            function safe_add(x, y) {
                var lsw = (x & 0xFFFF) + (y & 0xFFFF);
                var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xFFFF);
            }

            /*! base64x-1.1.3 (c) 2012-2014 Kenji Urushima | kjur.github.com/jsjws/license
             */
            /*
             * base64x.js - Base64url and supplementary functions for Tom Wu's base64.js library
             *
             * version: 1.1.3 (2014 May 25)
             *
             * Copyright (c) 2012-2014 Kenji Urushima (kenji.urushima@gmail.com)
             *
             * This software is licensed under the terms of the MIT License.
             * http://kjur.github.com/jsjws/license/
             *
             * The above copyright and license notice shall be
             * included in all copies or substantial portions of the Software.
             *
             * DEPENDS ON:
             *   - base64.js - Tom Wu's Base64 library
             */

            /**
             * Base64URL and supplementary functions for Tom Wu's base64.js library.<br/>
             * This class is just provide information about global functions
             * defined in 'base64x.js'. The 'base64x.js' script file provides
             * global functions for converting following data each other.
             * <ul>
             * <li>(ASCII) String</li>
             * <li>UTF8 String including CJK, Latin and other characters</li>
             * <li>byte array</li>
             * <li>hexadecimal encoded String</li>
             * <li>Full URIComponent encoded String (such like "%69%94")</li>
             * <li>Base64 encoded String</li>
             * <li>Base64URL encoded String</li>
             * </ul>
             * All functions in 'base64x.js' are defined in {@link _global_} and not
             * in this class.
             *
             * @class Base64URL and supplementary functions for Tom Wu's base64.js library
             * @author Kenji Urushima
             * @version 1.1 (07 May 2012)
             * @requires base64.js
             * @see <a href="http://kjur.github.com/jsjws/">'jwjws'(JWS JavaScript Library) home page http://kjur.github.com/jsjws/</a>
             * @see <a href="http://kjur.github.com/jsrsasigns/">'jwrsasign'(RSA Sign JavaScript Library) home page http://kjur.github.com/jsrsasign/</a>
             */
            function Base64x() {}

            // ==== base64 / base64url ================================
            /**
             * convert a Base64 encoded string to a Base64URL encoded string.<br/>
             * Example: "ab+c3f/==" &rarr; "ab-c3f_"
             * @param {String} s Base64 encoded string
             * @return {String} Base64URL encoded string
             */
            function b64tob64u(s) {
                s = s.replace(/\=/g, '');
                s = s.replace(/\+/g, '-');
                s = s.replace(/\//g, '_');
                return s;
            }

            var utf8tob64u, b64utoutf8;

            return {
                rstr2b64: rstr2b64,
                str2rstr_utf8: str2rstr_utf8,
                b64_hmac_sha256: b64_hmac_sha256,
                b64tob64u: b64tob64u
            }
        })();

    })();


    /* jshint camelcase:false */
    (function() {

        var jwt = corbel.jwt = {

            EXPIRATION: 3500,
            ALGORITHM: 'HS256',
            TYP: 'JWT',
            VERSION: '1.0.0',

            /**
             * JWT-HmacSHA256 generator
             * http://self-issued.info/docs/draft-ietf-oauth-json-web-token.html
             * @param  {Object}                                 claims Specific claims to include in the JWT (iss, aud, exp, scope, ...)
             * @param  {String} secret                          String with the client assigned secret
             * @param  {Object} [alg='corbel.jwt.ALGORITHM']    Object with the algorithm type
             * @return {String} jwt                             JWT string
             */
            generate: function(claims, secret, alg) {
                claims = claims || {};
                alg = alg || jwt.ALGORITHM;

                claims.exp = claims.exp || jwt._generateExp();

                if (!claims.iss) {
                    throw new Error('jwt:undefined:iss');
                }
                if (!claims.aud) {
                    throw new Error('jwt:undefined:aud');
                }
                if (!claims.scope) {
                    throw new Error('jwt:undefined:scope');
                }

                // Ensure claims specific order
                var claimsKeys = [
                    'iss',
                    'aud',
                    'exp',
                    'scope',
                    'prn',
                    'version',
                    'refresh_token',
                    'request_domain',

                    'basic_auth.username',
                    'basic_auth.password',

                    'device_id'
                ];

                var finalClaims = {};
                claimsKeys.forEach(function(key) {
                    if (claims[key]) {
                        finalClaims[key] = claims[key];
                    }
                });

                corbel.utils.extend(finalClaims, claims);

                if (Array.isArray(finalClaims.scope)) {
                    finalClaims.scope = finalClaims.scope.join(' ');
                }

                var bAlg = corbel.cryptography.rstr2b64(corbel.cryptography.str2rstr_utf8(JSON.stringify({
                        typ: jwt.TYP,
                        alg: alg
                    }))),
                    bClaims = corbel.cryptography.rstr2b64(corbel.cryptography.str2rstr_utf8(JSON.stringify(finalClaims))),
                    segment = bAlg + '.' + bClaims,
                    assertion = corbel.cryptography.b64tob64u(corbel.cryptography.b64_hmac_sha256(secret, segment));

                return segment + '.' + assertion;
            },

            _generateExp: function() {
                return Math.round((new Date().getTime() / 1000)) + jwt.EXPIRATION;
            },

            decode: function(assertion) {
                var serialize;
                if (corbel.Config.isNode) {
                    // node environment
                    serialize = require('atob');
                } else {
                    serialize = root.atob;
                }
                var decoded = assertion.split('.');

                try {
                    decoded[0] = JSON.parse(serialize(decoded[0]));
                } catch (e) {
                    console.log('error:jwt:decode:0');
                    decoded[0] = false;
                }

                try {
                    decoded[1] = JSON.parse(serialize(decoded[1]));
                } catch (e) {
                    console.log('error:jwt:decode:1');
                    decoded[1] = false;
                }

                if (!decoded[0] && !decoded[1]) {
                    throw new Error('corbel:jwt:decode:invalid_assertion');
                }

                decoded[0] = decoded[0] || {};
                decoded[1] = decoded[1] || {};

                Object.keys(decoded[1]).forEach(function(key) {
                    decoded[0][key] = decoded[1][key];
                });

                return decoded[0];
            }

        };

        return jwt;

    })();

    (function() {

        /**
         * Request object available for brwoser and node environment
         * @exports request
         * @namespace
         * @memberof corbel
         */
        var request = corbel.request = {
            /**
             * method constants
             * @namespace
             */
            method: {

                /**
                 * GET constant
                 * @constant
                 * @type {string}
                 * @default
                 */
                GET: 'GET',
                /**
                 * @constant
                 * @type {string}
                 * @default
                 */
                POST: 'POST',
                /**
                 * @constant
                 * @type {string}
                 * @default
                 */
                PUT: 'PUT',
                /**
                 * @constant
                 * @type {string}
                 * @default
                 */
                DELETE: 'DELETE',
                /**
                 * @constant
                 * @type {string}
                 * @default
                 */
                OPTIONS: 'OPTIONS',
                /**
                 * @constant
                 * @type {string}
                 * @default
                 */
                PATCH: 'PATCH',
                /**
                 * @constant
                 * @type {string}
                 * @default
                 */
                HEAD: 'HEAD'
            }
        };

        /**
         * Serialize handlers
         * @namespace
         */
        request.serializeHandlers = {
            /**
             * JSON serialize handler
             * @param  {object} data
             * @return {string}
             */
            json: function(data) {
                if (typeof data !== 'string') {
                    return JSON.stringify(data);
                } else {
                    return data;
                }
            },
            /**
             * Form serialize handler
             * @param  {object} data
             * @return {string}
             */
            'form-urlencoded': function(data) {
                return corbel.utils.toURLEncoded(data);
            },
            /**
             * dataURI serialize handler
             * @param  {object} data
             * @return {string}
             */
            'dataURI': function(data) {
                if (corbel.Config.isNode) {
                    //var buffer = new Buffer(data.split('base64,')[1], 'base64');
                } else {
                    return corbel.utils.dataURItoBlob(data);
                }
                // if browser transform to blob
                // if node transform to stream
                return corbel.utils.toURLEncoded(data);
            },
            /**
             * blob serialize handler
             * 'blob' type do not require serialization for browser, expode in node
             * @param  {object} data
             * @return {string}
             */
            'blob': function(data) {
                if (corbel.Config.isNode) {
                    throw new Error('error:request:unsupported:data_type');
                }
                return data;
            },
            /**
             * stream serialize handler
             * 'stream' type do not require serialization for ndoe, expode in browser
             * @param  {object} data
             * @return {string}
             */
            'stream': function(data) {
                    if (corbel.Config.isBrowser) {
                        throw new Error('error:request:unsupported:data_type');
                    }
                    return data;
                }
                // @todo: 'url' support
                // 'url' type convert in stream in node, explode in browser
        };

        /**
         * Serialize hada with according contentType handler
         * returns data if no handler available
         * @param  {mixed} data
         * @param  {string} contentType
         * @return {Mixed}
         */
        request.serialize = function(data, contentType) {
            var serialized;
            Object.keys(request.serializeHandlers).forEach(function(type) {
                if (contentType.indexOf(type) !== -1) {
                    serialized = request.serializeHandlers[type](data);
                }
            });
            serialized = serialized || data;
            return serialized;
        };

        /**
         * Parse handlers
         * @namespace
         */
        request.parseHandlers = {
            /**
             * JSON parse handler
             * @param  {string} data
             * @return {mixed}
             */
            json: function(data) {
                    data = data || '{}';
                    if (typeof data === 'string') {
                        data = JSON.parse(data);
                    }
                    return data;
                }
                // 'blob' type do not require any process
                // @todo: xml
        };

        /**
         * Process the server response data to the specified object/array/blob/byteArray/text
         * @param  {mixed} data                             The server response
         * @param  {string} type='array'|'blob'|'json'      The class of the server response
         * @param  {Stirng} dataType                        Is an extra param to form the blob object (if the type is blob)
         * @return {mixed}                                  Processed data
         */
        request.parse = function(data, responseType, dataType) {
            var parsed;
            Object.keys(request.parseHandlers).forEach(function(type) {
                if (responseType.indexOf(type) !== -1) {
                    parsed = request.parseHandlers[type](data, dataType);
                }
            });
            parsed = parsed || data;
            return parsed;
        };

        /**
         * Public method to make ajax request
         * @param  {object} options                                     Object options for ajax request
         * @param  {string} options.url                                 The request url domain
         * @param  {string} options.method                              The method used for the request
         * @param  {object} options.headers                             The request headers
         * @param  {string} options.responseType                        The response type of the body: `blob` | `undefined`
         * @param  {string} options.contentType                         The content type of the body
         * @param  {object | uint8array | blob} options.dataType        Optional data sent to the server
         * @param  {function} options.success                           Callback function for success request response
         * @param  {function} options.error                             Callback function for handle error in the request
         * @return {Promise}                                        Promise about the request status and response
         */
        request.send = function(options) {
            options = options || {};

            if (!options.url) {
                throw new Error('undefined:url');
            }

            var params = {
                method: options.method || request.method.GET,
                url: options.url,
                headers: typeof options.headers === 'object' ? options.headers : {},
                callbackSuccess: options.success && typeof options.success === 'function' ? options.success : undefined,
                callbackError: options.error && typeof options.error === 'function' ? options.error : undefined,
                responseType: options.responseType
            };

            // default content-type
            params.headers['content-type'] = options.contentType || 'application/json';

            var dataMethods = [request.method.PUT, request.method.POST, request.method.PATCH];
            if (dataMethods.indexOf(params.method) !== -1) {
                params.data = request.serialize(options.data, params.headers['content-type']);
            }

            var promise = new Promise(function(resolve, reject) {

                var resolver = {
                    resolve: resolve,
                    reject: reject
                };

                if (corbel.Config.isBrowser) {
                    //browser
                    request._browserAjax.call(this, params, resolver);
                } else {
                    //nodejs
                    request._nodeAjax.call(this, params, resolver);
                }
            }.bind(this));

            return promise;
        };

        var xhrSuccessStatus = {
            // file protocol always yields status code 0, assume 200
            0: 200,
            // Support: IE9
            // #1450: sometimes IE returns 1223 when it should be 204
            1223: 204
        };

        /**
         * Process server response
         * @param  {object} response
         * @param  {object} resolver
         * @param  {function} callbackSuccess
         * @param  {function} callbackError
         */
        var processResponse = function(response, resolver, callbackSuccess, callbackError) {

            //xhr = xhr.target || xhr || {};
            var statusCode = xhrSuccessStatus[response.status] || response.status,
                statusType = Number(response.status.toString()[0]),
                promiseResponse;

            if (statusType < 3) {

                var data = response.response;
                if (response.response) {
                    data = request.parse(response.response, response.responseType, response.dataType);
                }

                if (callbackSuccess) {
                    callbackSuccess.call(this, data, statusCode, response.responseObject);
                }

                promiseResponse = {
                    data: data,
                    status: statusCode,
                };

                promiseResponse[response.responseObjectType] = response.responseObject;

                resolver.resolve(promiseResponse);

            } else if (statusType === 4) {

                if (callbackError) {
                    callbackError.call(this, response.error, statusCode, response.responseObject);
                }

                promiseResponse = {
                    data: response.responseObject,
                    status: statusCode,
                    error: response.error
                };

                promiseResponse[response.responseObjectType] = response.responseObject;

                resolver.reject(promiseResponse);
            }

        };

        request._nodeAjax = function(params, resolver) {

            var request = require('request');

            request({
                method: params.method,
                url: params.url,
                headers: params.headers,
                body: params.data || ''
            }, function(error, response, body) {
                var responseType;
                var status;

                if (error) {
                    responseType = undefined;
                    status = 0;
                } else {
                    responseType = response.responseType || response.headers['content-type'];
                    status = response.statusCode;
                }

                processResponse.call(this, {
                    responseObject: response,
                    dataType: params.dataType,
                    responseType: responseType,
                    response: body,
                    status: status,
                    responseObjectType: 'response',
                    error: error
                }, resolver, params.callbackSuccess, params.callbackError);

            }.bind(this));

        };

        /**
         * Check if an url should be process as a crossdomain resource.
         * @param {string} url
         * @return {Boolean}
         */
        request.isCrossDomain = function(url) {
            if (url && url.indexOf('http') !== -1) {
                return true;
            } else {
                return false;
            }
        };

        request._browserAjax = function(params, resolver) {

            var httpReq = new XMLHttpRequest();

            if (request.isCrossDomain(params.url) && params.withCredentials) {
                httpReq.withCredentials = true;
            }

            httpReq.open(params.method, params.url, true);

            /* add request headers */
            for (var header in params.headers) {
                if (params.headers.hasOwnProperty(header)) {
                    httpReq.setRequestHeader(header, params.headers[header]);
                }
            }

            // 'blob' support
            httpReq.responseType = params.responseType || httpReq.responseType;

            httpReq.onload = function(xhr) {
                xhr = xhr.target || xhr; // only for mock testing purpose

                processResponse.call(this, {
                    responseObject: xhr,
                    dataType: xhr.dataType,
                    responseType: xhr.responseType || xhr.getResponseHeader('content-type'),
                    response: xhr.response || xhr.responseText,
                    status: xhr.status,
                    responseObjectType: 'xhr',
                    error: xhr.error
                }, resolver, params.callbackSuccess, params.callbackError);

                //delete callbacks
            }.bind(this);

            //response fail ()
            httpReq.onerror = function(xhr) {
                xhr = xhr.target || xhr; // only for fake sinon response xhr

                processResponse.call(this, {
                    responseObject: xhr,
                    dataType: xhr.dataType,
                    responseType: xhr.responseType || xhr.getResponseHeader('content-type'),
                    response: xhr.response || xhr.responseText,
                    status: xhr.status,
                    responseObjectType: 'xhr',
                    error: xhr.error
                }, resolver, params.callbackSuccess, params.callbackError);

            }.bind(this);

            httpReq.send(params.data);
        };

        return request;

    })();


    (function() {

        /**
         * A base object to inherit from for make corbel-js requests with custom behavior.
         * @exports Services
         * @namespace
         * @extends corbel.Object
         * @memberof corbel
         */
        var Services = corbel.Services = corbel.Object.inherit({ //instance props

            /**
             * Creates a new Services
             * @memberof corbel.Services.prototype
             * @param  {string}                         id String with the asset id or `all` key
             * @return {corbel.Services}
             */
            constructor: function(driver) {
                this.driver = driver;
            },

            /**
             * Execute the actual ajax request.
             * Retries request with refresh token when credentials are needed.
             * Refreshes the client when a force update is detected.
             * Returns a server error (corbel.Services._FORCE_UPDATE_STATUS_CODE - unsupported_version) when force update max retries are reached
             *
             * @memberof corbel.Services.prototype
             * @param  {Promise} dfd     The deferred object to resolve when the ajax request is completed.
             * @param  {object} args    The request arguments.
             */
            request: function(args) {

                var params = this._buildParams(args);

                var that = this;
                return this._doRequest(params).catch(function(response) {
                    var tokenObject = that.driver.config.get(corbel.Iam.IAM_TOKEN, {});
                    if (response.status === corbel.Services._UNAUTHORIZED_STATUS_CODE && tokenObject.refreshToken) {
                        return that._refreshHandler().then(function() {
                            return that._doRequest(that._buildParams(args));
                        }).catch(function() {
                            return Promise.reject(response);
                        });
                    } else {
                        console.log('corbeljs:services:no_refresh', response.status, !!tokenObject);
                        return Promise.reject(response);
                    }
                });

            },

            /**
             * Internal request method.
             * Has force update behavior
             * @param  {object} params
             * @return {Promise}
             */
            _doRequest: function(params) {
                var that = this;
                return corbel.request.send(params).then(function(response) {

                    that.driver.config.set(corbel.Services._FORCE_UPDATE_STATUS, 0);

                    return Promise.resolve(response);

                }).catch(function(response) {

                    // Force update
                    if (response.status === corbel.Services._FORCE_UPDATE_STATUS_CODE &&
                        response.textStatus === corbel.Services._FORCE_UPDATE_TEXT) {

                        var retries = that.driver.config.get(corbel.Services._FORCE_UPDATE_STATUS, 0);
                        if (retries < corbel.Services._FORCE_UPDATE_MAX_RETRIES) {
                            retries++;
                            that.driver.config.set(corbel.Services._FORCE_UPDATE_STATUS, retries);

                            corbel.utils.reload(); //TODO nodejs
                            // in node return rejected promise
                            return Promise.reject(response);
                        } else {
                            return Promise.reject(response);
                        }
                    } else {
                        return Promise.reject(response);
                    }

                });
            },

            /**
             * Default token refresh handler
             * @return {Promise}
             */
            _refreshHandler: function() {
                console.log('corbeljs:services:refresh');
                return this.driver.iam.token().refresh(this.driver.config.get(corbel.Iam.IAM_TOKEN, {}).refreshToken, this.driver.config.get(corbel.Iam.IAM_TOKEN_SCOPES));
            },

            /**
             * Add Authorization header with default tokenObject
             * @param {object} params request builded params
             */
            _addAuthorization: function(params) {
                // @todo: support to oauth token and custom handlers
                var accessToken = this.driver.config.get(corbel.Iam.IAM_TOKEN, {}).accessToken;

                // Use access access token if exists
                if (accessToken) {
                    params.headers.Authorization = 'Bearer ' + accessToken;
                }
                return params;
            },

            /**
             * Returns a valid corbel.request parameters with default values
             * and authorization params if needed.
             * By default, all request are json (dataType/contentType)
             * with object serialization support
             * 
             * @memberof corbel.Services.prototype
             * @param  {object} args
             * @return {object}
             */
            _buildParams: function(args) {

                // Default values
                var defaults = {
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    dataFilter: corbel.Services.addEmptyJson,
                    headers: {
                        Accept: 'application/json'
                    },
                    method: corbel.request.method.GET
                };
                var params = corbel.utils.defaults(args, defaults);

                if (!params.url) {
                    throw new Error('You must define an url');
                }

                if (params.query) {
                    params.url += '?' + params.query;
                }

                if (params.noRedirect) {
                    params.headers['No-Redirect'] = true;
                }

                if (params.Accept) {
                    params.headers.Accept = params.Accept;
                    params.dataType = undefined; // Accept & dataType are incompatibles
                }

                // set correct accept & contentType in case of blob
                // @todo: remove contentType+accept same-type constraint
                if (params.dataType === 'blob') {
                    if (corbel.Config.isBrowser) {
                        params.headers.Accept = params.data.type;
                        params.contentType = params.data.type;
                        params.dataType = undefined; // Accept & dataType are incompatibles
                    }
                }

                params = this._addAuthorization(params);

                return corbel.utils.pick(params, ['url', 'dataType', 'contentType', 'method', 'headers', 'data', 'dataFilter', 'responseType']);
            },

            /**
             * @memberof corbel.Services.prototype
             * @return {string}
             */
            _buildUri: function() {

                var uri = '';
                if (this.urlBase.slice(-1) !== '/') {
                    uri += '/';
                }

                Array.prototype.slice.call(arguments).forEach(function(argument) {
                    if (argument) {
                        uri += argument + '/';
                    }
                });

                // remove last '/'
                uri = uri.slice(0, -1);

                return this.urlBase + uri;
            }

        }, {

            /**
             * _FORCE_UPDATE_TEXT constant
             * @constant
             * @memberof corbel.Services
             * @type {string}
             * @default
             */
            _FORCE_UPDATE_TEXT: 'unsupported_version',

            /**
             * _FORCE_UPDATE_MAX_RETRIES constant
             * @constant
             * @memberof corbel.Services
             * @type {number}
             * @default
             */
            _FORCE_UPDATE_MAX_RETRIES: 3,

            /**
             * _FORCE_UPDATE_STATUS constant
             * @constant
             * @memberof corbel.Services
             * @type {string}
             * @default
             */
            _FORCE_UPDATE_STATUS: 'fu_r',

            /**
             * _FORCE_UPDATE_STATUS_CODE constant
             * @constant
             * @memberof corbel.Services
             * @type {number}
             * @default
             */
            _FORCE_UPDATE_STATUS_CODE: 403,

            /**
             * _UNAUTHORIZED_STATUS_CODE constant
             * @constant
             * @memberof corbel.Services
             * @type {number}
             * @default
             */
            _UNAUTHORIZED_STATUS_CODE: 401,

            /**
             * Extract a id from the location header of a requestXHR
             * @memberof corbel.Services
             * @param  {Promise} res response from a requestXHR
             * @return {String}  id from the Location
             */
            getLocationId: function(responseObject) {
                responseObject = responseObject || {};
                var location;

                if (responseObject.xhr) {
                    location = responseObject.xhr.getResponseHeader('location');
                } else if (responseObject.response && responseObject.response.headers.location) {
                    location = responseObject.response.headers.location;
                }
                return location ? location.substr(location.lastIndexOf('/') + 1) : undefined;
            },

            /**
             * @memberof corbel.Services
             * @param {mixed} response
             * @param {string} type
             * @return {midex}
             */
            addEmptyJson: function(response, type) {
                if (!response && type === 'json') {
                    response = '{}';
                }
                return response;
            }
        });

        return Services;

    })();


    //----------corbel modules----------------

    function Config(config) {
        config = config || {};
        // config default values
        this.config = {};

        corbel.utils.extend(this.config, config);
    }

    Config.URL_BASE_PLACEHOLDER = '{{module}}';

    corbel.Config = Config;

    var processExist = function() {
        return typeof(process) !== 'undefined' || {}.toString.call(process) === '[object process]';
    };


    if (typeof module !== 'undefined' && module.exports && processExist() && typeof window === 'undefined') {
        Config.__env__ = process.env.NODE_ENV === 'browser' ? 'browser' : 'node';
    } else {
        Config.__env__ = 'browser';
    }


    Config.isNode = Config.__env__ === 'node';

    Config.isBrowser = Config.__env__ === 'browser';

    /**
     * Client type
     * @type {String}
     * @default
     */
    Config.clientType = Config.isNode ? 'NODE' : 'WEB';

    if (Config.isNode) {
        Config.wwwRoot = 'localhost';
    } else {
        Config.wwwRoot = window.location.protocol + '//' + window.location.host + window.location.pathname;
    }

    /**
     * Returns all application config params
     * @return {Object}
     */
    Config.create = function(config) {
        return new Config(config);
    };

    /**
     * Returns all application config params
     * @return {Object}
     */
    Config.prototype.getConfig = function() {
        return this.config;
    };

    /**
     * Overrides current config with params object config
     * @param {Object} config An object with params to set as new config
     */
    Config.prototype.setConfig = function(config) {
        this.config = corbel.utils.extend(this.config, config);
        return this;
    };

    /**
     * Gets a specific config param
     * @param  {String} field config param name
     * @param  {Mixed} defaultValue Default value if undefined
     * @return {Mixed}
     */
    Config.prototype.get = function(field, defaultValue) {
        if (this.config[field] === undefined) {
            if (defaultValue === undefined) {
                throw new Error('config:undefined:' + field + '');
            } else {
                return defaultValue;
            }
        }

        return this.config[field];
    };

    /**
     * Sets a new value for specific config param
     * @param {String} field Config param name
     * @param {Mixed} value Config param value
     */
    Config.prototype.set = function(field, value) {
        this.config[field] = value;
    };

    (function() {

        /**
         * A module to make iam requests.
         * @exports iam
         * @namespace
         * @memberof app.corbel
         */

        var Iam = corbel.Iam = function(driver) {
            this.driver = driver;
        };

        Iam.moduleName = 'iam';

        Iam.create = function(driver) {
            return new Iam(driver);
        };

        Iam.GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
        Iam.AUD = 'http://iam.bqws.io';
        Iam.IAM_TOKEN = 'iamToken';
        Iam.IAM_TOKEN_SCOPES = 'iamScopes';

        /**
         * COMMON MIXINS
         */

        /**
         * Private method to build a string uri
         * @private
         * @param  {String} uri
         * @param  {String|Number} id
         * @return {String}
         */
        Iam._buildUri = function(uri, id) {
            if (id) {
                uri += '/' + id;
            }

            var urlBase = this.driver.config.get('iamEndpoint', null) ?
                this.driver.config.get('iamEndpoint') :
                this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, Iam.moduleName);

            return urlBase + uri;
        };

    })();

    (function() {

        /**
         * Creates a ClientBuilder for client managing requests.
         *
         * @param {String} domainId Domain id (optional).
         * @param {String} clientId Client id (optional).
         *
         * @return {corbel.Iam.ClientBuilder}
         */
        corbel.Iam.prototype.client = function(domainId, clientId) {
            var client = new ClientBuilder(domainId, clientId);
            client.driver = this.driver;
            return client;
        };

        /**
         * A builder for client management requests.
         *
         * @param {String} domainId Domain id.
         * @param {String} clientId Client id.
         *
         * @class
         * @memberOf iam
         */
        var ClientBuilder = corbel.Iam.ClientBuilder = corbel.Services.inherit({

            constructor: function(domainId, clientId) {
                this.domainId = domainId;
                this.clientId = clientId;
                this.uri = 'domain';
            },

            /**
             * Adds a new client.
             *
             * @method
             * @memberOf corbel.Iam.ClientBuilder
             *
             * @param {Object} client                          The client data.
             * @param {String} client.id                       Client id.
             * @param {String} client.name                     Client domain (obligatory).
             * @param {String} client.key                      Client key (obligatory).
             * @param {String} client.version                  Client version.
             * @param {String} client.signatureAlghorithm      Signature alghorithm.
             * @param {Object} client.scopes                   Scopes of the client.
             * @param {String} client.clientSideAuthentication Option for client side authentication.
             * @param {String} client.resetUrl                 Reset password url.
             * @param {String} client.resetNotificationId      Reset password notification id.
             *
             * @return {Promise} A promise with the id of the created client or fails
             *                   with a {@link corbelError}.
             */
            create: function(client) {
                console.log('iamInterface.domain.create', client);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.domainId + '/client'),
                    method: corbel.request.method.POST,
                    data: client,
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },

            /**
             * Gets a client.
             *
             * @method
             * @memberOf corbel.Iam.ClientBuilder
             *
             * @param {String} clientId Client id.
             *
             * @return {Promise} A promise with the client or fails with a {@link corbelError}.
             */
            get: function() {
                console.log('iamInterface.domain.get', this.clientId);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.domainId + '/client/' + this.clientId),
                    method: corbel.request.method.GET
                });
            },

            /**
             * Updates a client.
             *
             * @method
             * @memberOf corbel.Iam.ClientBuilder
             *
             * @param {Object} client                          The client data.
             * @param {String} client.name                     Client domain (obligatory).
             * @param {String} client.key                      Client key (obligatory).
             * @param {String} client.version                  Client version.
             * @param {String} client.signatureAlghorithm      Signature alghorithm.
             * @param {Object} client.scopes                   Scopes of the client.
             * @param {String} client.clientSideAuthentication Option for client side authentication.
             * @param {String} client.resetUrl                 Reset password url.
             * @param {String} client.resetNotificationId      Reset password notification id.
             *
             * @return {Promise} A promise or fails with a {@link corbelError}.
             */
            update: function(client) {
                console.log('iamInterface.domain.update', client);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.domainId + '/client/' + this.clientId),
                    method: corbel.request.method.PUT,
                    data: client
                });
            },

            /**
             * Removes a client.
             *
             * @method
             * @memberOf corbel.Iam.ClientBuilder
             *
             * @param {String} clientId The client id.
             *
             * @return {Promise} A promise or fails with a {@link corbelError}.
             */
            remove: function() {
                console.log('iamInterface.domain.remove', this.domainId, this.clientId);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.domainId + '/client/' + this.clientId),
                    method: corbel.request.method.DELETE
                });
            },

            _buildUri: corbel.Iam._buildUri

        });

    })();
    (function() {

        /**
         * Creates a DomainBuilder for domain managing requests.
         *
         * @param {String} domainId Domain id.
         *
         * @return {corbel.Iam.DomainBuilder}
         */
        corbel.Iam.prototype.domain = function(domainId) {
            var domain = new DomainBuilder(domainId);
            domain.driver = this.driver;
            return domain;
        };

        /**
         * A builder for domain management requests.
         *
         * @param {String} domainId Domain id (optional).
         *
         * @class
         * @memberOf iam
         */
        var DomainBuilder = corbel.Iam.DomainBuilder = corbel.Services.inherit({

            constructor: function(domainId) {
                this.domainId = domainId;
                this.uri = 'domain';
            },

            _buildUri: corbel.Iam._buildUri,

            /**
             * Creates a new domain.
             *
             * @method
             * @memberOf corbel.Iam.DomainBuilder
             *
             * @param {Object} domain                    The domain data.
             * @param {String} domain.description        Description of the domain.
             * @param {String} domain.authUrl            Authentication url.
             * @param {String} domain.allowedDomains     Allowed domains.
             * @param {String} domain.scopes             Scopes of the domain.
             * @param {String} domain.defaultScopes      Default copes of the domain.
             * @param {Object} domain.authConfigurations Authentication configuration.
             * @param {Object} domain.userProfileFields  User profile fields.
             *
             * @return {Promise} A promise with the id of the created domain or fails
             *                   with a {@link corbelError}.
             */
            create: function(domain) {
                console.log('iamInterface.domain.create', domain);
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: domain
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },

            /**
             * Gets a domain.
             *
             * @method
             * @memberOf corbel.Iam.DomainBuilder
             *
             * @return {Promise} A promise with the domain or fails with a {@link corbelError}.
             */
            get: function() {
                console.log('iamInterface.domain.get', this.domainId);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.domainId),
                    method: corbel.request.method.GET
                });
            },

            /**
             * Updates a domain.
             *
             * @method
             * @memberOf corbel.Iam.DomainBuilder
             *
             * @param {Object} domain                    The domain data.
             * @param {String} domain.description        Description of the domain.
             * @param {String} domain.authUrl            Authentication url.
             * @param {String} domain.allowedDomains     Allowed domains.
             * @param {String} domain.scopes             Scopes of the domain.
             * @param {String} domain.defaultScopes      Default copes of the domain.
             * @param {Object} domain.authConfigurations Authentication configuration.
             * @param {Object} domain.userProfileFields  User profile fields.
             *
             * @return {Promise} A promise or fails with a {@link corbelError}.
             */
            update: function(domain) {
                console.log('iamInterface.domain.update', domain);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.domainId),
                    method: corbel.request.method.PUT,
                    data: domain
                });
            },

            /**
             * Removes a domain.
             *
             * @method
             * @memberOf corbel.Iam.DomainBuilder
             *
             * @param {String} domainId The domain id.
             *
             * @return {Promise} A promise or fails with a {@link corbelError}.
             */
            remove: function() {
                console.log('iamInterface.domain.remove', this.domainId);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.domainId),
                    method: corbel.request.method.DELETE
                });
            }
        });

    })();
    (function() {

        /**
         * Creates a ScopeBuilder for scope managing requests.
         * @param {String} id Scope id.
         * @return {corbel.Iam.ScopeBuilder}
         */
        corbel.Iam.prototype.scope = function(id) {
            var scope = new ScopeBuilder(id);
            scope.driver = this.driver;
            return scope;
        };

        /**
         * A builder for scope management requests.
         *
         * @param {String} id Scope id.
         *
         * @class
         * @memberOf iam
         */
        var ScopeBuilder = corbel.Iam.ScopeBuilder = corbel.Services.inherit({

            constructor: function(id) {
                this.id = id;
                this.uri = 'scope';
            },

            _buildUri: corbel.Iam._buildUri,

            /**
             * Creates a new scope.
             *
             * @method
             * @memberOf corbel.Iam.ScopeBuilder
             *
             * @param {Object} scope        The scope.
             * @param {Object} scope.rules  Scope rules.
             * @param {String} scope.type   Scope type.
             * @param {Object} scope.scopes Scopes for a composite scope.
             *
             * @return {Promise} A promise with the id of the created scope or fails
             *                   with a {@link corbelError}.
             */
            create: function(scope) {
                console.log('iamInterface.scope.create', scope);
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: scope
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },

            /**
             * Gets a scope.
             *
             * @method
             * @memberOf corbel.Iam.ScopeBuilder
             *
             * @return {Promise} A promise with the scope or fails with a {@link corbelError}.
             */
            get: function() {
                console.log('iamInterface.scope.get', this.id);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.id),
                    method: corbel.request.method.GET
                });
            },

            /**
             * Removes a scope.
             *
             * @method
             * @memberOf corbel.Iam.ScopeBuilder
             * @return {Promise} A promise user or fails with a {@link corbelError}.
             */
            remove: function() {
                console.log('iamInterface.scope.remove', this.id);
                return this.request({
                    url: this._buildUri(this.uri + '/' + this.id),
                    method: corbel.request.method.DELETE
                });
            }

        });

    })();
    (function() {

        /**
         * Creates a TokenBuilder for token requests
         * @return {corbel.Iam.TokenBuilder}
         */
        corbel.Iam.prototype.token = function() {
            var tokenBuilder = new TokenBuilder(this.driver);
            tokenBuilder.driver = this.driver;
            return tokenBuilder;
        };

        /**
         * A builder for token requests
         * @class
         * @memberOf Iam
         */
        var TokenBuilder = corbel.Iam.TokenBuilder = corbel.Services.inherit({

            constructor: function() {
                this.uri = 'oauth/token';
            },

            _buildUri: corbel.Iam._buildUri,

            /**
             * Build a JWT with default driver config
             * @param  {Object} params
             * @param  {String} [params.secret]
             * @param  {Object} [params.claims]
             * @param  {String} [params.claims.iss]
             * @param  {String} [params.claims.aud]
             * @param  {String} [params.claims.scope]
             * @return {String} JWT assertion
             */
            _getJwt: function(params) {
                params = params || {};
                params.claims = params.claims || {};

                if (params.jwt) {
                    return params.jwt;
                }

                var secret = params.secret || this.driver.config.get('clientSecret');
                params.claims.iss = params.claims.iss || this.driver.config.get('clientId');
                params.claims.aud = params.claims.aud || corbel.Iam.AUD;
                params.claims.scope = params.claims.scope || this.driver.config.get('scopes');
                return corbel.jwt.generate(params.claims, secret);
            },

            _doGetTokenRequest: function(uri, params, setCookie) {
                var args = {
                    url: this._buildUri(uri),
                    method: corbel.request.method.GET,
                    query: corbel.utils.param(corbel.utils.extend({
                        assertion: this._getJwt(params),
                        'grant_type': corbel.Iam.GRANT_TYPE
                    }, params.oauth))
                };

                if (setCookie) {
                    args.headers = {
                        RequestCookie: 'true'
                    };
                }

                return corbel.request.send(args);
            },

            _doPostTokenRequest: function(uri, params, setCookie) {
                var args = {
                    url: this._buildUri(uri),
                    method: corbel.request.method.POST,
                    data: {
                        assertion: this._getJwt(params),
                        'grant_type': corbel.Iam.GRANT_TYPE
                    },
                    contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
                };

                if (setCookie) {
                    args.headers = {
                        RequestCookie: 'true'
                    };
                }
                return corbel.request.send(args);
            },

            /**
             * Creates a token to connect with iam
             * @method
             * @memberOf corbel.Iam.TokenBuilder
             * @param  {Object} params          Parameters to authorice
             * @param {String} [params.jwt]     Assertion to generate the token
             * @param {Object} [params.claims]  Claims to generate the token
             * @param {Boolean} [setCookie]     Sends 'RequestCookie' to server
             * @return {Promise}                Q promise that resolves to an AccessToken {Object} or rejects with a {@link corbelError}
             */
            create: function(params, setCookie) {
                params = params || {};
                // if there are oauth params this mean we should do use the GET verb
                var promise;
                if (params.oauth) {
                    promise = this._doGetTokenRequest(this.uri, params, setCookie);
                }
                // otherwise we use the traditional POST verb.
                promise = this._doPostTokenRequest(this.uri, params, setCookie);

                var that = this;
                return promise.then(function(response) {
                    that.driver.config.set(corbel.Iam.IAM_TOKEN, response.data);
                    if (params.jwt) {
                        that.driver.config.set(corbel.Iam.IAM_TOKEN_SCOPES, corbel.jwt.decode(params.jwt).scope);
                    }
                    if (params.claims) {
                        if (params.claims.scope) {
                            that.driver.config.set(corbel.Iam.IAM_TOKEN_SCOPES, params.claims.scope);
                        } else {
                            that.driver.config.set(corbel.Iam.IAM_TOKEN_SCOPES, this.driver.config.get('scopes'));
                        }
                    }
                    return response;
                });
            },

            /**
             * Refresh a token to connect with iam
             * @method
             * @memberOf corbel.Iam.TokenBuilder
             * @param {String} [refresh_token]   Token to refresh an AccessToken
             * @param {String} [scopes]          Scopes to the AccessToken
             * @return {Promise}                 Q promise that resolves to an AccesToken {Object} or rejects with a {@link corbelError}
             */
            refresh: function(refreshToken, scopes) {
                // console.log('iamInterface.token.refresh', refreshToken);
                // we need refresh token to refresh access token
                corbel.validate.isValue(refreshToken, 'Refresh access token request must contains refresh token');
                // we need create default claims to refresh access token
                var params = {
                    claims: {
                        'scope': scopes,
                        'refresh_token': refreshToken
                    }
                };
                var that = this;
                // we use the traditional POST verb to refresh access token.
                return this._doPostTokenRequest(this.uri, params).then(function(response) {
                    that.driver.config.set(corbel.Iam.IAM_TOKEN, response.data);
                    return response;
                });
            }

        });

    })();
    (function() {

        /**
         * Starts a username request
         * @return {corbel.Iam.UsernameBuilder}    The builder to create the request
         */
        corbel.Iam.prototype.username = function() {
            var username = new UsernameBuilder();
            username.driver = this.driver;
            return username;
        };

        /**
         * Builder for creating requests of users name
         * @class
         * @memberOf iam
         */
        var UsernameBuilder = corbel.Iam.UsernameBuilder = corbel.Services.inherit({

            constructor: function() {
                this.uri = 'username';
            },

            _buildUri: corbel.Iam._buildUri,

            /**
             * Return availability endpoint.
             * @method
             * @memberOf corbel.Iam.UsernameBuilder
             * @param  {String} username The username.
             * @return {Promise}     A promise which resolves into usename availability boolean state.
             */
            availability: function(username) {
                console.log('iamInterface.username.availability', username);
                return this.request({
                    url: this._buildUri(this.uri, username),
                    method: corbel.request.method.HEAD
                }).then(function() {
                    return false;
                }).catch(function(response) {
                    if (response.status === 404) {
                        return true;
                    } else {
                        return Promise.reject(response);
                    }
                });
            }
        });

    })();
    (function() {

        /**
         * Starts a user request
         * @param  {string} [id=undefined|id|'me'] Id of the user to perform the request
         * @return {corbel.Iam.UserBuilder|corbel.Iam.UsersBuilder}    The builder to create the request
         */
        corbel.Iam.prototype.user = function(id) {
            var builder;
            if (id) {
                builder = new UserBuilder(id);
            } else {
                builder = new UsersBuilder();
            }

            builder.driver = this.driver;
            return builder;
        };

        /**
         * getUser mixin for UserBuilder & UsersBuilder
         * @param  {string} uri
         * @param  {string} id
         * @param  {Bolean} postfix
         * @return {Promise}
         */
        corbel.Iam._getUser = function(method, uri, id, postfix) {
            return this.request({
                url: (postfix ? this._buildUri(uri, id) + postfix : this._buildUri(uri, id)),
                method: corbel.request.method.GET
            });
        };

        /**
         * Builder for a specific user requests
         * @class
         * @memberOf iam
         * @param {string} id The id of the user
         */
        var UserBuilder = corbel.Iam.UserBuilder = corbel.Services.inherit({

            constructor: function(id) {
                this.uri = 'user';
                this.id = id;
            },

            _buildUri: corbel.Iam._buildUri,
            _getUser: corbel.Iam._getUser,

            /**
             * Gets the user
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @return {Promise}  Q promise that resolves to a User {Object} or rejects with a {@link corbelError}
             */
            get: function() {
                console.log('iamInterface.user.get');
                return this._getUser(corbel.request.method.GET, this.uri, this.id);
            },

            /**
             * Updates the user
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @param  {Object} data    The data to update
             * @return {Promise}        Q promise that resolves to undefined (void) or rejects with a {@link corbelError}
             */
            update: function(data) {
                console.log('iamInterface.user.update', data);
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.PUT,
                    data: data
                });
            },

            /**
             * Deletes the user
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @return {Promise}  Q promise that resolves to undefined (void) or rejects with a {@link corbelError}
             */
            delete: function() {
                console.log('iamInterface.user.delete');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.DELETE
                });
            },

            /**
             * Sign Out the logged user.
             * @example
             * iam().user('me').signOut();
             * @method
             * @memberOf corbel.Iam.UsersBuilder
             * @return {Promise} Q promise that resolves to a User {Object} or rejects with a {@link corbelError}
             */
            signOut: function() {
                console.log('iamInterface.users.signOutMe');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/signout',
                    method: corbel.request.method.PUT
                });
            },

            /**
             * disconnect the user, all his tokens are deleted
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @return {Promise}  Q promise that resolves to undefined (void) or rejects with a {@link corbelError}
             */
            disconnect: function() {
                console.log('iamInterface.user.disconnect');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/disconnect',
                    method: corbel.request.method.PUT
                });
            },

            /**
             * Adds an identity (link to an oauth server or social network) to the user
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @param {Object} identity     The data of the identity
             * @param {string} oauthId      The oauth ID of the user
             * @param {string} oauthService The oauth service to connect (facebook, twitter, google, corbel)
             * @return {Promise}  Q promise that resolves to undefined (void) or rejects with a {@link corbelError}
             */
            addIdentity: function(identity) {
                // console.log('iamInterface.user.addIdentity', identity);
                corbel.validate.isValue(identity, 'Missing identity');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/identity',
                    method: corbel.request.method.POST,
                    data: identity
                });
            },

            /**
             * Get user identities (links to oauth servers or social networks)
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @return {Promise}  Q promise that resolves to {Array} of Identity or rejects with a {@link corbelError}
             */
            getIdentities: function() {
                console.log('iamInterface.user.getIdentities');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/identity',
                    method: corbel.request.method.GET
                });
            },

            /**
             * User device register
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @param  {Object} data      The device data
             * @param  {Object} data.URI  The device token
             * @param  {Object} data.name The device name
             * @param  {Object} data.type The device type (Android, Apple)
             * @return {Promise} Q promise that resolves to a User {Object} or rejects with a {@link corbelError}
             */
            registerDevice: function(data) {
                console.log('iamInterface.user.registerDevice');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/devices',
                    method: corbel.request.method.PUT,
                    data: data
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },

            /**
             * Get device
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @param  {string}  deviceId    The device id
             * @return {Promise} Q promise that resolves to a Device {Object} or rejects with a {@link corbelError}
             */
            getDevice: function(deviceId) {
                console.log('iamInterface.user.getDevice');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/devices/' + deviceId,
                    method: corbel.request.method.GET
                });
            },

            /**
             * Get all user devices
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @return {Promise} Q promise that resolves to a Device {Object} or rejects with a {@link corbelError}
             */
            getDevices: function() {
                console.log('iamInterface.user.getDevices');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/devices/',
                    method: corbel.request.method.GET
                });
            },

            /**
             * Delete user device
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @param  {string}  deviceId    The device id
             * @return {Promise} Q promise that resolves to a Device {Object} or rejects with a {@link corbelError}
             */
            deleteDevice: function(deviceId) {
                console.log('iamInterface.user.deleteDevice');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/devices/' + deviceId,
                    method: corbel.request.method.DELETE
                });
            },

            /**
             * Get user profiles
             * @method
             * @memberOf corbel.Iam.UserBuilder
             * @return {Promise}  Q promise that resolves to a User Profile or rejects with a {@link corbelError}
             */
            getProfile: function() {
                console.log('iamInterface.user.getProfile');
                return this.request({
                    url: this._buildUri(this.uri, this.id) + '/profile',
                    method: corbel.request.method.GET
                });
            }

        });


        /**
         * Builder for creating requests of users collection
         * @class
         * @memberOf iam
         */
        var UsersBuilder = corbel.Iam.UsersBuilder = corbel.Services.inherit({

            constructor: function() {
                this.uri = 'user';
            },

            _buildUri: corbel.Iam._buildUri,

            /**
             * Sends a reset password email to the email address recived.
             * @method
             * @memberOf oauth.UsersBuilder
             * @param  {string} userEmailToReset The email to send the message
             * @return {Promise}                 Q promise that resolves to undefined (void) or rejects with a {@link corbelError}
             */
            sendResetPasswordEmail: function(userEmailToReset) {
                console.log('iamInterface.users.sendResetPasswordEmail', userEmailToReset);
                var query = 'email=' + userEmailToReset;
                return this.request({
                    url: this._buildUri(this.uri + '/resetPassword'),
                    method: corbel.request.method.GET,
                    query: query
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },

            /**
             * Creates a new user.
             * @method
             * @memberOf corbel.Iam.UsersBuilder
             * @param  {Object} data The user data.
             * @return {Promise}     A promise which resolves into the ID of the created user or fails with a {@link corbelError}.
             */
            create: function(data) {
                console.log('iamInterface.users.create', data);
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: data
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },

            /**
             * Gets all users of the current domain
             * @method
             * @memberOf corbel.Iam.UsersBuilder
             * @return {Promise} Q promise that resolves to an {Array} of Users or rejects with a {@link corbelError}
             */
            get: function(params) {
                console.log('iamInterface.users.get', params);
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.GET,
                    query: params ? corbel.utils.serializeParams(params) : null
                });
            },

            getProfiles: function(params) {
                console.log('iamInterface.users.getProfiles', params);
                return this.request({
                    url: this._buildUri(this.uri) + '/profile',
                    method: corbel.request.method.GET,
                    query: params ? corbel.utils.serializeParams(params) : null //TODO cambiar por util e implementar dicho metodo
                });
            }

        });

    })();
    var aggregationBuilder = (function() {

        var aggregationBuilder = {};

        /**
         * Adds a count operation to aggregation
         * @param  {String} field Name of the field to aggregate or * to aggregate all
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        aggregationBuilder.count = function(field) {
            this.params.aggregation = this.params.aggregation || {};
            this.params.aggregation.$count = field;
            return this;
        };

        return aggregationBuilder;

    })();
    var queryBuilder = (function() {

        var queryBuilder = {};

        /**
         * Adds an Equal criteria to query
         * @param  {String} field
         * @param  {String | Number | Date} value
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.eq = function(field, value) {
            this.addCriteria('$eq', field, value);
            return this;
        };

        /**
         * Adds a Greater Than criteria to query
         * @param  {String} field
         * @param  {String | Number | Date} value
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.gt = function(field, value) {
            this.addCriteria('$gt', field, value);
            return this;
        };

        /**
         * Adds a Greater Than Or Equal criteria to query
         * @param  {String} field
         * @param  {String | Number | Date} value
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.gte = function(field, value) {
            this.addCriteria('$gte', field, value);
            return this;
        };

        /**
         * Adds a Less Than criteria to query
         * @param  {String} field
         * @param  {String | Number | Date} value
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.lt = function(field, value) {
            this.addCriteria('$lt', field, value);
            return this;
        };

        /**
         * Adds a Less Than Or Equal criteria to query
         * @param  {String} field
         * @param  {String | Number | Date} value
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.lte = function(field, value) {
            this.addCriteria('$lte', field, value);
            return this;
        };

        /**
         * Adds a Not Equal criteria to query
         * @param  {String} field
         * @param  {String | Number | Date} value
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.ne = function(field, value) {
            this.addCriteria('$ne', field, value);
            return this;
        };

        /**
         * Adds a Like criteria to query
         * @param  {String} field
         * @param  {String | Number | Date} value
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.like = function(field, value) {
            this.addCriteria('$like', field, value);
            return this;
        };

        /**
         * Adds an In criteria to query
         * @param  {String} field
         * @param  {String[]|Number[]|Date[]} values
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.in = function(field, values) {
            this.addCriteria('$in', field, values);
            return this;
        };

        /**
         * Adds an All criteria to query
         * @param  {String} field
         * @param  {String[]|Number[]|Date[]} values
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.all = function(field, values) {
            this.addCriteria('$all', field, values);
            return this;
        };

        /**
         * Adds an Element Match criteria to query
         * @param  {String} field
         * @param  {JSON} value Query for the matching
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        queryBuilder.elemMatch = function(field, query) {
            this.addCriteria('$elem_match', field, query);
            return this;
        };

        /**
         * Sets an specific queryDomain, by default 'api'.
         * @param {String} queryDomain query domain name, 'api' and '7digital' supported
         */
        queryBuilder.setQueryDomain = function(queryDomain) {
            this.params.queryDomain = queryDomain;
            return this;
        };

        queryBuilder.addCriteria = function(operator, field, value) {
            var criteria = {};
            criteria[operator] = {};
            criteria[operator][field] = value;
            this.params.query = this.params.query || [];
            this.params.query.push(criteria);
            return this;
        };

        return queryBuilder;

    })();
    var pageBuilder = (function() {

        var pageBuilder = {};

        /**
         * Sets the page number of the page param
         * @param  {int} page
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        pageBuilder.page = function(page) {
            this.params.pagination = this.params.pagination || {};
            this.params.pagination.page = page;
            return this;
        };

        /**
         * Sets the page size of the page param
         * @param  {int} size
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        pageBuilder.pageSize = function(size) {
            this.params.pagination = this.params.pagination || {};
            this.params.pagination.size = size;
            return this;
        };

        /**
         * Sets the page number and page size of the page param
         * @param  {int} size
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        pageBuilder.pageParam = function(page, size) {
            this.params.pagination = this.params.pagination || {};
            this.params.pagination.page = page;
            this.params.pagination.size = size;
            return this;
        };

        return pageBuilder;


    })();
    var sortBuilder = (function() {

        var sortBuilder = {};

        /**
         * Sets ascending direction to sort param
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        sortBuilder.asc = function(field) {
            this.params.sort = this.params.sort || {};
            this.params.sort[field] = corbel.Resources.sort.ASC;
            return this;
        };

        /**
         * Sets descending direction to sort param
         * @return {RequestParamsBuilder} RequestParamsBuilder
         */
        sortBuilder.desc = function(field) {
            this.params.sort = this.params.sort || {};
            this.params.sort[field] = corbel.Resources.sort.DESC;
            return this;
        };

        return sortBuilder;
    })();
    (function(aggregationBuilder, queryBuilder, sortBuilder, pageBuilder) {



        /**
         * A module to build Request Params
         * @exports requestParamsBuilder
         * @namespace
         * @memberof app.silkroad
         */
        corbel.requestParamsBuilder = corbel.Object.inherit({
            constructor: function() {
                this.params = {};
            },
            /**
             * Returns the JSON representation of the params
             * @return {JSON} representation of the params
             */
            build: function() {
                return this.params;
            }
        });


        corbel.utils.extend(corbel.requestParamsBuilder.prototype, queryBuilder, sortBuilder, aggregationBuilder, pageBuilder);

        return corbel.requestParamsBuilder;

    })(aggregationBuilder, queryBuilder, sortBuilder, pageBuilder);
    (function() {
        /**
         * An assets API factory
         * @exports corbel.Assets
         * @namespace
         * @extends corbel.Object
         * @memberof corbel
         */
        corbel.Assets = corbel.Object.inherit({

            /**
             * Creates a new AssetsBuilder
             * @memberof corbel.Assets.prototype
             * @param  {string} id String with the asset id or `all` key
             * @return {corbel.Assets.AssetsBuilder}
             */
            constructor: function(driver) {
                this.driver = driver;

                return function(id) {
                    var builder = new corbel.Assets.AssetsBuilder(id);
                    builder.driver = driver;
                    return builder;
                };
            },


        }, {

            /**
             * moduleName constant
             * @constant
             * @memberof corbel.Assets
             * @type {string}
             * @default
             */
            moduleName: 'assets',

            /**
             * AssetsBuilder factory
             * @memberof corbel.Assets
             * @param  {corbel} corbel instance driver
             * @return {corbel.Assets.AssetsBuilder}
             */
            create: function(driver) {
                return new corbel.Assets(driver);
            }

        });

        return corbel.Assets;

    })();

    (function() {

        /**
         * Module for organize user assets
         * @exports AssetsBuilder
         * @namespace
         * @extends corbel.Services
         * @memberof corbel.Assets
         */
        var AssetsBuilder = corbel.Assets.AssetsBuilder = corbel.Services.inherit({

            /**
             * Creates a new AssetsBuilder
             * @memberof corbel.Assets.AssetsBuilder.prototype
             * @param  {string}                         id string with the asset id or `all` key
             * @return {corbel.Assets.AssetsBuilder}
             */
            constructor: function(id) {
                this.uri = 'asset';
                this.id = id;
            },

            /**
             * Gets my user assets
             * @memberof corbel.Assets.AssetsBuilder.prototype
             * @param  {object} [params]      Params of a {@link corbel.request}
             * @return {Promise}              Promise that resolves with an Asset or rejects with a {@link CorbelError}
             */
            get: function(params) {

                var options = params ? params : {};

                var args = corbel.utils.extend(options, {
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.GET,
                    query: params ? corbel.utils.serializeParams(params) : null
                });

                return this.request(args);

            },

            /**
             * Delete asset
             * @memberof corbel.Assets.AssetsBuilder.prototype
             * @return {Promise}                Promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            delete: function() {
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.DELETE
                });
            },

            /**
             * Creates a new asset
             * @memberof corbel.Assets.AssetsBuilder.prototype
             * @param {object}  data            Contains the data of the new asset
             * @param {string}  data.userId     The user id
             * @param {string}  data.name       The asset name
             * @param {date}    data.expire     Expire date
             * @param {boolean} data.active     If asset is active
             * @param {array}   data.scopes     Scopes of the asset
             * @return {Promise}                Promise that resolves in the new asset id or rejects with a {@link CorbelError}
             */
            create: function(data) {
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: data
                }).
                then(function(res) {
                    return corbel.Services.getLocationId(res);
                });
            },

            /**
             * Generates a JWT that contains the scopes of the actual user's assets and redirects to iam to upgrade user's token
             * @memberof corbel.Assets.AssetsBuilder.prototype
             * @return {Promise} Promise that resolves to a redirection to iam/oauth/token/upgrade or rejects with a {@link CorbelError}
             */
            access: function(params) {
                var args = params || {};
                args.url = this._buildUri(this.uri + '/access');
                args.method = corbel.request.method.GET;
                args.noRedirect = true;

                var that = this;
                return that.request(args).then(function(uri) {
                    return that.request({
                        noRetry: args.noRetry,
                        url: uri
                    });
                });
            },

            _buildUri: function(path, id) {
                var uri = '',
                    urlBase = this.driver.config.get('assetsEndpoint', null) ?
                    this.driver.config.get('assetsEndpoint') :
                    this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, corbel.Assets.moduleName);

                uri = urlBase + path;
                if (id) {
                    uri += '/' + id;
                }
                return uri;
            }

        }, {

            /**
             * GET constant
             * @constant
             * @memberof corbel.Assets.AssetsBuilder
             * @type {string}
             * @default
             */
            moduleName: 'assets',

            /**
             * Factory
             * @memberof corbel.Assets.AssetsBuilder
             * @type {string}
             * @default
             */
            create: function(driver) {
                return new corbel.Assets.AssetsBuilder(driver);
            }

        });

        return AssetsBuilder;

    })();

    (function() {
        corbel.Resources = corbel.Object.inherit({

            constructor: function(driver) {
                this.driver = driver;
            },

            collection: function(type) {
                return new corbel.Resources.Collection(type, this.driver);
            },

            resource: function(type, id) {
                return new corbel.Resources.Resource(type, id, this.driver);
            },

            relation: function(srcType, srcId, destType) {
                return new corbel.Resources.Relation(srcType, srcId, destType, this.driver);
            }

        }, {

            moduleName: 'resources',

            sort: {

                /**
                 * Ascending sort
                 * @type {String}
                 * @constant
                 * @default
                 */
                ASC: 'asc',

                /**
                 * Descending sort
                 * @type {String}
                 * @constant
                 * @default
                 */
                DESC: 'desc'

            },

            /**
             * constant for use to specify all resources wildcard
             * @namespace
             */
            ALL: '_',

            create: function(driver) {
                return new corbel.Resources(driver);
            }

        });

        return corbel.Resources;

    })();
    (function() {
        corbel.Resources.BaseResource = corbel.Services.inherit({

            /**
             * Helper function to build the request uri
             * @param  {String} srcType     Type of the resource
             * @param  {String} srcId       Id of the resource
             * @param  {String} relType     Type of the relationed resource
             * @param  {String} destId      Information of the relationed resource
             * @return {String}             Uri to perform the request
             */
            buildUri: function(srcType, srcId, destType, destId) {

                var urlBase = this.driver.config.get('resourcesEndpoint', null) ?
                    this.driver.config.get('resourcesEndpoint') :
                    this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, corbel.Resources.moduleName);

                var uri = urlBase + 'resource/' + srcType;

                if (srcId) {
                    uri += '/' + srcId;
                    if (destType) {
                        uri += '/' + destType;
                        if (destId) {
                            uri += ';r=' + destType + '/' + destId;
                        }
                    }
                }

                return uri;
            },

            request: function(args) {
                var params = corbel.utils.extend(this.params, args);

                this.params = {}; //reset instance params

                args.query = corbel.utils.serializeParams(params);

                //call service request implementation
                return corbel.Services.prototype.request.apply(this, [args].concat(Array.prototype.slice.call(arguments, 1)));
            },

            getURL: function(params) {
                return this.buildUri(this.type, this.srcId, this.destType) + (params ? '?' + corbel.utils.serializeParams(params) : '');
            },

            getDefaultOptions: function(options) {
                options = options || {};

                return options;
            }

        });

        // extend for inherit requestParamsBuilder methods extensible for all Resources object
        corbel.utils.extend(corbel.Resources.BaseResource.prototype, corbel.requestParamsBuilder.prototype);

        return corbel.Resources.BaseResource;

    })();

    (function() {
        /**
         * Relation
         * @class
         * @memberOf Resources
         * @param  {String} srcType     The source resource type
         * @param  {String} srcId       The source resource id
         * @param  {String} destType    The destination resource type
         */
        corbel.Resources.Relation = corbel.Resources.BaseResource.inherit({

            constructor: function(srcType, srcId, destType, driver, params) {
                this.type = srcType;
                this.srcId = srcId;
                this.destType = destType;
                this.driver = driver;
                this.params = params || {};
            },

            /**
             * Gets the resources of a relation
             * @method
             * @memberOf Resources.Relation
             * @param  {String} dataType    Mime type of the expected resource
             * @param  {String} destId         Relationed resource
             * @param  {Object} params      Params of the silkroad request
             * @return {Promise}            ES6 promise that resolves to a relation {Object} or rejects with a {@link CorbelError}
             * @see {@link corbel.util.serializeParams} to see a example of the params
             */
            get: function(destId, options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type, this.srcId, this.destType, destId),
                    method: corbel.request.method.GET,
                    Accept: options.dataType
                });

                return this.request(args);
            },

            /**
             * Adds a new relation between Resources
             * @method
             * @memberOf Resources.Relation
             * @param  {String} destId          Relationed resource
             * @param  {Object} relationData Additional data to be added to the relation (in json)
             * @return {Promise}             ES6 promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             * @example uri = '555'
             */
            add: function(destId, relationData, options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type, this.srcId, this.destType, destId),
                    contentType: 'application/json',
                    data: relationData,
                    method: corbel.request.method.POST
                });

                return this.request(args);
            },

            /**
             * Move a relation
             * @method
             * @memberOf Resources.Relation
             * @param  {Integer} pos          The new position
             * @return {Promise}              ES6 promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            move: function(destId, pos, options) {

                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type, this.srcId, this.destType, destId),
                    contentType: 'application/json',
                    data: {
                        '_order': '$pos(' + pos + ')'
                    },
                    method: corbel.request.method.PUT
                });

                return this.request(args);
            },

            /**
             * Deletes a relation between Resources
             * @method
             * @memberOf Resources.Relation
             * @param  {String} destId          Relationed resource
             * @return {Promise}                ES6 promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             * @example
             * destId = 'music:Track/555'
             */
            delete: function(destId, options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type, this.srcId, this.destType, destId),
                    method: corbel.request.method.DELETE
                });

                return this.request(args);
            }

        });

        return corbel.Resources.Relation;

    })();
    (function() {

        /**
         * Collection requests
         * @class
         * @memberOf Resources
         * @param {String} type The collection type
         * @param {CorbelDriver} corbel instance
         */
        corbel.Resources.Collection = corbel.Resources.BaseResource.inherit({

            constructor: function(type, driver, params) {
                this.type = type;
                this.driver = driver;
                this.params = params || {};
            },

            /**
             * Gets a collection of elements, filtered, paginated or sorted
             * @method
             * @memberOf Resources.CollectionBuilder
             * @param  {object} options             Get options for the request
             * @return {Promise}                    ES6 promise that resolves to an {Array} of Resources or rejects with a {@link CorbelError}
             * @see {@link corbel.util.serializeParams} to see a example of the params
             */
            get: function(options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type),
                    method: corbel.request.method.GET,
                    Accept: options.dataType
                });

                return this.request(args);
            },

            /**
             * Adds a new element to a collection
             * @method
             * @memberOf Resources.CollectionBuilder
             * @param  {object} data      Data array added to the collection
             * @param  {object} options     Options object with dataType request option
             * @return {Promise}            ES6 promise that resolves to the new resource id or rejects with a {@link CorbelError}
             */
            add: function(data, options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type),
                    method: corbel.request.method.POST,
                    contentType: options.dataType,
                    Accept: options.dataType,
                    data: data
                });

                return this.request(args).then(function(res) {
                    return corbel.Services.getLocationId(res);
                });
            },

            /**
             * Delete a collection
             * @method
             * @memberOf Resources.CollectionBuilder
             * @param  {object} options     Options object with dataType request option
             * @return {Promise}            ES6 promise that resolves to the new resource id or rejects with a {@link CorbelError}
             */
            delete: function(options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type),
                    method: corbel.request.method.DELETE,
                    contentType: options.dataType,
                    Accept: options.dataType
                });

                return this.request(args);
            }

        });

        return corbel.Resources.Collection;

    })();
    (function() {
        /**
         * Builder for resource requests
         * @class
         * @memberOf resources
         * @param  {String} type    The resource type
         * @param  {String} id      The resource id
         */
        corbel.Resources.Resource = corbel.Resources.BaseResource.inherit({

            constructor: function(type, id, driver, params) {
                this.type = type;
                this.id = id;
                this.driver = driver;
                this.params = params || {};
            },

            /**
             * Gets a resource
             * @method
             * @memberOf resources.Resource
             * @param  {Object} options
             * @param  {String} [options.dataType]      Mime type of the expected resource
             * @param  {Object} [options.params]        Additional request parameters
             * @return {Promise}                        ES6 promise that resolves to a Resource {Object} or rejects with a {@link CorbelError}
             * @see {@link services.request} to see a example of the params
             */
            get: function(options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type, this.id),
                    method: corbel.request.method.GET,
                    contentType: options.dataType,
                    Accept: options.dataType
                });

                return this.request(args);
            },

            /**
             * Updates a resource
             * @method
             * @memberOf resources.Resource
             * @param  {Object} data                    Data to be updated
             * @param  {Object} options
             * @param  {String} [options.dataType]      Mime tipe of the sent data
             * @param  {Object} [options.params]        Additional request parameters
             * @return {Promise}                        ES6 promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             * @see {@link services.request} to see a example of the params
             */
            update: function(data, options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type, this.id),
                    method: corbel.request.method.PUT,
                    data: data,
                    contentType: options.dataType
                });

                return this.request(args);
            },

            /**
             * Deletes a resource
             * @method
             * @memberOf resources.Resource
             * @param  {Object} options
             * @param  {Object} [options.dataType]      Mime tipe of the delete data
             * @return {Promise}                        ES6 promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            delete: function(options) {
                options = this.getDefaultOptions(options);

                var args = corbel.utils.extend(options, {
                    url: this.buildUri(this.type, this.id),
                    method: corbel.request.method.DELETE,
                    contentType: options.dataType,
                    Accept: options.dataType
                });

                return this.request(args);
            }

        });

        return corbel.Resources.Resource;

    })();

    (function() {

        /**
         * A module to make Oauth requests.
         * @exports Oauth
         * @namespace
         * @memberof app.corbel
         */

        var Oauth = corbel.Oauth = function(driver) {
            this.driver = driver;
        };

        Oauth.moduleName = 'oauth';

        Oauth.create = function(driver) {
            return new Oauth(driver);
        };
        /**
         * Private method to build a string uri
         * @private
         * @param  {String} uri
         * @return {String}
         */
        Oauth._buildUri = function(uri) {

            var urlBase = this.driver.config.get('oauthEndpoint', null) ?
                this.driver.config.get('oauthEndpoint') :
                this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, Oauth.moduleName);

            return urlBase + uri;
        };
        /**
         * Default encoding
         * @type {String}
         * @default application/x-www-form-urlencoded; charset=UTF-8
         */
        Oauth._URL_ENCODED = 'application/x-www-form-urlencoded; charset=UTF-8';

        Oauth._checkProp = function(dict, keys, excep) {
            var error = excep ? excep : 'Error validating arguments';
            if (!dict) {
                throw new Error(error);
            }
            for (var i in keys) {
                if (!(keys[i] in dict)) {
                    throw new Error(error);
                }
            }
        };

        Oauth._validateResponseType = function(responseType) {
            if (['code', 'token'].indexOf(responseType) < 0) {
                throw new Error('Only "code" or "token" response type allowed');
            }
        };

        Oauth._validateGrantType = function(grantType) {
            if (grantType !== 'authorization_code') {
                throw new Error('Only "authorization_code" grant type is allowed');
            }
        };

        Oauth._trasformParams = function(clientParams) {

            for (var key in clientParams) {
                var keyWithUnderscores = this._toUnderscore(key);
                if (key !== keyWithUnderscores) {
                    clientParams[keyWithUnderscores] = clientParams[key];
                    delete clientParams[key];
                }
            }
            return clientParams;
        };

        Oauth._toUnderscore = function(string) {
            return string.replace(/([A-Z])/g, function($1) {
                return '_' + $1.toLowerCase();
            });
        };
    })();

    (function() {
        /**
         * Create a AuthorizationBuilder for resource managing requests.
         *
         * @param {Object} clientParams  Initial params
         *
         * @return {corbel.Oauth.AuthorizationBuilder}
         */
        corbel.Oauth.prototype.authorization = function(clientParams) {
            console.log('oauthInterface.authorization', clientParams);

            corbel.Oauth._checkProp(clientParams, ['responseType'], 'Invalid client parameters');
            clientParams.responseType = clientParams.responseType.toLowerCase();
            corbel.Oauth._validateResponseType(clientParams.responseType);
            if (clientParams.responseType.toLowerCase() === 'code') {
                corbel.Oauth._checkProp(clientParams, ['redirectUri'], 'Invalid client parameters');
            }
            clientParams.clientId = clientParams.clientId || corbel.Config.get('oauthClientId');
            var params = {
                contentType: corbel.Oauth._URL_ENCODED,
                data: corbel.Oauth._trasformParams(clientParams),
                // http://stackoverflow.com/questions/1557602/jquery-and-ajax-response-header
                noRedirect: true
            };
            var authorization = new AuthorizationBuilder(params);
            authorization.driver = this.driver;
            return authorization;
        };

        /**
         * A builder for authorization management requests.
         *
         * @param {Object} params  Initial params
         *
         * @class
         * @memberOf corbel.Oauth.AuthorizationBuilder
         */
        var AuthorizationBuilder = corbel.Oauth.AuthorizationBuilder = corbel.Services.inherit({

            constructor: function(params) {
                this.params = params;
                this.uri = 'oauth';
            },

            /**
             * Does a login with stored cookie in oauth server
             * @method
             * @memberOf corbel.Oauth.AuthorizationBuilder
             * @return {Promise} Q promise that resolves to a redirection to redirectUri or rejects with a 404 {@link CorbelError}
             */
            loginWithCookie: function() {
                console.log('oauthInterface.authorization.dialog');
                // make request, generate oauth cookie, then redirect manually
                return this.request({
                    url: this._buildUri(this.uri + '/authorize'),
                    method: corbel.request.method.GET,
                    dataType: 'text',
                    withCredentials: true,
                    data: this.params,
                    query: this.params.data ? corbel.utils.serializeParams(this.params.data) : null
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },
            /**
             * Does a login in oauth server
             * @method
             * @memberOf corbel.Oauth.AuthorizationBuilder
             * @param  {String} username The username of the user to log in
             * @param  {String} password The password of the user
             * @return {Promise}         Q promise that resolves to a redirection to redirectUri or rejects with a {@link CorbelError}
             */
            login: function(username, password, setCookie) {
                console.log('oauthInterface.authorization.login', username + ':' + password);
                this.params.username = username;
                this.params.password = password;
                this.params.setCookie = setCookie;
                this.params.withCredentials = true;
                // make request, generate oauth cookie, then redirect manually
                return this.request({
                    url: this._buildUri(this.uri + '/authorize'),
                    method: corbel.request.method.POST,
                    data: this.params
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },
            /**
             * Sign out from oauth server
             * @method
             * @memberOf corbel.Oauth.SignOutBuilder
             * @return {Promise}     promise that resolves empty when the sign out process completes or rejects with a {@link CorbelError}
             */
            signout: function() {
                console.log('oauthInterface.authorization.signOut');
                delete this.params.data;
                return this.request({
                    url: this._buildUri(this.uri + '/signout'),
                    method: corbel.request.method.GET,
                    withCredentials: true
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },

            _buildUri: corbel.Oauth._buildUri
        });
    })();

    (function() {
        /**
         * Create a TokenBuilder for token managing requests.
         * Starts to build a token request
         * @method
         * @param  {Object} clientParams
         * @param  {String} [clientParams.clientId=corbel.Config.get('oauthClientId')]    Client id
         * @param  {String} [clientParams.clientSecret=corbel.Config.get('oauthSecret')]  Client secret
         * @param  {String} clientParams.grantType                                        The grant type (only allowed 'authorization_code')
         * @return {corbel.Oauth.TokenBuilder}
         */
        corbel.Oauth.prototype.token = function(clientParams) {
            console.log('oauthInterface.token');

            corbel.Oauth._checkProp(clientParams, ['grantType'], 'Invalid client parameters');
            corbel.Oauth._validateGrantType(clientParams.grantType);
            clientParams.clientId = clientParams.clientId || corbel.Config.get('oauthClientId');
            clientParams.clientSecret = clientParams.clientSecret || corbel.Config.get('oauthSecret');
            var params = {
                contentType: corbel.Oauth._URL_ENCODED,
                data: corbel.Oauth._trasformParams(clientParams)
            };
            var token = new TokenBuilder(params);
            token.driver = this.driver;
            return token;
        };
        /**
         * A builder for a token management requests.
         * @class
         *
         * @param {Object} params Initial params
         * 
         * @memberOf corbel.Oauth.TokenBuilder
         */
        var TokenBuilder = corbel.Oauth.TokenBuilder = corbel.Services.inherit({

            constructor: function(params) {
                this.params = params;
                this.uri = 'oauth/token';
            },
            /**
             * Get an access token
             * @method
             * @memberOf corbel.Oauth.TokenBuilder
             * 
             * @param  {String} code The code to exchange for the token
             * 
             * @return {Promise}     promise that resolves to an access token  {Object}  or rejects with a {@link CorbelError}
             */
            get: function(code) {
                console.log('oauthInterface.token.get');
                this.params.data.code = code;
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: this.params
                });
            },

            _buildUri: corbel.Oauth._buildUri
        });
    })();

    (function() {
        /**
         * Create a UserBuilder for user managing requests.
         * Starts a user request
         * @method
         * @param  {Object} clientParams
         * @param  {String} [clientParams.clientId=corbel.Config.get('oauthClientId')]    Client id
         * @param  {String} [clientParams.clientSecret=corbel.Config.get('oauthSecret')]  Client secret
         * @param  {String} clientParams.grantType                                        The grant type (only allowed 'authorization_code')
         * @return {corbel.Oauth.UserBuilder}
         */
        corbel.Oauth.prototype.user = function(clientParams, accessToken) {
            console.log('oauthInterface.user');

            var params = {};

            if (accessToken) {
                params.accessToken = accessToken;
                params.headers = {};
                params.headers.Accept = 'application/json';
            }

            clientParams = clientParams || {};
            var clientId = clientParams.clientId || corbel.Config.get('oauthClientId');
            var clientSecret = clientParams.clientSecret || corbel.Config.get('oauthSecret');

            var user = new UserBuilder(params, clientId, clientSecret);
            user.driver = this.driver;
            return user;
        };
        /**
         * A builder for a user management requests.
         * @class
         * 
         * @param {Object} params           Parameters for initializing the builder
         * @param {String} [clientId]       Application client Id (required for creating user)
         * @param {String} [clientSecret]   Application client secret (required for creating user)
         *    
         * @memberOf corbel.Oauth.UserBuilder
         */
        var UserBuilder = corbel.Oauth.UserBuilder = corbel.Services.inherit({

            constructor: function(params, clientId, clientSecret) {
                this.params = params;
                this.clientSecret = clientSecret;
                this.clientId = clientId;
                this.uri = 'oauth/user';
            },
            _buildUri: corbel.Oauth._buildUri,
            /**
             * Adds a new user to the oauth server.
             *
             * @method
             * @memberOf corbel.Oauth.UserBuilder
             *
             * @param {Object} user    The user to be created
             * @param {String} username The username of the user
             * @param {String} email    The email of the user
             * @param {String} password The password of the user
             *
             * @return {Promise} A promise with the id of the created user or fails
             *                   with a {@link corbelError}.
             */
            create: function(user) {
                console.log('oauthInterface.user.create', user);

                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    headers: {
                        Authorization: 'Basic ' + this.getSerializer()(this.clientId + ':' + this.clientSecret)
                    },
                    dataType: 'text',
                    data: user
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },
            /**
             * Gets the user or the logged user
             * @method
             * @memberOf corbel.Oauth.UserBuilder
             * 
             * @param  {Object} id      The user id/me 
             *  
             * @return {Promise}  Q promise that resolves to a User {Object} or rejects with a {@link corbelError}
             */
            get: function(id) {
                console.log('oauthInterface.user.get');
                this.uri += '/' + id;
                return this.request({
                    url: this._buildUri(this.uri, this.uri),
                    method: corbel.request.method.GET
                });
            },
            /**
             * Get profile of some user or the logged user
             * @method
             * @memberOf corbel.Oauth.UserBuilder
             * @param  {Object} id      The user id/me 
             * @return {Promise}        Q promise that resolves to the profile from User {Object} or rejects with a {@link corbelError}
             */
            getProfile: function(id) {
                console.log('oauthInterface.user.getProfile');
                this.uri += '/' + id + '/profile';
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.GET
                });
            },
            /**
             * Updates the user or  the logged user
             * @method
             * @memberOf corbel.Oauth.UserBuilder
             * 
             * @param  {Object} id              The user id or me
             * @param  {Object} modification    Json object with the modificacion of the user
             * 
             * @return {Promise}        Q promise that resolves to undefined (void) or rejects with a {@link corbelError}
             */
            update: function(id, modification) {
                console.log('oauthInterface.user.update', modification);
                this.uri += '/' + id;
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.PUT,
                    data: modification
                });
            },
            /**
             * Deletes the user or the logged user
             * @memberOf corbel.Oauth.UserBuilder
             * 
             * @param  {Object} id        The user id or me
             * 
             * @return {Promise}  Q promise that resolves to undefined (void) or rejects with a {@link corbelError}
             */
            delete: function(id) {
                console.log('oauthInterface.user.delete');
                this.uri += '/' + id;
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.DELETE
                });
            },
            /**
             * Sends a reset password email to the email address recived.
             * @method
             * @memberOf corbel.Oauth.UsersBuilder
             * @param  {String} userEmailToReset The email to send the message
             * @return {Promise}                 Q promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            sendResetPasswordEmail: function(userEmailToReset) {
                console.log('oauthInterface.user.SendResetPasswordEmail', userEmailToReset);
                return this.request({
                    url: this._buildUri(this.uri + '/resetPassword'),
                    method: corbel.request.method.GET,
                    query: 'email=' + userEmailToReset,
                    headers: {
                        Authorization: 'Basic ' + this.getSerializer()(this.clientId + ':' + this.clientSecret)
                    },
                    noRetry: true
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },
            /**
             * Sends a email to the logged user or user to validate his email address
             * @method
             * @memberOf corbel.Oauth.UsersBuilder
             * 
             * @param  {Object} id     The user id or me
             * 
             * @return {Promise}  Q promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            sendValidateEmail: function(id) {
                console.log('oauthInterface.user.sendValidateEmail');
                this.uri += '/' + id + '/validate';
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.GET,
                    withAuth: true
                });
            },
            /**
             * Validates the email of a user or the logged user
             * @method
             * @memberOf corbel.Oauth.UsersBuilder
             * 
             * @param  {Object} id   The user id or me
             * 
             * @return {Promise}  Q promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            emailConfirmation: function(id) {
                console.log('oauthInterface.user.emailConfirmation');
                this.uri += '/' + id + '/emailConfirmation';
                return this.request({
                    url: this._buildUri(this.uri, id),
                    method: corbel.request.method.PUT,
                    noRetry: true
                });
            },

            getSerializer: function() {
                if (corbel.Config.isNode) {
                    return require('btoa');
                } else {
                    return btoa;
                }
            }
        });
    })();

    (function() {
        corbel.Notifications = corbel.Object.inherit({

            /**
             * Creates a new NotificationsBuilder
             * @param  {String} id String with the asset id or 'all' key
             * @return {Notifications}
             */
            constructor: function(driver) {
                this.driver = driver;

                return function(id) {
                    var builder = new corbel.Notifications.NotificationsBuilder(id);
                    builder.driver = driver;
                    return builder;
                };
            },


        }, {

            moduleName: 'notifications',

            create: function(driver) {
                return new corbel.Notifications(driver);
            }

        });

        return corbel.Notifications;

    })();

    (function() {

        var NotificationsBuilder = corbel.Notifications.NotificationsBuilder = corbel.Services.inherit({

            /**
             * Creates a new NotificationsBuilder
             * @param  {String} id String with the asset id or 'all' key
             * @return {Assets}
             */
            constructor: function(id) {
                this.uri = 'notification';
                this.id = id;
            },
            /*
             * Creates a new notification
             * @method
             * @memberOf Corbel.Notifications.NotificationsBuilder
             * @param {Object} notification                Contains the data of the new notification
             * @param {String} notification.type    Notification type (mail,  sms...)
             * @param {String} notification.text    Notification content
             * @param {String} notification.sender  Notification sender
             * @param {String} [notification.title] Notification title
             *    
             * @return {Promise}                    Promise that resolves in the new notification id or rejects with a {@link CorbelError}
             */
            create: function(notification) {
                console.log('notificationsInterface.notification.create', notification);
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: notification
                }).
                then(function(res) {
                    return corbel.Services.getLocationId(res);
                });
            },
            /**
             * Gets a notification
             * @method
             * @memberOf Corbel.Notifications.NotificationsBuilder
             * @param  {Object} [params]      Params of the corbel request
             * @return {Promise}              Promise that resolves to a Notification {Object} or rejects with a {@link CorbelError}
             */
            get: function(params) {
                console.log('notificationsInterface.notification.get', params);
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.GET,
                    query: params ? corbel.utils.serializeParams(params) : null
                });
            },
            /**
             * Updates a notification
             * @method
             * @memberOf Corbel.Notifications.NotificationsBuilder
             * @param  {Object} data                    Data to be updated
             * 
             * @return {Promise}                        Promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            update: function(data) {
                console.log('notificationsInterface.notification.update', data);
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.PUT,
                    data: data
                });
            },
            /**
             * Deletes a notification
             * @method
             * @memberOf Corbel.Notifications.NotificationsBuilder
             * @return {Promise}        Promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            delete: function() {
                console.log('notificationsInterface.notification.delete');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.DELETE
                });
            },
            /**
             * Send a notification
             * @method
             * @memberOf Corbel.Notifications.NotificationsBuilder
             * @param {Object} notification         Notification
             * @param {String} notification.notificationId    Notification id (mail,  sms...)
             * @param {String} notification.recipient    Notification recipient
             * @param {Object} notification.propierties    Notification propierties
             * @return {Promise}        Promise that resolves to undefined (void) or rejects with a {@link CorbelError}
             */
            sendNotification: function(notification) {
                console.log('notificationsInterface.notification.sendNotification', notification);
                this.uri += 'send';
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: notification
                });
            },

            _buildUri: function(path, id) {
                var uri = '',
                    urlBase = this.driver.config.get('notificationsEndpoint', null) ?
                    this.driver.config.get('notificationsEndpoint') :
                    this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, corbel.Notifications.moduleName);

                uri = urlBase + path;
                if (id) {
                    uri += '/' + id;
                }
                return uri;
            }

        }, {

            moduleName: 'notifications',

            create: function(driver) {
                return new corbel.NotificationsBuilder(driver);
            }

        });

        return NotificationsBuilder;

    })();

    (function() {

        /**
         * A module to make Ec requests.
         * @exports Ec
         * @namespace
         * @memberof app.corbel
         */

        var Ec = corbel.Ec = function(driver) {
            this.driver = driver;
        };

        Ec.moduleName = 'ec';


        Ec.create = function(driver) {
            return new Ec(driver);
        };

        Ec._ec = {
            /**
             * @namespace
             */
            purchaseStates: {
                /**
                 * IN_PROCESS constant
                 * @constant
                 * @type {String}
                 * @default
                 */
                IN_PROCESS: 'IN_PROCESS',

                /**
                 * COMPLETED constant
                 * @constant
                 * @type {String}
                 * @default
                 */
                COMPLETED: 'COMPLETED',

                /**
               * FAILED constant
               * @constant
               * @type {String}
               * @default
               
              FAILED: 'FAILED',
  
              /**
               * IN_PAYMENT constant
               * @constant
               * @type {String}
               * @default
               */
                IN_PAYMENT: 'IN_PAYMENT',

                /**
                 * CANCELLED constant
                 * @constant
                 * @type {String}
                 * @default
                 */
                CANCELLED: 'CANCELLED'
            }
        };


        /**
         * COMMON MIXINS
         */


        // Ec._encrypt = function (data) {
        //     return {
        //         name: data.name,
        //         data: cse.encrypt(data.number, data.holderName, data.cvc, data.expiryMonth, data.expiryYear)
        //     };
        // };

        /**
         * Private method to build a string uri
         * @private
         * @param  {String} uri
         * @param  {String|Number} id
         * @param  {String} extra
         * @return {String}
         */
        Ec._buildUri = function(uri, id, extra) {
            if (id) {
                uri += '/' + id;
            }
            if (extra) {
                uri += extra;
            }
            var urlBase = this.driver.config.get('ecEndpoint', null) ?
                this.driver.config.get('ecpoint') :
                this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, Ec.moduleName);

            return urlBase + uri;
        };
    })();

    (function() {

        /**
         * Create a ProductBuilder for product managing requests.
         *
         * @param {String}  id  The id of the product.
         *
         * @return {corbel.Ec.ProductBuilder}
         */
        corbel.Ec.prototype.product = function(id) {
            var product = new ProductBuilder(id);
            product.driver = this.driver;
            return product;
        };
        /**
         * A builder for products management requests.
         *
         * @param {String}  id product ID.
         *
         * @class
         * @memberOf corbel.Ec.ProductBuilder
         */
        var ProductBuilder = corbel.Ec.ProductBuilder = corbel.Services.inherit({

            constructor: function(id) {
                if (id) {
                    this.id = id;
                }
                this.uri = 'product';
            },
            /**
             * Create a new product.
             *
             * @method
             * @memberOf corbel.Ec.ProductBuilder
             * @param {Object} product                 Contains the data of the new product
             * @param {String} product.price           Information about price
             * @param {String} product.price.currency  Currency code fro the price
             * @param {Number} product.price.amount    The amount of the price
             * @param {String} href                 Link to ???
             * @param {String} type                 Type of the Product
             * @param {Object} [scopes]             Set of scopes of the product
             * @param {String} [period]             Duration of the Product
             * @param {Number} period.years
             * @param {Number} period.months
             * @param {Number} period.days
             * @param {String} [name]               Name of the Product
             * @return {Promise} A promise with the id of the created loanable resources or fails
             *                   with a {@link corbelError}.
             */
            create: function(product) {
                console.log('ecInterface.product.create', product);
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: product,
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },
            /**
             * Get a product.
             *
             * @method
             * @memberOf corbel.Ec.EcBuilder
             *
             * @param  {Object} params  The params filter
             * 
             * @return {Promise} A promise with product {Object} or fails with a {@link corbelError}.
             */
            get: function(params) {
                console.log('ecInterface.product.get');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.GET,
                    query: params ? corbel.utils.serializeParams(params) : null
                });
            },
            /**
             * Update a product.
             *
             * @method
             * @memberOf corbel.Ec.EcBuilder
             *
             * @param  {Object} product  The product update
             * 
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            update: function(product) {
                console.log('ecInterface.product.update');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.PUT,
                    data: product
                });
            },
            /**Delete a product.
             *
             * @method
             * @memberOf corbel.Ec.EcBuilder
             *
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            delete: function() {
                console.log('ecInterface.product.delete');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.DELETE
                });
            },

            _buildUri: corbel.Ec._buildUri
        });
    })();
    (function() {
        corbel.Evci = corbel.Object.inherit({

            /**
             * Create a new EventBuilder
             * @param  {String} type String
             * @return {Events}
             */
            constructor: function(driver) {
                this.driver = driver;
            },

            event: function(type) {
                if (!type) {
                    throw new Error('Send event require event type');
                }
                return new corbel.Evci.EventBuilder(type, this.driver);
            }


        }, {

            moduleName: 'evci',

            create: function(driver) {
                return new corbel.Evci(driver);
            }

        });

        return corbel.Evci;

    })();
    (function() {

        var EventBuilder = corbel.Evci.EventBuilder = corbel.Services.inherit({
            /**
             * Creates a new EventBuilder
             * @param  {String} type
             * @return {Events}
             */
            constructor: function(type, driver) {
                this.uri = 'event';
                this.eventType = type;
                this.driver = driver;
            },

            /**
             * Publish a new event.
             *
             * @method
             * @memberOf corbel.Evci.EventBuilder
             *
             * @param {Object} eventData  The data of the event.
             *
             * @return {Promise} A promise with the id of the created scope or fails
             *                   with a {@link corbelError}.
             */
            publish: function(eventData) {
                if (!eventData) {
                    throw new Error('Send event require data');
                }
                console.log('evciInterface.publish', eventData);
                return this.request({
                    url: this._buildUri(this.uri, this.eventType),
                    method: corbel.request.method.POST,
                    data: eventData
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },

            _buildUri: function(path, eventType) {
                var uri = '',
                    urlBase = this.driver.config.get('evciEndpoint', null) ?
                    this.driver.config.get('evciEndpoint') :
                    this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, corbel.Evci.moduleName);

                uri = urlBase + path;
                if (eventType) {
                    uri += '/' + eventType;
                }
                return uri;
            }

        }, {

            moduleName: 'evci',

            create: function(driver) {
                return new corbel.EventBuilder(driver);
            }

        });

        return EventBuilder;
    })();
    (function() {

        /**
         * A module to make Borrow requests.
         * @exports Borrow
         * @namespace
         * @memberof app.corbel
         */

        corbel.Borrow = corbel.Object.inherit({

            constructor: function(driver) {
                this.driver = driver;
            },



            /**
             * Create a BorrowBuilder for resource managing requests.
             *
             * @param {String}  id  The id of the borrow.
             *
             * @return {corbel.Borrow.BorrowBuilder}
             */
            resource: function(id) {
                var resource = new corbel.Borrow.BorrowBuilder(id);
                resource.driver = this.driver;
                return resource;
            },

            /**
             * Create a LenderBuilder for lender managing requests.
             *
             * @param {String}  id  The id of the lender.
             *
             * @return {corbel.Borrow.LenderBuilder}
             */
            lender: function(id) {
                var lender = new corbel.Borrow.LenderBuilder(id);
                lender.driver = this.driver;
                return lender;
            },

            /**
             * Create a UserBuilder for user managing requests.
             *
             * @param {String}  id  The id of the user.
             *
             * @return {corbel.Borrow.UserBuilder}
             */
            user: function(id) {
                var user = new corbel.Borrow.UserBuilder(id);
                user.driver = this.driver;
                return user;
            }




        }, {
            moduleName: 'borrow',

            create: function(driver) {
                return new corbel.Borrow(driver);
            },

            _buildUri: function() {
                var uri = '';
                Array.prototype.slice.call(arguments).forEach(function(argument) {
                    if (argument) {
                        uri += '/' + argument;
                    }
                });

                var urlBase = this.driver.config.get('borrowEndpoint', null) ||
                    this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, corbel.Borrow.moduleName);

                if (urlBase.slice(-1) === '/') {
                    urlBase = urlBase.substring(0, urlBase.length - 1);
                }

                return urlBase + uri;
            }
        });

        return corbel.Borrow;





    })();

    (function() {


        /**
         * A builder for borrowed management requests.
         *
         * @param {String}  id resource ID.
         *
         * @class
         * @memberOf corbel.Borrow.BorrowBuilder
         */
        corbel.Borrow.BorrowBuilder = corbel.Services.inherit({

            constructor: function(id) {
                this.id = id;
                this.uri = 'resource';
            },
            /**
             * Adds the loanable resource.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @param {Object}   loanable resource                          The loanable resource data.
             * @param {String}   loanableResource.resourceId                Identifier of resource
             * @param {Object[]} loanableResource.licenses                  Licenses list
             * @param {number}   loanableResource.licenses[].availableUses  Amount of uses that the resource is available
             * @param {number}   loanableResource.licenses[].availableLoans Amount of concurrent loans are available for the resource
             * @param {timestamp}loanableResource.licenses[].expire         Expire date
             * @param {timestamp}loanableResource.licenses[].start          Start date
             * @param {Object}   loanableResource.asset                     Asigned to the resource
             * @param {String[]} loanableResource.asset.scopes              Scope list
             * @param {String}   loanableResource.asset.name                Asset name
             *
             * @return {Promise} A promise with the id of the created loanable resources or fails
             *                   with a {@link corbelError}.
             */
            add: function(loanableResource) {
                console.log('borrowInterface.resource.add', loanableResource);
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: loanableResource,
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },
            /**
             * Get a loanable resource.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @return {Promise} A promise with loanable resource {Object} or fails with a {@link corbelError}.
             */
            get: function() {
                console.log('borrowInterface.resource.get');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.GET
                });
            },
            /**
             * Delete a loanable resource.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @return {Promise} A promise  resolves to undefined (void) or fails with a {@link corbelError}.
             */
            delete: function() {
                console.log('borrowInterface.resource.delete');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.DELETE
                });
            },
            /**
           * Add license to loanable resource.
           *
           * @method
           * @memberOf corbel.Borrow.BorrowBuilder
           *
           * @param {Object} data   licenses data.
           * @param {Object} license                 The license data.
           * @param {String} license.resourceId      Identifier of resource
           * @param {number} licensee.availableUses  Amount of uses that the resource is available
           * @param {number} license.availableLoans  Amount of concurrent loans are available for the resource
           * @param {timestamp} license.expire       Expire date
           * @param {timestamp} licensee.start       Start date
           * @param {String} license.asset           Asigned to the resource
  
           * @return {Promise} A promise with the id of the created a license or fails
           *                   with a {@link corbelError}.
           */
            addLicense: function(license) {
                console.log('borrowInterface.resource.addLicense', license);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'license'),
                    method: corbel.request.method.POST,
                    data: license,
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },
            /**
             * Apply loan.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @param {String} userId    user id.
             *
             * @return {Promise} A promise  resolves to undefined (void) or fails with a {@link corbelError}.
             */
            applyFor: function(userId) {
                console.log('borrowInterface.resource.applyFor', userId);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'loan/' + userId),
                    method: corbel.request.method.PUT
                });
            },
            /**
             * Apply loan for user logged.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @return {Promise} A promise  resolves to undefined (void) or fails with a {@link corbelError}.
             */
            applyForMe: function() {
                console.log('borrowInterface.resource.applyForMe');
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'loan/me'),
                    method: corbel.request.method.PUT
                });
            },
            /**
             * Get lent.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @param {String} userId    user id.
             *
             * @return {Promise} A promise with user lents {Object} or fails with a {@link corbelError}.
             */
            getLentOf: function(userId) {
                console.log('borrowInterface.resource.getLentOf', userId);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'loan/' + userId),
                    method: corbel.request.method.GET
                });
            },
            /**
             * Get lent of user logged.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             * @return {Promise} A promise with user logged lents {Object} or fails with a {@link corbelError}.
             */
            getMyLent: function() {
                console.log('borrowInterface.resource.getMyLent');
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'loan/me'),
                    method: corbel.request.method.GET
                });
            },
            /**
             * Return lent.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @param {String} userId    user id.
             *
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            returnLoanOf: function(userId) {
                console.log('borrowInterface.resource.returnLoanOf', userId);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'loan/' + userId),
                    method: corbel.request.method.DELETE
                });
            },
            /**
             * Return loan of user logged.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            returnMyLoan: function() {
                console.log('borrowInterface.resource.returnMyLoan');
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'loan/me'),
                    method: corbel.request.method.DELETE
                });
            },
            /**
             * Renew loan.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @param  {String} userId    The userId
             *
             * @return {Promise} A promise  resolves to undefined (void) or fails with a {@link corbelError}.
             */
            renewFor: function(userId) {
                console.log('borrowInterface.resource.renewFor', userId);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'renewal/' + userId),
                    method: corbel.request.method.PUT
                });
            },
            /**
             * Renew loan for user logged.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @return {Promise} A promise  resolves to undefined (void) or fails with a {@link corbelError}.
             */
            renewForMe: function() {
                console.log('borrowInterface.resource.renewForMe');
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'renewal/me'),
                    method: corbel.request.method.PUT
                });
            },
            /**
             * Reserve a resource.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @param  {String} userId    The userId
             *
             * @return {Promise} A promise  resolves to undefined (void) or fails with a {@link corbelError}.
             */
            reserveFor: function(userId) {
                console.log('borrowInterface.resource.reserveFor', userId);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'reservation/' + userId),
                    method: corbel.request.method.PUT
                });
            },
            /**
             * Reserve a resource for user logged.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            reserveForMe: function() {
                console.log('borrowInterface.resource.reserveForMe');
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'reservation/me'),
                    method: corbel.request.method.PUT
                });
            },
            /**
             * Cancel reservation.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @param {String} userId    user id.
             *
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            cancelReservationFor: function(userId) {
                console.log('borrowInterface.resource.cancelReservationFor', userId);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'reservation/' + userId),
                    method: corbel.request.method.DELETE
                });
            },
            /**
             * Cancel reservation for user logged.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            cancelMyReservation: function() {
                console.log('borrowInterface.resource.cancelMyReservation');
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'reservation/me'),
                    method: corbel.request.method.DELETE
                });
            },
            /**
             * get the user borrowed history.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @param {String} userId    user id.
             *
             * @return {Promise} A promise with user borowed {Object} history or fails with a {@link corbelError}.
             */
            getHistoryOf: function(userId) {
                console.log('borrowInterface.resource.getHistoryOf', userId);
                return this.request({
                    url: this._buildUri(this.uri, 'history/' + userId),
                    method: corbel.request.method.GET
                });
            },
            /**
             * Get lent of user logged.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             * @return {Promise} A promise with user logged borrowed {Object} history or fails with a {@link corbelError}.
             */
            getMyHistory: function() {
                console.log('borrowInterface.resource.getMyHistory');
                return this.request({
                    url: this._buildUri(this.uri, 'history/me'),
                    method: corbel.request.method.GET
                });
            },
            /**
             * get full resources borrowed history.
             *
             * @method
             * @memberOf corbel.Borrow.BorrowBuilder
             *
             * @return {Promise} A promise with borowed full {Object} history or fails with a {@link corbelError}.
             */
            getFullHistory: function(params) {
                console.log('borrowInterface.resource.getFullHistory');
                return this.request({
                    url: this._buildUri(this.uri, 'history/'),
                    method: corbel.request.method.GET,
                    query: params ? corbel.utils.serializeParams(params) : null
                });
            },

            _buildUri: corbel.Borrow._buildUri
        });
    })();

    (function() {


        /**
         * A builder for borrowed management requests.
         *
         * @param {String}  id user ID.
         *
         * @class
         * @memberOf corbel.Borrow.UserBuilder
         */
        corbel.Borrow.UserBuilder = corbel.Services.inherit({

            constructor: function(id) {
                this.id = id || 'me';
                this.uri = 'user';
            },
            /**
             * Get all reservations of a user.
             *
             * @method
             * @memberOf corbel.Borrow.UserBuilder
             *
             * @return {Promise} A promise with all user reservations {Object} or fails with a {@link corbelError}.
             */
            getAllReservations: function() {
                console.log('borrowInterface.user.getAllReservations', this.id);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'reservation'),
                    method: corbel.request.method.GET
                });
            },
            /**
             *  Get all loans of a user.
             *
             * @method
             * @memberOf corbel.Borrow.UserBuilder
             *
             * @return {Promise} A promise with all user loans {Object} or fails with a {@link corbelError}.
             */
            getAllLoans: function() {
                console.log('borrowInterface.user.getAllLoans', this.id);
                return this.request({
                    url: this._buildUri(this.uri, this.id, 'loan'),
                    method: corbel.request.method.GET
                });
            },


            _buildUri: corbel.Borrow._buildUri
        });
    })();

    (function() {


        /**
         * A builder for borrowed management requests.
         *
         * @param {String}  id lender ID.
         *
         * @class
         * @memberOf corbel.Borrow.LenderBuilder
         */
        corbel.Borrow.LenderBuilder = corbel.Services.inherit({

            constructor: function(id) {
                this.id = id;
                this.uri = 'lender';
            },
            /**
             * Create a new Lender
             * @method
             * @memberOf corbel.Borrow.LenderBuilder
             * @param {Object} lender                           The lender data
             * @param {String} lender.id                        The lender name
             * @param {String} lender.borrowPeriod              The borrow period
             * @param {String} lender.freeReturnPeriod          Return without use
             * @param {String} lender.reservationPeriod         Period to apply after wait on queue
             * @param {String} lender.maxConcurrentLoansPerUser Number of loans at same time
             * @param {String} lender.maxLoansPerUserInMonth    Limit number of loans per user
             * @param {Object} lender.maxRenewalsPerResource    Number of times user can renew his loans
             * @param {Object} lender.maxUsersInWaitingQueue    Waiting queue size
             * @param {Object} lender.priority                  RENEW or RESERVE
             * @return {Promise} A promise with the id of the created loanable resources or fails
             *                   with a {@link corbelError}.
             */
            create: function(lender) {
                console.log('borrowInterface.lender.create', lender);
                return this.request({
                    url: this._buildUri(this.uri),
                    method: corbel.request.method.POST,
                    data: lender,
                }).then(function(res) {
                    res.data = corbel.Services.getLocationId(res);
                    return res;
                });
            },
            /**
             * Update a Lender.
             *
             * @method
             * @memberOf corbel.Borrow.LenderBuilder
             *
             * @param {Object} lender   The lender data.
             *
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            update: function(lender) {
                console.log('borrowInterface.lender.update');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.PUT,
                    data: lender
                });
            },
            /**
             * Delete a Lender.
             *
             * @method
             * @memberOf corbel.Borrow.LenderBuilder
             *
             * @return {Promise} A promise resolves to undefined (void) or fails with a {@link corbelError}.
             */
            delete: function() {
                console.log('borrowInterface.lender.delete');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.DELETE
                });
            },
            /**
             * Get Lender.
             *
             * @method
             * @memberOf corbel.Borrow.LenderBuilder
             *
             * @return {Promise} A promise with lender {Object} or fails with a {@link corbelError}.
             */
            get: function() {
                console.log('borrowInterface.lender.get');
                return this.request({
                    url: this._buildUri(this.uri, this.id),
                    method: corbel.request.method.GET
                });
            },
            /**
             * Get all Lenders.
             *
             * @method
             * @memberOf corbel.Borrow.LenderBuilder
             *
             * @return {Promise} A promise with all lenders {Object} or fails with a {@link corbelError}.
             */
            getAll: function(params) {
                console.log('borrowInterface.lender.getAll');
                return this.request({
                    url: this._buildUri(this.uri, 'all'),
                    method: corbel.request.method.GET,
                    query: params ? corbel.utils.serializeParams(params) : null
                });
            },
            /**
             * Get all reservations by lender.
             *
             * @method
             * @memberOf corbel.Borrow.LenderBuilder
             *
             * @return {Promise} A promise with all reservations {Object} by lender or fails with a {@link corbelError}.
             */
            getAllReservations: function(params) {
                console.log('borrowInterface.lender.getAllReservations');
                return this.request({
                    url: this._buildUri(this.uri, 'reservation'),
                    method: corbel.request.method.GET,
                    query: params ? corbel.utils.serializeParams(params) : null
                });
            },

            _buildUri: corbel.Borrow._buildUri
        });
    })();

    (function() {

        /**
         * A module to make CompoSR requests.
         * @exports CompoSR
         * @namespace
         * @memberof app.corbel
         */

        corbel.CompoSR = corbel.Object.inherit({

            constructor: function(driver) {
                this.driver = driver;
            },

            /**
             * Create a PhraseBuilder for phrase managing requests.
             *
             * @param {String}  id  The id of the phrase.
             *
             * @return {corbel.CompoSR.PhraseBuilder}
             */
            phrase: function(id) {
                var phraseBuilder = new corbel.CompoSR.PhraseBuilder(id);
                phraseBuilder.driver = this.driver;
                return phraseBuilder;
            },

            /**
             * Create a RequestBuilder for phrase requests.
             *
             * @param  {String} id      phrase id
             * @param  {String} param1  path parameter
             * @param  {String} param2  path parameter
             * @param  {String} paramN  path parameter
             *
             * @return {corbel.CompoSR.RequestBuilder}
             */
            request: function() {
                var requestBuilder = new corbel.CompoSR.RequestBuilder(Array.prototype.slice.call(arguments));
                requestBuilder.driver = this.driver;
                return requestBuilder;
            }


        }, {

            moduleName: 'composr',

            create: function(driver) {
                return new corbel.CompoSR(driver);
            },

            _buildUri: function() {
                var urlBase = this.driver.config.get('composrEndpoint', null) ||
                    this.driver.config.get('urlBase').replace(corbel.Config.URL_BASE_PLACEHOLDER, corbel.CompoSR.moduleName);

                if (urlBase.slice(-1) === '/') {
                    urlBase = urlBase.substring(0, urlBase.length - 1);
                }

                var uri = '';
                Array.prototype.slice.call(arguments).forEach(function(argument) {
                    if (argument) {
                        uri += '/' + argument;
                    }
                });
                return urlBase + uri;
            },

        });

        return corbel.CompoSR;

    })();

    (function() {


        /**
         * A builder for composr phrase crud.
         *
         * @param {String}  id phrase ID.
         *
         * @class
         * @memberOf corbel.CompoSR.PhraseBuilder
         */
        corbel.CompoSR.PhraseBuilder = corbel.Services.inherit({

            constructor: function(id) {
                this.id = id;
            },

            put: function(body) {
                console.log('composrInterface.phrase.add');
                return this.request({
                    url: this._buildUri('phrase', this.id),
                    method: corbel.request.method.PUT,
                    data: body
                });
            },

            get: function() {
                console.log('composrInterface.phrase.get');
                return this.request({
                    url: this._buildUri('phrase', this.id),
                    method: corbel.request.method.GET,
                });
            },

            getAll: function() {
                console.log('composrInterface.phrase.getAll');
                return this.request({
                    url: this._buildUri('phrase'),
                    method: corbel.request.method.GET,
                });
            },

            delete: function() {
                console.log('composrInterface.phrase.delete');
                return this.request({
                    url: this._buildUri('phrase', this.id),
                    method: corbel.request.method.DELETE,
                });
            },

            _buildUri: corbel.CompoSR._buildUri

        });
    })();

    (function() {


        /**
         * A builder for composr requests.
         *
         *
         * @class
         * @memberOf corbel.CompoSR.RequestBuilder
         */
        corbel.CompoSR.RequestBuilder = corbel.Services.inherit({

            constructor: function(pathsArray) {
                this.path = this.buildPath(pathsArray);
            },

            post: function(data, options) {
                console.log('composrInterface.request.post');
                this.options = options || {};
                return this.request({
                    url: this._buildUri(this.path),
                    method: corbel.request.method.POST,
                    headers: this.options.headers,
                    data: data,
                    query: this.buildQueryPath(this.options.queryParams)
                });
            },

            get: function(options) {
                console.log('composrInterface.request.get');
                this.options = options || {};
                return this.request({
                    url: this._buildUri(this.path),
                    method: corbel.request.method.GET,
                    headers: this.options.headers,
                    query: this.buildQueryPath(this.options.queryParams)
                });
            },

            put: function(data, options) {
                console.log('composrInterface.request.put');
                this.options = options || {};
                return this.request({
                    url: this._buildUri(this.path),
                    method: corbel.request.method.PUT,
                    data: data,
                    headers: this.options.headers,
                    query: this.buildQueryPath(this.options.queryParams)
                });
            },

            delete: function(options) {
                console.log('composrInterface.request.delete');
                this.options = options || {};
                return this.request({
                    url: this._buildUri(this.path),
                    method: corbel.request.method.DELETE,
                    headers: this.options.headers,
                    query: this.buildQueryPath(this.options.queryParams)
                });
            },

            buildPath: function(pathArray) {
                var path = '';
                path += pathArray.shift();
                pathArray.forEach(function(entryPath) {
                    path += '/' + entryPath;
                });
                return path;
            },

            buildQueryPath: function(dict) {
                var query = '';
                if (dict) {
                    var queries = [];
                    Object.keys(dict).forEach(function(key) {
                        queries.push(key + '=' + dict[key]);
                    });
                    if (queries.length > 0) {
                        query = queries.join('&');
                    }
                }
                return query;
            },

            _buildUri: corbel.CompoSR._buildUri
        });
    })();


    return corbel;
});
