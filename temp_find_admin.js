const mongoose = require('mongoose');
const User = require('./backend/models/User');

mongoose.connect('mongodb://localhost:27017/dekyc')
    .then(async () => {
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log('ADMIN_FOUND:' + JSON.stringify(admin));
        } else {
            console.log('NO_ADMIN_FOUND');
        }
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
