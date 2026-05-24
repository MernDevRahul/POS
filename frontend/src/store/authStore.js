import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:    null,
      loading: false,

      setAuth: (user)=> set({ user }),

      login: async (username, password) => {
        set({ loading: true });
        try {
          const res = await authApi.login({ username, password });
          set({
            user: res.data.data.user,
            loading: false,
          });
          return { ok: true };
        } catch (err) {
          set({ loading: false });
          return { ok: false, message: err.message || 'Invalid credentials' };
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch (_) {}
        set({ user: null });
        localStorage.removeItem('axispos_token');
      },

      fetchMe: async () => {
        try {
          const res = await authApi.me();
          set({ user: res.data });
        } catch (_) {
          set({ user: null });
        }
      },

      isAdmin:   () => get().user?.role === 'ADMIN',
      isManager: () => ['ADMIN', 'MANAGER'].includes(get().user?.role),
    }),
    {
      name: 'axispos_auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }), // only persist the user object
    }
  )
);

export default useAuthStore;