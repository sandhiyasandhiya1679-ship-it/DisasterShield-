
const { getDistance } = require("geolib");

const calculateDistance = (
    latitude1,
    longitude1,
    latitude2,
    longitude2
) => {
    const distanceInMetres = getDistance(
        {
            latitude: latitude1,
            longitude: longitude1
        },
        {
            latitude: latitude2,
            longitude: longitude2
        }
    );

    // Convert metres to kilometres
    return distanceInMetres / 1000;
};

module.exports = calculateDistance;
