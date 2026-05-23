import { object, string } from 'valibot';

const User = object({
  id: string(),
});

export { User };
