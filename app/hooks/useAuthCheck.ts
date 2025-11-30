// hooks/useAuthCheck.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/lib/store';

export const useAuthCheck = (redirectIfUnauthenticated = false) => {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuth = () => {
      const tokenFromStorage = typeof window !== 'undefined' ? 
        localStorage.getItem('accessToken') : null;

      const isActuallyAuthenticated = isAuthenticated || !!tokenFromStorage;

      if (redirectIfUnauthenticated && !isActuallyAuthenticated) {
        router.replace('/auth/login');
      }

      return isActuallyAuthenticated;
    };

    checkAuth();
  }, [isAuthenticated, accessToken, redirectIfUnauthenticated, router]);

  return { isAuthenticated: isAuthenticated || !!(typeof window !== 'undefined' && localStorage.getItem('accessToken')) };
};