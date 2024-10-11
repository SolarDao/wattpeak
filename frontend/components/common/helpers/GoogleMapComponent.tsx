import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const GoogleMapComponent = ({ projects, apiKey }: { projects: any[], apiKey: string }) => {

  const mapStyles = {
    height: "400px",
    width: "98%",
    marginBottom: "10px",
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: "23px",
    border: "2px solid #ccc",
  };

  const defaultCenter = {
    lat: 30.7128,
    lng: 13.006,
  };

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
