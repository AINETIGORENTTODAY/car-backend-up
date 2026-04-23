export const generateEmployeeId = async (agency) => {
    agency.driverCounter += 1;
    await agency.save();

    const number = agency.driverCounter.toString().padStart(4, "0");

    return `${agency.code}-DR-${number}`;
};