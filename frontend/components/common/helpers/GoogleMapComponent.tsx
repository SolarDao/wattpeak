import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const GoogleMapComponent = (projects: { projects: any[]; }) => {
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
  
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
    >
      <GoogleMap mapContainerStyle={mapStyles} zoom={2} center={defaultCenter}>
        {projects.projects.map((location, index) => {
          return (
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
          );
        })}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;
