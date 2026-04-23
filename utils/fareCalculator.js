export const calculateFare = ({ baseFare }) => {
    const bookingFee = Math.round(baseFare * 0.1);

    return {
        bookingFee,
        agencyEarning: baseFare - bookingFee,
        platformEarning: bookingFee
    };
};