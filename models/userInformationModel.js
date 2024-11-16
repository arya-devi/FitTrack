const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email must be required'],
    },
    username:{
        type:String,
        required:[true,'Email must be required']
    },
    weight:{
        type:Number,
        required:[true,'weight must be required'],
    },
    date:{
        type:String,
        required:[true]
    },
    time:{
        type:String,
        required:[true]
    }
})
userSchema.plugin(mongoosePaginate);
const UserInformation = mongoose.model('UserInformation',userSchema)
module.exports = UserInformation