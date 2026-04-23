export const calculateFare = ({ vehicle, distance, hours, days }) => {
    const p = vehicle.pricing;

    const kmFare = p.perKmRate * distance;
    const hourFare = p.perHourRate * hours;

    const baseFare = p.baseFare + kmFare + hourFare;

    const driverAllowance = (p.driverAllowancePerDay || 0) * days;

    const platformFee = (baseFare * p.platformFeePercent) / 100;

    return {
        baseFare,
        bookingFee: platformFee,
        agencyEarning: baseFare - platformFee,
        platformEarning: platformFee,
        totalFare: baseFare + driverAllowance
    };
};




// 2640

// 1000
// 1000


// 30 * 120 = 3600 + 3000 =6600 + 7000 =   13600 - 1360 == 12240

// 13600
// 500
// 14100