const validateFields = (fields) => {
    for (let key in fields) {
        const value = fields[key];

        if (
            value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "") ||
            (Array.isArray(value) && value.length === 0)
        ) {
            return `${key} is required`;
        }
    }
    return null;
};

module.exports = validateFields;
