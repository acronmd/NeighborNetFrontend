import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal
} from 'react-native';
import { api } from "../lib/_api";
import * as SecureStore from 'expo-secure-store';

type Badge = {
    badge_id: number;
    name: string;
    description: string;
    icon: string;
    category: string;
    points_value: number;
    earned_at?: string;
    is_displayed: boolean;
    progress?: {
        current: number;
        target: number;
        percentage: number;
    };
};

export default function BadgesScreen() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [myBadges, setMyBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'earned' | 'available'>('earned');
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    const checkAuthAndFetch = async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");
            
            if (!token || !ip) {
                setLoading(false);
                return;
            }
            
            await fetchBadges();
        } catch (err) {
            console.error('Auth check failed:', err);
            setLoading(false);
        }
    };

    const fetchBadges = async () => {
        try {
            const [allBadgesData, myBadgesData, progressData] = await Promise.all([
                api('/badges'),
                api('/badges/my-badges'),
                api('/badges/progress')
            ]);

            setBadges(allBadgesData.badges || []);
            setMyBadges(myBadgesData.badges || []);
            
            // Merge progress data
            if (progressData.badges) {
                setBadges(progressData.badges);
            }
        } catch (err: any) {
            console.error('Failed to fetch badges:', err);
            // Silently fail - show empty state instead of crashing
            // User will see "No badges yet" message
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBadges();
    };

    const toggleBadgeDisplay = async (badgeId: number, currentDisplay: boolean) => {
        try {
            await api(`/badges/${badgeId}/display`, {
                method: 'PATCH',
                body: JSON.stringify({ is_displayed: !currentDisplay }),
            });
            
            setMyBadges(prev =>
                prev.map(b =>
                    b.badge_id === badgeId ? { ...b, is_displayed: !currentDisplay } : b
                )
            );
            
            Alert.alert(
                'Success',
                !currentDisplay ? 'Badge will be displayed on your profile' : 'Badge hidden from profile'
            );
        } catch (err) {
            Alert.alert('Error', 'Failed to update badge display');
        }
    };

    const getBadgeCategoryColor = (category: string): string => {
        switch (category) {
            case 'participation':
                return '#4A90E2';
            case 'contribution':
                return '#27AE60';
            case 'leadership':
                return '#F39C12';
            case 'special':
                return '#9B59B6';
            default:
                return '#95A5A6';
        }
    };

    const renderBadge = ({ item }: { item: Badge }) => {
        const isEarned = !!item.earned_at;
        const categoryColor = getBadgeCategoryColor(item.category);

        return (
            <TouchableOpacity
                style={[
                    styles.badgeCard,
                    !isEarned && styles.lockedBadge
                ]}
                onPress={() => setSelectedBadge(item)}
            >
                <View style={[styles.badgeIconContainer, { backgroundColor: categoryColor }]}>
                    <Text style={styles.badgeIcon}>{item.icon}</Text>
                </View>
                
                <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, !isEarned && styles.lockedText]}>
                        {item.name}
                    </Text>
                    <Text style={styles.badgeCategory}>{item.category.toUpperCase()}</Text>
                    
                    {item.progress && !isEarned && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${item.progress.percentage}%`, backgroundColor: categoryColor }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {item.progress.current} / {item.progress.target}
                            </Text>
                        </View>
                    )}
                    
                    {isEarned && (
                        <View style={styles.earnedContainer}>
                            <Text style={styles.earnedText}>
                                ✓ Earned {new Date(item.earned_at!).toLocaleDateString()}
                            </Text>
                            <Text style={styles.pointsText}>+{item.points_value} pts</Text>
                        </View>
                    )}
                </View>

                {isEarned && (
                    <TouchableOpacity
                        style={[
                            styles.displayToggle,
                            item.is_displayed && styles.displayToggleActive
                        ]}
                        onPress={(e) => {
                            e.stopPropagation();
                            toggleBadgeDisplay(item.badge_id, item.is_displayed);
                        }}
                    >
                        <Text style={styles.displayToggleText}>
                            {item.is_displayed ? '👁️' : '👁️‍🗨️'}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    const displayData = selectedTab === 'earned' ? myBadges : badges;
    const earnedCount = myBadges.length;
    const totalPoints = myBadges.reduce((sum, b) => sum + b.points_value, 0);

    return (
        <View style={styles.container}>
            {/* Stats Header */}
            <View style={styles.statsHeader}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{earnedCount}</Text>
                    <Text style={styles.statLabel}>Badges Earned</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{totalPoints}</Text>
                    <Text style={styles.statLabel}>Total Points</Text>
                </View>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'earned' && styles.activeTab]}
                    onPress={() => setSelectedTab('earned')}
                >
                    <Text style={[styles.tabText, selectedTab === 'earned' && styles.activeTabText]}>
                        🏆 Earned ({earnedCount})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'available' && styles.activeTab]}
                    onPress={() => setSelectedTab('available')}
                >
                    <Text style={[styles.tabText, selectedTab === 'available' && styles.activeTabText]}>
                        🎯 Available ({badges.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Badges List */}
            <FlatList
                data={displayData}
                renderItem={renderBadge}
                keyExtractor={(item) => item.badge_id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🏆</Text>
                        <Text style={styles.emptyText}>
                            {selectedTab === 'earned'
                                ? 'No badges earned yet'
                                : 'No badges available'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {selectedTab === 'earned'
                                ? 'Keep participating to earn your first badge!'
                                : 'Check back later for new badges'}
                        </Text>
                    </View>
                }
            />

            {/* Badge Detail Modal */}
            <Modal
                visible={selectedBadge !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedBadge(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedBadge && (
                            <>
                                <View
                                    style={[
                                        styles.modalIconContainer,
                                        { backgroundColor: getBadgeCategoryColor(selectedBadge.category) }
                                    ]}
                                >
                                    <Text style={styles.modalIcon}>{selectedBadge.icon}</Text>
                                </View>
                                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                                <Text style={styles.modalCategory}>
                                    {selectedBadge.category.toUpperCase()}
                                </Text>
                                <Text style={styles.modalDescription}>{selectedBadge.description}</Text>
                                
                                {selectedBadge.earned_at ? (
                                    <View style={styles.modalEarnedInfo}>
                                        <Text style={styles.modalEarnedText}>
                                            ✓ Earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.modalPointsText}>
                                            Awarded {selectedBadge.points_value} points
                                        </Text>
                                    </View>
                                ) : selectedBadge.progress && (
                                    <View style={styles.modalProgressContainer}>
                                        <Text style={styles.modalProgressLabel}>Your Progress</Text>
                                        <View style={styles.modalProgressBar}>
                                            <View
                                                style={[
                                                    styles.modalProgressFill,
                                                    {
                                                        width: `${selectedBadge.progress.percentage}%`,
                                                        backgroundColor: getBadgeCategoryColor(selectedBadge.category)
                                                    }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.modalProgressText}>
                                            {selectedBadge.progress.current} / {selectedBadge.progress.target} ({selectedBadge.progress.percentage}%)
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.modalCloseButton}
                                    onPress={() => setSelectedBadge(null)}
                                >
                                    <Text style={styles.modalCloseButtonText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f8fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsHeader: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e1e8ed',
        marginHorizontal: 20,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#657786',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#4A90E2',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#657786',
    },
    activeTabText: {
        color: '#4A90E2',
    },
    listContainer: {
        padding: 12,
    },
    badgeCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    lockedBadge: {
        opacity: 0.6,
    },
    badgeIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    badgeIcon: {
        fontSize: 32,
    },
    badgeInfo: {
        flex: 1,
    },
    badgeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#14171a',
        marginBottom: 4,
    },
    lockedText: {
        color: '#95a5a6',
    },
    badgeCategory: {
        fontSize: 12,
        color: '#657786',
        fontWeight: '600',
        marginBottom: 8,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e1e8ed',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#657786',
    },
    earnedContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    earnedText: {
        fontSize: 12,
        color: '#27AE60',
        fontWeight: '600',
    },
    pointsText: {
        fontSize: 14,
        color: '#F39C12',
        fontWeight: 'bold',
    },
    displayToggle: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f5f8fa',
    },
    displayToggleActive: {
        backgroundColor: '#4A90E2',
    },
    displayToggleText: {
        fontSize: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        marginTop: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#14171a',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#657786',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalIcon: {
        fontSize: 48,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#14171a',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalCategory: {
        fontSize: 14,
        color: '#657786',
        fontWeight: '600',
        marginBottom: 16,
    },
    modalDescription: {
        fontSize: 16,
        color: '#657786',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    modalEarnedInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalEarnedText: {
        fontSize: 14,
        color: '#27AE60',
        fontWeight: '600',
        marginBottom: 8,
    },
    modalPointsText: {
        fontSize: 16,
        color: '#F39C12',
        fontWeight: 'bold',
    },
    modalProgressContainer: {
        width: '100%',
        marginBottom: 20,
    },
    modalProgressLabel: {
        fontSize: 14,
        color: '#657786',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalProgressBar: {
        height: 12,
        backgroundColor: '#e1e8ed',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    modalProgressFill: {
        height: '100%',
        borderRadius: 6,
    },
    modalProgressText: {
        fontSize: 14,
        color: '#657786',
        textAlign: 'center',
    },
    modalCloseButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 8,
    },
    modalCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
