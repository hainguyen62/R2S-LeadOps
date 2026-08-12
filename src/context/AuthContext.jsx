import { createContext, useContext } from "react";

/**
 * AuthContext — cung cấp user hiện tại (đã đăng nhập) cho toàn bộ cây
 * component nằm trong <AuthProvider> (đặt trong App.jsx sau khi có user).
 *
 * useAuth() trả về thẳng object user (hoặc null nếu gọi ngoài AuthProvider),
 * khớp với cách các trang đang dùng: `const user = useAuth();`
 */
const AuthContext = createContext(null);

export function AuthProvider({ user, children }) {
  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}