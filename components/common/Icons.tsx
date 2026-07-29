// components/common/Icons.tsx
import React from 'react';
import { 
  Flame, 
  Droplet, 
  Gauge, 
  Zap, 
  Waves, 
  LogOut, 
  Video,
  AlertTriangle,
  Settings,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle
} from 'lucide-react';
import { SensorType } from '../../types/sensor';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. 소화기 아이콘
export const ExtinguisherIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <Flame className={className} size={size} />
);

// 2. 소화전 아이콘
export const HydrantIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <Droplet className={className} size={size} />
);

// 3. 배관 수압 아이콘
export const WaterPressureIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <Gauge className={className} size={size} />
);

// 4. 아크 차단 아이콘
export const ArcIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <Zap className={className} size={size} />
);

// 5. 선형 누수 아이콘
export const LeakIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <Waves className={className} size={size} />
);

// 6. 비상구 도어 아이콘
export const EmergencyDoorIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <LogOut className={className} size={size} />
);

// 7. CCTV 아이콘
export const CctvIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <Video className={className} size={size} />
);

// 6대 센서 타입을 받아서 해당 아이콘을 반환하는 컴포넌트
interface SensorIconProps extends IconProps {
  type: SensorType;
}

export const SensorIcon: React.FC<SensorIconProps> = ({ type, className, size = 20 }) => {
  switch (type) {
    case 'EXTINGUISHER':
      return <ExtinguisherIcon className={className} size={size} />;
    case 'HYDRANT':
      return <HydrantIcon className={className} size={size} />;
    case 'WATER_PRESSURE':
      return <WaterPressureIcon className={className} size={size} />;
    case 'ARC':
      return <ArcIcon className={className} size={size} />;
    case 'LEAK':
      return <LeakIcon className={className} size={size} />;
    case 'EMERGENCY_DOOR':
      return <EmergencyDoorIcon className={className} size={size} />;
    case 'CCTV':
      return <CctvIcon className={className} size={size} />;
    default:
      return <AlertTriangle className={className} size={size} />;
  }
};

// 기타 관제용 공통 아이콘들 재수출
export {
  AlertTriangle as AlertIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  ShieldAlert as ShieldIcon,
  CheckCircle as CheckIcon,
};
