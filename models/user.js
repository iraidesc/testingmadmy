import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
    name: { type: String, maxlength:50, required:true},
    middle_name:{ type: String, maxlength:50},
    last_name: { type: String, maxlength:50, required:true},
    email: { type:String, maxlength:50, unique:true, required:true},
    password: { type:String, maxlength:64, required:true},
    role: { type:String, default:'employee'},
    status: { type:Number,  required:true, default:0},
    verified: { type:Boolean,  required:true, default:false},
    code: { type: String, required: true, default:0 },
	createdAt: { type: Date, default: Date.now },
    regiter_date: { type: Date, default: Date.now },
    last_login: { type: Date, default: Date.now },
    fail_login: { type: Number, default: 0}
});

const User = mongoose.model('user',userSchema);
export default User;

//----Insertar Usuarios---//

//MADMY
//const madmy = new User({
//    id:'445640abc972a9cb97c2cc01',
//    name:'Alayn',
//    last_name:'Sánchez Núñez',
//    email:'alaynsn@hotmail.com',
//    password: bcrypt.hashSync('89112232986',10),
//    role: 'administrator'
//})

////Guardar Ciego de Ávila
//madmy.save()