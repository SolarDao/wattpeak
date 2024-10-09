import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Loading } from "./Loading";

const GoogleMapComponent = ({ projects }: { projects: any[] }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // State to manage loading

  const mapStyles = {
    height: "400px",
    width: "97%",
    marginBottom: "10px",
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: "23px",
  };

  const defaultCenter = {
    lat: 30.7128,
    lng: 13.006,
  };

  // Fetch the API key from the backend
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await fetch("/api/getGoogleMapsApiKey");
        const data = await res.json();
        setApiKey(data.apiKey);
      } catch (error) {
        console.error("Error fetching API key:", error);
      } finally {
        setLoading(false); // Set loading to false once API key is fetched
      }
    };
    fetchApiKey();
  }, []);

  // Display a loading state until the API key is fetched
  if (loading || !apiKey) {
    return <Loading />
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap mapContainerStyle={mapStyles} zoom={2} center={defaultCenter}>
        {projects.map((location, index) => (
          <Marker
            key={index}
            position={{
              lat: Number(location.location.latitude),
              lng: Number(location.location.longitude),
            }}
            onClick={() => {
              // Your click handler
            }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;
