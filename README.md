# Sofa

A simple utility that helps you earn [Stack Overflow](http://stackoverflow.com) _fanatic_ badge.

## Installation

Sofa uses [Phantom.js](http://phantomjs.org/) so you have to install it first if you did not do it before.

1. Get sources. You can use `git clone`, download button or any other method.
2. Install dependencies using `npm install`.
3. Build the sources using `npm run build`
4. Copy `configs/default_config.yml` to `configs/config.yml` and fill it with
your own values.
5. Run the application using `node dist/index.js`


## Start with the system

You may want to run the application automatically with the system. There are
many ways of doing so.

For example, one can use [PM2](https://github.com/Unitech/pm2) utility. Just install it, configure to automatic
startup and run the following in the console:

```shell
pm2 start dist/index.js --name="sofa"
pm2 save
```

## License

[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) © Dmitriy Simushev

