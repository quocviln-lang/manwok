import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiCall } from '../services/api';

type TourContextType = {
  run: boolean;
  stepIndex: number;
  setRun: (val: boolean) => void;
  setStepIndex: (val: number) => void;
  finishTour: () => Promise<void>;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user, login } = useAuth();
  
  // Lấy trạng thái lưu trữ trong localStorage để tiếp tục Tour giữa các trang
  const [run, setRun] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(() => {
    const saved = localStorage.getItem('manwok_tour_step');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    // Chỉ kích hoạt nếu user chưa từng xem tutorial
    if (user && user.hasSeenTutorial === false) {
      setRun(true);
    } else {
      setRun(false);
      localStorage.removeItem('manwok_tour_step');
    }
  }, [user]);

  // Cập nhật localStorage mỗi khi step thay đổi
  useEffect(() => {
    if (run) {
      localStorage.setItem('manwok_tour_step', stepIndex.toString());
    }
  }, [stepIndex, run]);

  const finishTour = async () => {
    setRun(false);
    localStorage.removeItem('manwok_tour_step');
    if (user) {
      try {
        const res = await apiCall('/auth/me', {
          method: 'PATCH',
          body: JSON.stringify({ hasSeenTutorial: true }),
        });
        if (res.success && res.data?.user) {
          login(localStorage.getItem('token') || '', res.data.user);
        }
      } catch (error) {
        console.error('Failed to finish tour', error);
      }
    }
  };

  return (
    <TourContext.Provider value={{ run, setRun, stepIndex, setStepIndex, finishTour }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within TourProvider');
  return context;
};
