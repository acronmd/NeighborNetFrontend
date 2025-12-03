# Backend Implementation Required - Follow System

## 🚨 Frontend is Complete - Backend Needed

The frontend follow system is fully implemented and working. However, it needs these backend endpoints to function:

---

## Required Database Table

```sql
-- Create the follows table
CREATE TABLE IF NOT EXISTS follows (
    follow_id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL COMMENT 'User who is following',
    followed_id INT NOT NULL COMMENT 'User being followed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Prevent duplicate follows
    UNIQUE KEY unique_follow (follower_id, followed_id),
    
    -- Indexes for performance
    INDEX idx_follower (follower_id),
    INDEX idx_followed (followed_id),
    
    -- Prevent self-follows
    CONSTRAINT check_no_self_follow CHECK (follower_id != followed_id)
);
```

---

## Required Endpoints (6 Total)

### 1. POST `/api/follows/follow/:user_id` - Follow a User

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

---

### 2. POST `/api/follows/unfollow/:user_id` - Unfollow a User

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

---

### 3. GET `/api/follows/is-following/:user_id` - Check Follow Status

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

---

### 4. GET `/api/follows/counts/:user_id` - Get Follower/Following Counts

**THIS IS THE CRITICAL ENDPOINT FOR SHOWING COUNTS**

```javascript
router.get('/follows/counts/:user_id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Get followers count (people following this user)
        const [followersResult] = await db.query(
            'SELECT COUNT(*) as count FROM follows WHERE followed_id = ?',
            [userId]
        );

        // Get following count (people this user is following)
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

---

### 5. GET `/api/follows/followers/:user_id` - Get Followers List

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

---

### 6. GET `/api/follows/following/:user_id` - Get Following List

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

## Testing Steps

### 1. Create the follows table (run SQL above)

### 2. Test Follow Flow:
```bash
# User 1 follows User 2
curl -X POST http://localhost:5050/api/follows/follow/2 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
{
  "success": true,
  "message": "Successfully followed user"
}
```

### 3. Test Counts:
```bash
# Get User 2's follower/following counts
curl http://localhost:5050/api/follows/counts/2 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
{
  "success": true,
  "followers_count": 1,
  "following_count": 0
}
```

### 4. Test Unfollow:
```bash
# User 1 unfollows User 2
curl -X POST http://localhost:5050/api/follows/unfollow/2 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
{
  "success": true,
  "message": "Successfully unfollowed user"
}
```

### 5. Test in App:
- Open any user's profile
- Count should display (e.g., "5 Followers", "10 Following")
- Click Follow button → count increases
- Click Following button → count decreases

---

## What Will Work After Implementation:

✅ Follower count will show real numbers
✅ Following count will show real numbers  
✅ Follow button will add follow relationship
✅ Following button (when active) will remove follow relationship
✅ Counts update in real-time when you follow/unfollow

---

## Important Notes:

1. **authenticateToken middleware** must decode JWT and set `req.user.user_id`
2. **All endpoints return JSON** (never HTML)
3. **Database constraints** prevent self-follows and duplicate follows
4. **Indexes** ensure fast queries even with many followers

---

## Frontend is Ready - Just Add Backend!

The frontend code is 100% complete. Once you implement these 6 endpoints, everything will work perfectly:
- Numbers will show up
- Follow button will work
- Unfollow (clicking "Following") will work
- Counts will update in real-time

No frontend changes needed! 🎉
