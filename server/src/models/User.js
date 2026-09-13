/**
 * User Model
 * Author: Aakarsh Sharma
 *
 * Mongoose schema for users with password hashing and authentication.
 */

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// ── User Schema Definition ──────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // Unique user email address
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // User display name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    // Securely hashed password
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Omit password hash from query results by default
    },
  },
  {
    // Automatically record creation and modification timestamps
    timestamps: true,
  }
);

// ── Password Hashing Hook ───────────────────────────────────────────────────
// Automatically hash passwords prior to persisting document
userSchema.pre('save', async function (next) {
  // Only re-hash if the password field was modified
  if (!this.isModified('password')) {
    return next();
  }
  // Generate salt and hash with bcrypt
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Methods ────────────────────────────────────────────────────────
/**
 * Compares candidate plain-text password against stored bcrypt hash.
 *
 * @param {string} candidatePassword - Plain text password.
 * @returns {Promise<boolean>} True if match.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
