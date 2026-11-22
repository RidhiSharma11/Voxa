import { User } from "../models/user.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
    const { name, username, email, password } = req.body;

    // Check if all required fields are provided
    if (!name || !username || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    try {
        // Check whether email or username already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase().trim() },
                { username: username.trim() }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or username already exists"
            });
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name.trim(),
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({
            message: "User Registered Successfully"
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Step 2: Find user
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        // Step 3: Check if user exists
        if (!user) {
            return res.status(404).json({
                message: "Invalid email or password"
            });
        }

        // Step 4: Compare passwords with hashedpass
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Step 5: Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Step 6: Send response
        return res.status(200).json({
            message: "Login Successful",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};

export { register, login };