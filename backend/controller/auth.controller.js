import User from "../models/user.model.js";
import bcyrpt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signup = async (req, res) => {
    try {
        const {fullName, username, password, confirmPassword, gender} = req.body;
        if(password !== confirmPassword) {
            return res.status(400).send({message: "Passwords do not match"});
        }
        
        const user = await User.findOne({username: username});
        if(user){
            return res.status(400).send({message: "User already exists"});
        }

        //hash
        const salt = await bcyrpt.genSalt(10);
        const hashedPassword = await bcyrpt.hash(password, salt);


        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUser = new User({
            fullName: fullName,
            username: username,
            password: hashedPassword,
            gender: gender,
            profilePic: gender === "male" ? boyProfilePic : girlProfilePic
        });

        if (newUser) {
            // Generate token and set cookie
            generateTokenAndSetCookie(newUser, res);

            await newUser.save();

            res.status(201).send({message: "User created successfully",
                user: {
                    fullName: newUser.fullName,
                    username: newUser.username,
                    gender: newUser.gender,
                    profilePic: newUser.profilePic
                }
            });
        } else {
            res.status(400).send({message: "Error creating user"});
        }

    } catch (error) {
        res.status(500).send({message: error.message});
    }
};

export const login = async (req, res) => {
  try {
    const {username, password} = req.body;
    const user = await User.findOne({username: username});
    
    if(!user) {
        return res.status(400).send({message: "User does not exist"});
    }
    const isPasswordCorrect = await bcyrpt.compare(password, user.password);
    if(!isPasswordCorrect) {
        return res.status(400).send({message: "Invalid username or password"});
    }
    // Generate token and set cookie
    generateTokenAndSetCookie(user, res);

    res.status(200).send({message: "Login successful",
        user: {
            fullName: user.fullName,
            username: user.username,
            gender: user.gender,
            profilePic: user.profilePic
        }
    });
    } catch (error) {
        res.status(500).send({message: error.message});
    }
}

export const logout = (req, res) => {
  try{
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        sameSite: "strict",
         maxAge: 0
    });
    res.status(200).send({message: "Logout successful"});
  } catch (error) {
    res.status(500).send({message: error.message});
  }
}
