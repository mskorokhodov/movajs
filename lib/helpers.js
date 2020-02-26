export const generateId = (segmentsCount = 4, segmentLength = 4) => Array.from({ length: segmentsCount }).map(() => Math.random().toString(16).substring(2, 2 + segmentLength)).join('-');

const validateValue = (value, type) => {
  const error = new Error(`${value} is not assignable to type ${type.name}`);

  switch (type) {
    case String:
      if (value.toString) {
        return value.toString();
      } else {
        throw error;
      }
    case Number:
      const number = Number(value);

      if (!Number.isNaN(number)) {
        return number;
      } else {
        throw error;
      }
    case Boolean:
      return Boolean(value);
    case Array:
      if (Array.isArray(value)) {
        return value;
      } else {
        throw error;
      }
    case Object:
      if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
      } else {
        throw error;
      }
    case Function:
      if (typeof value === 'function') {
        return value;
      } else {
        throw error;
      }
    default:
      return value;
  }
}

export const processProperty = (model, value) => {
  const { type } = model;

  return validateValue(value, type);
}