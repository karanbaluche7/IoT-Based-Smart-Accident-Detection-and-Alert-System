const haversine = require("../utils/haversine");

const findNearbyHospitals = (
  accidentLocation,
  hospitals,
  radius = 10
) => {
  return hospitals.filter((hospital) => {
    const distance = haversine(
      accidentLocation.latitude,
      accidentLocation.longitude,
      hospital.latitude,
      hospital.longitude
    );

    hospital.distance = Number(distance.toFixed(2));

    return distance <= radius;
  });
};

module.exports = {
  findNearbyHospitals,
};