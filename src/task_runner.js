/**
 * Utility class that runs a task periodically.
 */
export default class {
    constructor(task, interval) {
        /**
         * A function which will be called periodically.
         *
         * @type Function
         * @private
         */
        this._task = task;

        /**
         * Interval in milliseconds between task calls.
         *
         * @type Number
         * @private
         */
        this._interval = interval * 1000;

        /**
         * Interval handler.
         *
         * @type {null|Number}
         * @private
         */
        this._timer = null;
    }

    /**
     * Starts periodic execution of the task.
     *
     * @returns {Promise}
     */
    start() {
        if (this._timer !== null) {
            return Promise.reject(new Error('The runner is already started'));
        }

        // Run the task for the first time.
        this._task();
        // And schedule its execution after specified interval.
        this._timer = setInterval(this._task, this._interval);

        return Promise.resolve();
    }

    /**
     * Stops periodical execution of the task.
     *
     * @returns {Promise}
     */
    stop() {
        if (this._timer === null) {
            return Promise.reject(new Error('The runner was not started'));
        }
        clearInterval(this._timer);

        return Promise.resolve();
    }
}
