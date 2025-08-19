const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { activityLogService } = require('../services/activityLogService');

// @route   GET /api/activity/my-stats
// @desc    Get user's own activity statistics
// @access  Private
router.get('/my-stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;
    
    const stats = await activityLogService.getUserActivityStats(userId, days);
    
    // Log this activity
    await activityLogService.logActivity({
      userId: userId,
      sessionId: req.sessionID,
      action: 'view_activity_stats',
      details: { days: days },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: stats,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Get user activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity statistics'
    });
  }
});

// @route   GET /api/activity/system-stats
// @desc    Get system activity statistics (admin only)
// @access  Private/Admin
router.get('/system-stats', auth, async (req, res) => {
  try {
    // Check if user is admin (you can modify this based on your user roles)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const hours = parseInt(req.query.hours) || 24;
    const stats = await activityLogService.getSystemActivityStats(hours);
    
    // Log this activity
    await activityLogService.logActivity({
      userId: req.user._id,
      sessionId: req.sessionID,
      action: 'view_system_stats',
      details: { hours: hours },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: stats,
      period: `${hours} hours`
    });
  } catch (error) {
    console.error('Get system activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system statistics'
    });
  }
});

// @route   POST /api/activity/log
// @desc    Manual activity logging (for frontend events)
// @access  Private
router.post('/log', auth, async (req, res) => {
  try {
    const { action, details } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }

    await activityLogService.logActivity({
      userId: req.user._id,
      sessionId: req.sessionID,
      action: action,
      details: details || {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error('Manual activity logging error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log activity'
    });
  }
});

// @route   GET /api/activity/server-status
// @desc    Get current server status and schedule
// @access  Public
router.get('/server-status', async (req, res) => {
  try {
    if (!global.scheduleService) {
      return res.status(503).json({
        success: false,
        message: 'Schedule service not available'
      });
    }
    
    const statusInfo = global.scheduleService.getActiveHoursInfo();
    
    res.json({
      success: true,
      data: statusInfo
    });
  } catch (error) {
    console.error('Get server status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get server status'
    });
  }
});

// @route   POST /api/activity/force-activate
// @desc    Force server activation (admin only)
// @access  Private/Admin
router.post('/force-activate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (!global.scheduleService) {
      return res.status(503).json({
        success: false,
        message: 'Schedule service not available'
      });
    }

    global.scheduleService.forceActivate();
    
    // Log this admin action
    await activityLogService.logActivity({
      userId: req.user._id,
      sessionId: req.sessionID,
      action: 'force_server_activate',
      details: { reason: req.body.reason || 'Manual activation' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Server manually activated'
    });
  } catch (error) {
    console.error('Force activate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate server'
    });
  }
});

// @route   POST /api/activity/force-deactivate
// @desc    Force server deactivation (admin only)
// @access  Private/Admin
router.post('/force-deactivate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (!global.scheduleService) {
      return res.status(503).json({
        success: false,
        message: 'Schedule service not available'
      });
    }

    global.scheduleService.forceDeactivate();
    
    // Log this admin action
    await activityLogService.logActivity({
      userId: req.user._id,
      sessionId: req.sessionID,
      action: 'force_server_deactivate',
      details: { reason: req.body.reason || 'Manual deactivation' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Server manually deactivated'
    });
  } catch (error) {
    console.error('Force deactivate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate server'
    });
  }
});

module.exports = router;
