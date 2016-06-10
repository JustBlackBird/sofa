import EventEmitter from 'events';
import util from 'util';
import phantom from 'phantom';
import cheerio from 'cheerio';

/**
 * A class which is responsible for Stack Overflow visiting.
 */
export default class {
    constructor(logger) {
        /**
         * An instance of winston.js logger.
         *
         * @type {Object}
         * @private
         */
        this._logger = logger;

        /**
         * An instance of Phantom.js.
         *
         * @type {null|Object}
         * @private
         */
        this._phantom = null;
        /**
         * An instance of Phantom.js's page.
         *
         * @type {null|Object}
         * @private
         */
        this._page = null;
        /**
         * Indicates that the visitor is connected and ready to visit pages.
         *
         * @type {Boolean}
         * @private
         */
        this._isReady = false;
    }

    /**
     * Connects the visitor instance to stackoverflow.com.
     *
     * The method passes SO authentication and assure that SO is accessible.
     * @param {String} email E-mail of SO user.
     * @param {String} password Password of SO user.
     * @returns {Promise}
     */
    connect(email, password) {
        const em = new EventEmitter();

        const done = new Promise((resolve, reject) => {
            em.once('ready', () => {
                this._logger.info('[Site visitor] Site visitor is logged into SO.');
                this._isReady = true;
                resolve(this);
            });
            em.once('error', (error) => {
                this._logger.info('[Site visitor] Cannot log in.');
                this._cleanup();
                reject(error);
            });
        });

        phantom.create()
            .then(instance => {
                this._phantom = instance;
                return instance.createPage();
            })
            .then(page => {
                this._page = page;
                return this._page.open('https://stackoverflow.com/users/login');
            })
            .then(this._validateStatus)
            .then(() => {
                // This magic with event handler is needed only for catching
                // redirect after form submit.
                // TODO: Try to use POST instead of form fields filling.
                const handler = () => {
                    this._page.off('onLoadFinished', handler)
                        .then(() => {
                            return this._page.property('content');
                        })
                        .then(content => {
                            const $ = cheerio.load(content);

                            if ($('a.profile-me').length === 0) {
                                return Promise.reject(new Error('Cannot login.'));
                            }

                            return Promise.resolve();
                        })
                        .then(() => {
                            em.emit('ready');
                        })
                        .catch(error => {
                            em.emit('error', error);
                        });
                };

                return this._page.on('onLoadFinished', handler);
            })
            .then(() => {
                return this._page.evaluate((userEmail, userPass) => {
                    /* eslint-disable */

                    // Fill and submit the login form.
                    $('#email').val(userEmail);
                    $('#password').val(userPass);
                    $('#login-form').submit();

                    /* eslint-enable */
                }, email, password);
            })
            .catch(error => {
                em.emit('error', error);
            });

        return done;
    }

    /**
     * Visits Stack Overflow related sites (incl. Stack Exchange network).
     *
     * @param {Array} sites List of URLs that should be visited.
     * @returns {Promise}
     */
    visit(sites) {
        if (!this._isReady) {
            return Promise.reject('You have to connect the visitor first!');
        }

        // Process all sites squently.
        const visitSites = sites.reduce((p, target) => {
            return p.then(() => {
                // Each promise must be created only when a previous one is
                // resolved.
                return this._visitTarget(target);
            });
        }, Promise.resolve());

        return visitSites
            .then(data => {
                console.log(data.length);
            }).catch(error => {
                this._cleanup();

                return Promise.reject(error);
            });
    }

    /**
     * Disconnects the visitor from Stack Overflow.
     *
     * @returns {Promise}
     */
    disconnect() {
        if (!this._isReady) {
            return Promise.reject('You have to connect the visitor first!');
        }

        this._cleanup();
        this._isReady = false;

        return Promise.resolve();
    }

    /**
     * Redirect Phantom instance to the specified page.
     *
     * @param {String} target URL of the page, the browser should go to.
     * @returns {Promise}
     * @private
     */
    _go(target) {
        return this._page.open(target)
            .then(this._validateStatus)
            // Wait for the page contents. It's an easy way to ensure the page
            // is fully loaded.
            .then(() => {
                return this._page.property('content');
            });
    }

    /**
     * Visits a site from StackExchange network.
     *
     * This method encapsulates all site visiting logic.
     *
     * @param {String} target URL of the page, the browser should go to.
     * @returns {Promise}
     * @private
     */
    _visitTarget(target) {
        return this._go(target).then(() => {
            return new Promise(resolve => {
                // Wait for a while to give a change to JS on page become completed.
                setTimeout(resolve, 1000 * 60);
            });
        }).then(() => {
            this._logger.info(`[Site visitor] ${target} site is visited.`);
        });
    }

    /**
     * Validates the Phantom instance accessed a page successfully.
     *
     * @param {String} status A status string returned by Phantom's `page.open`.
     * @returns {Promise}
     * @private
     */
    _validateStatus(status) {
        if (status !== 'success') {
            return Promise.reject(util.format(
                'The status is "%s" and not "success".',
                status
            ));
        }

        return Promise.resolve();
    }

    /**
     * Cleans up all Phantom related stuff to make it exit.
     *
     * @private
     */
    _cleanup() {
        this._page.close();
        this._phantom.exit();
    }
}
