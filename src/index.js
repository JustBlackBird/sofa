import path from 'path';
import Application from './application';

const app = new Application(path.join(__dirname, '../configs/config.yml'));

app.run().catch(error => {
    console.log('Cannot run the application!');
    console.log(error);
});
