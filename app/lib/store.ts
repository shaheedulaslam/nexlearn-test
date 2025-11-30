import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlices';
import examReducer from './slices/examSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;