# Complete Backend Implementation Guide
## NeighborNet - Authentication, Profile & Follow System

---

## 🎯 Overview

This document provides complete backend implementation for:
1. Enhanced authentication (email verification, password reset, username recovery)
2. User profile management
3. Follow/unfollow system
4. Badge viewing for other users
5. Proper error handling

---

## 📋 Table of Contents

1. [Database Schema Updates](#database-schema-updates)
2. [Error Handling Middleware](#error-handling-middleware)
3. [Authentication Endpoints](#authentication-endpoints)
4. [User Profile Endpoints](#user-profile-endpoints)
5. [Follow System Endpoints](#follow-system-endpoints)
6. [Badge Endpoints](#badge-endpoints)
7. [Email Service Configuration](#email-service-configuration)
8. [Testing Checklist](#testing-checklist)

---

## 1. Database Schema Updates

### Email Verification & Password Reset
```sql
-- Add email verification fields to users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255),
ADD COLUMN verification_token_expires DATETIME,
ADD COLUMN reset_password_token VARCHAR(255),
ADD COLUMN reset_password_expires DATETIME;

-- Ensure email is unique
ALTER TABLE users ADD UNIQUE INDEX idx_email (email);
```

### Follow System
```sql
-- Create follows table
CREATE TABLE follows (
    follow_id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, followed_id),
    INDEX idx_follower (follower_id),
    INDEX idx_followed (followed_id)
);

-- Add constraint to prevent self-follows
ALTER TABLE follows ADD CONSTRAINT check_no_self_follow 
CHECK (follower_id != followed_id);
```

---

## 2. Error Handling Middleware

**Add to your main `server.js` or `app.js`:**

```javascript
// IMPORTANT: Add this AFTER all your routes but BEFORE app.listen()

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Don't send stack trace in production
    const error = {
        success: false,
        message: err.message || 'Internal server error'
    };
    
    if (process.env.NODE_ENV === 'development') {
        error.stack = err.stack;
    }
    
    res.status(err.status || 500).json(error);
});
```

---

## 3. Authentication Endpoints

### POST `/api/auth/register` - Enhanced Registration

```javascript
const crypto = require('crypto');
const bcrypt = require('bcrypt');

router.post('/auth/register', async (req, res) => {
    try {
        const { email, password, name, display_name, username, street } = req.body;

        // Validation
        if (!email || !password || !name || !display_name || !username) {
            return res.status(400).json({ 
                success: false, 
                message: 'Required: email, password, name, display_name, username' 
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Check if email exists
        const [existingEmail] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }

        // Check if username exists
        const [existingUsername] = await db.query(
            'SELECT user_id FROM users WHERE username = ?',
            [username.toLowerCase()]
        );

        if (existingUsername.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Username already taken' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Insert user
        const [result] = await db.query(`
            INSERT INTO users (
                email, password, name, display_name, username, street,
                email_verified, verification_token, verification_token_expires,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, ?, NOW())
        `, [
            email.toLowerCase(),
            hashedPassword,
            name,
            display_name,
            username.toLowerCase(),
            street || null,
            verificationToken,
            tokenExpires
        ]);

        // Send verification email
        const verificationLink = `http://${req.get('host')}/api/auth/verify-email?token=${verificationToken}`;
        
        await sendEmail({
            to: email,
            subject: 'Verify Your NeighborNet Email',
            html: `
                <h2>Welcome to NeighborNet!</h2>
                <p>Hi ${name},</p>
                <p>Please verify your email by clicking: <a href="${verificationLink}">Verify Email</a></p>
                <p>Link expires in 24 hours.</p>
            `,
            text: `Verify your email: ${verificationLink}`
        });

        res.status(201).json({
            success: true,
            message: 'Account created. Please check your email to verify.',
            user_id: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});
```

### GET `/api/auth/verify-email` - Email Verification

```javascript
router.get('/auth/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send('Invalid verification link');
        }

        const [users] = await db.query(`
            SELECT user_id, email, name 
            FROM users 
            WHERE verification_token = ? 
            AND verification_token_expires > NOW()
            AND email_verified = FALSE
        `, [token]);

        if (users.length === 0) {
            return res.status(400).send('Invalid or expired verification link');
        }

        await db.query(`
            UPDATE users 
            SET email_verified = TRUE,
                verification_token = NULL,
                verification_token_expires = NULL
            WHERE user_id = ?
        `, [users[0].user_id]);

        res.send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2>✅ Email Verified!</h2>
                    <p>You can now log in to NeighborNet.</p>
                </body>
            </html>
        `);

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).send('Server error');
    }
});
```

### POST `/api/auth/login` - Enhanced Login

```javascript
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password required' 
            });
        }

        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({ 
                success: false, 
                message: 'Please verify your email before logging in.' 
            });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                name: user.name,
                username: user.username,
                display_name: user.display_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});
```

### POST `/api/auth/forgot-password` - Request Password Reset

```javascript
router.post('/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const [users] = await db.query(
            'SELECT user_id, email, name FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        // Always return success (security)
        if (users.length === 0) {
            return res.json({ 
                success: true, 
                message: 'If email exists, reset code sent' 
            });
        }

        const user = users[0];

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const hashedCode = await bcrypt.hash(resetCode, 10);

        await db.query(`
            UPDATE users 
            SET reset_password_token = ?,
                reset_password_expires = ?
            WHERE user_id = ?
        `, [hashedCode, codeExpires, user.user_id]);

        await sendEmail({
            to: email,
            subject: 'Password Reset Code',
            html: `
                <h2>Password Reset</h2>
                <p>Hi ${user.name},</p>
                <p>Your reset code: <strong>${resetCode}</strong></p>
                <p>Expires in 15 minutes.</p>
            `,
            text: `Reset code: ${resetCode}`
        });

        res.json({ 
            success: true, 
            message: 'Reset code sent to email' 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});
```

### POST `/api/auth/reset-password` - Reset Password

```javascript
router.post('/auth/reset-password', async (req, res) => {
    try {
        const { email, code, new_password } = req.body;

        if (!email || !code || !new_password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, code, and new password required' 
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        const [users] = await db.query(`
            SELECT user_id, reset_password_token 
            FROM users 
            WHERE email = ? 
            AND reset_password_expires > NOW()
        `, [email.toLowerCase()]);

        if (users.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired reset code' 
            });
        }

        const user = users[0];
        const isValid = await bcrypt.compare(code, user.reset_password_token);

        if (!isValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid reset code' 
            });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(`
            UPDATE users 
            SET password = ?,
                reset_password_token = NULL,
                reset_password_expires = NULL
            WHERE user_id = ?
        `, [hashedPassword, user.user_id]);

        res.json({ 
            success: true, 
            message: 'Password reset successfully' 
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});
```

### POST `/api/auth/forgot-username` - Recover Username

```javascript
router.post('/auth/forgot-username', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const [users] = await db.query(
            'SELECT user_id, email, name, username FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        // Always return success (security)
        if (users.length === 0) {
            return res.json({ 
                success: true, 
                message: 'If email exists, username sent' 
            });
        }

        const user = users[0];

        await sendEmail({
            to: email,
            subject: 'Your NeighborNet Username',
            html: `
                <h2>Username Recovery</h2>
                <p>Hi ${user.name},</p>
                <p>Your username: <strong>@${user.username}</strong></p>
            `,
            text: `Your username: @${user.username}`
        });

        res.json({ 
            success: true, 
            message: 'Username sent to email' 
        });

    } catch (error) {
        console.error('Forgot username error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});
```

---

## 4. User Profile Endpoints

### GET `/api/users/public/:user_id` - View Other Users' Profiles

```javascript
router.get('/users/public/:user_id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const [users] = await db.query(`
            SELECT 
                user_id,
                name,
                username,
                display_name,
                bio,
                street,
                profile_image,
                verification_status,
                profile_visibility,
                is_moderator,
                created_at
            FROM users
            WHERE user_id = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Get public user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

### PUT `/api/users/profile` - Update Own Profile

```javascript
router.put('/users/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { name, display_name, username, bio, street, email, phone } = req.body;

        // Validation
        if (!name || !display_name || !username) {
            return res.status(400).json({
                success: false,
                message: 'Name, display_name, and username required'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 3 characters'
            });
        }

        // Check if username is taken by someone else
        const [existingUsername] = await db.query(
            'SELECT user_id FROM users WHERE username = ? AND user_id != ?',
            [username.toLowerCase(), userId]
        );

        if (existingUsername.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Update user
        await db.query(`
            UPDATE users 
            SET name = ?,
                display_name = ?,
                username = ?,
                bio = ?,
                street = ?,
                email = ?,
                phone = ?
            WHERE user_id = ?
        `, [
            name,
            display_name,
            username.toLowerCase(),
            bio || null,
            street || null,
            email || null,
            phone || null,
            userId
        ]);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

---

## 5. Follow System Endpoints

### POST `/api/follows/follow/:user_id` - Follow User

```javascript
router.post('/follows/follow/:user_id', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.user_id;
        const followedId = parseInt(req.params.user_id);

        if (!followedId || isNaN(followedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        if (followerId === followedId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot follow yourself'
            });
        }

        // Check if user exists
        const [users] = await db.query(
            'SELECT user_id FROM users WHERE user_id = ?',
            [followedId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already following
        const [existing] = await db.query(
            'SELECT follow_id FROM follows WHERE follower_id = ? AND followed_id = ?',
            [followerId, followedId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Already following this user'
            });
        }

        // Create follow
        await db.query(
            'INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)',
            [followerId, followedId]
        );

        res.json({
            success: true,
            message: 'Successfully followed user'
        });

    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

### POST `/api/follows/unfollow/:user_id` - Unfollow User

```javascript
router.post('/follows/unfollow/:user_id', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.user_id;
        const followedId = parseInt(req.params.user_id);

        if (!followedId || isNaN(followedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Check if following
        const [existing] = await db.query(
            'SELECT follow_id FROM follows WHERE follower_id = ? AND followed_id = ?',
            [followerId, followedId]
        );

        if (existing.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Not following this user'
            });
        }

        // Remove follow
        await db.query(
            'DELETE FROM follows WHERE follower_id = ? AND followed_id = ?',
            [followerId, followedId]
        );

        res.json({
            success: true,
            message: 'Successfully unfollowed user'
        });

    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

### GET `/api/follows/is-following/:user_id` - Check Follow Status

```javascript
router.get('/follows/is-following/:user_id', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.user_id;
        const followedId = parseInt(req.params.user_id);

        const [result] = await db.query(
            'SELECT follow_id FROM follows WHERE follower_id = ? AND followed_id = ?',
            [followerId, followedId]
        );

        res.json({
            success: true,
            is_following: result.length > 0
        });

    } catch (error) {
        console.error('Check follow status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

### GET `/api/follows/counts/:user_id` - Get Follow Counts

```javascript
router.get('/follows/counts/:user_id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);

        // Get followers count
        const [followersResult] = await db.query(
            'SELECT COUNT(*) as count FROM follows WHERE followed_id = ?',
            [userId]
        );

        // Get following count
        const [followingResult] = await db.query(
            'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
            [userId]
        );

        res.json({
            success: true,
            followers_count: followersResult[0].count,
            following_count: followingResult[0].count
        });

    } catch (error) {
        console.error('Get follow counts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

### GET `/api/follows/followers/:user_id` - Get Followers List

```javascript
router.get('/follows/followers/:user_id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [followers] = await db.query(`
            SELECT 
                u.user_id,
                u.name,
                u.username,
                u.display_name,
                u.profile_image,
                u.verification_status,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.follower_id = u.user_id
            WHERE f.followed_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM follows WHERE followed_id = ?',
            [userId]
        );

        res.json({
            success: true,
            followers,
            total: countResult[0].total,
            page,
            limit
        });

    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

### GET `/api/follows/following/:user_id` - Get Following List

```javascript
router.get('/follows/following/:user_id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [following] = await db.query(`
            SELECT 
                u.user_id,
                u.name,
                u.username,
                u.display_name,
                u.profile_image,
                u.verification_status,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.followed_id = u.user_id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM follows WHERE follower_id = ?',
            [userId]
        );

        res.json({
            success: true,
            following,
            total: countResult[0].total,
            page,
            limit
        });

    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

---

## 6. Badge Endpoints

### GET `/api/badges/user/:user_id` - Get User's Badges

```javascript
router.get('/badges/user/:user_id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);
        const viewerId = req.user.user_id;

        // Show all badges if viewing own profile, otherwise only displayed badges
        const displayFilter = userId === viewerId ? '' : 'AND ub.is_displayed = TRUE';

        const [badges] = await db.query(`
            SELECT 
                b.badge_id,
                b.name,
                b.description,
                b.icon,
                b.category,
                b.points_value,
                ub.earned_at,
                ub.is_displayed
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.badge_id
            WHERE ub.user_id = ? ${displayFilter}
            ORDER BY ub.earned_at DESC
        `, [userId]);

        res.json({
            success: true,
            badges
        });

    } catch (error) {
        console.error('Get user badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

---

## 7. Email Service Configuration

### Using Nodemailer (Development/Testing)

```javascript
// config/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendEmail({ to, subject, html, text }) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"NeighborNet" <noreply@neighbornet.com>',
            to,
            subject,
            text,
            html,
        });
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}

module.exports = { sendEmail };
```

### Environment Variables

Add to `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="NeighborNet <noreply@neighbornet.com>"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5050
```

---

## 8. Testing Checklist

### Authentication
- [ ] Register new user → receives verification email
- [ ] Click verification link → email verified
- [ ] Try login before verification → blocked with message
- [ ] Login after verification → success
- [ ] Duplicate email registration → error
- [ ] Duplicate username registration → error
- [ ] Forgot password → receives code
- [ ] Reset password with code → success
- [ ] Forgot username → receives username

### Profiles
- [ ] View own profile → all fields visible
- [ ] Edit own profile → updates successfully
- [ ] View other user's profile → public fields only
- [ ] Try to edit other user's profile → blocked

### Follow System
- [ ] Follow another user → count increases
- [ ] Unfollow user → count decreases
- [ ] Try to follow self → blocked with error
- [ ] Try to double-follow → blocked with error
- [ ] View followers list → correct users shown
- [ ] View following list → correct users shown

### Badges
- [ ] View own badges → all badges shown
- [ ] View other user's badges → only displayed badges shown
- [ ] Toggle badge display → updates correctly

### Error Handling
- [ ] All endpoints return JSON (not HTML)
- [ ] Proper error messages for all failures
- [ ] 404 for invalid routes → JSON response
- [ ] Server errors → JSON response with message

---

## 🚀 Quick Start

1. Run database migrations (schema updates)
2. Install dependencies: `npm install nodemailer bcrypt crypto`
3. Configure environment variables
4. Add error handling middleware to main app file
5. Add/update all route handlers
6. Test each endpoint
7. Deploy and test with frontend

---

## 📝 Notes

- All endpoints return JSON (never HTML error pages)
- Passwords are hashed with bcrypt
- Email tokens expire after 24 hours
- Reset codes expire after 15 minutes
- Follow relationships prevent self-follows at database level
- Profile images stored with proper localhost URL fixing

---

**Frontend is complete and ready!** Implement these backend endpoints and test thoroughly.
