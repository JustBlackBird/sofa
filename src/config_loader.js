import fs from 'fs';
import ymlParser from 'js-yaml';

/**
 * A class which encapsulate config files processing.
 */
export default class {
    /**
     * Loads configs from the specified YAML file.
     *
     * @param {String} path
     * @returns {Promise}
     */
    load(path) {
        return this._readFile(path)
            .then(this._parseData.bind(this))
            .then(this._verifyData.bind(this))
            .then(this._addDefaults.bind(this));
    }

    /**
     * Reads config's file.
     *
     * @param {String} path
     * @returns {Promise} A promise which is resolved with file contents or
     *   rejected with an error.
     * @private
     */
    _readFile(path) {
        return new Promise(function(resolve, reject) {
            fs.readFile(path, function(err, data) {
                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    }

    /**
     * Parses config's data.
     *
     * @param {String} data A string with a YAML config.
     * @returns {Promise} A promise that is resolved with parsed configs object
     *   or rejected with an error.
     * @private
     */
    _parseData(data) {
        return new Promise(function(resolve, reject) {
            // On error loadSafe method will throw an error which be processed
            // by promises automatically.
            resolve(ymlParser.safeLoad(data));
        });
    }

    /**
     * Verifies configurations object.
     *
     * @param {Object} data Parsed config data.
     * @returns {Promise} A promise which is resolved with a passed in data or
     *   rejected with a verification error.
     * @private
     */
    _verifyData(data) {
        if (data.sites) {
            if (typeof data.sites !== 'object') {
                return Promise.reject(new Error(
                    '"sites" section of the config file must be an object.'
                ));
            }

            if (data.sites.hasOwnProperty('stackoverflow')) {
                let soSites = data.sites.stackoverflow;
                if (soSites !== null && !Array.isArray(soSites)) {
                    return Promise.reject(new Error(
                        '"sites.stackoverflow" value of the config file can be either null or an array.'
                    ));
                }
            }

            if (data.sites.hasOwnProperty('stackexchange')) {
                let seSites = data.sites.stackexchange;
                if (seSites !== null && !Array.isArray(seSites)) {
                    return Promise.reject(new Error(
                        '"sites.stackexchange" value of the config file can be either null or an array.'
                    ));
                }
            }
        }

        if (!data.auth) {
            return Promise.reject(new Error(
                '"auth" section of the config file must exist.'
            ));
        }

        if (!data.auth.email) {
            return Promise.reject(new Error(
                '"auth.email" field must be set.'
            ));
        }

        if (!data.auth.password) {
            return Promise.reject(new Error(
                '"auth.password" field must be set.'
            ));
        }

        return Promise.resolve(data);
    }

    /**
     * Attaches default fields to configurations object.
     *
     * @param {Object} data Configuration object.
     * @returns {Promise} A promise which is resolved with updated configs or
     *   rejected with an error.
     * @private
     */
    _addDefaults(data) {
        if (!data.sites) {
            data.sites = {
                stackoverflow: null,
                stackexchange: null
            };
        }

        if (!data.sites.stackoverflow) {
            data.sites.stackoverflow = [];
        }

        if (!data.sites.stackexchange) {
            data.sites.stackexchange = [];
        }

        return Promise.resolve(data);
    }
};
