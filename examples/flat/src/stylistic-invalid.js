import * as v from 'valibot';

const User = v.object({
  id: v.string(),
});

export { User };
