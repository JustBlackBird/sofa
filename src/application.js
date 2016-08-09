import winston from 'winston';
import ConfigLoader from './config_loader';
import SiteVisitor from './site_visitor';
import TaskRunner from './task_runner';

/**
 * Represents the whole application.
 */
export default class {
    constructor(configPath) {
        /**
         * Path of the config file the application works with.
         *
         * @type {String}
         * @private
         */
        this._configPath = configPath;

        /**
         * @type {SiteVisitor|null}
         * @private
         */
        this._siteVisitor = null;

        /**
         * @type {ConfigLoader|null}
         * @private
         */
        this._configLoader = null;

        /**
         * @type {winston.Logger}
         * @private
         */
        this._logger = null;

        /**
         * @type {TaskRunner|null}
         * @private
         */
        this._taskRunner = null;

        /**
         * Application configs object.
         *
         * @type {null}
         * @private
         */
        this._config = null;

        /**
         * Indicates if the application is running or not.
         *
         * @type {boolean}
         * @private
         */
        this._isRunning = false;
    }

    /**
     * Runs the application.
     *
     * @returns {Promise}
     */
    run() {
        if (this._isRunning) {
            return Promise.reject(new Error('The application is already running.'));
        }

        return this._loadConfigs()
            .then(this._createLogger.bind(this))
            .then(this._prepareSiteVisitor.bind(this))
            .then(this._scheduleVisits.bind(this))
            .then(() => {
                this._isRunning = true;
                this._logger.info('[Application] The application is running.');
            });
    }

    /**
     * Stops the application.
     *
     * @returns {Promise}
     */
    stop() {
        if (!this._isRunning) {
            return Promise.reject(new Error('The application was not running.'));
        }

        return this._taskRunner.stop()
            .then(() => {
                this._taskRunner = null;
            })
            .then(() => {
                return this._siteVisitor.disconnect();
            })
            .then(() => {
                this._isRunning = false;
                this._logger.info('[Application] The application is stopped.');
            });
    }

    /**
     * Loads and parses configuration file.
     *
     * The loaded config will be available via this._config once the returned
     * promise becomes resolved.
     *
     * @returns {Promise}
     * @private
     */
    _loadConfigs() {
        if (!this._configLoader) {
            this._configLoader = new ConfigLoader();
        }

        return this._configLoader.load(this._configPath)
            .then(config => {
                this._config = config;
            });
    }

    /**
     * Prepare site visitor to work with requests.
     *
     * A ready to use will be available via this._siteVisitor once the
     * returned promise becomes resolved.
     *
     * @returns {Promise}
     * @private
     */
    _prepareSiteVisitor() {
        if (!this._siteVisitor) {
            this._siteVisitor = new SiteVisitor(this._logger);
        }

        return this._siteVisitor.connect(
            this._config.auth.email,
            this._config.auth.password
        );
    }

    /**
     * Creates the logger.
     *
     * A ready to use logger will be available as this._logger once the returned
     * promise becomes resolved.
     *
     * @returns {Promise}
     * @private
     */
    _createLogger() {
        if (!this._logger) {
            this._logger = new winston.Logger({
                transports: [
                    // Make sure the timestamp is included into the log
                    new winston.transports.Console({ timestamp: true })
                ]
            });
        }

        return Promise.resolve();
    }

    /**
     * Initiate visit processes.
     *
     * @returns {Promise}
     * @private
     */
    _scheduleVisits() {
        const sites = ['https://stackoverflow.com'].concat(
            this._config.sites.stackoverflow.map(site => {
                return `https://${site}.stackoverflow.com`;
            }),
            this._config.sites.stackexchange.map(site => {
                return `https://${site}.stackexchange.com`;
            })
        );

        // Visit all target sites 12 times a day. In this we're sure the visit
        // will be counted by SO.
        this._taskRunner = new TaskRunner(() => {
            this._siteVisitor.visit(sites);
        }, 2 * 60 * 60);

        return this._taskRunner.start();
    }
}
