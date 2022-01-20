import models from '../models';
import bcrypt from 'bcryptjs';
import token from '../services/token';

const { v4: uuidv4 } = require('uuid');
const { getToken, getTokenData } = require('../config/jwt.config');
const { getTemplateVerifycation, getTemplateRestorePassword, getTemplatePasswordChanged, getTemplateBlockedAccount, sendEmail } = require('../config/mail.config');

export default {
    login: async (req, res, next) => {
        try {
            let user = await models.User.findOne({ email: req.body.email });
            if (user.status == 1 && user.verified == true) {
                //Existe un usuario con ese email
                let match = await bcrypt.compare(req.body.password, user.password);
                if (match) {
                    let tokenReturn = await token.encode(user._id, user.role, user.email, user.name, user.last_name)
                    user.fail_login = 0;
                    await user.save();
                    res.status(200).json({ user, tokenReturn });
                } else {
                    res.status(404).json('password_fail');
                }
            } else {
                res.status(404).json('password_incorrect');
            }
        } catch (e) {
            res.status(500).json('unknown');
            next(e);
        }
    },
    check_email: async (req, res, next) => {
        try {
            const reg = await models.User.findOne({ email: req.body.email });
            if (!reg) {
                res.status(404).json('unknown')
            } else if (reg.status === 0 && reg.fail_login >= 3) {
                res.status(200).json('fail_login');
            } else if (reg.status == 0) {
                res.status(404).json('inactive');
            } else if (reg.verified == false) {
                res.status(404).json('unverified');
            } else {
                res.status(200).json('success');
            }
        } catch (e) {
            res.status(500).send({
                message: 'Ha ocurrido un error'
            });
            next(e);
        }
    },
    verify_email: async (req, res, next) => {
        try {
            const reg = await models.User.findOne({ email: req.body.email });
            if (!reg) {
                res.status(404).json('false')
            } else {
                res.status(200).json('true');
            }
        } catch (e) {
            res.status(500).send({
                message: 'Ha ocurrido un error'
            });
            next(e);
        }
    },
    register: async (req, res, next) => {
        try {
            const code = uuidv4();
            const name = req.body.name;
            const email = req.body.email;
            const token = getToken({ email, code });
            const template = getTemplateVerifycation(name, token);
            req.body.password = await bcrypt.hash(req.body.password, 10);
            req.body.code = code;

            //Send Email Confirmation
            const send_email = await sendEmail(email, 'Welcome to MADMY!', template);

            if (send_email) {

                const reg = models.User.create(req.body);

                res.status(200).json('register_success');

            } else {
                res.status(404).json('send_error no_register')
            }

        } catch (e) {
            res.status(500).send({
                message: 'Ha ocurrido un error'
            });
            next(e);
        }
    },

    verify_account: async (req, res, next) => {
        try {
            const { token } = req.params;
            const data = await getTokenData(token);
            const { email, code } = data.data;

            const user = await models.User.findOne({ email });

            if (!user) {
                return res.redirect('/?res=unknow');
            } else if (user.verified === true) {
                return res.redirect('/?res=confirmed');
            } else if (code !== user.code) {
                return res.redirect('/?res=invalid');
            } else {

                //Activate and Verify account
                user.status = 1;
                user.verified = true;

                await user.save();

                return res.redirect('/?res=activate');
            }

        } catch (e) {
            return res.redirect('/?res=expired');
        }
    },

    fail_password: async (req, res, next) => {
        try {
            const reg = await models.User.findOne({ email: req.body.email });

            const template = getTemplateBlockedAccount(reg.name);

            if (reg.fail_login < 2) {
                reg.fail_login = reg.fail_login + 1;
                if (reg.fail_login === 2) {
                    res.status(200).json('attempt_two');
                }
            } else {
                if (reg.fail_login > 2) {
                    reg.fail_login = reg.fail_login + 1;
                    await reg.save();
                    res.status(200).json('blocked');
                }
                reg.status = 0;
                reg.fail_login = reg.fail_login + 1;

                
                if (reg.fail_login === 3) {
                    //Send email
                    const send_email = await sendEmail(reg.email, 'Madmy Account Lockout', template);
                }
                
                res.status(200).json('inactive');
            }
            await reg.save();
        } catch (e) {
            res.status(500).send({
                message: 'Ha ocurrido un error'
            });
            next(e);
        }
    },

    reset_password: async (req, res, next) => {
        try {

            const user = await models.User.findOne({ email: req.body.email });
            const email = req.body.email;
            const code = uuidv4();
            const name = user.name
            const token = getToken({ email, code });
            const template = getTemplateRestorePassword(name, token);

            //Send Email Restore Password
            const send_email = await sendEmail(email, 'Madmy Password Recovery', template);

            if (send_email) {

                //Update Code Verification
                user.code = code;
                await user.save();

                res.status(200).json('send_success');

            } else {
                res.status(404).json('send_error')
            }

        } catch (e) {
            res.status(500).send({
                message: 'Ha ocurrido un error'
            });
            next(e);
        }
    },

    reset_confirm: async (req, res, next) => {
        try {
            
         
            const token = req.params.token
            const data = await getTokenData(token);
            const { email, code } = data.data;

            const user = await models.User.findOne({ email });
        
            if (!user) {
                return res.redirect('/?res=unknow');
            } else if (user.code === code) {
                return res.redirect('/?res=resetpassword&key=' + token + '&user=' + user.email);
            } else {
                return res.redirect('/?res=invalidp');
            }

        } catch (e) {
            return res.redirect('/?res=expired');
        }
    },

    recover_password: async (req, res, next) => {
        try {

            const token = req.body.key;
            const data = await getTokenData(token);
            const { email, code } = data.data;

            const newcode = uuidv4();
            const newpassword = await bcrypt.hash(req.body.password, 10);

            const user = await models.User.findOne({ email });

            const template = getTemplatePasswordChanged(user.name);

            if (!user) {
                return res.redirect('/?res=unknow');
            } else if (code !== user.code) {
                return res.redirect('/?res=invalid');
            } else {

                //Send Email Confirmation
                await sendEmail(email, 'Madmy Password Updated', template);

                //Update User
                user.code = newcode;
                user.password = newpassword;
                user.status = 1;
                user.fail_login = 0;
                await user.save();

                res.status(200).json('password_updated');
            }

        } catch (e) {
            res.status(404).json('error');
            
        }
    },
}