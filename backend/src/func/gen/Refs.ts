import { v4 as uuidv4 } from 'uuid';

function Refs({
  ids = [],
  length = 3,
  prefix = 'un',
}: {
  ids?: string[];
  length?: number;
  prefix?: string;
}): string {
  let uuid = '';
  do {
    // Generate a UUID
    let newUuid;
    do {
      newUuid = uuidv4();
    } while (!/\d/.test(newUuid.charAt(0))); // Ensure the first character is a digit

    // Extract the required number of characters
    const trimmedUuid = newUuid.replace(/-/g, '').substr(0, length);

    // Add the specified prefix
    const prefixedUuid = prefix + trimmedUuid;

    uuid = prefixedUuid;
  } while (ids.includes(uuid.toUpperCase()));

  return uuid.toUpperCase();
}

export default Refs;
