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
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
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
        return new Promise((resolve) => {
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
                const soSites = data.sites.stackoverflow;
                if (soSites !== null && !Array.isArray(soSites)) {
                    return Promise.reject(new Error(
                        '"sites.stackoverflow" value of the config file can be '
                            + 'either null or an array.'
                    ));
                }
            }

            if (data.sites.hasOwnProperty('stackexchange')) {
                const seSites = data.sites.stackexchange;
                if (seSites !== null && !Array.isArray(seSites)) {
                    return Promise.reject(new Error(
                        '"sites.stackexchange" value of the config file can be '
                            + 'either null or an array.'
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
        const result = Object.assign({}, {
            sites: {},
        }, data);

        if (!result.sites.stackoverflow) {
            result.sites.stackoverflow = [];
        }

        if (!result.sites.stackexchange) {
            result.sites.stackexchange = [];
        }

        return Promise.resolve(result);
    }
}
