import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';

export interface MaintenanceContextType {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEstimatedEndTime?: string;
  allowUserRegistration: boolean;
  isMaintenance: boolean;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(
    'SkillKart is currently undergoing scheduled platform upgrades. We will be right back!'
  );
  const [maintenanceEstimatedEndTime, setMaintenanceEstimatedEndTime] = useState<string | undefined>(undefined);
  const [allowUserRegistration, setAllowUserRegistration] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await api.get<{
        maintenanceMode?: boolean;
        maintenanceMessage?: string;
        maintenanceEstimatedEndTime?: string;
        allowUserRegistration?: boolean;
      }>('/settings/public');

      if (res.data) {
        setMaintenanceMode(Boolean(res.data.maintenanceMode));
        if (res.data.maintenanceMessage) {
          setMaintenanceMessage(res.data.maintenanceMessage);
        }
        setMaintenanceEstimatedEndTime(res.data.maintenanceEstimatedEndTime || undefined);
        if (res.data.allowUserRegistration !== undefined) {
          setAllowUserRegistration(Boolean(res.data.allowUserRegistration));
        }
      }
    } catch (err) {
      console.warn('Could not fetch public system settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Non-admin users are blocked from state-mutating actions during maintenance mode
  const isMaintenance = maintenanceMode && user?.role !== 'admin';

  return (
    <MaintenanceContext.Provider
      value={{
        maintenanceMode,
        maintenanceMessage,
        maintenanceEstimatedEndTime,
        allowUserRegistration,
        isMaintenance,
        loading,
        refreshSettings,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = (): MaintenanceContextType => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};
