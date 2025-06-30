import React, { useState, useEffect, useReducer } from "react";
import toast from "react-hot-toast";
import ProfileLeft from "./ProfileLeft";
import ProfileRight from "./ProfileRight";
import SubmissionPage from "../SubmissionPage";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { fetchSubmissions } from "../../redux/slices/submissionSlice";
import {
  startNavigation,
  endNavigation,
} from "../../redux/slices/historySlice";
import { useLocation } from "react-router-dom";
import { isPageCached } from "../../utils/transitionManager";
import { motion, AnimatePresence } from "framer-motion";

const initialState = {
  username: "",
  gender: "",
  location: "",
  birthday: "",
  github: "",
  linkedIn: "",
  skills: "",
  education: "",
  name: "",
  bio: "",
  email: "",
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_FORM_DATA":
      return { ...state, ...action.payload };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
};

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, dispatch] = useReducer(reducer, initialState);
  const user = useSelector((state) => state.app.user);
  const imageUrl = useSelector((state) => state.app.imageUrl);
  const reduxDispatch = useDispatch();
  const submissions = useSelector((state) => state.submissions.submissions);  const location = useLocation();
  const isCached = isPageCached(location.pathname);
  const [rightColumnKey, setRightColumnKey] = useState("submissions");

  // Get initial tab from URL params
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'apikeys' ? 'apikeys' : 'profile';

  useEffect(() => {
    // Only signal navigation start if we're not already cached
    if (!isCached) {
      reduxDispatch(startNavigation());
    }

    return () => {};
  }, []);

  useEffect(() => {
    if (user) {
      // No need to signal navigation start again
      // Just update form data from existing Redux state
      dispatch({
        type: "SET_FORM_DATA",
        payload: {
          username: user.username || "",
          name: user.profile?.name || "",
          gender: user.profile?.gender || "",
          bio: user.profile?.bio || "",
          location: user.profile?.location || "",
          birthday: user.profile?.birthday
            ? user.profile.birthday.slice(0, 10)
            : "",
          github: user.profile?.github || "",
          skills: user.profile?.skills || "",
          education: user.profile?.education || "",
          linkedIn: user.profile?.linkedIn || "",
          email: user.email || "",
        },
      });

      // Only end navigation if we started it
      if (!isCached) {
        reduxDispatch(endNavigation());
      }
    }
  }, [user, reduxDispatch, isCached]);

  useEffect(() => {
    // Only fetch if we don't have submissions yet and haven't attempted to fetch
    if (user?._id && submissions.length === 0) {
      console.log("Fetching submissions for the first time");
      reduxDispatch(fetchSubmissions({ page: 1, limit: 7 }));
    }
  }, [reduxDispatch, user?._id, submissions.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    dispatch({ type: "SET_FORM_DATA", payload: { [name]: value } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email) {
      toast.error("Username and email are required.");
      return;
    }

    try {
      const response = await axiosInstance.put("user/update", { ...formData });

      if (response.data.success) {
        // First update UI state to appear responsive
        toast.success("Profile updated successfully.");

        // Then smoothly transition out of edit mode
        setRightColumnKey("submissions");
        setTimeout(() => {
          setIsEditing(false);
        }, 300);
      } else {
        toast.error(response.data.message || "Profile update failed.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred. Please try again."
      );
      console.error(error);
    }
  };

  const toggleEdit = () => {
    setRightColumnKey(isEditing ? "submissions" : "edit");
    setTimeout(() => {
      setIsEditing(!isEditing);
    }, 50);
  };

  if (!user) {
    return (
      <div className="text-center text-gray-500 h-screen flex items-center justify-center">
        <p>User data could not be loaded. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <section className="pt-16 dark:bg-gray-900">
        <div className="container mx-auto p-3 sm:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="lg:col-span-1">
              <ProfileLeft
                formData={formData}
                toggleEdit={toggleEdit}
                isEditing={isEditing}
                imageUrl={imageUrl || "https://via.placeholder.com/150"} // Placeholder image
              />
            </div>
            <div className="lg:col-span-3">
              {isEditing || initialTab === 'apikeys' ? (
                <ProfileRight
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  user={user || {}} // Provide an empty object as fallback
                  initialTab={initialTab}
                />
              ) : (
                <div className="overflow-x-auto">
                  <SubmissionPage />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;