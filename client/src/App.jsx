import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import AuthService from "./Auth/auth";
import { useDispatch } from "react-redux";
import { setUser, logout, setLoading } from "./redux/userSlice";
import { fetchProfilePicThunk } from "./redux/userSlice";
import Body from "./componets/Body";
import { LoaderPinwheel } from "lucide-react";
import { NotificationProvider } from "./contexts/NotificationContext";
import Browse from "./componets/Browse";

const App = () => {
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await AuthService.getCurrentUser();
        setIsAuthenticated(authResponse.authStatus);
        if (authResponse.authStatus) {
          dispatch(setUser(authResponse.data.user));
          dispatch(setLoading(true));
          dispatch(fetchProfilePicThunk());
          dispatch(setLoading(false));
        } else {
          dispatch(logout());
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [dispatch]);
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white overflow-hidden">
        <LoaderPinwheel size={60} className="animate-spin text-blue-400" />
        <p className="mt-4 text-xl text-blue-400 font-medium">
          Checking authentication...
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-900 overflow-hidden">
      <NotificationProvider>
        <Body isAuthenticated={isAuthenticated} />
        <Toaster />
      </NotificationProvider>
    </div>
  );
};

export default App;