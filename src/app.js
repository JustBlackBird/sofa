import ConfigLoader from './config_loader';
import TaskRunner from './task_runner';
import path from 'path';
import SiteVisitor from './site_visitor';

const loader = new ConfigLoader();
const visitor = new SiteVisitor();
let config = null;

loader.load(path.join(__dirname, '../configs/config.yml'))
    .then(conf => {
        config = conf;

        return visitor.connect(conf.auth.email, conf.auth.password);
    })
    .then(() => {
        const sites = ['https://stackoverflow.com'].concat(
            config.sites.stackoverflow.map(site => {
                return `https://${site}.stackoverflow.com`;
            }),
            config.sites.stackexchange.map(site => {
                return `https://${site}.stackexchange.com`;
            })
        );

        const taskRunner = new TaskRunner(() => {
            visitor.visit(sites);
        }, 24 * 60 * 60);

        return taskRunner.start();
    })
    .catch(err => {
        console.log(err);
    });
