import mongoose from "mongoose";
import validator from "validator";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodeCron from 'node-cron';
import geolocation from 'geolocation';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"]
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: validator.isEmail
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [6, "Password must be at least 6 characters"],
        select: false
    },
    role: {
        type: String,
        enum: ["patient", "caregiver", "Doctor"],
        default: "user"
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    medicine: [{
        name: {
            type: String,
            required: [true, "Please enter medicine name"]
        },
        photo: {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        },
        time: {
            type: Date,
            required: [true, "Please enter medicine time"]
        }
    }],
    location: {
        long: {
            type: Number
        },
        lat: {
            type: Number
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Generate JWT token
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn: "15d"
    });
};

// Compare password
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate password reset token
userSchema.methods.getResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};


export const User = mongoose.model("User", userSchema);

const updateLocation = () => {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const { latitude, longitude } = position.coords;

              const users = await User.find();
              users.forEach(async (user) => {
                  user.location = [{ lat: latitude, long: longitude }];
                  await user.save();
                  console.log(`Updated location for user: ${user.name}`);
              });

          },
          (error) => {
              // console.log(error.message);
          }
      );
  } else {
      // console.log("Geolocation is not supported by this browser.");
  }
};

nodeCron.schedule('*/10 * * * * *', async () => {
  await updateLocation();
});