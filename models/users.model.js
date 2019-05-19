const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let createApiKey = require('./../utils').createApiKey;

let responseCodes = require('./../config/response-codes.config');

let usersSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
            trim: true
        },
        name: {
            type: String,
            trim: true,
            match: /[a-zA-Z]+/
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            default: 'user',
            required: true
        },
        apiKey: {
            type: String,
            required: true,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true,
            required: false
        },
        isPremium: {
            type: Boolean,
            default: false,
            required: false
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String,
            trim: true
        },
        passwordResetToken: {
            type: String,
            trim: true
        },
        passwordResetExpires: {
            type: Date,
            trim: true
        }
    },
    {
        timestamps: true
    },
    {
        strict: false,
        collection: 'users'
    },
    {
        versionKey: false
    }
);




usersSchema.statics.checkUser = (email) => {
    return User.findOne({ email: email }, { password: 0, createdAt: 0, updatedAt: 0 }).exec()
}

usersSchema.statics.authenticate = (email, password, callback) => {
    User.findOne({ email: email }, { createdAt: 0, updatedAt: 0 }).exec((error, user) => {
        if (error || !user) {
            return callback(error || new Error(responseCodes["no-user-found"]));
        } else {
            bcrypt.compare(password, user.password, (error, result) => {
                if (error || result !== true) {
                    return callback(error || new Error(responseCodes["wrong-password"]));
                } else {
                    return callback(null, user);
                }
            });
        }
    });
};

usersSchema.statics.hashPassword = (_id, password, callback) => {
    User.findOne({ _id: _id }, { createdAt: 0, updatedAt: 0 }).exec((error, user) => {
        if (error || !user) {
            return callback(error || new Error(responseCodes["no-user-found"]));
        } else {
            bcrypt.hash(password, 15, (error, result) => {
                console.log('r', result);
                if (error || !result) {
                    return callback(error || new Error(responseCodes["wrong-password"]));
                } else {
                    return callback(null, result);
                }
            });
        }
    });
};

usersSchema.statics.setApiKey = (_id, callback) => {
    let apiKey = createApiKey();
    User.findByIdAndUpdate(_id, { $set: { apiKey: apiKey } }, { fields: { _id: 0, apiKey: 1 }, new: true }, (error, response) => {
        if (error) {
            return callback(error);
        } else {
            return callback(null, response);
        }
    }
    );
};

usersSchema.statics.deactivate = (_id, callback) => {
    User.findByIdAndUpdate(_id, { $set: { isActive: false } }, { fields: { _id: 0, isActive: 1 }, new: true }, (error, response) => {
        if (error) {
            return callback(error);
        } else {
            return callback(null, response);
        }
    }
    );
};



let User = mongoose.model('User', usersSchema);
module.exports = User;
