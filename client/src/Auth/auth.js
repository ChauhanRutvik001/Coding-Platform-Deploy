import axiosInstance from "../utils/axiosInstance";

class Auth {
  async getCurrentUser() {
    try {
      const response = await axiosInstance.get("auth/get-current-user");
      const data = response.data;
      if (data.success) {
        return { data, authStatus: true };
      }
      return { authStatus: false };
    } catch (error) {
      // Don't log 401 errors as they're expected for non-authenticated users
      if (error.response && error.response.status === 401) {
        return { authStatus: false };
      }
      
      // Log other errors
      console.error("Error in getCurrentUser:", error);
      return { authStatus: false };
    }
  }
}

const AuthService = new Auth();
export default AuthService;