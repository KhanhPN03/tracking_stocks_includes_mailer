import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CheckCircle as ActiveIcon,
  Pause as StandbyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useServerStatus } from '../../hooks/useServerStatus';

interface ServerStatusCardProps {
  showAdminControls?: boolean;
}

const ServerStatusCard: React.FC<ServerStatusCardProps> = ({ 
  showAdminControls = false 
}) => {
  const { 
    serverStatus, 
    loading, 
    error, 
    forceActivate, 
    forceDeactivate, 
    refreshStatus 
  } = useServerStatus();

  const handleForceActivate = async () => {
    const result = await forceActivate('Manual activation by admin');
    if (result?.success) {
      console.log('Server activated:', result.message);
    } else {
      console.error('Failed to activate:', result?.message);
    }
  };

  const handleForceDeactivate = async () => {
    const result = await forceDeactivate('Manual deactivation by admin');
    if (result?.success) {
      console.log('Server deactivated:', result.message);
    } else {
      console.error('Failed to deactivate:', result?.message);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography>Đang tải trạng thái server...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button onClick={refreshStatus} size="small">
              <RefreshIcon />
            </Button>
          }>
            Lỗi: {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!serverStatus) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            Không có thông tin trạng thái server
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="div">
            <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Trạng thái Server
          </Typography>
          <Button onClick={refreshStatus} size="small">
            <RefreshIcon />
          </Button>
        </Box>

        <Box mb={2}>
          <Chip
            icon={serverStatus.isActive ? <ActiveIcon /> : <StandbyIcon />}
            label={serverStatus.isActive ? 'ĐANG HOẠT ĐỘNG' : 'CHẾ ĐỘ CHỜ'}
            color={serverStatus.isActive ? 'success' : 'warning'}
            variant="filled"
            size="medium"
          />
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Giờ hoạt động:</strong> {serverStatus.activeHours} ({serverStatus.timezone})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Thời gian hiện tại:</strong> {new Date(serverStatus.currentTime).toLocaleString('vi-VN')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>
              {serverStatus.isActive ? 'Kết thúc lúc:' : 'Bắt đầu lúc:'}
            </strong>{' '}
            {new Date(serverStatus.isActive ? serverStatus.nextEnd : serverStatus.nextStart)
              .toLocaleString('vi-VN')}
          </Typography>
        </Box>

        <Alert 
          severity={serverStatus.isActive ? 'success' : 'info'}
          sx={{ mb: 2 }}
        >
          {serverStatus.isActive ? (
            <>
              <strong>Server đang hoạt động</strong><br />
              Hệ thống cảnh báo, cập nhật giá và lưu dữ liệu người dùng đang hoạt động đầy đủ.
            </>
          ) : (
            <>
              <strong>Server ở chế độ chờ</strong><br />
              Dữ liệu người dùng vẫn được lưu, nhưng cập nhật giá và cảnh báo được giảm tần suất.
            </>
          )}
        </Alert>

        {showAdminControls && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Điều khiển Admin:
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                color="success"
                size="small"
                onClick={handleForceActivate}
                disabled={serverStatus.isActive}
              >
                Kích hoạt thủ công
              </Button>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={handleForceDeactivate}
                disabled={!serverStatus.isActive}
              >
                Tạm dừng thủ công
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ServerStatusCard;
