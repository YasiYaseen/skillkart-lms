import type { Request, Response } from "express";
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

export async function googleLogin(req: Request, res: Response) {
    const { access_token } = req.body;

    if (!access_token) {
        return res.status(400).json({ message: 'Access token required' });
    }

    try {
        //  Fetch user profile from Google
        const googleRes = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const { email, name, picture, sub } = googleRes.data;


        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                email,
                name,
                googleId: sub,
                avatar: picture, 
                password: "", 
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        //  Create JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            token,
            user,
        });

    } catch (error) {
        return res.status(401).json({ message: 'Google authentication failed' });
    }
}
