import { Polyline } from "react-leaflet";

function HospitalMap({ hospital, accident }) {
  if (
    !hospital ||
    !accident ||
    hospital.latitude == null ||
    hospital.longitude == null ||
    accident.latitude == null ||
    accident.longitude == null
  ) {
    return null;
  }

  const positions = [
    [Number(hospital.latitude), Number(hospital.longitude)],
    [Number(accident.latitude), Number(accident.longitude)],
  ];

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: "red",
        weight: 5,
      }}
    />
  );
}

export default HospitalMap;