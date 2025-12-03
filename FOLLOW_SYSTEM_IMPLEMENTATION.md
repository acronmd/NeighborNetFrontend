# Follow System Implementation Guide

## Frontend Changes Required

### 1. Update Profile.tsx - Add Follow Functionality

Add these functions after the `getBadgeCategoryColor` function (around line 380):

```typescript
// Fetch follow status and counts
useEffect(() => {
    if (!isSelf && viewingUserId) {
        fetchFollowStatus();
    }
    if (viewingUserId) {
        fetchFollowCounts();
    }
}, [viewingUserId, isSelf]);

const fetchFollowStatus = async () => {
    try {
        const token = await SecureStore.getItemAsync('authToken');
        const ip = await SecureStore.getItemAsync('serverIp');

        const res = await fetch(`http://${ip}/api/follows/is-following/${viewingUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            setIsFollowing(data.is_following);
        }
    } catch (err) {
        console.error('Failed to fetch follow status:', err);
    }
};

const fetchFollowCounts = async () => {
    try {
        const token = await SecureStore.getItemAsync('authToken');
        const ip = await SecureStore.getItemAsync('serverIp');

        const userId = viewingUserId || loggedInUserId;
        const res = await fetch(`http://${ip}/api/follows/counts/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            setFollowersCount(data.followers_count);
            setFollowingCount(data.following_count);
        }
    } catch (err) {
        console.error('Failed to fetch follow counts:', err);
    }
};

const handleFollowToggle = async () => {
    if (!viewingUserId) return;
    
    setLoadingFollow(true);
    try {
        const token = await SecureStore.getItemAsync('authToken');
        const ip = await SecureStore.getItemAsync('serverIp');

        const endpoint = isFollowing ? 'unfollow' : 'follow';
        const res = await fetch(`http://${ip}/api/follows/${endpoint}/${viewingUserId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            setIsFollowing(!isFollowing);
            setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        } else {
            Alert.alert('Error', data.message || 'Failed to update follow status');
        }
    } catch (err) {
        console.error('Failed to toggle follow:', err);
        Alert.alert('Error', 'Failed to update follow status');
    } finally {
        setLoadingFollow(false);
    }
};
```

### 2. Update Profile Header - Add Follow Button and Counts

Replace the header section (around line 455) with:

```typescript
<View style={styles.headerCenter}>
    <TouchableOpacity 
        style={styles.avatarContainer} 
        onPress={isSelf ? pickImage : undefined}
        disabled={!isSelf || uploadingImage}
    >
        {/* ...existing avatar code... */}
    </TouchableOpacity>

    <View style={styles.nameContainer}>
        <Text style={styles.name}>{user.name}</Text>
        {user.verification_status === 'verified' && (
            <Text style={styles.verifiedBadge}>✓</Text>
        )}
    </View>
    <Text style={styles.handle}>@{user.username}</Text>
    
    {/* Follow Stats */}
    <View style={styles.followStats}>
        <TouchableOpacity 
            style={styles.stat}
            onPress={() => router.push(`/profile/${user.user_id}/followers` as any)}
        >
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity 
            style={styles.stat}
            onPress={() => router.push(`/profile/${user.user_id}/following` as any)}
        >
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
    </View>

    {/* Follow Button for other users */}
    {!isSelf && (
        <TouchableOpacity 
            style={[
                styles.followButton,
                isFollowing && styles.followingButton
            ]}
            onPress={handleFollowToggle}
            disabled={loadingFollow}
        >
            {loadingFollow ? (
                <ActivityIndicator color="white" size="small" />
            ) : (
                <Text style={styles.followButtonText}>
                    {isFollowing ? '✓ Following' : '+ Follow'}
                </Text>
            )}
        </TouchableOpacity>
    )}
    
    {user.verification_status && (
        <Text style={[
            styles.verificationStatus,
            user.verification_status === 'verified' && styles.verifiedStatus,
            user.verification_status === 'pending' && styles.pendingStatus,
        ]}>
            {user.verification_status === 'verified' && '✓ Verified'}
            {user.verification_status === 'pending' && '⏳ Verification Pending'}
            {user.verification_status === 'unverified' && '○ Unverified'}
        </Text>
    )}
    {user.street && <Text style={styles.location}>{user.street}</Text>}
</View>
```

### 3. Add Styles

Add these styles to the StyleSheet (around line 730):

```typescript
followStats: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
},
stat: {
    alignItems: 'center',
    paddingHorizontal: 20,
},
statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14171a',
},
statLabel: {
    fontSize: 12,
    color: '#657786',
    marginTop: 2,
},
statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e1e8ed',
},
followButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    minWidth: 120,
    alignItems: 'center',
},
followingButton: {
    backgroundColor: '#657786',
},
followButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
},
```

---

## Backend Implementation

### 1. Database Schema

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

### 2. API Routes

#### POST `/api/follows/follow/:user_id` - Follow a User

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.post('/follow/:user_id', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.user_id;
        const followedId = parseInt(req.params.user_id);

        // Validation
        if (!followedId || isNaN(followedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Prevent self-follow
        if (followerId === followedId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself'
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

        // Create follow relationship
        await db.query(
            'INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)',
            [followerId, followedId]
        );

        // TODO: Create notification for followed user
        // await createNotification(followedId, 'follow', followerId);

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

module.exports = router;
```

#### POST `/api/follows/unfollow/:user_id` - Unfollow a User

```javascript
router.post('/unfollow/:user_id', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.user_id;
        const followedId = parseInt(req.params.user_id);

        // Validation
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
                message: 'You are not following this user'
            });
        }

        // Remove follow relationship
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

#### GET `/api/follows/is-following/:user_id` - Check Follow Status

```javascript
router.get('/is-following/:user_id', authenticateToken, async (req, res) => {
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

#### GET `/api/follows/counts/:user_id` - Get Follow Counts

```javascript
router.get('/counts/:user_id', authenticateToken, async (req, res) => {
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

#### GET `/api/follows/followers/:user_id` - Get Followers List

```javascript
router.get('/followers/:user_id', authenticateToken, async (req, res) => {
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

        // Get total count
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

#### GET `/api/follows/following/:user_id` - Get Following List

```javascript
router.get('/following/:user_id', authenticateToken, async (req, res) => {
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

        // Get total count
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

### 3. Register Routes in Main App

In your `server.js` or `app.js`:

```javascript
const followsRouter = require('./routes/follows');
app.use('/api/follows', followsRouter);
```

---

## Testing Checklist

- [ ] Can follow users from their profile
- [ ] Can unfollow users from their profile
- [ ] Follower/following counts update correctly
- [ ] Cannot follow yourself
- [ ] Cannot double-follow same user
- [ ] Follow button shows correct state
- [ ] Followers list displays correctly
- [ ] Following list displays correctly
- [ ] Database constraints work (no self-follows)
- [ ] Proper authorization (must be logged in)

---

## Future Enhancements

1. **Notifications**: Notify users when someone follows them
2. **Follow Requests**: Add private profiles requiring approval
3. **Mutual Follows**: Show indicator when both users follow each other
4. **Follow Suggestions**: Recommend users to follow
5. **Activity Feed**: Show posts from followed users
6. **Block Users**: Prevent certain users from following
