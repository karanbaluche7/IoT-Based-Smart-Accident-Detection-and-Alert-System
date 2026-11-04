const sendNotification = async (hospital, accident) => {
  try {
    console.log("=================================");
    console.log("🚨 Emergency Notification");
    console.log(`Hospital : ${hospital.hospitalName}`);
    console.log(`Latitude : ${accident.latitude}`);
    console.log(`Longitude: ${accident.longitude}`);
    console.log(`Distance : ${hospital.distance} km`);
    console.log("=================================");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = {
  sendNotification,
};