import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import HealthProfileForm from "./components/HealthProfileForm";
import Dashboard from "./components/Dashboard";
import ChatWidget from "./components/ChatWidget";
import { UserProfile, HospitalCard } from "./types";
import { fetchNearbyHospitals, saveUserProfile } from "./services/apiService";
import { TAGBILARAN_CENTER, HOSPITALS } from "./constants";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalCard[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Fetch hospitals from backend once setup is complete
  useEffect(() => {
    if (!isSetupComplete) return;

    async function loadHospitals() {
      setIsLoadingHospitals(true);
      try {
        const data = await fetchNearbyHospitals(
          TAGBILARAN_CENTER.lat,
          TAGBILARAN_CENTER.lng,
          20, // 20km radius to get all hospitals
          20  // up to 20 results
        );

        if (data.length > 0) {
          setHospitals(data);
          setBackendConnected(true);
        } else {
          // Fallback to mock data
          setHospitals(HOSPITALS.map((h, i) => ({
            id: i + 1,
            name: h.name,
            type: h.type,
            address: "",
            distance: "",
            travel: "",
            status: "Open",
            specializations: h.specializations,
            directoryUrl: "#",
            tags: h.specializations.map(s => s.toLowerCase().replace(/ /g, "-")),
            pinX: "0%",
            pinY: "0%",
            lat: h.lat,
            lng: h.lng,
          })));
          setBackendConnected(false);
        }
      } catch {
        // Fallback to mock data
        setHospitals(HOSPITALS.map((h, i) => ({
          id: i + 1,
          name: h.name,
          type: h.type,
          address: "",
          distance: "",
          travel: "",
          status: "Open",
          specializations: h.specializations,
          directoryUrl: "#",
          tags: h.specializations.map(s => s.toLowerCase().replace(/ /g, "-")),
          pinX: "0%",
          pinY: "0%",
          lat: h.lat,
          lng: h.lng,
        })));
        setBackendConnected(false);
      } finally {
        setIsLoadingHospitals(false);
      }
    }

    loadHospitals();
  }, [isSetupComplete]);

  const handleLogin = (email: string) => {
    setIsLoggedIn(true);
  };

  const handleProfileComplete = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    setIsSetupComplete(true);

    // Save profile to backend (fire and forget)
    saveUserProfile(newProfile).catch(() => {});
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setProfile(null);
    setIsSetupComplete(false);
    setHospitals([]);
    setBackendConnected(false);
  };

  return (
    <div className="h-screen w-full font-sans antialiased">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : !isSetupComplete ? (
        <HealthProfileForm onComplete={handleProfileComplete} />
      ) : (
        <>
          <Dashboard
            profile={profile!}
            onLogout={handleLogout}
            hospitals={hospitals}
            isLoadingHospitals={isLoadingHospitals}
            backendConnected={backendConnected}
          />
          <ChatWidget userProfile={profile!} backendConnected={backendConnected} />
        </>
      )}
    </div>
  );
}
