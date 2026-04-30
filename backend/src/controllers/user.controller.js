import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production", {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      const token = generateToken(user._id);
      return res.status(httpStatus.OK).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid email or password" });
    }
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong: ${e.message}` });
  }
};

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(httpStatus.FOUND).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(httpStatus.CREATED).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (e) {
    res.status(500).json({ message: `Something went wrong: ${e.message}` });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { hostId: req.user._id },
        { "participants.userId": req.user._id },
      ],
    }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export { login, register, getProfile, getUserHistory };

