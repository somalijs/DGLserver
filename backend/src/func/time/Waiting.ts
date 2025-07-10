type Props = {
  date: number;
  minute?: number;
};
export const isWaited = ({ date, minute = 1 }: Props) => {
  if (!date || !minute) {
    throw new Error('date and minute is required');
  }

  const elapsed = Date.now() - date;
  const required = minute * 60 * 1000; // convert minutes to milliseconds
  return elapsed >= required;
};

export const isExpired = ({ date }: Props) => {
  if (!date) {
    throw new Error('date and is required to check expiration');
  }
  return date < Date.now();
};
